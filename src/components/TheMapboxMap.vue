<template>
  <div id="map" :class="mapClass"></div>

  <div class="basemap-control-wrap">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group custom-control">
      <q-btn
        :ripple="false"
        flat
        dense
        icon="layers"
        @click="mapStore.displayBasemaps = !mapStore.displayBasemaps"
      >
        <q-tooltip
          class="bg-white text-body2 text-black shadow-2"
          style="border: 1px solid grey"
          anchor="center right"
          self="center start"
          >Basemaps</q-tooltip
        >
      </q-btn>
    </div>

    <transition name="basemap-slide">
      <div
        v-if="mapStore.displayBasemaps"
        class="basemap-panel q-px-md q-py-sm"
        style="background-color: #f7f6f7"
      >
        <q-list>
          <q-item clickable v-ripple @click="mapStore.basemapOption = 'standard'">
            <q-item-section thumbnail>
              <img src="/streets_basemap.jpg" style="width: 60px" />
            </q-item-section>
            <q-item-section>Streets</q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="mapStore.basemapOption = 'light'">
            <q-item-section thumbnail>
              <img src="/light_basemap.jpg" style="width: 60px" />
            </q-item-section>
            <q-item-section>Light</q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="mapStore.basemapOption = 'dark'">
            <q-item-section thumbnail>
              <img src="/dark_basemap.jpg" style="width: 60px" />
            </q-item-section>
            <q-item-section>Dark</q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-ripple @click="mapStore.basemapOption = 'imagery'">
            <q-item-section thumbnail>
              <img src="/imagery_basemap.jpg" style="width: 60px" />
            </q-item-section>
            <q-item-section>Satellite Imagery</q-item-section>
          </q-item>
          <!-- <q-separator />
          <q-item clickable v-ripple>
            <q-item-section>Icon as avatar</q-item-section>
            <q-item-section avatar>
              <q-icon color="primary" name="bluetooth" />
            </q-item-section>
          </q-item> -->
        </q-list>
      </div>
    </transition>
  </div>

  <div class="left-action-control-wrap">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group custom-control" style="margin-bottom: 5px">
      <q-btn
        :ripple="false"
        flat
        dense
        icon="home"
        @click="mapStore.map?.flyTo({ center: [10.099215, 51.249358], zoom: 2.2 })"
      >
        <q-tooltip
          class="bg-white text-body2 text-black shadow-2"
          style="border: 1px solid grey"
          anchor="center right"
          self="center start"
          >Reset zoom</q-tooltip
        ></q-btn
      >
    </div>

    <div class="mapboxgl-ctrl mapboxgl-ctrl-group custom-control">
      <q-btn
        :ripple="false"
        flat
        dense
        :icon="
          mapStore.sidePanelExpanded ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'
        "
        @click="mapStore.sidePanelExpanded = !mapStore.sidePanelExpanded"
      >
        <q-tooltip
          class="bg-white text-body2 text-black shadow-2"
          style="border: 1px solid grey"
          anchor="center right"
          self="center start"
        >
          Expand or contract side panel
        </q-tooltip></q-btn
      >
    </div>
  </div>

  <div id="info"></div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, watch } from "vue";
import "mapbox-gl/dist/mapbox-gl.css";

// import map store
import { useMapStore } from "../stores/mapStore";
const mapStore = useMapStore();

onMounted(() => {
  if (!mapStore.map) {
    mapStore.initMap();
  } else {
    console.log("map already initialized");
    try {
      console.log("resizing map on mounted");
      //mapStore.map.resize()
    } catch (e) {
      console.error("Error resizing map on mounted:", e);
    }
  }

  watch(
    () => mapStore.basemapOption,
    (newOption) => {
      if (mapStore.map) {
        mapStore.applyBasemapStyle(newOption);
      }
    },
  );

  watch(
    () => mapStore.sidePanelExpanded,
    async () => {
      await nextTick();
      window.setTimeout(() => {
        mapStore.map?.resize();
      }, 280);
    },
  );
});

// onActivated(() => {
//   if (mapStore.map) {
//     console.log("resizing map on activated");
//     try {
//       mapStore.map.resize();
//     } catch (e) {
//       console.error("Error resizing map on activated:", e);
//     }
//   }
// });
</script>

<style>
div#map {
  position: relative;
  top: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  background: #f7f6f7 !important;
  color: #ccc;
  /* border-radius: 20px; */
}

.map-legend-outer {
  position: absolute;
  bottom: 25px;
  right: 10px;
  z-index: 999;
  width: 300px;
  font-family: "Barlow", sans-serif;
}

.map-legend-container {
  background-color: white;
  border-radius: 10px;
  padding: 8px 8px 5px;
  box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.25);
}

/* .map-container {
  position: relative;
} */

.custom-control {
  position: relative;
  z-index: 2;
}

.basemap-control-wrap {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.left-action-control-wrap {
  position: absolute;
  top: 88px;
  left: 10px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basemap-panel {
  position: absolute;
  top: 0;
  right: calc(100% + 10px);
  width: fit-content;
  max-width: min(280px, calc(100vw - 70px));
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.basemap-slide-enter-active,
.basemap-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.basemap-slide-enter-from,
.basemap-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
