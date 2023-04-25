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
        text: "Linux-0.11详解", 
        icon: "edit", 
        link: "Linux/kernel/Linux-0.11" 
      },
      { 
        text: "计算机网络", 
        icon: "edit", 
        link: "network" 
      },
      { 
        text: "c++", 
        icon: "edit", 
        link: "Program_language/cpp" 
      },
      { 
        text: "设计模式", 
        icon: "edit", 
        link: "design-pattern" 
      },      
      { 
        text: "工具", 
        icon: "edit", 
        link: "tool" 
      },
      { 
        text: "编译原理", 
        icon: "edit", 
        link: "Linux/compile" 
      },
      {
        text: "Linux应用层开发",
        icon: "edit",
        link: "Linux/application-dev"
      }
    ],
  },
  {
    text: "每日一文",
    icon: "note",
    link: "https://meiriyiwen.com/",
  },
  { 
    text: "关于作者", 
    icon: "about", 
    link: "/posts/about/about" 
  },
]);
