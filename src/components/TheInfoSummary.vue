<template>
  <div class="q-pt-sm q-pl-md q-pr-xs" style="background-color: #f7f6f7; height: 100%; width: 100%">
    <div class="q-mb-md" style="display: flex">
      <!-- <h2 style="margin: auto; display: block; width: fit-content">Naturescapes</h2> -->
      <q-img
        class="logo-image q-my-sm"
        fit="contain"
        src="/banner.png"
        alt="Naturescapes Logo"
        style="height: 100px; width: 100%"
      />
      <IconButton type="info" method="showInfo" @showInfo="showInfo" />
    </div>
    <q-separator class="q-mt-md" />
    <q-scroll-area class="outer-scroll-area q-mt-md q-pr-md q-pb-none">
      <q-slide-transition>
        <div v-show="mapStore.showSummaryInfo">
          <div>
            Naturescapes provides an overview of the contributions of different NBS within
            functional urban areas (FUAs) to address sustainability challenges based on a common set
            of quantitative and qualitative indicators. It serves as a simple starting point for
            understanding individual NBS impacts and for creating an overview of the possible
            synergies across NBS and NBS assemblages (naturescapes) in specific thematic domains or
            areas.
            <br />
            <br />
            The database includes the profile of 390 NBS sites over 30 Functional Urban Areas and is
            available both as a stand-alone database and through the
            <a href="https://una.city/" target="_blank">Urban Nature Atlas</a>.
            <br />
            <br />
            <a href="/scorecard_purpose_draft_methodology.pdf" target="_blank"
              >Brief on Scorecard Purpose and Draft Methodology</a
            >
          </div>
          <q-separator class="q-my-md" />
        </div>
      </q-slide-transition>
      <div v-if="!mapStore.selectedProject" class="search-row">
        <div class="search-inline">
          <div class="search-input-wrap">
            <q-input
              outlined
              dense
              standout
              placeholder="Filter by keyword(s)"
              v-model="mapStore.keywordSearch"
              class="bg-white"
            />
          </div>
        </div>
        <div class="search-btn-wrap">
          <q-btn
            text-color="dark-grey"
            class="q-mr-sm"
            style="background-color: #f6f2c0"
            icon="tune"
            round
            outlined
            flat
            @click="mapStore.resultsPanelOpen = !mapStore.resultsPanelOpen"
            ><q-tooltip
              class="bg-white text-body2 text-black shadow-2"
              style="border: 1px solid grey"
              anchor="center right"
              self="center start"
              >Advanced Filters</q-tooltip
            ></q-btn
          >
        </div>
        <div class="cards-wrap">
          <div class="card-grid" :class="{ 'is-expanded': mapStore.sidePanelExpanded }">
            <ScoreCard v-for="(card, i) in filteredProjects" :key="i" :model-value="card" />
          </div>
        </div>
        <!-- <q-img src="/dragonfly_logo.jpg" height="25px" /> -->
      </div>
      <div v-if="mapStore.selectedProject" id="selected-project-info">
        <div>
          <q-btn
            class="q-ml-xs"
            icon="arrow_back"
            round
            flat
            text-color="dark-grey"
            style="background-color: #f6f2c0"
            @click="
              mapStore.selectedProject = null;
              mapStore.selectedFeature = null;
            "
          >
            <q-tooltip>Back</q-tooltip></q-btn
          >
          <h5 class="text-center q-my-sm">{{ mapStore.selectedProject.name }}</h5>
          <div class="text-center q-my-sm" v-if="mapStore.selectedProject.nativeName !== 'NA'">
            ({{ mapStore.selectedProject.nativeName }})
          </div>
          <div class="text-center q-my-sm" v-else>({{ mapStore.selectedProject.name }})</div>
          <div class="q-my-sm">
            <strong>City or FUA:</strong> {{ mapStore.selectedProject.cityFUA }}
          </div>
          <div class="q-my-sm"><strong>Region:</strong> {{ mapStore.selectedProject.region }}</div>
          <div class="q-my-sm">
            <strong>Project Description:</strong> {{ mapStore.selectedProject.description }}
          </div>
          <div class="q-my-md text-bold">
            <a :href="mapStore.selectedProject.website" target="_blank">
              <q-icon name="launch"></q-icon> Project Website</a
            >
          </div>
          <div class="q-mt-sm" style="min-height: 0px !important">
            <div><strong>Project Details:</strong></div>
            <div class="row justify-evenly items-center q-my-sm score-row">
              <div class="col text-center score-cell">
                <div>Biodiversity</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="mapStore.selectedProject.biodiversity.totalScore"
                  :max="MAX_SCORE"
                  size="75px"
                  :thickness="0.22"
                  style="color: #84cc5c"
                  track-color="grey-5"
                  class="q-ma-md"
                >
                  {{ mapStore.selectedProject.biodiversity.totalScore }}/{{ MAX_SCORE }}
                </q-circular-progress>
              </div>
              <q-separator></q-separator>
              <div class="col text-center score-cell">
                <div>Climate</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="mapStore.selectedProject.climate.totalScore"
                  :max="MAX_SCORE"
                  size="75px"
                  :thickness="0.22"
                  style="color: #ef7d69"
                  track-color="grey-5"
                  class="q-ma-md"
                >
                  {{ mapStore.selectedProject.climate.totalScore }}/{{ MAX_SCORE }}
                </q-circular-progress>
              </div>
              <div class="col text-center score-cell">
                <div>Social Justice</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="mapStore.selectedProject.socialJustice.totalScore"
                  :max="MAX_SCORE"
                  size="75px"
                  :thickness="0.22"
                  style="color: #76c0e7"
                  track-color="grey-5"
                  class="q-ma-md"
                >
                  {{ mapStore.selectedProject.socialJustice.totalScore }}/{{ MAX_SCORE }}
                </q-circular-progress>
              </div>
              <div class="col text-center score-cell">
                <div>Transformative Potential</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="mapStore.selectedProject.transformativePotential.totalScore"
                  :max="MAX_SCORE"
                  size="75px"
                  :thickness="0.22"
                  style="color: #ead755"
                  track-color="grey-5"
                  class="q-ma-md"
                >
                  {{ mapStore.selectedProject.transformativePotential.totalScore }}/{{ MAX_SCORE }}
                </q-circular-progress>
              </div>
            </div>

            <table style="border-collapse: collapse; width: 100%">
              <th>
                <tr>
                  Biodiversity
                </tr>
              </th>
              <tr>
                <th :style="cellStyle">Protected<br />Areas</th>
                <th :style="cellStyle">Coastal<br />Habitats</th>
                <th :style="cellStyle">Fraction of<br />Natural Area</th>
                <th :style="cellStyle">Ambition and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.biodiversity.protectedAreas }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.biodiversity.coastalHabitats }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.biodiversity.fractionNaturalArea }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.biodiversity.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />
            <table style="border-collapse: collapse; width: 100%">
              <th>
                <tr>
                  Climate
                </tr>
              </th>
              <tr>
                <th :style="cellStyle">Land Surface<br />Temperature</th>
                <th :style="cellStyle">Carbon<br />Storage</th>
                <th :style="cellStyle">Stormwater Holding<br />Capacity</th>
                <th :style="cellStyle">Ambition and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.climate.landSurfaceTemp }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.climate.carbonStorage }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.climate.stormwaterHoldingCapacity }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.climate.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />

            <table style="border-collapse: collapse; width: 100%">
              <th>
                <tr>
                  Social Justice
                </tr>
              </th>
              <tr>
                <th :style="cellStyle">Population Access<br />to Blue and Green<br />Spaces</th>
                <th :style="cellStyle">Recreation Potential<br />Within and Without<br />NBS</th>
                <th :style="cellStyle">Inclusiveness<br />of<br />Project Beneficiaries</th>
                <th :style="cellStyle">Ambition<br />and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.socialJustice.blueGreenSpace }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.socialJustice.recreationPotential }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.socialJustice.inclusiveness }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.socialJustice.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />

            <table style="border-collapse: collapse; width: 100%">
              <th>
                <tr>
                  Transformative Potential
                </tr>
              </th>
              <tr>
                <th :style="cellStyle">
                  Potential for<br />High Quality<br />Project Result Delivery
                </th>
                <th :style="cellStyle">Long-term<br />Perspective</th>
                <th :style="cellStyle">Diversity of<br />Stakeholder<br />Involvement</th>
                <th :style="cellStyle">
                  Alignment of NBS Targets<br />with Climate, Biodiversity,<br />and Social
                  Objectives
                </th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.transformativePotential.resultDelivery }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.transformativePotential.longTermPerspective }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.transformativePotential.diversity }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.selectedProject.transformativePotential.targetAlignment }}
                </td>
              </tr>
            </table>
            <br />

            <!-- <div class="q-px-lg">
              Biodiversity Indicators:
              <q-list separator class="q-py-xs">
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Protected Areas</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.biodiversity.protectedAreas
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Costal Habitats</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.biodiversity.coastalHabitats
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Fraction of Natural Area</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.biodiversity.fractionNaturalArea
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >NBS Biodiversity-related Ambition and Performance</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.biodiversity.ambitionPerformance
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-px-lg">
              Climate Indicators:
              <q-list separator class="q-py-xs">
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Land Surface Temperature</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.climate.landSurfaceTemp
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Carbon Storage</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.climate.carbonStorage
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Stormwater Holding Capacity</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.climate.stormwaterHoldingCapacity
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >NBS Climate-related Ambition and Performance</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.climate.ambitionPerformance
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-px-lg">
              Social Justice Indicators:
              <q-list separator class="q-py-xs">
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Population Access to Blue and Green Spaces</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.socialJustice.blueGreenSpace
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >Recreation Potential within and without NBS</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.socialJustice.recreationPotential
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Inclusiveness of Project Beneficiaries</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.socialJustice.inclusiveness
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >NBS Social Justice-related Ambition and Performance</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.socialJustice.ambitionPerformance
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-px-lg">
              Transformative Potential Indicators:
              <q-list separator class="q-py-xs">
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >Potential for High-Quality Project Result Delivery</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.transformativePotential.resultDelivery
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Long-term Perspective</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.transformativePotential.longTermPerspective
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline>Diversity of Stakeholder Involvement</q-item-label>
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.transformativePotential.diversity
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item dense class="q-py-sm metric-row">
                  <q-item-section>
                    <q-item-label overline
                      >Alignment of NBS Targets with Climate, Biodiversity, and Social
                      Objectives</q-item-label
                    >
                    <q-item-label
                      ><strong>{{
                        mapStore.selectedProject.transformativePotential.targetAlignment
                      }}</strong></q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </div> -->

            <div class="text-center">
              <q-img class="dragonfly-logo" src="/dragonfly_logo.svg"></q-img>
            </div>

            <div class="wave-container">
              <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
                <path
                  d="M0,40 C240,80 480,0 720,30 C960,60 1200,20 1440,40 L1440,100 L0,100 Z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import ScoreCard from "./UI/ScoreCard.vue";
