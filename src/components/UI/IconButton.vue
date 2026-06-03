<template>
  <q-btn
    :style="iconInfo.style"
    round
    unelevated
    :color="iconInfo.color"
    text-color="primary"
    :padding="iconInfo.padding"
    :icon="iconInfo.icon"
    @click="$emit(method)"
    :size="iconInfo.size"
  >
    <tool-tip v-if="iconInfo.tooltip" :text="iconInfo.tooltip" :delay="400"></tool-tip>
  </q-btn>
</template>
<script>
import ToolTip from "./Tooltip.vue";
export default {
  components: {
    ToolTip,
  },
  props: ["method", "type", "otherTooltip"],
  computed: {
    // This is where icons are chosen for the button, including their size, positioning, and tooltip.
    iconInfo() {
      let icon = "";
      let size = "";
      let padding = "";
      let tooltip = "";
      let style = "";
      let color = "";
      // info icon
      if (this.type === "info") {
        icon = "info_outline";
        size = "8pt";
        padding = "0px";
        tooltip = "Info";
        style = "height: 20px; width: 20px;";
      }
      // close icon
      if (this.type === "close") {
        icon = "close";
        size = "7pt";
        padding = "0px";
        tooltip = "Close";
      }
      if (this.type === "filter") {
        icon = "info_outline";
        size = "10pt";
        tooltip = "Info";
        style = "height: 20px; width: 20px;";
      }
      return { icon, size, padding, tooltip, style, color };
    },
  },
};
</script>
