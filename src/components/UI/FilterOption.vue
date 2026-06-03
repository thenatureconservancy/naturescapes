<template>
  <div class="filter-option column q-mb-md">
    <div class="row items-center no-wrap q-gutter-xs">
      <div class="overline text-weight-medium">
        {{ modelValue.label }}
      </div>
      <IconButton
        v-if="!showDescription"
        type="info"
        method="openDescription"
        @openDescription="openDescription"
      />
      <IconButton
        v-else
        type="close"
        method="closeDescription"
        @closeDescription="closeDescription"
      />
    </div>

    <div v-if="showDescription" class="text-caption q-my-sm" style="max-height: 400px">
      {{ modelValue.description || "No description available." }}
    </div>

    <div>
      <q-slider
        v-model="sliderValue"
        :min="modelValue.min"
        :max="modelValue.max"
        :step="1"
        color="primary"
        track-color="grey-4"
        marker-labels
        snap
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import IconButton from "./IconButton.vue";
import { useMapStore } from "../../stores/mapStore";

const mapStore = useMapStore();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const sliderValue = computed({
  get: () => props.modelValue.value,
  set: (nextValue) => {
    emit("update:modelValue", {
      ...props.modelValue,
      value: nextValue,
    });
  },
});

const filterOptionKey = computed(() => {
  if (props.modelValue.id !== undefined && props.modelValue.id !== null) {
    return String(props.modelValue.id);
  }

  if (props.modelValue.key !== undefined && props.modelValue.key !== null) {
    return String(props.modelValue.key);
  }

  return String(props.modelValue.label || "unknown-filter-option");
});

const showDescription = computed(() => mapStore.isFilterDescriptionOpen(filterOptionKey.value));

const openDescription = () => {
  mapStore.openFilterDescription(filterOptionKey.value);
};

const closeDescription = () => {
  mapStore.closeFilterDescription(filterOptionKey.value);
};
</script>

<style scoped>
.filter-option {
  min-width: 0;
}
</style>
