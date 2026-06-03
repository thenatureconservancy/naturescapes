import { defineStore } from "pinia";
import { ref, reactive, computed, watch } from "vue";
import { markRaw } from "vue";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

export const useMapStore = defineStore("map", () => {
  const mapboxToken =
    "pk.eyJ1IjoidG5jbWFwYm94IiwiYSI6ImNrODR6MHk0YjAwaG8za2xuY2NpY2x6bmgifQ.SS-B0bFPoJMa_e7lZH2Oug";
  const map = ref<mapboxgl.Map | null>(null);
  const mapLoaded = ref(false);
  const zoomLevel = ref<number | null>(null);
  const refHubBasemapStyle = "mapbox://styles/tncmapbox/clms1lrtx056u01p91cfy6hqr"; // global
  const healthyRenewablesStyle = "mapbox://styles/tncmapbox/cmj0inecz00cm01qif9zd7tqf"; // US only
  const conusBbox: [number, number, number, number] = [-124.98044, 26.64984, -75.24436, 48.59458];
  const globalBbox: [number, number, number, number] = [-180, -90, 180, 90];
  const selectedFeature = ref<{
    selection_type: string;
    properties: mapboxgl.GeoJSONFeature["properties"];
    geometry?: mapboxgl.GeoJSONFeature["geometry"];
  } | null>(null);
  const resultsPanelOpen = ref(false);
  const filterDescriptionOpenByKey = reactive<Record<string, boolean>>({});
  const allProjects = ref([]) as unknown as { value: Record<string, string | number>[] };
  const allFua = ref([]) as unknown as { value: Record<string, string | number>[] };
  let initialNotify = ref(false);
  let mapTopNotifyEl: HTMLDivElement | null = null;
  let mapTopNotifyMessageEl: HTMLSpanElement | null = null;
  let mapTopNotifyHideTimeout: ReturnType<typeof setTimeout> | null = null;
  let displayBasemaps = ref(false);
  let basemapOption = ref("standard");
  let sidePanelExpanded = ref(false);
  let showFilterInfo = ref(false);
  let showSummaryInfo = ref(true);
  let selectedProject = ref<any>(null);
  let keywordSearch = ref<string>("");
  let filterQuery = ref<string>("");
  let filterLocation = ref<any>(null);
  let filterRegion = ref([]);
  let filterFUA = ref([]);
  let polygonFeatureById: Record<number, { properties: any; geometry: any }> = {};

  const hideMapTopNotify = () => {
    if (!mapTopNotifyEl) return;
    mapTopNotifyEl.style.opacity = "0";
    mapTopNotifyEl.style.transform = "translate(-50%, -12px)";
    mapTopNotifyEl.style.pointerEvents = "none";
    mapTopNotifyHideTimeout = setTimeout(() => {
      if (!mapTopNotifyEl || mapTopNotifyEl.style.opacity !== "0") return;
      mapTopNotifyEl.style.visibility = "hidden";
    }, 220);
  };

  watch(selectedFeature, (feature) => {
    syncSelectedFeatureHighlight(feature);

    if (feature) {
      const mapInstance = map.value;
      const geometry = feature.geometry;

      if (mapInstance && geometry) {
        const polygonFeature = {
          type: "Feature",
          geometry,
          properties: feature.properties ?? {},
        } as const;

        const [minX, minY, maxX, maxY] = turf.bbox(polygonFeature) as [
          number,
          number,
          number,
          number,
        ];
        mapInstance.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          {
            padding: 60,
            duration: 900,
            maxZoom: 12,
          },
        );
      }

      hideMapTopNotify();
      return;
    }

    if (zoomLevel.value !== null && zoomLevel.value >= 10) {
      const notifyEl = mapTopNotifyEl;
      if (notifyEl && mapTopNotifyMessageEl) {
        mapTopNotifyMessageEl.textContent = "Click on a polygon to see project details";
        notifyEl.style.visibility = "visible";
        notifyEl.style.pointerEvents = "auto";
        requestAnimationFrame(() => {
          notifyEl.style.opacity = "1";
          notifyEl.style.transform = "translate(-50%, 0)";
        });
      }
      initialNotify.value = true;
    }
  });

  watch(filterLocation, (newLocation) => {
    console.log("Filter location changed to:", newLocation);
    const mapInstance = map.value;
    if (!mapInstance || !newLocation) return;

    // Match geocoder-like behavior: use bbox when present, otherwise center with a point zoom.
    const bbox = Array.isArray(newLocation.bbox) ? newLocation.bbox : null;
    if (bbox && bbox.length === 4) {
      mapInstance.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {
          padding: 20,
          duration: 1000,
        },
      );
      return;
    }

    const center =
      Array.isArray(newLocation.center) && newLocation.center.length >= 2
        ? newLocation.center
        : newLocation.geometry?.coordinates;

    if (!Array.isArray(center) || center.length < 2) return;

    mapInstance.flyTo({
      center: [center[0], center[1]],
      zoom: 16,
      duration: 1000,
    });
  });

  const isFilterDescriptionOpen = (key: string) => {
    return Boolean(filterDescriptionOpenByKey[key]);
  };

  const openFilterDescription = (key: string) => {
    filterDescriptionOpenByKey[key] = true;
  };

  const closeFilterDescription = (key: string) => {
    filterDescriptionOpenByKey[key] = false;
  };

  const styleByOption: Record<string, string> = {
    standard: "mapbox://styles/mapbox/standard",
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    imagery: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map.value?.getLayer(layerId)) return;
    map.value.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  };

  const getEmptyFeatureCollection = () => {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  };

  const ensureSelectedFeatureHighlightLayers = () => {
    if (!map.value) return;

    if (!map.value.getSource("selected-feature")) {
      map.value.addSource("selected-feature", {
        type: "geojson",
        data: getEmptyFeatureCollection(),
      });
    }

    if (!map.value.getLayer("selected-feature-fill")) {
      map.value.addLayer({
        id: "selected-feature-fill",
        type: "fill",
        source: "selected-feature",
        paint: {
          "fill-color": "#ffd166",
          "fill-opacity": 0.38,
        },
      });
    }

    if (!map.value.getLayer("selected-feature-outline")) {
      map.value.addLayer({
        id: "selected-feature-outline",
        type: "line",
        source: "selected-feature",
        paint: {
          "line-color": "#ffea00",
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });
    }
  };

  const syncSelectedFeatureHighlight = (
    feature: {
      properties: mapboxgl.GeoJSONFeature["properties"];
      geometry?: mapboxgl.GeoJSONFeature["geometry"];
    } | null,
  ) => {
    if (!map.value) return;

    const selectedGeometry = feature?.geometry;
    if (!selectedGeometry) {
      if (map.value.getLayer("selected-feature-outline")) {
        map.value.removeLayer("selected-feature-outline");
      }
      if (map.value.getLayer("selected-feature-fill")) {
        map.value.removeLayer("selected-feature-fill");
      }
      if (map.value.getSource("selected-feature")) {
        map.value.removeSource("selected-feature");
      }
      return;
    }

    ensureSelectedFeatureHighlightLayers();

    const source = map.value.getSource("selected-feature") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    setLayerVisibility("selected-feature-fill", true);
    setLayerVisibility("selected-feature-outline", true);
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: feature?.properties ?? {},
          geometry: selectedGeometry,
        },
      ],
    } as any);
  };

  const applyMapFog = (mapInstance: any) => {
    mapInstance.setFog({
      "space-color": "#fdf6f2",
      "star-intensity": 0,
      color: "#fdf6f2",
      "high-color": "#fdf6f2",
      "horizon-blend": 0.05,
    });
  };

  const addPolygonClickInteraction = (mapInstance: any) => {
    try {
      mapInstance.removeInteraction("polygon-click-interaction");
    } catch {
      // Interaction may not exist yet.
    }

    mapInstance.addInteraction("polygon-click-interaction", {
      type: "click",
      target: { layerId: "nbs-polygons-fill" },
      handler: (e: any) => {
        lookUpProject(e.feature);
      },
    });
  };

  const applyBasemapStyle = (option: string) => {
    if (!map.value) return;

    const mapInstance = map.value;
    const nextStyle = styleByOption[option] || "mapbox://styles/mapbox/standard";

    mapInstance.once("style.load", async () => {
      await addNBSLayer();

      const currentZoom = mapInstance.getZoom();
      const isPolygonMode = currentZoom >= 10;
      setLayerVisibility("clusters", !isPolygonMode);
      setLayerVisibility("cluster-count", !isPolygonMode);
      setLayerVisibility("unclustered-points", !isPolygonMode);
      setLayerVisibility("nbs-polygons-fill", isPolygonMode);

      addPolygonClickInteraction(mapInstance);
    });

    mapInstance.setStyle(nextStyle);
  };

  const initMap = async () => {
    if (!mapboxToken) {
      console.error("Mapbox token is not set.");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    if (!map.value) {
      const mapInstance = markRaw(
        new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/standard",
          bounds: conusBbox,
          projection: "globe", // mercator, globe, naturalEarth, equalEarth, winkelTripel, albers, lambertConformalConic, equirectangular
          logoPosition: "bottom-right",
        }),
      );

      mapInstance.on("load", () => {
        map.value = mapInstance;
        zoomLevel.value = mapInstance.getZoom();
        mapInstance.showTileBoundaries = false;

        // Reapply fog whenever the active style changes.
        mapInstance.on("style.load", () => {
          applyMapFog(mapInstance);
        });

        const ensureMapTopNotify = () => {
          if (mapTopNotifyEl) return mapTopNotifyEl;

          const container = mapInstance.getContainer();
          const notifyEl = document.createElement("div");
          notifyEl.style.position = "absolute";
          notifyEl.style.top = "12px";
          notifyEl.style.left = "50%";
          notifyEl.style.transform = "translateX(-50%)";
          notifyEl.style.zIndex = "2";
          notifyEl.style.padding = "12px";
          notifyEl.style.borderRadius = "6px";
          notifyEl.style.background = "#ea631c";
          notifyEl.style.color = "#ffffff";
          notifyEl.style.fontSize = "18px";
          notifyEl.style.fontWeight = "400";
          notifyEl.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.2)";
          notifyEl.style.display = "flex";
          notifyEl.style.alignItems = "center";
          notifyEl.style.gap = "10px";
          notifyEl.style.pointerEvents = "none";
          notifyEl.style.opacity = "0";
          notifyEl.style.visibility = "hidden";
          notifyEl.style.transform = "translate(-50%, -12px)";
          notifyEl.style.transition = "transform 220ms ease, opacity 220ms ease";

          const messageEl = document.createElement("span");
          messageEl.style.lineHeight = "1.2";

          const closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.textContent = "\u00d7";
          closeBtn.setAttribute("aria-label", "Close notification");
          closeBtn.style.border = "none";
          closeBtn.style.background = "transparent";
          closeBtn.style.color = "#ffffff";
          closeBtn.style.cursor = "pointer";
          closeBtn.style.fontSize = "22px";
          closeBtn.style.lineHeight = "1";
          closeBtn.style.padding = "0";
          closeBtn.style.margin = "0";
          closeBtn.style.pointerEvents = "auto";

          closeBtn.addEventListener("click", () => {
            hideMapTopNotify();
          });

          notifyEl.appendChild(messageEl);
          notifyEl.appendChild(closeBtn);

          container.appendChild(notifyEl);
          mapTopNotifyEl = notifyEl;
          mapTopNotifyMessageEl = messageEl;
          return notifyEl;
        };

        const showMapTopNotify = (message: string) => {
          if (selectedFeature.value) return;

          const notifyEl = ensureMapTopNotify();
          if (mapTopNotifyHideTimeout) {
            clearTimeout(mapTopNotifyHideTimeout);
            mapTopNotifyHideTimeout = null;
          }
          if (mapTopNotifyMessageEl) {
            mapTopNotifyMessageEl.textContent = message;
          }
          notifyEl.style.visibility = "visible";
          notifyEl.style.pointerEvents = "auto";
          requestAnimationFrame(() => {
            notifyEl.style.opacity = "1";
            notifyEl.style.transform = "translate(-50%, 0)";
          });
        };

        mapInstance.on("zoom", () => {
          zoomLevel.value = mapInstance.getZoom();
          // console.log("Zoom level:", zoomLevel.value);
          if (zoomLevel.value >= 10) {
            setLayerVisibility("clusters", false);
            setLayerVisibility("cluster-count", false);
            setLayerVisibility("unclustered-points", false);
            setLayerVisibility("nbs-polygons-fill", true);

            if (!initialNotify.value && !selectedFeature.value) {
              showMapTopNotify("Click on a polygon to see project details");
              initialNotify.value = true;
            }
          } else {
            setLayerVisibility("clusters", true);
            setLayerVisibility("cluster-count", true);
            setLayerVisibility("unclustered-points", true);
            setLayerVisibility("nbs-polygons-fill", false);

            if (initialNotify.value) {
              hideMapTopNotify();
              initialNotify.value = false;
            }
          }
        });

        applyMapFog(mapInstance);

        // function initialization
        // ---------------------------------------
        addMapControls();
        addNBSLayer();
        zoomToGlobal();
        getAllProjects();

        addPolygonClickInteraction(mapInstance);
      });
    }
    mapLoaded.value = true;
  };

  const zoomToGlobal = () => {
    map.value?.setProjection("globe");
    map.value?.flyTo({ center: [10.099215, 51.249358], zoom: 2.2 });
  };

  const addMapControls = () => {
    if (!map.value) return;

    // Main nav controls
    map.value.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "top-left",
    );

    // Turn on scale bar
    const scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: "imperial",
    });
    map.value?.addControl(scale);
    scale.setUnit("imperial");
  };

  const addNBSLayer = async () => {
    if (!map.value) return;

    map.value.addSource("nbs-locations", {
      type: "geojson",
      data: "/NBSToJSON_final.geojson",
    });

    const response = await fetch("/NBSToJSON_final.geojson");
    const polygonGeojson = await response.json();

    polygonFeatureById = {};
    if (Array.isArray(polygonGeojson?.features)) {
      polygonGeojson.features.forEach((feature: any) => {
        const featureId = Number(feature?.properties?.ID);
        if (!Number.isFinite(featureId) || !feature?.geometry) return;
        polygonFeatureById[featureId] = {
          properties: feature.properties,
          geometry: feature.geometry,
        };
      });
    }

    // 2. Add polygon source
    map.value.addSource("nbs-polygons", {
      type: "geojson",
      data: polygonGeojson,
    });

    // 3. Convert polygons → centroid points
    const centroidGeojson = {
      type: "FeatureCollection",
      features: polygonGeojson.features.map((f) => {
        const pt = turf.centerOfMass(f);

        return {
          type: "Feature",
          geometry: pt.geometry,
          properties: {
            ...f.properties,
          },
        };
      }),
    };

    // 4. Add clustered point source
    map.value.addSource("nbs-centroids", {
      type: "geojson",
      data: centroidGeojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // 5. Cluster circles
    map.value.addLayer({
      id: "clusters",
      type: "circle",
      source: "nbs-centroids",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#f2b500",
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 50, 30],
      },
    });

    // 6. Cluster counts
    map.value.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "nbs-centroids",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#1e1d1d",
      },
    });

    // 7. Unclustered points
    map.value.addLayer({
      id: "unclustered-points",
      type: "circle",
      source: "nbs-centroids",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#f28cb1",
        "circle-radius": 6,
      },
    });

    // 8. Polygons (only visible when zoomed in)
    map.value.addLayer({
      id: "nbs-polygons-fill",
      type: "fill",
      source: "nbs-polygons",
      minzoom: 10,
      paint: {
        "fill-color": "#ea631c",
        "fill-opacity": 0.5,
      },
    });

    syncSelectedFeatureHighlight(selectedFeature.value);
  };

  const closeResultsPanel = () => {
    resultsPanelOpen.value = false;
  };

  const openResultsPanel = () => {
    resultsPanelOpen.value = true;
  };

  // parse csv for data
  const getAllProjects = async () => {
    try {
      const response = await fetch("/Joint Scores trimmed and formatted scored NBS sites v3_1.csv");
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const normalizedCsvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      const parseCsvRows = (text: string) => {
        const rows: string[] = [];
        let currentRow = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentRow += '""';
              i += 1;
            } else {
              inQuotes = !inQuotes;
              currentRow += char;
            }
            continue;
          }

          if (char === "\n" && !inQuotes) {
            if (currentRow.trim().length > 0) {
              rows.push(currentRow);
            }
            currentRow = "";
            continue;
          }

          currentRow += char;
        }

        if (currentRow.trim().length > 0) {
          rows.push(currentRow);
        }

        return rows;
      };

      const rows = parseCsvRows(normalizedCsvText);

      if (rows.length === 0) return [];

      const parseCsvLine = (line: string) => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
          }

          current += char;
        }

        values.push(current.trim());
        return values;
      };

      let headerLine = rows[0];
      if (!headerLine) return [];
      // Remove BOM if present
      if (headerLine.charCodeAt(0) === 0xfeff) {
        headerLine = headerLine.slice(1);
      }
      const headers = parseCsvLine(headerLine);
      console.log("Parsed CSV headers:", headers);

      const idHeader = headers.find((header) => header.trim().toLowerCase() === "id") ?? "ID";

      const projects = rows.slice(1).map((line) => {
        const rowValues = parseCsvLine(line);
        const row = headers.reduce(
          (rowObject, header, index) => {
            rowObject[header] = rowValues[index] ?? "";
            return rowObject;
          },
          {} as Record<string, string | number>,
        );

        if (idHeader in row) {
          const numericId = Number(String(row[idHeader]).trim());
          if (Number.isFinite(numericId)) {
            row[idHeader] = numericId;
          }
        }

        return row;
      });

      // console.log("All projects from CSV:", projects);
      allProjects.value = projects;
      console.log("All projects after processing:", allProjects);
      return projects;
    } catch (error) {
      console.error("Error parsing projects CSV:", error);
      return [];
    }
  };

  const getAllFua = async () => {
    try {
      const response = await fetch("/Joint Scores trimmed and formatted scored FUA wide v1_2.csv");
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const normalizedCsvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      const parseCsvRows = (text: string) => {
        const rows: string[] = [];
        let currentRow = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentRow += '""';
              i += 1;
            } else {
              inQuotes = !inQuotes;
              currentRow += char;
            }
            continue;
          }

          if (char === "\n" && !inQuotes) {
            if (currentRow.trim().length > 0) {
              rows.push(currentRow);
            }
            currentRow = "";
            continue;
          }

          currentRow += char;
        }

        if (currentRow.trim().length > 0) {
          rows.push(currentRow);
        }

        return rows;
      };

      const rows = parseCsvRows(normalizedCsvText);

      if (rows.length === 0) return [];

      const parseCsvLine = (line: string) => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
          }

          current += char;
        }

        values.push(current.trim());
        return values;
      };

      let headerLine = rows[0];
      if (!headerLine) return [];
      // Remove BOM if present
      if (headerLine.charCodeAt(0) === 0xfeff) {
        headerLine = headerLine.slice(1);
      }
      const headers = parseCsvLine(headerLine);
      console.log("Parsed CSV headers:", headers);

      const idHeader = headers.find((header) => header.trim().toLowerCase() === "id") ?? "ID";

      const projects = rows.slice(1).map((line) => {
        const rowValues = parseCsvLine(line);
        const row = headers.reduce(
          (rowObject, header, index) => {
            rowObject[header] = rowValues[index] ?? "";
            return rowObject;
          },
          {} as Record<string, string | number>,
        );

        if (idHeader in row) {
          const numericId = Number(String(row[idHeader]).trim());
          if (Number.isFinite(numericId)) {
            row[idHeader] = numericId;
          }
        }

        return row;
      });

      // console.log("All projects from CSV:", projects);
      allFua.value = projects;
      console.log("All FUA after processing:", allFua.value);
      return projects;
    } catch (error) {
      console.error("Error parsing projects CSV:", error);
      return [];
    }
  };

  // csv query based on layer click
  const selectProjectFromRecord = (project: Record<string, string | number>) => {
    selectedProject.value = {
      name: project["Name (short English title)"],
      nativeName: project["Native language title"],
      cityFUA: project["City or FUA"],
      region: project["Region"],
      description: project["Short description of the intervention"],
      website: project["Website of the intervention"],
      biodiversity: {
        label: "Biodiversity",
        totalScore: project["Biodiversity"],
        protectedAreas: project["Protected Area"],
        coastalHabitats: project["Coastal habitat"],
        fractionNaturalArea: project["Green/Blue Area Fraction"],
        ambitionPerformance: project["Biodiversity-related ambition and performance"],
      },
      climate: {
        label: "Climate",
        totalScore: project["Climate"],
        landSurfaceTemp: project["Land surface temperature"],
        carbonStorage: project["Carbon storage"],
        stormwaterHoldingCapacity: project["Stormwater holding capacity"],
        ambitionPerformance: project["Climate-related ambition and performance"],
      },
      socialJustice: {
        label: "Social Justice",
        totalScore: project["Social Justice"],
        blueGreenSpace: project["Population access"],
        recreationPotential: project["Recreation potential"],
        inclusiveness: project["Inclusiveness of project beneficiaries"],
        ambitionPerformance: project["Social justice-related ambition and performance"],
      },
      transformativePotential: {
        label: "Transformative Potential",
        totalScore: project["Transformative Potential"],
        resultDelivery: project["Potential for high-quality project result delivery"],
        longTermPerspective: project["Long-term perspective"],
        diversity: project["Diversity of stakeholder involvement"],
        targetAlignment:
          project["Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives"],
      },
    };
  };

  const setSelectedFeatureFromProject = (
    project: Record<string, string | number>,
    selectionType = "card",
  ) => {
    const featureId = Number(project.ID ?? project.id);
    const polygonFeature = Number.isFinite(featureId) ? polygonFeatureById[featureId] : undefined;

    selectedFeature.value = {
      selection_type: selectionType,
      properties: polygonFeature?.properties ?? project,
      geometry: polygonFeature?.geometry,
    };
  };

  const lookUpProject = (feat: any) => {
    console.log(feat);
    console.log(allProjects.value);
    let id;
    id = Number(feat.properties.ID);

    selectedFeature.value = {
      selection_type: "polygon",
      properties: feat.properties,
      geometry: feat.geometry,
    };

    allProjects.value.forEach((project) => {
      if (project.ID === id) {
        console.log("Found project:", project);
        // highlight feature on map then open project details
        selectProjectFromRecord(project);
      }
    });
  };

  // const filters = reactive({
  //   "City or FUA": "ALL",
  //   "Region": "ALL",
  //   // Biodiversity
  //   "Protected Area": "ALL",
  //   "Coastal habitat": "ALL",
  //   "Green/Blue Area Fraction": "ALL",
  //   "Biodiversity-related ambition and performance": "ALL",
  //   // Climate
  //   "Land surface temperature": "ALL",
  //   "Carbon storage": "ALL",
  //   "Stormwater holding capacity": "ALL",
  //   "Climate-related ambition and performance": "ALL",
  //   // Social Justice
  //   "Population access": "ALL",
  //   "Recreation potential": "ALL",
  //   "Inclusiveness of project beneficiaries": "ALL",
  //   "Social justice-related ambition and performance": "ALL",
  //   // Transformative Potential
  //   "Potential for high-quality project result delivery": "ALL",
  //   "Long-term perspective": "ALL",
  //   "Diversity of stakeholder involvement": "ALL",
  //   "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives": "ALL",
  // });
  // const buildFilterQuery = () => {

  // }

  return {
    mapboxToken,
    map,
    mapLoaded,
    zoomLevel,
    initMap,
    selectedFeature,
    featureSelected: selectedFeature,
    allProjects,
    resultsPanelOpen,
    filterDescriptionOpenByKey,
    displayBasemaps,
    basemapOption,
    sidePanelExpanded,
    showFilterInfo,
    showSummaryInfo,
    selectedProject,
    keywordSearch,
    filterQuery,
    filterLocation,
    filterRegion,
    filterFUA,
    isFilterDescriptionOpen,
    openFilterDescription,
    closeFilterDescription,
    closeResultsPanel,
    openResultsPanel,
    applyBasemapStyle,
    getAllProjects,
    lookUpProject,
    selectProjectFromRecord,
    setSelectedFeatureFromProject,
    // buildFilterQuery,
    allFua,
    getAllFua,
  };
});
