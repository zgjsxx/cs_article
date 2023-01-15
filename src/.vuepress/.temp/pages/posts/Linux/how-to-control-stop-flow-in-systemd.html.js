export const data = JSON.parse("{\"key\":\"v-4fcf4503\",\"path\":\"/posts/Linux/how-to-control-stop-flow-in-systemd.html\",\"title\":\"关机时，如何控制systemd服务的关闭顺序?\",\"lang\":\"zh-CN\",\"frontmatter\":{\"category\":[\"Linux\"],\"description\":\"关机时，如何控制systemd服务的关闭顺序? 在工作中，我们通常遇到的问题是，如何控制systemd服务的启动顺序，同志们第一反应就会是使用Before=或者After=去进行控制。 问题来了，如果服务启动时没有顺序要求，但是关闭时有顺序要求， 该如何操作？ 通过查找如下相关文档， 我查到了这样一段话： https://www.freedesktop.org/software/systemd/man/systemd.unit.html\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://mister-hope.github.io/posts/Linux/how-to-control-stop-flow-in-systemd.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"Blog Demo\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"关机时，如何控制systemd服务的关闭顺序?\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"关机时，如何控制systemd服务的关闭顺序? 在工作中，我们通常遇到的问题是，如何控制systemd服务的启动顺序，同志们第一反应就会是使用Before=或者After=去进行控制。 问题来了，如果服务启动时没有顺序要求，但是关闭时有顺序要求， 该如何操作？ 通过查找如下相关文档， 我查到了这样一段话： https://www.freedesktop.org/software/systemd/man/systemd.unit.html\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"关机时，如何控制systemd服务的关闭顺序?\\\",\\\"image\\\":[\\\"\\\"],\\\"dateModified\\\":null,\\\"author\\\":[]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":3.19,\"words\":956},\"filePathRelative\":\"posts/Linux/how-to-control-stop-flow-in-systemd.md\",\"excerpt\":\"<h1> 关机时，如何控制systemd服务的关闭顺序?</h1>\\n<p>在工作中，我们通常遇到的问题是，如何控制systemd服务的启动顺序，同志们第一反应就会是使用Before=或者After=去进行控制。 问题来了，如果服务启动时没有顺序要求，但是关闭时有顺序要求， 该如何操作？</p>\\n<p>通过查找如下相关文档， 我查到了这样一段话：</p>\\n<p><a href=\\\"https://www.freedesktop.org/software/systemd/man/systemd.unit.html\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">https://www.freedesktop.org/software/systemd/man/systemd.unit.html</a></p>\",\"autoDesc\":true}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
