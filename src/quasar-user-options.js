import "quasar/dist/quasar.css";
import "@quasar/extras/roboto-font/roboto-font.css";
import "@quasar/extras/material-icons/material-icons.css";
import "@quasar/extras/material-icons-outlined/material-icons-outlined.css";

// To be used on app.use(Quasar, { ... })
export default {
  config: {
    animations: "all",
    brand: {
      primary: "#ead755",
      secondary: "#fdf6f2",
      accent: "#009688",
      dark: "#1a1a1a",

      positive: "#ff163c",
      negative: "#c5351c",
      info: "#d9d9d9",
      warning: "#ffe04f",
    },
    blues: {},
    greens: {},
    tncPreferred: {
      oakGreen: "#00703c",
      leafGreen: "#49a942",
      spring: "#a0c04d",
      indigo: "#23487a",
      lake: "#0096d6",
      plum: "#90214a",
      crimson: "#c5351c",
      redRock: "#f3901d",
      yellowField: "#ffe14f",
    },
    tncSupplemental: {
      mallard: "#007932",
      clover: "#46812b",
      spruce: "#4d632d",
      everglade: "#5e8827",
      moss: "#6a8a22",
      olive: "#737c29",
      acadia: "#95ba79",
      lime: "#cdc90f",
      deepWaters: "#005387",
      trueBlue: "#1b75bc",
      cirrus: "#3a89b4",
      frost: "#5e94b6",
      marine: "#009ecb",
      aqua: "#00a0af",
      glacier: "#b7dee0",
      iris: "#46166b",
      carnelian: "#8a2f1d",
      rust: "#c95c1a",
      ochre: "#a88701",
      nutmeg: "#b48724",
      butternut: "#e39717",
      gold: "#e6b120",
    },
    tncNeutrals: {
      cocoa: "#623c25",
      canyon: "#80561b",
      storm: "#7e6a65",
      driftwood: "#d2bfaa",
      beach: "#dac792",
      icicle: "#e4e6d7",
      mudstone: "#989482",
      sandstone: "#f7e7c9",
      drySage: "#afb087",
    },
  },
  plugins: {},
  extras: ["material-symbols-outlined"],
};
