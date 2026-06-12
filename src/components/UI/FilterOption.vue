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
        :marker-labels="markerLabels"
        label
        :label-value="sliderLabel"
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

const labelToField = {
  "Protected Areas": "Protected Area",
  "Coastal Habitats": "Coastal habitat",
  "Fraction of Natural Area": "Green/Blue Area Fraction",
  "NBS Biodiversity-related Ambition and Performance":
    "Biodiversity-related ambition and performance",
  "Land Surface Temperature": "Land surface temperature",
  "Carbon Storage": "Carbon storage",
  "Stormwater Holding Capacity": "Stormwater holding capacity",
  "NBS Climate-related Ambition and Performance": "Climate-related ambition and performance",
  "Population Access to Blue and Green Spaces": "Population access",
  "Recreation Potential within and without NBS": "Recreation potential",
  "Inclusiveness of Project Beneficiaries": "Inclusiveness of project beneficiaries",
  "NBS Social Justice-related Ambition and Performance":
    "Social justice-related ambition and performance",
  "Potential for High-Quality Project Result Delivery":
    "Potential for high-quality project result delivery",
  "Long-term Perspective": "Long-term perspective",
  "Diversity of Stakeholder Involvement": "Diversity of stakeholder involvement",
  "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives":
    "Alignment of NBS Targets with Climate, Biodiversity, and Social Objectives",
};

const normalizeFieldName = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^nbs\s+/, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/s$/, "");
};

const allProjectHeaders = computed(() => {
  const projects = Array.isArray(mapStore.allProjects) ? mapStore.allProjects : [];
  const first = projects[0];
  if (!first || typeof first !== "object") return [];
  return Object.keys(first);
});

const resolveFieldFromHeaders = (headers, preferredField, label) => {
  if (!headers.length) return preferredField;

  const directMatch = headers.find((header) => header === preferredField || header === label);
  if (directMatch) return directMatch;

  const lowerPreferred = String(preferredField).toLowerCase();
  const lowerLabel = String(label).toLowerCase();
  const caseInsensitiveMatch = headers.find((header) => {
    const lowerHeader = header.toLowerCase();
    return lowerHeader === lowerPreferred || lowerHeader === lowerLabel;
  });
  if (caseInsensitiveMatch) return caseInsensitiveMatch;

  const normalizedPreferred = normalizeFieldName(preferredField);
  const normalizedLabel = normalizeFieldName(label);
  const normalizedMatch = headers.find((header) => {
    const normalizedHeader = normalizeFieldName(header);
    return normalizedHeader === normalizedPreferred || normalizedHeader === normalizedLabel;
  });
  if (normalizedMatch) return normalizedMatch;

  return preferredField;
};

const dataField = computed(() => {
  const headers = allProjectHeaders.value;
  const explicitField = props.modelValue.field;
  if (explicitField !== undefined && explicitField !== null && String(explicitField).trim()) {
    return resolveFieldFromHeaders(
      headers,
      String(explicitField),
      String(props.modelValue.label ?? ""),
    );
  }

  const label = String(props.modelValue.label ?? "");
  const preferredField = labelToField[label] ?? label;
  return resolveFieldFromHeaders(headers, preferredField, label);
});

const sliderValue = computed({
  get: () => mapStore.getIndicatorFilterValue(dataField.value),
  set: (nextValue) => {
    mapStore.setIndicatorFilterValue(dataField.value, nextValue);

    emit("update:modelValue", {
      ...props.modelValue,
      value: nextValue,
    });
  },
});

const sliderLabel = computed(() => {
  return sliderValue.value === 0 ? "NA" : String(sliderValue.value);
});

const markerLabels = computed(() => {
  const min = Number(props.modelValue.min ?? 0);
  const max = Number(props.modelValue.max ?? 0);
  const labels = [];

  for (let value = min; value <= max; value += 1) {
    labels.push(value === 0 ? "NA" : String(value));
  }

  return labels;
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
