import { defineConfig } from "vitepress";

const siteUrl = process.env.DOCS_SITE_URL;

const base =
  process.env.DOCS_BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : "/");

const repositoryUrl = "https://github.com/priemskiyyy/pulse";

export default defineConfig({
  base,
  lang: "en-US",
  title: "Pulse",
  description:
    "One owned observation of an application's lifecycle on the web and in React Native.",
  cleanUrls: true,
  lastUpdated: true,
  ...(siteUrl ? { sitemap: { hostname: siteUrl } } : {}),
  themeConfig: {
    socialLinks: [{ icon: "github", link: repositoryUrl }],
    editLink: { pattern: `${repositoryUrl}/edit/main/docs/:path` },
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Adapters", link: "/browser" },
      { text: "React", link: "/react" },
      { text: "Reference", link: "/internals/architecture" },
    ],
    sidebar: [
      {
        text: "Start here",
        items: [
          { text: "What Pulse is", link: "/" },
          { text: "Getting started", link: "/getting-started" },
          { text: "States and transitions", link: "/states-and-transitions" },
        ],
      },
      {
        text: "Adapters",
        items: [
          { text: "Browser", link: "/browser" },
          { text: "React Native", link: "/react-native" },
          { text: "Custom adapters", link: "/custom-adapters" },
        ],
      },
      {
        text: "Build your application",
        items: [
          { text: "React", link: "/react" },
          { text: "Recipes", link: "/recipes" },
          { text: "Testing", link: "/testing" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Verification", link: "/verification" },
          { text: "Decisions", link: "/decisions" },
          { text: "Architecture", link: "/internals/architecture" },
        ],
      },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    footer: { message: "Released under the MIT License." },
  },
});
