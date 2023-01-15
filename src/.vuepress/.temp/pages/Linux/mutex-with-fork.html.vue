<template><div><!-- # Fork之前创建了互斥锁，Fork之后是否可以保护临界区？-->
<p>这是一道某数通公司的面试题。</p>
<p>这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区?</p>
<p>反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区?</p>
<p>经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是<strong>线程锁</strong>还是<strong>进程锁</strong>两种场景进行讨论。</p>
<p>首先我们讨论线程锁。</p>
<h1 id="fork之前创建线程锁" tabindex="-1"><a class="header-anchor" href="#fork之前创建线程锁" aria-hidden="true">#</a> fork之前创建线程锁</h1>
<p>这里我们使用pthread_mutex_t创建了一个互斥锁mutex。该mutex不设置任何其他的属性。我们在fork之后让父进程和子进程执行临界区的代码，进入临界区和离开临界区分别lock和unlock，临界区代码的功能就是去打印一些&quot;start to work&quot;的日志。</p>
<div class="language-cpp line-numbers-mode" data-ext="cpp"><pre v-pre class="language-cpp"><code><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;unistd.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;sys/mman.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;pthread.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;sys/types.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;sys/wait.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;fcntl.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;string.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;stdlib.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span><span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string></span> </span>

<span class="token keyword">void</span> <span class="token function">print</span><span class="token punctuation">(</span>std<span class="token double-colon punctuation">::</span>string name<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">10</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%s start to work, index = %d\n"</span><span class="token punctuation">,</span> name<span class="token punctuation">.</span><span class="token function">c_str</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> i<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">sleep</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    
    <span class="token keyword">int</span> i<span class="token punctuation">;</span>
    pid_t pid<span class="token punctuation">;</span>
    pthread_mutex_t mutex<span class="token punctuation">;</span>
    <span class="token function">pthread_mutex_init</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">,</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">int</span> num<span class="token punctuation">;</span>
    
    pid <span class="token operator">=</span> <span class="token function">fork</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span> pid <span class="token operator">==</span> <span class="token number">0</span> <span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"child"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">else</span> 
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"parent"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">wait</span><span class="token punctuation">(</span><span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token punctuation">}</span>
    <span class="token function">pthread_mutex_destroy</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行之前，我们先定性分析一下，父进程在其地址空间中创建了一把互斥锁进而调用了fork函数，我们知道fork函数拥有copy-on-wrtie机制，当子进程或者父进程对锁进行lock时，父子进程的内存空间分离，也就是说父子进程的锁的作用范围就被限制在了各自的进程空间中，互不干扰。 所以理论上将父子进程在进入临界区时使用的是各自内存空间中的互斥锁， 应该是互不影响的，不能控制父子进程进入临界区。</p>
<p>那么是不是如此呢？我们执行一下。</p>
<p>执行结果：</p>
<div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost mutex<span class="token punctuation">]</span><span class="token comment"># ./a.out</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">0</span>
child start to work, index <span class="token operator">=</span> <span class="token number">0</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">1</span>
child start to work, index <span class="token operator">=</span> <span class="token number">1</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">2</span>
child start to work, index <span class="token operator">=</span> <span class="token number">2</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">3</span>
child start to work, index <span class="token operator">=</span> <span class="token number">3</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">4</span>
child start to work, index <span class="token operator">=</span> <span class="token number">4</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">5</span>
child start to work, index <span class="token operator">=</span> <span class="token number">5</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">6</span>
child start to work, index <span class="token operator">=</span> <span class="token number">6</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">7</span>
child start to work, index <span class="token operator">=</span> <span class="token number">7</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">8</span>
child start to work, index <span class="token operator">=</span> <span class="token number">8</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">9</span>
child start to work, index <span class="token operator">=</span> <span class="token number">9</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们看到父子进程的日志交替输出， 并没有出现父进程的日志整体先于子进程的日志， 或者子进程的日志整体先于父进程的日志的现象。通过该实验证明了我们之前的定性分析是正确的。接下来我们来讨论进程锁。</p>
<h1 id="fork之前创建进程锁" tabindex="-1"><a class="header-anchor" href="#fork之前创建进程锁" aria-hidden="true">#</a> fork之前创建进程锁</h1>
<p>和线程锁代码类似， 我们也创建了一把互斥锁。稍有区别的是，该锁使用mmap创建并附加了MAP_SHARED属性，这样做导致了该锁创建在了该进程的共享内存空间中。除此以外，该互斥锁还拥有一个属性PTHREAD_PROCESS_SHARED， 这意味着该锁是跨越进程的。</p>
<div class="language-cpp line-numbers-mode" data-ext="cpp"><pre v-pre class="language-cpp"><code><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;unistd.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/mman.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;pthread.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/types.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/wait.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;fcntl.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string></span></span>

