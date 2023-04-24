import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/posts/Linux/kernel/Linux-0.11": [
    {
      text: "Linux-0.11详解",
      icon: "info",
      prefix: "",
      link: "",
      children: [
        "Linux-0.11",
        "Linux-0.11-assemble-language",
        "Linux-0.11-boot-bootsect",
        "Linux-0.11-boot-head",
        "Linux-0.11-boot-setup",
        "Linux-0.11-fs-bitmap",
        "Linux-0.11-fs-block_dev",
        "Linux-0.11-fs-buffer",
        "Linux-0.11-fs-char_dev",
        "Linux-0.11-fs-exec",
        "Linux-0.11-fs-fcntl",
        "Linux-0.11-fs-file_dev",
        "Linux-0.11-fs-inode",
        "Linux-0.11-fs-ioctl",
        "Linux-0.11-fs-namei",
        "Linux-0.11-fs-open",
        "Linux-0.11-fs-pipe",
        "Linux-0.11-fs-read_write",
        "Linux-0.11-fs-stat",
        "Linux-0.11-fs-super",
        "Linux-0.11-fs-truncate",
        "Linux-0.11-init-main",
        "Linux-0.11-kernel-asm",
        "Linux-0.11-kernel-exit",
        "Linux-0.11-kernel-fork",
        "Linux-0.11-kernel-ll-rw-blk",
        "Linux-0.11-kernel-mktime",
        "Linux-0.11-kernel-hd",
        "Linux-0.11-kernel-panic",
        "Linux-0.11-kernel-printk",
        "Linux-0.11-kernel-sched",
        "Linux-0.11-kernel-signal",
        "Linux-0.11-kernel-sys",
        "Linux-0.11-kernel-system_call",
        "Linux-0.11-kernel-trap",
        "Linux-0.11-kernel-tty_ioctl",
        "Linux-0.11-kernel-tty-io",
        "Linux-0.11-mm-memory",
        "Linux-0.11-mm-page"
      ],
    },
  ],
  "/posts/network": [
    {
      text: "计算机网络",
      icon: "info",
      prefix: "",
      link: "",
      children: [
        "http-introduction"
      ] 
    } 
  ],
  "/posts/design-pattern": [
    {
      text: "设计模式",
      icon: "info",
      prefix: "",
      link: "",
      children: [
        "adapter"
      ] 
    } 
  ],
  "/posts/Program_language/cpp": [
    {
      text: "c++",
      icon: "info",
      prefix: "",
      link: "",
      children: [
        "cpp_singleton_summarize",
        "cpp_googlestyle_static_global_var",
        "cpp_lambda",
        "cpp11_thread",
        "placement_operator_new",
        "cpp_realize_defer"
      ] 
    } 
  ],
  "/posts/tool": [
    {
      text: "tool",
      icon: "info",
      prefix: "",
      link: "",
      children: [
        "how-to-configure-git-with-multiple-user",
        "makefile-knowledge",
        "utf8-gbk"
      ] 
    } 
  ]  
});


  