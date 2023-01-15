export const data = JSON.parse("{\"key\":\"v-1c845b32\",\"path\":\"/Linux/mutex-with-fork.html\",\"title\":\"Fork之前创建的互斥锁，Fork之后是否可以保护临界区？\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"Fork之前创建的互斥锁，Fork之后是否可以保护临界区？\",\"categories\":[\"Linux\"],\"tags\":[\"interview\"],\"description\":\"这是一道某数通公司的面试题。 这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区? 反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区? 经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是线程锁还是进程锁两种场景进行讨论。\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://mister-hope.github.io/Linux/mutex-with-fork.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"Blog Demo\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"Fork之前创建的互斥锁，Fork之后是否可以保护临界区？\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"这是一道某数通公司的面试题。 这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区? 反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区? 经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是线程锁还是进程锁两种场景进行讨论。\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"interview\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"Fork之前创建的互斥锁，Fork之后是否可以保护临界区？\\\",\\\"image\\\":[\\\"\\\"],\\\"dateModified\\\":null,\\\"author\\\":[]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":6.54,\"words\":1961},\"filePathRelative\":\"Linux/mutex-with-fork.md\",\"excerpt\":\"<!-- # Fork之前创建了互斥锁，Fork之后是否可以保护临界区？-->\\n<p>这是一道某数通公司的面试题。</p>\\n<p>这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区?</p>\\n<p>反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区?</p>\\n<p>经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是<strong>线程锁</strong>还是<strong>进程锁</strong>两种场景进行讨论。</p>\",\"autoDesc\":true}")

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
