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
            The
            <a href="https://www.naturescapes-project.com/" target="_blank">Naturescapes</a> project
            provides an overview of the contributions of different nature-based solutions (NBS)
            within functional urban areas (FUAs) to address sustainability challenges based on a
            common set of quantitative and qualitative indicators.
            <br />
            <br />
            It serves as a simple starting point for understanding individual NBS impacts and for
            creating an overview of the possible synergies across NBS assemblages (naturescapes) in
            specific thematic domains or areas.
            <br />
            <br />
            The database includes the profile of 390 NBS sites over 30 FUAs and it is available both
            as a stand-alone database here and through the
            <a href="https://una.city/front-search/collection_phase/5" target="_blank"
              >Urban Nature Atlas</a
            >
            where more details are available on the individual NBS.
            <br />
            <br />
            <a href="/scorecard_purpose_draft_methodology.pdf" target="_blank"
              >Brief on Scorecard Purpose and Draft Methodology</a
            >
          </div>
          <q-separator class="q-my-md" />
        </div>
      </q-slide-transition>
      <div
        v-if="!mapStore.selectedProject"
        style="
          width: 100%;
          display: block;
          position: sticky;
          top: 0;
          z-index: 1;
          background-color: #f7f6f7;
          padding: 0px 0px 10px 0px;
        "
      >
        <q-btn-toggle
          v-model="mapStore.projectToggleOption"
          spread
          no-caps
          unelevated
          color="white"
          toggle-color="secondary"
          text-color="black"
          toggle-text-color="black"
          style="border: 1px solid #e0e0e0"
          :options="[
            { label: 'All NBS Projects', value: 'all', slot: 'one' },
            { label: 'Naturescape Collection', value: 'set', slot: 'two' },
          ]"
        >
          <template v-slot:one>
            <q-chip class="q-ml-sm" outline dense color="grey-6" text-color="white" label="390" />
          </template>
          <template v-slot:two>
            <q-chip
              class="q-ml-sm"
              outline
              dense
              color="grey-6"
              text-color="white"
              :label="mapStore.projectCollection.length.toString()"
            />
          </template>
        </q-btn-toggle>
      </div>
      <div v-if="!mapStore.selectedProject" class="search-row">
        <div v-if="mapStore.projectToggleOption == 'all'" class="search-inline">
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
        <div v-if="mapStore.projectToggleOption == 'all'" class="search-btn-wrap q-mt-xs">
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
            >
            <!-- <q-badge
              v-if="mapStore.filterQuery != ''"
              floating
              transparent
              rounded
              color="red"
              :label="mapStore.numOfFilters"
          /> -->
          </q-btn>
        </div>
        <div v-if="mapStore.projectToggleOption == 'all'" class="cards-wrap q-pb-xl">
          <div class="card-grid" :class="{ 'is-expanded': mapStore.sidePanelExpanded }">
            <ScoreCard v-for="(card, i) in filteredProjects" :key="i" :model-value="card" />
          </div>
        </div>
        <div v-else class="cards-wrap q-pb-xl">
          <div v-if="mapStore.projectCollection.length > 0" class="text-center">
            <q-btn
              class="q-mx-md"
              style="background-color: #f6f2c0"
              text-color="black"
              flat
              round
              icon="download"
              @click="mapStore.generatePdf()"
              ><q-tooltip>Save Collection</q-tooltip></q-btn
            >
            <q-btn
              class="q-mx-md"
              style="background-color: #f6f2c0"
              text-color="black"
              flat
              round
              icon="delete_forever"
              @click="mapStore.projectCollection = []"
              ><q-tooltip>Clear Collection</q-tooltip></q-btn
            >
          </div>
          <div
            v-if="mapStore.projectCollection.length > 0"
            class="card-grid q-mt-sm"
            :class="{ 'is-expanded': mapStore.sidePanelExpanded }"
          >
            <ScoreCard
              v-for="(card, i) in mapStore.projectCollection"
              :key="i"
              :model-value="card"
            />
          </div>
          <div v-else class="text-center" style="color: red">
            <span class="material-icons-outlined"> announcement </span>
            <br />
            There are currently no projects added to your collection.
          </div>
        </div>
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
            @click="mapStore.goBack"
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
            <div class="row justify-between items-center q-my-sm score-row">
              <div class="col text-center score-cell">
                <div>Biodiversity</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="Number(mapStore.selectedProject.biodiversity.totalScore)"
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
                  :value="Number(mapStore.selectedProject.climate.totalScore)"
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
                  :value="Number(mapStore.selectedProject.socialJustice.totalScore)"
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
              <div class="col text-center score-cell q-pr-lg" style="white-space: nowrap">
                <div style="">Transformative Potential</div>
                <q-circular-progress
                  show-value
                  font-size="12px"
                  :value="Number(mapStore.selectedProject.transformativePotential.totalScore)"
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
            <!-- Biodiversity Table -->
            <div style="display: flex">
              <div>Biodiversity</div>
              <!-- <IconButton :type="'info'"></IconButton> -->
            </div>
            <div class="q-my-md">
              The Biodiversity theme evaluates potential NBS impacts on biodiversity in terms of
              habitat protection and ecosystem connectivity, as well as comparing performance
              against declared biodiversity goals.
            </div>
            <table style="border-collapse: collapse; width: 100%">
              <tr>
                <th :style="cellStyle" style="background-color: lightgrey"></th>
                <th :style="cellStyle">Protected<br />Areas</th>
                <th :style="cellStyle">Coastal<br />Habitats</th>
                <th :style="cellStyle">Fraction of<br />Natural Area</th>
                <th :style="cellStyle">Ambition and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">Project</td>
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
              <tr v-if="mapStore.fuaResults">
                <td :style="{ ...cellStyle }">FUA</td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.biodiversity.protectedAreas }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.biodiversity.coastalHabitats }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.biodiversity.fractionNaturalArea }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.biodiversity.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />
            <!-- Climate Table -->
            <div>Climate</div>
            <div class="q-my-md">
              Under the Climate theme, indicators assess the contribution of NBS assemblages to
              climate change mitigation and adaptation through impacts on land surface temperature
              reduction, carbon storage, and stormwater retention and evaluate these contributions
              compared to stated climate-related ambitions.
            </div>
            <table style="border-collapse: collapse; width: 100%">
              <tr>
                <th :style="cellStyle" style="background-color: lightgrey"></th>
                <th :style="cellStyle">Land Surface<br />Temperature</th>
                <th :style="cellStyle">Carbon<br />Storage</th>
                <th :style="cellStyle">Stormwater Holding<br />Capacity</th>
                <th :style="cellStyle">Ambition and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">Project</td>
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
              <tr v-if="mapStore.fuaResults">
                <td :style="{ ...cellStyle }">FUA</td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.climate.landSurfaceTemp }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.climate.carbonStorage }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.climate.stormwaterHoldingCapacity }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.climate.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />
            <!-- Social Justice Table -->
            <div>Social Justice</div>
            <div class="q-my-md">
              The Social Justice theme focuses on the accessibility and equitable distribution of
              NBS benefits, including an evaluation of the proximity of people to green and blue
              spaces, recreational opportunities, and the inclusiveness of beneficiary groups. It
              also evaluates these impacts from the perspective of social justice-related ambitions.
            </div>
            <table style="border-collapse: collapse; width: 100%">
              <tr>
                <th :style="cellStyle" style="background-color: lightgrey"></th>
                <th :style="cellStyle">Population Access<br />to Blue and Green<br />Spaces</th>
                <th :style="cellStyle">Recreation Potential<br />Within and Without<br />NBS</th>
                <th :style="cellStyle">Inclusiveness<br />of<br />Project Beneficiaries</th>
                <th :style="cellStyle">Ambition<br />and<br />performance</th>
              </tr>
              <tr>
                <td :style="{ ...cellStyle }">Project</td>
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
              <tr v-if="mapStore.fuaResults">
                <td :style="{ ...cellStyle }">FUA</td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.socialJustice.blueGreenSpace }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.socialJustice.recreationPotential }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.socialJustice.inclusiveness }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.socialJustice.ambitionPerformance }}
                </td>
              </tr>
            </table>
            <br />
            <!-- Transformative Potential Table -->
            <div>Transformative Potential</div>
            <div class="q-my-md">
              The Transformative Potential theme considers the long-term sustainability and systemic
              impact of NBS by assessing the quality of project design, integration of long-term and
              cross-cutting perspectives, and considerations given to stakeholder diversity.
            </div>
            <table style="border-collapse: collapse; width: 100%">
              <tr>
                <th :style="cellStyle" style="background-color: lightgrey"></th>
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
                <td :style="{ ...cellStyle }">Project</td>
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
              <tr v-if="mapStore.fuaResults">
                <td :style="{ ...cellStyle }">FUA</td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.transformativePotential.resultDelivery }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.transformativePotential.longTermPerspective }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.transformativePotential.diversity }}
                </td>
                <td :style="{ ...cellStyle }">
                  {{ mapStore.fuaResults.transformativePotential.targetAlignment }}
                </td>
              </tr>
            </table>
            <br />

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
  /* justify-content: center; */
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
