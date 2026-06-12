<template>
  <q-card class="my-card">
    <!-- <img
      v-if="modelValue['Website of the intervention']"
      :src="modelValue['Website of the intervention']"
    /> -->

    <q-card-section>
      <div class="text-size-lg">{{ modelValue["Name (short English title)"] }}</div>
      <div class="text-subtitle2 q-mt-sm">{{ modelValue["City or FUA"] }}</div>
    </q-card-section>
    <div style="margin: 0px auto 15px auto">
      <div class="petal-wrapper">
        <div class="petal tl">
          {{ modelValue["Biodiversity"] }}
          <q-tooltip anchor="center left" self="center right">Biodiversity</q-tooltip>
        </div>
        <div class="petal tr">
          {{ modelValue["Climate"] }}
          <q-tooltip anchor="center right" self="center left">Climate</q-tooltip>
        </div>
        <div class="petal bl">
          {{ modelValue["Social Justice"] }}
          <q-tooltip anchor="center left" self="center right">Social Justice</q-tooltip>
        </div>
        <div class="petal br">
          {{ modelValue["Transformative Potential"] }}
          <q-tooltip anchor="center right" self="center left">Transformative Potential</q-tooltip>
        </div>

        <div class="center"></div>
      </div>
    </div>
    <q-card-section class="q-pt-none">
      {{ truncatedDescription }}
    </q-card-section>

    <!-- <q-card-section>
      <div class="row">
        <div class="col">
          <q-circular-progress size="md" color="primary" value="40"> </q-circular-progress>
        </div>
        <div class="col">
          <q-circular-progress size="md" color="primary" value="40"> </q-circular-progress>
        </div>
        <div class="col">
          <q-circular-progress size="md" color="primary" value="40"> </q-circular-progress>
        </div>
        <div class="col">
          <q-circular-progress size="md" color="primary" value="40"> </q-circular-progress>
        </div>
      </div>
    </q-card-section> -->

    <div class="q-ma-md website-link">
      <q-btn
        flat
        stretch
        text-color="dark-grey"
        style="background-color: #f6f2c0; border-radius: 4px !important"
        @click="handleViewProjectDetails"
        >View Project Details</q-btn
      ><br />
    </div>
  </q-card>
</template>

<script setup>
import { computed } from "vue";
import { useMapStore } from "../../stores/mapStore";
const mapStore = useMapStore();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const DESCRIPTION_MAX_LENGTH = 220;

function truncate(str, maxLength) {
  if (typeof str !== "string") {
    return "";
  }

  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

const truncatedDescription = computed(() => {
  const description = props.modelValue["Short description of the intervention"] || "";
  return truncate(description, DESCRIPTION_MAX_LENGTH);
});

const handleViewProjectDetails = () => {
  mapStore.selectProjectFromRecord(props.modelValue);
  mapStore.setSelectedFeatureFromProject(props.modelValue, "card");

  const element = document.getElementById("selected-project-info");
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<style scoped>
.my-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f7f7f7;
}

.q-card-section.q-pt-none {
  flex: 1;
}

.website-link {
  margin-top: auto;
  text-align: center;
}
.petal-wrapper {
  position: relative;
  width: 100px;
  height: 100px;

  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;

  gap: 10px; /* IMPORTANT: creates the spacing between petals */
}

/* Shared petal styles */
.petal {
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 20px;
  font-weight: 500;
  color: black;

  position: relative;
  overflow: hidden;
}

/* Individual shapes */
.tl {
  border-radius: 100px 100px 20px 100px;
  background: #84cc5c;
}

.tr {
  border-radius: 100px 100px 100px 20px;
  background: #ef7d69;
}

.bl {
  border-radius: 100px 20px 100px 100px;
  background: #76c0e7;
}

.br {
  border-radius: 20px 100px 100px 100px;
  background: #ead755;
}

/* Center circle */
.center {
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
