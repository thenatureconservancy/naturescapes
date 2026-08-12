<template>
  <div id="results-panel">
    <div class="results-panel__header q-mb-sm">
      <div style="display: flex; align-items: center">
        <div class="q-mr-sm">
          <h6><b>Filter</b></h6>
        </div>
        <div
          v-if="!mapStore.showFilterInfo"
          @click="mapStore.showFilterInfo = !mapStore.showFilterInfo"
        >
          <IconButton type="filter" />
        </div>
        <div v-else @click="mapStore.showFilterInfo = !mapStore.showFilterInfo">
          <IconButton type="close" />
        </div>
      </div>
      <q-btn icon="close" flat size="small" round @click="mapStore.closeResultsPanel"></q-btn>
    </div>
    <div v-if="mapStore.showFilterInfo" class="q-mb-md">
      <div>
        The Naturescapes scorecard aims to communicate the potential contributions of NBS
        interventions across our four key thematic areas, using a combination of quantitative and
        qualitative indicators that describe the potential impact of NBS on a particular aspect of
        these four thematic areas.
      </div>
      <div>
        <ul>
          <li>
            Under the Climate theme, indicators assess the contribution of NBS assemblages to
            climate change mitigation and adaptation through impacts on land surface temperature
            reduction, carbon storage, and stormwater retention and evaluate these contributions
            compared to stated climate-related ambitions.
          </li>
          <li>
            The Biodiversity theme evaluates potential NBS impacts on biodiversity in terms of
            habitat protection and ecosystem connectivity, as well as comparing performance against
            declared biodiversity goals.
          </li>
          <li>
            The Social Justice theme focuses on the accessibility and equitable distribution of NBS
            benefits, including an evaluation of the proximity of people to green and blue spaces,
            recreational opportunities, and the inclusiveness of beneficiary groups. It also
            evaluates these impacts from the perspective of social justice-related ambitions.
          </li>
          <li>
            The Transformative Potential theme considers the long-term sustainability and systemic
            impact of NBS by assessing the quality of project design, integration of long-term and
            cross-cutting perspectives, and considerations given to stakeholder diversity.
          </li>
        </ul>
      </div>
    </div>

    <q-separator />

    <div>
      <div class="q-my-md">Filter by Location</div>
      <div class="q-mt-sm row" style="display: flex">
        <div
          class="col q-mr-md q-ml-xs"
          id="search-location"
          ref="searchLocationEl"
          style="border: 1px solid #c2c2c2; border-radius: 4px"
        ></div>
      </div>
      <div>
        <q-select
          v-model="mapStore.filterRegion"
          outlined
          options-dense
          multiple
          dense
          label="Region(s)"
          class="bg-white"
          use-chips
          :options="[
            'Africa',
            'Asia',
            'Europe',
            'Latin America and the Caribbean',
            'Northern America',
          ]"
        />
      </div>
      <div>
        <q-select
          v-model="mapStore.filterFUA"
          outlined
          options-dense
          multiple
          dense
          label="Functional Urban Area(s) (FUA)"
          class="bg-white"
          use-chips
          :options="[
            'Adana',
            'Alexandria',
            'Belgrade',
            'Berlin',
            'Birmingham',
            'Cagliari',
            'Cartagena',
            'Ciudad Juárez',
            'Colombo',
            'Detroit',
            'Dublin',
            'La Paz',
            'Fort-de-France',
            'Gdansk',
            'Gothenburg',
            'Iaşi',
            'Kunming',
            'Lima',
            'Lisbon',
            'Marseille',
            'Miskolc',
            'Mobile',
            'Nairobi',
            'Phoenix',
            'Porto Velho',
            'Seville',
            'Tbilisi',
            'Thessaloniki',
            'Tirana',
            'Vienna',
          ]"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div>
      <div class="q-my-md">Filter by Indicator</div>
      <q-expansion-item style="border-radius: 10px !important" label="Biodiversity">
        <div class="q-ma-lg">
          <FilterOption
            :modelValue="{
              label: 'Protected Areas',
              min: 0,
              max: 4,
              value: 0,
              description:
                'The degree of protection for the NBS site. Many sites have no formal protection. For those that do, we have also recorded the IUCN protected category, which describes the degree of protection.',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Coastal Habitats',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Coastal habitats within the Nature-based solution. For NBS-level, this is a binary variable (in the low-elevation coastal zone or not). For the FUA-level, we record the amount and type of habitats within the low-elevation coastal zone.',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Fraction of Natural Area',
              min: 0,
              max: 4,
              value: 0,
              description:
                '% of land covered by green/blue ‘natural’ area within the NBS vs a 1 km buffer.',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'NBS Biodiversity-related Ambition and Performance',
              min: 0,
              max: 4,
              value: 0,
              description: '',
            }"
          />
        </div>
      </q-expansion-item>
      <q-expansion-item style="border-radius: 10px !important" label="Climate">
        <div class="q-ma-lg">
          <FilterOption
            :modelValue="{
              label: 'Land Surface Temperature',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Summer land surface temperature (Celsius), as the average (arithmetic mean) within NBS sites, relative to a 1 km buffer around sites. ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Carbon Storage',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Carbon density, average (arithmetic mean) within the NBS site relative to a 1 km buffer ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Stormwater Holding Capacity',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Improvement of yearly storm water run-off reduction with versus without an NBS',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'NBS Climate-related Ambition and Performance',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Assessing the alignment of NBS projects ambitions and on-the-ground performance is crucial to understanding whether projects formulate climate goals and deliver on these goals. NBS projects that establish goals but fail to report or measure project outcomes risk demonstrating an aspirational performance, while those projects that report impacts without the intentional establishment of project goals may lack strategic project design or may generate unintended or coincidental co-benefits. The indicator evaluates whether the NBS project set the ambition to address problems related to climate action (for adaptation, resilience, and/or mitigation), and whether it delivered any project impacts across this area. Specifically, the indicator assesses the degree to which the project demonstrated both ambition by establishing climate-related goals from the project design phase, and performance by reporting climate-related impacts through implementation.',
            }"
          />
        </div>
      </q-expansion-item>
      <q-expansion-item style="border-radius: 10px !important" label="Social Justice">
        <div class="q-ma-lg">
          <FilterOption
            :modelValue="{
              label: 'Population Access to Blue and Green Spaces',
              min: 0,
              max: 4,
              value: 0,
              description: 'Population within 1 km of NBS sites ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Recreation Potential within and without NBS',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Percent increase recreation accessibility in the NBS and NBS buffer areas compared with and without the NBS. ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Inclusiveness of Project Beneficiaries',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Achieving equitable outcomes and social legitimacy for NBS interventions begins by ensuring the inclusiveness of the different social groups that need and benefit from the intervention. Overlooking local context needs and current or future challenges may result in an elevated risk of uneven NBS benefits distribution. Thus, an inclusive project design is centered on considering effective approaches to reach a representative cross-section of the local community, target the needs of commonly marginalized or vulnerable groups, and foster stakeholder ownership. The indicator on inclusiveness of project beneficiaries assesses the extent to which the project plans and implementation identify and target a diverse array of social groups. Beyond measuring the extent to which different groups are considered as intended project beneficiaries (community groups, marginalized groups or institutional actors), the indicator also considers the extent to which project plans refer to the creation or improvement of project amenities (e.g. benches, drinking fountains, playgrounds) that cater to the needs of varied social groups. ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'NBS Social Justice-related Ambition and Performance',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Assessing the alignment of NBS projects ambitions and on-the-ground performance is crucial to understanding whether projects formulate social justice-related goals and deliver on these goals. NBS projects that establish goals but fail to report or measure project outcomes risk demonstrating an aspirational performance, while those projects that report impacts without the intentional establishment of project goals may lack strategic project design or may generate unintended or coincidental co-benefits. The indicator evaluates whether the NBS project set the ambition to address problems related to social justice, and whether it delivered any project impacts across this area. Specifically, the indicator assesses the degree to which the project demonstrated both ambition by establishing social justice-related goals from the project design phase, and performance by reporting social justice-related impacts through implementation.',
            }"
          />
        </div>
      </q-expansion-item>
      <q-expansion-item style="border-radius: 10px !important" label="Transformative Potential">
        <div class="q-ma-lg">
          <FilterOption
            :modelValue="{
              label: 'Potential for High-Quality Project Result Delivery',
              min: 0,
              max: 4,
              value: 0,
              description:
                'NBS projects are often recognized for their multi-solution capacity to tackle several suitability challenges simultaneously, delivering a multitude of co-benefits to ecosystems and society. However, due to the increasing diversity of NBS uptake over the last decade, research attention has been raised on determining the actual potential for successful NBS project delivery. This indicator measures the potential of an NBS project to be considered a “high-quality” NBS by assessing its performance across four critical areas: delivering multiple achieved co-benefits simultaneously, delivering these co-benefits equitably, involving different stakeholders in project design and implementation, and introducing measures to enhance the transparency of project implementation, outcomes and results.',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Long-term Perspective',
              min: 0,
              max: 4,
              value: 0,
              description:
                'For NBS projects to effectively contribute to addressing critical sustainability challenges, such as climate change, biodiversity loss, and social justice, and deliver systemic transformation, NBS interventions must not only provide short-term benefits but also demonstrate foresight and strategic integration across ecological and social dimensions. Recognizing, planning, and establishing management systems for the long term can help ensure that NBS remain relevant under changing socio-economic contexts. The indicator assesses the extent to which the NBS project is designed and implemented, with a long-term perspective that ensures its sustainability, long-term effectiveness, and overall withstanding of future environmental stressors. ',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Diversity of Stakeholder Involvement',
              min: 0,
              max: 4,
              value: 0,
              description:
                'Involvement of a diverse range of stakeholders at various stages of NBS project cycles is fundamental for both the projects success and its legitimacy and acceptance. The inclusion of a diverse stakeholder group in the planning and implementation phases contributes to a more comprehensive approach to problem-solving through NBS, encourages collaboration and knowledge sharing, and enhances the potential for innovative and context-rich solutions. This indicator assesses the diversity of stakeholder groups involved in leading and implementing the project, encompassing municipal, regional, and national governmental bodies, as well as engagement with NGOs and grassroots community groups, universities, and professional networks, and participation from private sector companies and financial institutions.',
            }"
          />
          <FilterOption
            :modelValue="{
              label: 'Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives',
              min: 0,
              max: 4,
              value: 0,
              description:
                'This indicator measures how thoroughly NBS project targets are aligned with the three key priority areas of climate action (adaptation and/or mitigation), biodiversity (conservation and/or mitigation), and social justice (including social cohesion and inclusion). A high-scoring NBS in this context demonstrates a comprehensive targeting effort and a clear commitment to multi-solving across these key priority areas. In contrast, lower scores indicate a more limited focus on some of these key areas, or they may also suggest that the project is intended to focus on other key domains (e.g., economic development, environmental quality, cultural heritage). ',
            }"
          />
        </div>
      </q-expansion-item>
    </div>

    <div class="results-panel__actions">
      <q-btn
        text-color="dark-grey"
        flat
        label="Reset Filters"
        class="results-panel__reset-btn"
        style="background-color: #f6f2c0"
        @click="mapStore.resetFilters"
      ></q-btn>
    </div>
  </div>
