import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  { 
    text: "演示", 
    icon: "discover", 
    link: "/demo/" 
  },
  {
    text: "博文",
    icon: "edit",
    prefix: "/posts/",
    children: [
      { 
        text: "Linux", 
        icon: "edit", 
        link: "linux" 
      },
      { 
        text: "网络", 
        icon: "edit", 
        link: "network" 
      },
      { 
        text: "编程语言", 
        icon: "edit", 
        link: "program_language" 
      },
      { 
        text: "工具", 
        icon: "edit", 
        link: "tool" 
      },
      // {
      //   text: "香蕉",
      //   icon: "edit",
      //   prefix: "banana/",
      //   children: [
      //     {
      //       text: "香蕉 1",
      //       icon: "edit",
      //       link: "1",
      //     },
      //     {
      //       text: "香蕉 2",
      //       icon: "edit",
      //       link: "2",
      //     },
      //     "3",
      //     "4",
      //   ],
      // },
    ],
  },
  {
    text: "每日一文",
    icon: "note",
    link: "https://meiriyiwen.com/",
  },
]);