import IconButton from "./UI/IconButton.vue";
import { useMapStore } from "../stores/mapStore";
const mapStore = useMapStore();
const filteredProjects = ref([]);

const MAX_SCORE = 16;

const cellStyle = {
  border: "1px solid darkgrey",
  padding: "5px 5px",
  textAlign: "center",
  backgroundColor: "#f7f6f7",
};

function showInfo() {
  mapStore.showSummaryInfo = !mapStore.showSummaryInfo;
}

function applyKeywordFilter() {
  const visibleIds = mapStore.visibleProjectIds;
  const visibleIdSet = visibleIds ? new Set(visibleIds) : null;
  const baseProjects = visibleIdSet
    ? mapStore.allProjects.filter((project) => {
        const projectId = Number(project.ID ?? project.id);
        return Number.isFinite(projectId) && visibleIdSet.has(projectId);
      })
    : mapStore.allProjects;

  const keywordSearch = (mapStore.keywordSearch ?? "").trim().toLowerCase();

  if (!keywordSearch) {
    filteredProjects.value = baseProjects;
    return;
  }

  filteredProjects.value = baseProjects.filter(
    (project) =>
      // Substring match: show card when name, description, or city/FUA contains the search text.
      String(project["Name (short English title)"] ?? project.name ?? "")
        .toLowerCase()
        .includes(keywordSearch) ||
      String(project["Short description of the intervention"] ?? project.description ?? "")
        .toLowerCase()
        .includes(keywordSearch) ||
      String(project["City or FUA"] ?? "")
        .toLowerCase()
        .includes(keywordSearch),
  );
}