</template>

<script setup>
import FilterOption from "./UI/FilterOption.vue";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useMapStore } from "../stores/mapStore";
import IconButton from "./UI/IconButton.vue";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
const mapStore = useMapStore();
const searchLocationEl = ref(null);
let geocoder = null;

async function initGeocoder() {
  await nextTick();

  if (!searchLocationEl.value) {
    console.warn("Geocoder mount element not found.");
    return;
  }

  const accessToken = mapStore.mapboxToken || mapboxgl.accessToken;
  if (!accessToken) {
    console.error("Mapbox token is missing. Geocoder was not initialized.");
    return;
  }

  geocoder = new MapboxGeocoder({
    accessToken,
    mapboxgl,
    marker: false,
    placeholder: "Search for a location...",
    types: "country,region,district,place",
  });

  geocoder.addTo(searchLocationEl.value);

  // Add geocoder result to container.
  geocoder.on("result", (e) => {
    goToSearchLocation(e.result);
    // geocoder.clear();
    console.log("GEOCODE RESULTS", e.result);
  });
}

async function goToSearchLocation(val) {
  mapStore.filterLocation = val;
}

onMounted(() => {
  try {
    initGeocoder();
  } catch (error) {
    console.log("ERROR INIT GEOCODER", error);
  }
});

onUnmounted(() => {
  if (geocoder) {
    geocoder.onRemove();
    geocoder = null;
  }
});
</script>

<style scoped>
#results-panel {
  padding: 12px 12px 16px;
}

.results-panel__actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin-top: 8px;
  padding: 12px 0 8px;
}

.results-panel__reset-btn {
  width: 90%;
  margin: 0 auto;
  display: block;
}

.results-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.results-panel__close {
  appearance: none;
  border: 0;
  background: #e7e7e7;
  color: #222;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.results-panel__close:hover {
  background: #d8d8d8;
  transform: scale(1.05);
}

.results-panel__close:focus-visible {
  outline: 2px solid #222;
  outline-offset: 2px;
}
.search {
  display: flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: white;
  padding: 0 12px;
  height: 48px; /* matches expansion header height */
  margin: 8px 0;
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

/* Icon */
.search-icon {
  font-size: 16px;
  color: #666;
}

#search-location :deep(.mapboxgl-ctrl-geocoder) {
  width: 100%;
  max-width: none;
  min-height: 40px;
  box-shadow: none;
}

/* Smooth open */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
