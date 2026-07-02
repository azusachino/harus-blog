// Giscus loader that works with Material's instant navigation.
// Inline <script> tags inside swapped page content are not re-executed, so we
// subscribe to `document$` (fires on every navigation) and (re)inject Giscus
// whenever a `.giscus` container is present on the page.

function __giscusTheme() {
  var palette = __md_get("__palette");
  if (palette && typeof palette.color === "object")
    return palette.color.scheme === "slate" ? "dark" : "light";
  return "light";
}

document$.subscribe(function () {
  var container = document.querySelector(".giscus");
  if (!container) return;
  container.innerHTML = "";

  var attrs = {
    "data-repo": "azusachino/idealistic-daydreamer",
    "data-repo-id": "MDEwOlJlcG9zaXRvcnkzNTgxOTk2MjU=",
    "data-category": "General",
    "data-category-id": "DIC_kwDOFVmxSc4CON34",
    "data-mapping": "title",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "top",
    "data-theme": __giscusTheme(),
    "data-lang": "en",
    "data-loading": "lazy",
  };

  var script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  Object.keys(attrs).forEach(function (k) {
    script.setAttribute(k, attrs[k]);
  });
  script.crossOrigin = "anonymous";
  script.async = true;
  container.appendChild(script);
});

// Keep Giscus theme in sync when the palette toggle changes. The palette
// component lives in the header and persists across instant navigation, so we
// register this listener once.
var __paletteRef = document.querySelector("[data-md-component=palette]");
if (__paletteRef) {
  __paletteRef.addEventListener("change", function () {
    var frame = document.querySelector(".giscus-frame");
    if (frame)
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: __giscusTheme() } } },
        "https://giscus.app",
      );
  });
}
