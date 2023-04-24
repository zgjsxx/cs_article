import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
    {
      text: "如何使用",
      icon: "creative",
      prefix: "guide/",
      link: "guide/",
      children: "structure",
    },
    {
      text: "文章",
      icon: "note",
      prefix: "posts/",
      children: "structure",
    },
    // {
    //   text: "Linux-0.11",
    //   icon: "info",
    //   prefix: "posts/Linux/kernel/Linux-0.11/",
    //   link: "posts/Linux/kernel/Linux-0.11/",
    //   children: ["Linux-0.11-assemble-language","Linux-0.11-boot-bootsect"],
    // },
    "intro",
    "slides",
  ],
});
