<template>
  <div class="q-mt-sm" style="height: 100%; width: 100%">
    <q-table
      class="my-sticky-header-column-table"
      flat
      bordered
      :rows="rows"
      :columns="columns"
      virtual-scroll
      :rows-per-page-options="[0]"
      row-key="name"
      style="height: calc(100vh - 235px); width: 100%"
    >
      <template v-slot:top="">
        <div>
          <q-checkbox
            v-model="mapStore.tableFilterBiodiversity"
            toggle-order="tf"
            dense
            label="Biodiversity"
            class="q-mr-md"
            checked-icon="visibility"
            unchecked-icon="visibility_off"
          />
          <q-checkbox
            v-model="mapStore.tableFilterClimate"
            toggle-order="tf"
            dense
            label="Climate"
            class="q-mr-md"
            checked-icon="visibility"
            unchecked-icon="visibility_off"
          />
          <q-checkbox
            v-model="mapStore.tableFilterSocialJustice"
            toggle-order="tf"
            dense
            label="Social Justice"
            class="q-mr-md"
            checked-icon="visibility"
            unchecked-icon="visibility_off"
          />
          <q-checkbox
            v-model="mapStore.tableFilterTransformativePotential"
            toggle-order="tf"
            dense
            label="Transformative Potential"
            class="q-mr-sm"
            checked-icon="visibility"
            unchecked-icon="visibility_off"
          />
        </div>
        <q-space />
        <div>
          <div class="text-center">
            <q-btn
              class="q-ml-md"
              text-color="black"
              style="background-color: #f6f2c0"
              flat
              round
              icon="download"
              @click="
                mapStore.generatePdf();
                console.log(mapStore.projectCollection);
              "
              ><q-tooltip>Save Collection</q-tooltip></q-btn
            >
            <q-btn
              class="q-ml-md"
              style="background-color: #f6f2c0"
              text-color="black"
              flat
              round
              icon="map"
              @click="mapStore.projectCollection = []"
              ><q-tooltip>Show on Map</q-tooltip></q-btn
            >
            <q-btn
              class="q-ml-md"
              text-color="black"
              style="background-color: #f6f2c0"
              flat
              round
              icon="delete_forever"
              @click="mapStore.projectCollection = []"
              ><q-tooltip>Clear Collection</q-tooltip></q-btn
            >
          </div>
        </div>
        <!-- <q-space /> -->
        <!-- <q-btn
          flat
          round
          dense
          :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          @click="props.toggleFullscreen"
          class="q-ml-md"
        /> -->
      </template>
      <template v-slot:body-cell-name="props">
        <q-td :props="props" style="max-width: 200px">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="close"
            @click="removeProject(props.row)"
            class="q-mr-sm"
          />
          <span class="ellipsis">{{ props.row.name }}</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { useMapStore } from "../../stores/mapStore";
import { ref, watch, computed } from "vue";
const mapStore = useMapStore();

const removeProject = (row) => {
  const projectIndex = mapStore.projectCollection.findIndex(
    (p) => p["Name (short English title)"] === row.name,
  );
  if (projectIndex > -1) {
    mapStore.projectCollection.splice(projectIndex, 1);
  }
};