<span class="token keyword">void</span> <span class="token function">print</span><span class="token punctuation">(</span>std<span class="token double-colon punctuation">::</span>string name<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">10</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%s start to work, index = %d\n"</span><span class="token punctuation">,</span> name<span class="token punctuation">.</span><span class="token function">c_str</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> i<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">sleep</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
 
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">int</span> i<span class="token punctuation">;</span>
    pid_t pid<span class="token punctuation">;</span>
    <span class="token comment">// 使用mmap 创建一把共享锁</span>
    pthread_mutex_t<span class="token operator">*</span> mutex <span class="token operator">=</span> <span class="token punctuation">(</span>pthread_mutex_t<span class="token operator">*</span><span class="token punctuation">)</span><span class="token function">mmap</span><span class="token punctuation">(</span><span class="token constant">NULL</span><span class="token punctuation">,</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>pthread_mutex_t<span class="token punctuation">)</span><span class="token punctuation">,</span>PROT_READ<span class="token operator">|</span>PROT_WRITE<span class="token punctuation">,</span>MAP_SHARED<span class="token operator">|</span>MAP_ANON<span class="token punctuation">,</span><span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">memset</span><span class="token punctuation">(</span>mutex<span class="token punctuation">,</span> <span class="token number">0</span> <span class="token punctuation">,</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>pthread_mutex_t<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    pthread_mutexattr_t mutexattr<span class="token punctuation">;</span>
    <span class="token function">pthread_mutexattr_init</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 修改属性为进程间共享</span>
    <span class="token function">pthread_mutexattr_setpshared</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">,</span> PTHREAD_PROCESS_SHARED<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 初始化一把 mutex 锁, 该所拥有进程间共享的特性</span>
    <span class="token function">pthread_mutex_init</span><span class="token punctuation">(</span>mutex<span class="token punctuation">,</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    
    pid <span class="token operator">=</span> <span class="token function">fork</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span> pid <span class="token operator">==</span> <span class="token number">0</span> <span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"child"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">else</span> 
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"parent"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">wait</span><span class="token punctuation">(</span><span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token punctuation">}</span>
    <span class="token function">pthread_mutexattr_destroy</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">pthread_mutex_destroy</span><span class="token punctuation">(</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在执行之前，我们先定性分析， 由于该锁是创建在共享内存空间中，因此子进程和父进程的mutex是存放在同一块物理内存上的， 也就是同一个对象。 所以这个场景下，执行结果就会出现同步效果。 也就是子进程先打印或者父进程先打印的结果。</p>
<p>执行结果：</p>
<div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost mutex<span class="token punctuation">]</span><span class="token comment"># ./a.out</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">0</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">1</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">2</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">3</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">4</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">5</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">6</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">7</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">8</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">9</span>
child start to work, index <span class="token operator">=</span> <span class="token number">0</span>
child start to work, index <span class="token operator">=</span> <span class="token number">1</span>
child start to work, index <span class="token operator">=</span> <span class="token number">2</span>
child start to work, index <span class="token operator">=</span> <span class="token number">3</span>
child start to work, index <span class="token operator">=</span> <span class="token number">4</span>
child start to work, index <span class="token operator">=</span> <span class="token number">5</span>
child start to work, index <span class="token operator">=</span> <span class="token number">6</span>
child start to work, index <span class="token operator">=</span> <span class="token number">7</span>
child start to work, index <span class="token operator">=</span> <span class="token number">8</span>
child start to work, index <span class="token operator">=</span> <span class="token number">9</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行结果是父进程先执行完然后子进程再执行，这就说明这个时候进程锁就起到了同步的作用， 控制了子进程和父进程进入临界区的顺序。</p>
<h1 id="设置了pthread-process-shared属性-在fork之后就一定可以控制执行顺序吗" tabindex="-1"><a class="header-anchor" href="#设置了pthread-process-shared属性-在fork之后就一定可以控制执行顺序吗" aria-hidden="true">#</a> 设置了PTHREAD_PROCESS_SHARED属性， 在fork之后就一定可以控制执行顺序吗？</h1>
<p>我们看下面的例子， 该锁直接创建在父进程的栈中，并设置PTHREAD_PROCESS_SHARED属性， 那么可以起到控制父子进程进入临界区吗？</p>
<div class="language-cpp line-numbers-mode" data-ext="cpp"><pre v-pre class="language-cpp"><code><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;unistd.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/mman.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;pthread.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/types.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;sys/wait.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;fcntl.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string></span></span>

