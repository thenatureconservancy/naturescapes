<script setup>
import PDFObject from "pdfobject/pdfobject";
import { onMounted } from "vue";

onMounted(() => {
  PDFObject.embed("/UserGuide.pdf", "#pdf", {
    height: "51rem",
    width: "50rem",
  });
});
</script>

<template>
  <div id="pdf"></div>
</template>

<style>
#end > #more {
  display: none !important;
}
</style>
