import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  locales: {
    "/": {
      lang: "zh-CN",
      title: "Code Building",
      description: "Every day, code needs building",
    }
  },

  theme,

  shouldPrefetch: false,
});
