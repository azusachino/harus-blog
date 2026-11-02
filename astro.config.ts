// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { math } from './src/lib/math';

export default defineConfig({
  site: 'https://azusachino.com',
  // Links are written with a trailing slash and pages build to dir/index.html
  // (the URLs the MkDocs site had); 'ignore' also accepts the slash-less form,
  // so a typo still lands on the 404 page instead of the framework's error page.
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  redirects: {
    '/tech/series/effective-cpp/01.习惯CPP': '/tech/series/effective-cpp/01.accustom/',
    '/tech/series/effective-cpp/02.构造与析构与赋值': '/tech/series/effective-cpp/02.construct-destruct-assign/',
    '/tech/series/effective-cpp/03.资源管理': '/tech/series/effective-cpp/03.resource-management/',
    '/tech/series/effective-cpp/04.设计与声明': '/tech/series/effective-cpp/04.design-declaration/',
    '/tech/series/effective-cpp/05.实现': '/tech/series/effective-cpp/05.implementations/',
    '/tech/series/effective-cpp/06.模板与泛型编程': '/tech/series/effective-cpp/06.templates-generics/',
    '/tech/series/effective-cpp/07.创建与销毁': '/tech/series/effective-cpp/07.new-delete/',
    '/tech/series/effective-cpp/08.继承与面向对象': '/tech/series/effective-cpp/08.oop/',
    '/tech/series/k8s/01.初见': '/tech/series/k8s/01.intro/',
    '/tech/series/k8s/02.概览': '/tech/series/k8s/02.overview/',
    '/tech/series/k8s/03.架构': '/tech/series/k8s/03.architecture/',
    '/tech/series/more-effective-cpp/01.基础内容': '/tech/series/more-effective-cpp/01.basics/',
    '/tech/series/more-effective-cpp/02.操作符': '/tech/series/more-effective-cpp/02.operators/',
    '/tech/series/network/01.浏览器与HTTP': '/tech/series/network/01.browser-http/',
    '/tech/series/network/02.TCP': '/tech/series/network/02.tcp/',
    '/tech/series/network/03.IP与以太网': '/tech/series/network/03.ip-ethernet/',
    '/tech/series/network/04.互联网': '/tech/series/network/04.isp/',
    '/tech/series/network/05.网络设备': '/tech/series/network/05.hardware/',
  },
  // Mermaid's chunks (~650 KB) load only on pages with a diagram, so Vite's
  // 500 KB warning is expected; keep the build log quiet for real warnings.
  vite: {
    build: { chunkSizeWarningLimit: 1024 },
    server: { allowedHosts: ['harus-mini', 'harus-mini.talpidae-beta.ts.net', 'harus-macmini', 'harus-macmini.talpidae-beta.ts.net'] },
    preview: { allowedHosts: ['harus-mini', 'harus-mini.talpidae-beta.ts.net', 'harus-macmini', 'harus-macmini.talpidae-beta.ts.net'] },
  },
  markdown: {
    processor: satteri({ mdastPlugins: [math], features: { math: true } }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