const allColumns = [
  {
    name: "name",
    required: true,
    label: "Project",
    align: "left",
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
    style: "max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
    group: "base",
  },
  // Biodiversity
  {
    name: "biodiversity",
    label: "Biodiversity",
    field: "biodiversity",
    sortable: true,
    align: "center",
    group: "biodiversity",
    style: "background-color: #e1ebd7",
  },
  {
    name: "protectedAreas",
    label: "Protected Areas",
    field: "protectedAreas",
    sortable: true,
    align: "center",
    group: "biodiversity",
    style: "background-color: #e1ebd7",
  },
  {
    name: "coastalHabitats",
    label: "Coastal Habitats",
    field: "coastalHabitats",
    align: "center",
    group: "biodiversity",
    style: "background-color: #e1ebd7",
  },
  {
    name: "fractionNaturalArea",
    label: "Fraction of Natural Area",
    field: "fractionNaturalArea",
    align: "center",
    group: "biodiversity",
    style: "background-color: #e1ebd7",
  },
  {
    name: "biodiversityAmbitionPerformance",
    label: "Ambition & Performance",
    field: "ambitionPerformance",
    group: "biodiversity",
    style: "background-color: #e1ebd7",
    align: "center",
  },
  // Climate
  {
    name: "climate",
    label: "Climate",
    field: "climate",
    sortable: true,
    group: "climate",
    style: "background-color: #f3d7d3",
    align: "center",
  },
  {
    name: "landSurfaceTemp",
    label: "Land Surface Temperature",
    field: "landSurfaceTemp",
    group: "climate",
    style: "background-color: #f3d7d3",
    align: "center",
  },
  {
    name: "carbonStorage",
    label: "Carbon Storage",
    field: "carbonStorage",
    group: "climate",
    style: "background-color: #f3d7d3",
    align: "center",
  },
  {
    name: "stormwaterHoldingCapacity",
    label: "Stormwater Holding Capacity",
    field: "stormwaterHoldingCapacity",
    group: "climate",
    style: "background-color: #f3d7d3",
    align: "center",
  },
  {
    name: "climateAmbitionPerformance",
    label: "Ambition & Performance",
    field: "ambitionPerformance",
    group: "climate",
    style: "background-color: #f3d7d3",
    align: "center",
  },
  // Social Justice
  {
    name: "socialJustice",
    label: "Social Justice",
    field: "socialJustice",
    sortable: true,
    group: "socialJustice",
    style: "background-color: #e0f1f9",
    align: "center",
  },
  {
    name: "blueGreenSpace",
    label: "Population Access",
    field: "blueGreenSpace",
    group: "socialJustice",
    style: "background-color: #e0f1f9",
    align: "center",
  },
  {
    name: "recreationPotential",
    label: "Recreation Potential",
    field: "recreationPotential",
    group: "socialJustice",
    style: "background-color: #e0f1f9",
    align: "center",
  },
  {
    name: "inclusiveness",
    label: "Inclusiveness of Project Beneficiaries",
    field: "inclusiveness",
    group: "socialJustice",
    style: "background-color: #e0f1f9",
    align: "center",
  },
  {
    name: "socialJusticeAmbitionPerformance",
    label: "Ambition & Performance",
    field: "ambitionPerformance",
    group: "socialJustice",
    style: "background-color: #e0f1f9",
    align: "center",
  },
  // Transformative Potential
  {
    name: "transformativePotential",
    label: "Transformative Potential",
    field: "transformativePotential",
    sortable: true,
    group: "transformativePotential",
    style: "background-color: #f6f2c0",
    align: "center",
  },
  {
    name: "resultDelivery",
    label: "Potential for High-quality Project Result Delivery",
    field: "resultDelivery",
    group: "transformativePotential",
    style: "background-color: #f6f2c0",
    align: "center",
  },
  {
    name: "longTermPerspective",
    label: "Long Term Perspective",
    field: "longTermPerspective",
    group: "transformativePotential",
    style: "background-color: #f6f2c0",
    align: "center",
  },
  {
    name: "diversity",
    label: "Diversity of Stakeholder Involvement",
    field: "diversity",
    group: "transformativePotential",
    style: "background-color: #f6f2c0",
    align: "center",
  },
  {
    name: "targetAlignment",
    label: "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives",
    field: "targetAlignment",
    group: "transformativePotential",
    style: "background-color: #f6f2c0",
    align: "center",
  },
];

const columns = computed(() => {
  return allColumns.filter((col) => {
    if (col.group === "base") return true;
    if (col.group === "biodiversity") return mapStore.tableFilterBiodiversity;
    if (col.group === "climate") return mapStore.tableFilterClimate;
    if (col.group === "socialJustice") return mapStore.tableFilterSocialJustice;
    if (col.group === "transformativePotential") return mapStore.tableFilterTransformativePotential;
    return false;
  });
});

const rows = ref([]);

watch(
  () => mapStore.projectCollection,
  (newCollection) => {
    rows.value = newCollection.map((project) => ({
      name: project["Name (short English title)"],
      // Biodiversity
      biodiversity: project["Biodiversity"],
      protectedAreas: project["Protected Area"],
      coastalHabitats: project["Coastal habitat"],
      fractionNaturalArea: project["Green/Blue Area Fraction"],
      biodiversityAmbitionPerformance: project["Biodiversity-related ambition and performance"],
      // Climate
      climate: project["Climate"],
      landSurfaceTemp: project["Land surface temperature"],
      carbonStorage: project["Carbon storage"],
      stormwaterHoldingCapacity: project["Stormwater holding capacity"],
      climateAmbitionPerformance: project["Climate-related ambition and performance"],
      // Social Justice
      socialJustice: project["Social Justice"],
      blueGreenSpace: project["Population access"],
      recreationPotential: project["Recreation potential"],
      inclusiveness: project["Inclusiveness of project beneficiaries"],
      socialJusticeAmbitionPerformance: project["Social justice-related ambition and performance"],
      // Transformative Potential
      transformativePotential: project["Transformative Potential"],
      resultDelivery: project["Potential for high-quality project result delivery"],
      longTermPerspective: project["Long-term perspective"],
      diversity: project["Diversity of stakeholder involvement"],
      targetAlignment:
        project["Alignment of NBS targets with Climate, Biodiversity, and Social Objectives"],
    }));
  },
  { immediate: true, deep: true },
);
</script>

<style lang="sass">
.my-sticky-header-column-table
  /* height or max-height is important */
  height: 100%

  /* specifying max-width so the example can
    highlight the sticky column on any browser window */
  max-width: 100%

  td:first-child
    /* bg color is important for td; just specify one */
    background-color: white

  tr th
    position: sticky
    /* higher than z-index for td below */
    z-index: 2
    /* bg color is important; just specify one */
    background: white

  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
    /* highest z-index */
    z-index: 3
  thead tr:first-child th
    top: 0
    z-index: 1
  tr:first-child th:first-child
    /* highest z-index */
    z-index: 3

  td:first-child
    z-index: 1

  td:first-child, th:first-child
    position: sticky
    left: 0

  /* prevent scrolling behind sticky top row on focus */
  tbody
    /* height of all previous header rows */
    scroll-margin-top: 48px
</style>
