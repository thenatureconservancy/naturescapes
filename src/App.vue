<template>
  <div id="app">
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
import { useMapStore } from "./stores/mapStore";
const mapStore = useMapStore();
const ThePrimaryNavigation = defineAsyncComponent(
  () => import("./components/layout/ThePrimaryNavigation.vue"),
);
</script>

<style></style>