watch(
  () => mapStore.keywordSearch,
  () => {
    applyKeywordFilter();
  },
  { immediate: true },
);

watch(
  () => mapStore.allProjects,
  () => {
    applyKeywordFilter();
  },
  { immediate: true, deep: true },
);

watch(
  () => mapStore.visibleProjectIds,
  () => {
    applyKeywordFilter();
  },
  { immediate: true, deep: true },
);

watch(
  () => mapStore.selectedProject,
  (newValue) => {
    if (newValue) {
      mapStore.showSummaryInfo = false;
      const element = document.getElementById("selected-project-info");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  },
);
</script>

<style scoped>
.search-row {
  --space: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space);
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

.cards-wrap {
  grid-column: 1 / -1;
  width: 99%;
  min-width: 0;
  margin: auto;
}

.outer-scroll-area {
  height: calc(100% - 120px);
  width: 100%;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.card-grid > * {
  min-width: 0;
}

.card-grid.is-expanded {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.search-inline {
  display: flex;
  align-items: center;
  gap: 0px;
  width: 100%;
  min-width: 0;
}

.search-input-wrap {
  width: 100%;
  min-width: 0;
}

.search-icon-wrap {
  flex: 0 0 auto;
}

.search {
  display: flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: white;
  height: 48px; /* matches expansion header height */
  margin: 8px 0;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.search {
  padding: 0 12px;
}

/* Hover = same feel as expansion */
.search:hover,
.round-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Focus state (like active expansion) */
.search:focus-within {
  border-color: #1976d2;
}

/* Input */
.search input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
}
.round-btn {
  width: 100%;
  min-width: 72px;
  padding: 0 5px;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

/* Active / focus (same blue accent) */
.round-btn:active {
  background: #f5f5f5;
}

.round-btn:focus-visible {
  outline: none;
  border-color: #1976d2;
}

label {
  margin: 0px !important;
}

.metric-row {
  align-items: center;
}

.metric-row :deep(.q-item__section) {
  justify-content: center;
}

.score-row {
  min-height: 180px;
}

.score-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.wave-container svg {
  display: block;
  width: 100%;
  height: 70px;
  fill: #d9c44d;
}

.dragonfly-logo {
  width: min(80px, 60%);
  margin: 15px auto;
}
</style>
