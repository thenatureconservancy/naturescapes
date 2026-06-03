<template>
  <q-tooltip
    class="bg-white text-primary text-h7 shadow-4"
    style="border: 1pt solid #ccc;"
    anchor="top middle"
    self="bottom middle"
    >{{ text }}</q-tooltip
  >
</template>
<script>
export default {
  props: ['text'],
};
</script>
