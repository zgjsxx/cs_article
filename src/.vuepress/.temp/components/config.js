import { defineClientConfig } from "@vuepress/client";
import { hasGlobalComponent } from "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/shared.js";
import { h } from "vue";

import { useStyleTag } from "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/vueuse.js";
import Badge from "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/components/Badge.js";
import FontIcon from "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/components/FontIcon.js";
import BackToTop from "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/components/BackToTop.js";


import "D:/git_proj/zgjsxx/docs/node_modules/vuepress-plugin-components/lib/client/styles/sr-only.scss";

export default defineClientConfig({
  enhance: ({ app }) => {
    if(!hasGlobalComponent("Badge")) app.component("Badge", Badge);
    if(!hasGlobalComponent("FontIcon")) app.component("FontIcon", FontIcon);
    
  },
  setup: () => {
    useStyleTag(`@import url("//at.alicdn.com/t/c/font_2410206_5vb9zlyghj.css");`, { id: "icon-assets" });
    
  },
  rootComponents: [
    () => h(BackToTop, { threshold: 300 }),
    
  ],
});