<span class="token keyword">void</span> <span class="token function">print</span><span class="token punctuation">(</span>std<span class="token double-colon punctuation">::</span>string name<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">10</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%s start to work, index = %d\n"</span><span class="token punctuation">,</span> name<span class="token punctuation">.</span><span class="token function">c_str</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> i<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">sleep</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
 
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">int</span> i<span class="token punctuation">;</span>
    pid_t pid<span class="token punctuation">;</span>
    <span class="token comment">// 使用mmap 创建一把共享锁</span>
    pthread_mutex_t mutex<span class="token punctuation">;</span>
    pthread_mutexattr_t mutexattr<span class="token punctuation">;</span>
    <span class="token function">pthread_mutexattr_init</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 修改属性为进程间共享</span>
    <span class="token function">pthread_mutexattr_setpshared</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">,</span> PTHREAD_PROCESS_SHARED<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 初始化一把 mutex 锁, 该所拥有进程间共享的特性</span>
    <span class="token function">pthread_mutex_init</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">,</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    
    pid <span class="token operator">=</span> <span class="token function">fork</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span> pid <span class="token operator">==</span> <span class="token number">0</span> <span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"child"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">else</span> 
    <span class="token punctuation">{</span>
        <span class="token function">pthread_mutex_lock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">"parent"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">pthread_mutex_unlock</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">wait</span><span class="token punctuation">(</span><span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token punctuation">}</span>
    <span class="token function">pthread_mutexattr_destroy</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutexattr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">pthread_mutex_destroy</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>mutex<span class="token punctuation">)</span><span class="token punctuation">;</span>
 
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost mutex<span class="token punctuation">]</span><span class="token comment"># ./a.out</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">0</span>
child start to work, index <span class="token operator">=</span> <span class="token number">0</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">1</span>
child start to work, index <span class="token operator">=</span> <span class="token number">1</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">2</span>
child start to work, index <span class="token operator">=</span> <span class="token number">2</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">3</span>
child start to work, index <span class="token operator">=</span> <span class="token number">3</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">4</span>
child start to work, index <span class="token operator">=</span> <span class="token number">4</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">5</span>
child start to work, index <span class="token operator">=</span> <span class="token number">5</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">6</span>
child start to work, index <span class="token operator">=</span> <span class="token number">6</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">7</span>
child start to work, index <span class="token operator">=</span> <span class="token number">7</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">8</span>
child start to work, index <span class="token operator">=</span> <span class="token number">8</span>
parent start to work, index <span class="token operator">=</span> <span class="token number">9</span>
child start to work, index <span class="token operator">=</span> <span class="token number">9</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>此时发现子进程和父进程交替进入了临界区， 该锁没有起到同步作用。 与实验二对比， 实验二中互斥锁创建在父进程的共享内存中， 并设置有PTHREAD_PROCESS_SHARED属性， 因此父子进程操作的是同一把锁。而在实验三中，互斥锁创建在父进程的栈中， 由于<strong>写时复制</strong>， 父子进程实际操作的是各自内存空间的锁，因此没有同步作用。</p>
<h1 id="结论" tabindex="-1"><a class="header-anchor" href="#结论" aria-hidden="true">#</a> 结论</h1>
<p>如果在fork之前创建的互斥锁具有PTHREAD_PROCESS_SHARED属性，并且该锁创建在父进程的共享内存中， 也就是说如果该互斥锁是一把<strong>进程锁</strong>，那么其对父子进程具有保护临界区的作用。 如果在fork之前创建的互斥锁没有该属性， 也就是说如果该锁是一把<strong>线程锁</strong>， 那么其没有对父子进程没有保护临界区的作用。</p>
<p>除此以外，如果一把锁要成为进程锁，需要两个条件， 一是该锁需要创建在共享内存中， 二是该锁需要有PTHREAD_PROCESS_SHARED属性。</p>
</div></template>


