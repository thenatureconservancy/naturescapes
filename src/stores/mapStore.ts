import { defineStore } from "pinia";
import { ref, reactive, computed, watch } from "vue";
import { markRaw } from "vue";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import Papa from "papaparse";
import pdfMake from "pdfmake/build/pdfmake";

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export const useMapStore = defineStore("map", () => {
  const mapboxToken =
    "pk.eyJ1IjoidG5jbWFwYm94IiwiYSI6ImNrODR6MHk0YjAwaG8za2xuY2NpY2x6bmgifQ.SS-B0bFPoJMa_e7lZH2Oug";
  const map = ref<mapboxgl.Map | null>(null);
  const mapLoaded = ref(false);
  const zoomLevel = ref<number | null>(null);
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
  const visibleProjectIds = ref<number[] | null>(null);
  const focusedProjectId = ref<number | null>(null);
  const allFua = ref([]) as unknown as { value: Record<string, string | number>[] };
  let initialNotify = ref(false);
  let mapTopNotifyEl: HTMLDivElement | null = null;
  let mapTopNotifyMessageEl: HTMLSpanElement | null = null;
  let mapTopNotifyHideTimeout: ReturnType<typeof setTimeout> | null = null;
  let displayBasemaps = ref(false);
  let basemapOption = ref("light");
  let sidePanelExpanded = ref(false);
  let showFilterInfo = ref(false);
  let showSummaryInfo = ref(true);
  let selectedProject = ref<any>(null);
  let fuaResults = ref<any>(null);
  let keywordSearch = ref<string>("");
  let filterQuery = ref<string>("");
  let filterLocation = ref<any>(null);
  let filterRegion = ref([]);
  let filterFUA = ref([]);
  let numOfFilters = ref(0);
  let projectToggleOption = ref("all");
  let projectCollection = ref([]);
  let printMap = ref(false);
  let dialogVisible = ref(true);
  let tableFilterBiodiversity = ref(true);
  let tableFilterClimate = ref(true);
  let tableFilterSocialJustice = ref(true);
  let tableFilterTransformativePotential = ref(true);
  let showUserGuide = ref(false);
  const indicatorFilterFields = [
    "Protected Area",
    "Coastal habitat",
    "Green/Blue Area Fraction",
    "Biodiversity-related ambition and performance",
    "Land surface temperature",
    "Carbon storage",
    "Stormwater holding capacity",
    "Climate-related ambition and performance",
    "Population access",
    "Recreation potential",
    "Inclusiveness of project beneficiaries",
    "Social justice-related ambition and performance",
    "Potential for high-quality project result delivery",
    "Long-term perspective",
    "Diversity of stakeholder involvement",
    "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives",
  ] as const;
  const indicatorFilterState = reactive<Record<string, { value: number; active: boolean }>>(
    Object.fromEntries(
      indicatorFilterFields.map((field) => [field, { value: 0, active: false }]),
    ) as Record<string, { value: number; active: boolean }>,
  );
  let polygonFeatureById: Record<number, { properties: any; geometry: any }> = {};
  let allPolygonFeatures: any[] = [];
  let allCentroidFeatures: any[] = [];

  const advancedFiltersApplied = computed(
    () =>
      Object.values(indicatorFilterState).some((state) => state.active) ||
      filterRegion.value.length > 0 ||
      filterFUA.value.length > 0,
  );

  const getIndicatorFilterValue = (field: string) => {
    return indicatorFilterState[field]?.value ?? 0;
  };

  const setIndicatorFilterValue = (field: string, value: number) => {
    if (!indicatorFilterState[field]) {
      indicatorFilterState[field] = { value: 0, active: false };
    }

    indicatorFilterState[field].value = value;
    indicatorFilterState[field].active = true;
  };

  const clearIndicatorFilters = () => {
    Object.keys(indicatorFilterState).forEach((field) => {
      const state = indicatorFilterState[field];
      if (!state) return;
      state.value = 0;
      state.active = false;
    });
  };

  const matchesIndicatorFilters = (project: Record<string, string | number>) => {
    const activeFilters = Object.entries(indicatorFilterState).filter(([, state]) => state.active);
    if (activeFilters.length === 0) return true;

    for (const [field, state] of activeFilters) {
      const rawValue = String(project[field] ?? "").trim();

      if (state.value === 0) {
        const isNaValue = rawValue === "" || /^(na|n\/a)$/i.test(rawValue) || rawValue === "0";
        const numericValue = Number(rawValue);
        const isLowValue = Number.isFinite(numericValue) && numericValue <= 4;

        if (!isNaValue && !isLowValue) return false;
        continue;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue) || numericValue > state.value) {
        return false;
      }
    }

    return true;
  };

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
    focusedProjectId.value = feature ? getNumericProjectId(feature.properties) : null;
    applyFeatureVisibilityMode();
    syncVisibleProjectsFromMap();

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

  const applyCombinedFilters = () => {
    const mapInstance = map.value;
    if (!mapInstance) return;

    const selectedRegions = filterRegion.value as string[];
    const selectedFua = filterFUA.value as string[];
    const hasRegionFilter = selectedRegions.length > 0;
    const hasFuaFilter = selectedFua.length > 0;
    const hasIndicatorFilter = Object.values(indicatorFilterState).some((state) => state.active);

    let matchingIds: Set<number> | null = null;
    if (hasRegionFilter || hasFuaFilter || hasIndicatorFilter) {
      matchingIds = new Set(
        allProjects.value
          .filter((p: any) => {
            const regionMatches = !hasRegionFilter || selectedRegions.includes(String(p.Region));
            const fuaRawValue = String(p["City or FUA"] ?? "").trim();
            const fuaWithoutSuffix = fuaRawValue.replace(/\s*\(FUA\)\s*$/i, "").trim();
            const fuaMatches =
              !hasFuaFilter ||
              selectedFua.some((selected: string) => {
                const selectedTrimmed = String(selected).trim();
                return (
                  selectedTrimmed === fuaRawValue ||
                  selectedTrimmed === fuaWithoutSuffix ||
                  `${selectedTrimmed} (FUA)` === fuaRawValue
                );
              });
            const indicatorMatches = matchesIndicatorFilters(p);
            return regionMatches && fuaMatches && indicatorMatches;
          })
          .map((p: any) => Number(p.ID))
          .filter((id: number) => Number.isFinite(id)),
      );
    }

    const filteredPolygonFeatures = matchingIds
      ? allPolygonFeatures.filter((f: any) => matchingIds!.has(Number(f?.properties?.ID)))
      : allPolygonFeatures;

    const filteredCentroidFeatures = matchingIds
      ? allCentroidFeatures.filter((f: any) => matchingIds!.has(Number(f?.properties?.ID)))
      : allCentroidFeatures;

    const polygonSource = mapInstance.getSource("nbs-polygons") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (polygonSource) {
      polygonSource.setData({
        type: "FeatureCollection",
        features: filteredPolygonFeatures,
      });
    }

    const centroidSource = mapInstance.getSource("nbs-centroids") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (centroidSource) {
      centroidSource.setData({
        type: "FeatureCollection",
        features: filteredCentroidFeatures,
      });
    }

    syncVisibleProjectsFromMap();
  };

  watch([filterRegion, filterFUA], applyCombinedFilters, { deep: true });
  watch(indicatorFilterState, applyCombinedFilters, { deep: true });
  watch(allProjects, applyCombinedFilters, { deep: true });

  const resetFilters = () => {
    filterRegion.value = [];
    filterFUA.value = [];
    filterLocation.value = null;
    clearIndicatorFilters();
    applyCombinedFilters();
  };

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

  const getNumericProjectId = (
    properties: Record<string, unknown> | mapboxgl.GeoJSONFeature["properties"] | undefined,
  ) => {
    if (!properties) return null;
    const rawId =
      (properties as Record<string, unknown>).ID ?? (properties as Record<string, unknown>).id;
    const parsedId = Number(rawId);
    return Number.isFinite(parsedId) ? parsedId : null;
  };

  const getClusterLeafProjectIds = async (clusterId: number) => {
    const mapInstance = map.value;
    if (!mapInstance) return [] as number[];

    const source = mapInstance.getSource("nbs-centroids") as
      | (mapboxgl.GeoJSONSource & {
          getClusterLeaves?: (
            clusterId: number,
            limit: number,
            offset: number,
            callback: (error: Error | null, features?: mapboxgl.MapboxGeoJSONFeature[]) => void,
          ) => void;
        })
      | undefined;

    if (!source?.getClusterLeaves) return [] as number[];

    const pageSize = 100;
    const leafIds: number[] = [];
    let offset = 0;

    while (true) {
      const page = await new Promise<Array<{ properties?: Record<string, unknown> }>>((resolve) => {
        source.getClusterLeaves?.(clusterId, pageSize, offset, (error, features = []) => {
          if (error) {
            console.error("Failed to read cluster leaves", error);
            resolve([]);
            return;
          }
          resolve((features as Array<{ properties?: Record<string, unknown> }>) ?? []);
        });
      });

      if (page.length === 0) break;

      page.forEach((feature) => {
        const id = getNumericProjectId(feature.properties);
        if (id !== null) {
          leafIds.push(id);
        }
      });

      if (page.length < pageSize) break;
      offset += pageSize;
    }

    return leafIds;
  };

  const syncVisibleProjectsFromMap = debounce(async () => {
    const mapInstance = map.value;
    if (!mapInstance) {
      visibleProjectIds.value = null;
      return;
    }

    const idSet = new Set<number>();
    const zoom = mapInstance.getZoom();

    if (zoom >= 10 && mapInstance.getLayer("nbs-polygons-fill")) {
      const polygonFeatures = mapInstance.queryRenderedFeatures({
        layers: ["nbs-polygons-fill"],
      });

      polygonFeatures.forEach((feature) => {
        const id = getNumericProjectId(feature.properties);
        if (id !== null) {
          idSet.add(id);
        }
      });
    } else {
      if (mapInstance.getLayer("unclustered-points")) {
        const pointFeatures = mapInstance.queryRenderedFeatures({
          layers: ["unclustered-points"],
        });

        pointFeatures.forEach((feature) => {
          const id = getNumericProjectId(feature.properties);
          if (id !== null) {
            idSet.add(id);
          }
        });
      }

      if (mapInstance.getLayer("clusters")) {
        const clusterFeatures = mapInstance.queryRenderedFeatures({
          layers: ["clusters"],
        });

        for (const feature of clusterFeatures) {
          const clusterId = Number(feature.properties?.cluster_id);
          if (!Number.isFinite(clusterId)) continue;

          const clusterLeafIds = await getClusterLeafProjectIds(clusterId);
          clusterLeafIds.forEach((id) => idSet.add(id));
        }
      }
    }

    visibleProjectIds.value = Array.from(idSet);
  }, 150);

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map.value?.getLayer(layerId)) return;
    map.value.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  };

  const setProjectFilters = (projectId: number | null) => {
    if (!map.value) return;

    if (map.value.getLayer("nbs-polygons-fill")) {
      map.value.setFilter(
        "nbs-polygons-fill",
        projectId === null ? null : ["==", ["to-number", ["get", "ID"]], projectId],
      );
    }

    if (map.value.getLayer("unclustered-points")) {
      map.value.setFilter(
        "unclustered-points",
        projectId === null
          ? ["!", ["has", "point_count"]]
          : ["all", ["!", ["has", "point_count"]], ["==", ["to-number", ["get", "ID"]], projectId]],
      );
    }
  };

  const applyFeatureVisibilityMode = () => {
    if (!map.value) return;

    const isFocusedMode = focusedProjectId.value !== null;
    const isPolygonMode = (zoomLevel.value ?? map.value.getZoom()) >= 10;

    setProjectFilters(null);
    setLayerVisibility("clusters", !isPolygonMode && !isFocusedMode);
    setLayerVisibility("cluster-count", !isPolygonMode && !isFocusedMode);
    setLayerVisibility("unclustered-points", !isPolygonMode && !isFocusedMode);
    setLayerVisibility("nbs-polygons-fill", isPolygonMode);
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
          "fill-color": "#f6f2c0",
          "fill-opacity": 0.3,
        },
      });
    }

    if (!map.value.getLayer("selected-feature-outline")) {
      map.value.addLayer({
        id: "selected-feature-outline",
        type: "line",
        source: "selected-feature",
        paint: {
          "line-color": "#76e0c7",
          "line-width": 5,
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
      "space-color": "#f7f6f7",
      "star-intensity": 0,
      color: "#f7f6f7",
      "high-color": "#f7f6f7",
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
      zoomLevel.value = currentZoom;
      applyFeatureVisibilityMode();
      await syncVisibleProjectsFromMap();

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
          style: "mapbox://styles/mapbox/light-v11",
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
          notifyEl.style.background = "#f6f2c0";
          notifyEl.style.color = "black";
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
          closeBtn.style.color = "black";
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
          applyFeatureVisibilityMode();
          // console.log("Zoom level:", zoomLevel.value);
          if (zoomLevel.value >= 10) {
            if (!initialNotify.value && !selectedFeature.value) {
              showMapTopNotify("Click on a polygon to see project details");
              initialNotify.value = true;
            }
          } else {
            if (initialNotify.value) {
              hideMapTopNotify();
              initialNotify.value = false;
            }
          }

          syncVisibleProjectsFromMap();
        });

        mapInstance.on("moveend", () => {
          syncVisibleProjectsFromMap();
        });

        applyMapFog(mapInstance);

        // function initialization
        // ---------------------------------------
        addMapControls();
        addNBSLayer();
        zoomToGlobal();
        getAllProjects();
        getAllFua();
        applyFeatureVisibilityMode();
        syncVisibleProjectsFromMap();

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
    allPolygonFeatures = polygonGeojson.features;
    map.value.addSource("nbs-polygons", {
      type: "geojson",
      data: polygonGeojson,
    });

    // 3. Convert polygons → centroid points
    const centroidGeojson = {
      type: "FeatureCollection" as const,
      features: polygonGeojson.features.map((f: any) => {
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
    allCentroidFeatures = centroidGeojson.features;

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
        "circle-color": "#ead755",
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
        "circle-color": "#ead755",
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
        "fill-color": "#ead755",
        "fill-opacity": 0.7,
      },
    });

    // Re-apply current location/indicator filters after sources/layers are ready.
    applyCombinedFilters();

    syncSelectedFeatureHighlight(selectedFeature.value);
  };

  const closeResultsPanel = () => {
    resultsPanelOpen.value = false;
  };

  const openResultsPanel = () => {
    resultsPanelOpen.value = true;
  };

  const loadCsvRecords = async (csvPath: string) => {
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.replace(/^\ufeff/, "").trim(),
      transform: (value) => value.trim(),
    });

    if (parsed.errors.length > 0) {
      console.warn("CSV parse warnings:", parsed.errors);
    }

    const idHeader = parsed.meta.fields?.find((header) => header.toLowerCase() === "id") ?? "ID";

    return parsed.data
      .map((rawRow) => {
        const row: Record<string, string | number> = {};

        Object.entries(rawRow).forEach(([header, value]) => {
          if (!header) return;
          row[header] = value ?? "";
        });

        if (idHeader in row) {
          const numericId = Number(String(row[idHeader]).trim());
          if (Number.isFinite(numericId)) {
            row[idHeader] = numericId;
          }
        }

        return row;
      })
      .filter((row) => Object.values(row).some((value) => String(value).trim().length > 0));
  };

  // parse csv for data
  const getAllProjects = async () => {
    try {
      const projects = await loadCsvRecords(
        "/Joint Scores trimmed and formatted scored NBS sites v3_1.csv",
      );

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
      const projects = await loadCsvRecords(
        "/Joint Scores trimmed and formatted scored FUA wide v1_2.csv",
      );

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
      sourceRecord: project,
      sourceId: Number(project.ID ?? project.id),
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

    const projectFua = String(project["City or FUA"])
      .replace(/\s*\(FUA\)\s*$/i, "")
      .trim();
    const fuaRecord = allFua.value.find((record) => String(record.FUA).trim() === projectFua);

    if (fuaRecord) {
      console.log("Found matching FUA record:", fuaRecord);
      selectFuaFromRecord(fuaRecord);
    }
  };

  const selectFuaFromRecord = (fua: Record<string, string | number>) => {
    fuaResults.value = {
      name: fua["City or FUA"],
      region: fua["Region"],
      biodiversity: {
        label: "Biodiversity",
        // totalScore: fua["Biodiversity"],
        protectedAreas: fua["Protected Area"],
        coastalHabitats: fua["Coastal habitat"],
        fractionNaturalArea: fua["Green/Blue Area"],
        ambitionPerformance: fua["Biodiversity-related ambition and performance"],
      },
      climate: {
        label: "Climate",
        // totalScore: fua["Climate"],
        landSurfaceTemp: fua["Land surface temperature"],
        carbonStorage: fua["Carbon storage"],
        stormwaterHoldingCapacity: fua["Stormwater holding capacity"],
        ambitionPerformance: fua["Climate-related ambition and performance"],
      },
      socialJustice: {
        label: "Social Justice",
        // totalScore: fua["Social Justice"],
        blueGreenSpace: fua["Population access"],
        recreationPotential: fua["Recreation potential"],
        inclusiveness: fua["Inclusiveness of project beneficiaries"],
        ambitionPerformance: fua["Social justice-related ambition and performance"],
      },
      transformativePotential: {
        label: "Transformative Potential",
        // totalScore: fua["Transformative Potential"],
        resultDelivery: fua["Potential for high-quality project result delivery"],
        longTermPerspective: fua["Long-term perspective"],
        diversity: fua["Diversity of stakeholder involvement"],
        targetAlignment:
          fua["Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives"],
      },
    };

    console.log("end of fuaresults");
    console.log(fuaResults.value);
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
    // console.log(allProjects.value);
    let id;
    let fua;
    id = Number(feat.properties.ID);
    fua = feat.properties["City or FUA"];

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
        // if (project["City or FUA"]) {
        //   const projectFua = String(project["City or FUA"])
        //     .replace(/\s*\(FUA\)\s*$/i, "")
        //     .trim();
        //   const fuaRecord = allFua.value.find((record) => String(record.FUA).trim() === projectFua);

        //   if (fuaRecord) {
        //     console.log("Found matching FUA record:", fuaRecord);
        //     selectFuaFromRecord(fuaRecord);
        //   }
        // }
      }
    });
  };

  const generatePdf = async () => {
    // set fonts
    pdfMake.fonts = {
      Roboto: {
        normal:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
        bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
        italics:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf",
        bolditalics:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf",
      },
    };

    let today = new Date();
    let dateString = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const s = (value: any) => (value === undefined || value === null ? "" : String(value));

    const content: any[] = [
      {
        text: "Naturescapes Collection",
        style: ["header1", "centerItem"],
        margin: [0, 0, 0, 20],
      },
    ];

    projectCollection.value.forEach((project) => {
      // selectProjectFromRecord(project);
      const selectedProject = {
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

      content.push({
        text: s(selectedProject.name),
        style: "header2",
        margin: [0, 0, 0, 10],
      });

      // Biodiversity Table
      content.push({ text: "Biodiversity", style: "header3", margin: [0, 10, 0, 5] });
      content.push({
        table: {
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: [
            [
              { text: "", style: "tableHeader" },
              { text: "Protected Areas", style: "tableHeader" },
              { text: "Coastal Habitats", style: "tableHeader" },
              { text: "Fraction of Natural Area", style: "tableHeader" },
              { text: "Ambition and performance", style: "tableHeader" },
            ],
            [
              "Project",
              s(selectedProject.biodiversity.protectedAreas),
              s(selectedProject.biodiversity.coastalHabitats),
              s(selectedProject.biodiversity.fractionNaturalArea),
              s(selectedProject.biodiversity.ambitionPerformance),
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 10],
      });

      // Climate Table
      content.push({ text: "Climate", style: "header3", margin: [0, 10, 0, 5] });
      content.push({
        table: {
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: [
            [
              { text: "", style: "tableHeader" },
              { text: "Land Surface Temperature", style: "tableHeader" },
              { text: "Carbon Storage", style: "tableHeader" },
              { text: "Stormwater Holding Capacity", style: "tableHeader" },
              { text: "Ambition and performance", style: "tableHeader" },
            ],
            [
              "Project",
              s(selectedProject.climate.landSurfaceTemp),
              s(selectedProject.climate.carbonStorage),
              s(selectedProject.climate.stormwaterHoldingCapacity),
              s(selectedProject.climate.ambitionPerformance),
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 10],
      });

      // Social Justice Table
      content.push({ text: "Social Justice", style: "header3", margin: [0, 10, 0, 5] });
      content.push({
        table: {
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: [
            [
              { text: "", style: "tableHeader" },
              { text: "Population Access to Blue and Green Spaces", style: "tableHeader" },
              { text: "Recreation Potential Within and Without NBS", style: "tableHeader" },
              { text: "Inclusiveness of Project Beneficiaries", style: "tableHeader" },
              { text: "Ambition and performance", style: "tableHeader" },
            ],
            [
              "Project",
              s(selectedProject.socialJustice.blueGreenSpace),
              s(selectedProject.socialJustice.recreationPotential),
              s(selectedProject.socialJustice.inclusiveness),
              s(selectedProject.socialJustice.ambitionPerformance),
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 10],
      });

      // Transformative Potential Table
      content.push({ text: "Transformative Potential", style: "header3", margin: [0, 10, 0, 5] });
      content.push({
        table: {
          widths: ["20%", "20%", "20%", "20%", "20%"],
          body: [
            [
              { text: "", style: "tableHeader" },
              { text: "Potential for High Quality Project Result Delivery", style: "tableHeader" },
              { text: "Long-term Perspective", style: "tableHeader" },
              { text: "Diversity of Stakeholder Involvement", style: "tableHeader" },
              {
                text: "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives",
                style: "tableHeader",
              },
            ],
            [
              "Project",
              s(selectedProject.transformativePotential.resultDelivery),
              s(selectedProject.transformativePotential.longTermPerspective),
              s(selectedProject.transformativePotential.diversity),
              s(selectedProject.transformativePotential.targetAlignment),
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 20], // Add more margin after the last table for spacing
      });
    });

    let docDefinition = {
      header: {
        text: dateString,
        alignment: "right",
        margin: [0, 20, 20, 0],
      },
      footer: function (currentPage, pageCount) {
        return {
          text: "Page " + currentPage.toString() + " of " + pageCount.toString(),
          alignment: "center",
          margin: [0, 0, 0, 10],
        };
      },
      content: content,
      defaultStyle: {
        fontSize: 11,
        color: "#374269",
      },
      styles: {
        header1: {
          bold: true,
          fontSize: 18,
        },
        header1a: {
          bold: true,
          fontSize: 16,
        },
        header2: {
          bold: true,
          fontSize: 14,
        },
        header3: {
          bold: true,
          fontSize: 12,
        },
        header4: {
          fontSize: 12,
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: "black",
        },
        anotherStyle: {
          italics: true,
          alignment: "right",
        },
        boldItem: {
          bold: true,
        },
        centerItem: {
          alignment: "center",
        },
      },
    };
    pdfMake.createPdf(docDefinition).download();
  };

  function goBack() {
    selectedProject.value = null;
    selectedFeature.value = null;
  }

  return {
    mapboxToken,
    map,
    mapLoaded,
    zoomLevel,
    initMap,
    selectedFeature,
    featureSelected: selectedFeature,
    allProjects,
    visibleProjectIds,
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
    indicatorFilterState,
    fuaResults,
    projectToggleOption,
    projectCollection,
    numOfFilters,
    dialogVisible,
    tableFilterBiodiversity,
    tableFilterClimate,
    tableFilterSocialJustice,
    tableFilterTransformativePotential,
    showUserGuide,
    getIndicatorFilterValue,
    setIndicatorFilterValue,
    clearIndicatorFilters,
    resetFilters,
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
    goBack,
    generatePdf,
    advancedFiltersApplied,
  };
});
