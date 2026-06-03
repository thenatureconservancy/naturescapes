import "./assets/main.css";
import "./assets/responsive-grid.css";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";
import { Quasar, Notify } from "quasar";
import { createApp } from "vue";
import { createPinia } from "pinia";
import quasarUserOptions from "./quasar-user-options.js";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Quasar, {
  ...quasarUserOptions,
  plugins: {
    ...(quasarUserOptions.plugins || {}),
    Notify,
  },
});

app.mount("#app");
