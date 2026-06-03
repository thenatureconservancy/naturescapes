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

    <q-card-section class="q-pt-none">
      {{ truncatedDescription }}
    </q-card-section>

    <div class="q-ma-md website-link">
      <q-btn flat stretch text-color="primary" @click="handleViewProjectDetails"
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
</style>
