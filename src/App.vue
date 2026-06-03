<template>
  <div id="app">
    <ThePrimaryNavigation />

    <router-view v-slot="{ Component }">
      <keep-alive include="MapView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { MapboxGeocoder } from "@mapbox/search-js-web";
const ThePrimaryNavigation = defineAsyncComponent(
  () => import("./components/layout/ThePrimaryNavigation.vue"),
);
</script>

<style scoped></style>
