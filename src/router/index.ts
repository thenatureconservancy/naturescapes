import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   name: "HomeView",
    //   path: "/",
    //   component: () => import("../views/HomeView.vue"),
    // },
    {
      name: "MapView",
      path: "/",
      component: () => import("../views/MapView.vue"),
    },
    // {
    //   name: "DataView",
    //   path: "/data",
    //   component: () => import("../views/DataView.vue"),
    // },
  ],
});

export default router;
