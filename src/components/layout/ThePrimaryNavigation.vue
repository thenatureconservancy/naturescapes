<template>
  <nav class="primary-navigation shadow-3">
    <h1>Naturescapes</h1>
    <ul>
      <!-- <li><RouterLink to="/">Home</RouterLink></li> -->
      <li><RouterLink to="/map">Map</RouterLink></li>
      <!-- <li><RouterLink to="/data">Data</RouterLink></li> -->
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<style scoped>
.primary-navigation {
  background-color: #ea631c;
  padding: 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  height: 50px;
  position: relative;
  z-index: 2;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}

h1 {
  display: inline-block;
  color: white;
  margin: 0;
  margin-right: 2rem;
  font-size: 20px;
}
nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
  display: flex;

  margin-left: auto;
  margin-right: 20px;
}
nav ul li a {
  color: white;
  text-decoration: none;
}
nav ul li a:hover {
  text-decoration: underline;
}
</style>
