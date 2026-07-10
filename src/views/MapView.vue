<template>
  <div class="grid-container">
    <div class="column-map">
      <keep-alive>
        <div id="map-wrapper">
          <TheMapboxMap></TheMapboxMap>
        </div>
      </keep-alive>
    </div>

    <div class="column-info" :class="{ 'is-expanded': mapStore.sidePanelExpanded }">
      <router-view />
      <TheInfoSummary />
    </div>

    <div class="results-info shadow-2" :class="{ 'is-closed': !mapStore.resultsPanelOpen }">
      <TheResultsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useMapStore } from "../stores/mapStore";

const TheMapboxMap = defineAsyncComponent(() => import("../components/TheMapboxMap.vue"));
const TheInfoSummary = defineAsyncComponent(() => import("../components/TheInfoSummary.vue"));
const TheResultsPanel = defineAsyncComponent(() => import("../components/TheResultsPanel.vue"));
const mapStore = useMapStore();
</script>
<style scoped>
.grid-container {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.column-map {
  flex-grow: 7;
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 0;
  /* padding: 0px 0px 0px 10px; */
  order: 2;
}

.column-info {
  flex: 0 1 clamp(360px, 34vw, 750px);
  min-width: clamp(420px, 46vw, 820px);
  max-width: min(950px, 68vw);
  /* min-width: clamp(320px, 30vw, 450px); */
  /* max-width: min(750px, 58vw); */
  transition:
    min-width 0.25s ease,
    max-width 0.25s ease;
  /* padding-left: 10px; */
  order: 1;
}

.column-info.is-expanded {
  min-width: clamp(420px, 46vw, 820px);
  max-width: min(950px, 68vw);
}

.results-info {
  flex-grow: 2.5;
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 400px;
  max-width: 400px;
  padding: 0px 10px 0;
  order: 3;
  background: #f7f7f7; /* just to visualize */
  overflow-y: auto;
  position: absolute;
  top: 20px;
  bottom: 60px;
  right: 20px;
  z-index: 999;
  border-radius: 10px;
  transform: translateX(0);
  transition:
    transform 0.35s ease,
    opacity 0.2s ease;
  will-change: transform;
}

.results-info.is-closed {
  transform: translateX(calc(100% + 32px));
  opacity: 0;
  pointer-events: none;
}

#map-wrapper {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100vh;
}

/* ─── Mobile layout: map on top, info below ────── */
@media (max-width: 768px) {
  .mobile-hide {
    display: none;
  }

  .map-section-wrapper {
    padding-top: 5px;
    flex-direction: column;
  }

  .column-nav,
  .column-map,
  .column-info {
    width: 100%;
  }

  /* Map on top — use natural DOM order (map is first in HTML) */
  .column-map {
    order: 1;
    height: 40vh;
    min-height: 220px;
    flex: 0 0 auto;
    padding: 0;
  }

  #map-wrapper {
    height: 100%;
    border-bottom: 1px solid #ccc;
    border-top: 1px solid #ccc;
  }

  /* Info below the map */
  .column-info {
    order: 2;
    flex: 1 1 auto;
    min-width: 100%;
    max-width: 100%;
    height: calc(60vh - 67px); /* account for bottom nav bar */
    padding: 0px 10px 10px;
    overflow: auto;
  }

  .column-info.is-expanded {
    min-width: 100%;
    max-width: 100%;
  }

  #info-pane {
    height: 100%;
    min-height: 200px;
  }

  /* ─── Bottom horizontal nav bar ────── */
  .bottom-bar-mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 900;
    width: 100%;
    height: auto;
    margin: 0;
    padding: 0;
    padding-top: 0;
    margin-top: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .bottom-bar-mobile #map-summary-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    margin: 0;
    padding: 6px 0;
    gap: 0;
  }

  .bottom-bar-mobile .button-wrapper {
    margin: 0;
    flex: 1;
    gap: 2px;
  }

  .bottom-bar-mobile .button-wrapper button {
    height: auto;
    width: auto;
    padding: 4px;
  }

  .bottom-bar-mobile .nav-icon {
    font-size: 20px;
  }

  .bottom-bar-mobile .button-label {
    font-size: 14px;
    line-height: 1.2;
  }

  .bottom-bar-mobile .button-label br {
    display: none;
  }
}
</style>
