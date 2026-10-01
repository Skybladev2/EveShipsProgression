/* Renders the Mermaid diagram from README.md and adds pan / zoom / search.
   Libraries are vendored under assets/vendor; CDNs are only a fallback. */
(function () {
  "use strict";

  var MERMAID_CDN = [
    "https://cdn.jsdelivr.net/npm/mermaid@12.0.0/dist/mermaid.min.js",
    "https://unpkg.com/mermaid@12.0.0/dist/mermaid.min.js"
  ];
  var PANZOOM_CDN = [
    "https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js",
    "https://unpkg.com/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"
  ];

  var host = document.getElementById("graph");
  var statusEl = document.getElementById("status");
  var viewport = document.getElementById("viewport");
  var panZoom = null;
  var svgEl = null;

  function fail(message) {
    host.innerHTML = '<div class="error">' + message + "</div>";
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureGlobal(name, urls) {
    if (window[name]) return Promise.resolve();
    return urls.reduce(function (chain, url) {
      return chain.catch(function () { return loadScript(url); });
    }, Promise.reject()).then(function () {
      if (!window[name]) throw new Error(name + " did not load");
    });
  }

  function countStats(code) {
    var nodes = (code.match(/\bn_[A-Za-z0-9_]+\["/g) || []).length;
    var edges = (code.match(/-->/g) || []).length;
    return { nodes: nodes, edges: edges };
  }

  function centerOn(el) {
    if (!panZoom || !el) return;
    var rect = el.getBoundingClientRect();
    var vp = viewport.getBoundingClientRect();
    panZoom.panBy({
      x: vp.left + vp.width / 2 - (rect.left + rect.width / 2),
      y: vp.top + vp.height / 2 - (rect.top + rect.height / 2)
    });
  }

  function runSearch(query) {
    if (!svgEl) return;
    var q = query.trim().toLowerCase();
    svgEl.classList.toggle("searching", q.length > 0);
    var first = null;
    svgEl.querySelectorAll(".node").forEach(function (node) {
      var hit = q.length > 0 && node.textContent.toLowerCase().indexOf(q) !== -1;
      node.classList.toggle("search-hit", hit);
      if (hit && !first) first = node;
    });
    if (first) centerOn(first);
  }

  function downloadSvg() {
    if (!svgEl) return;
    var clone = svgEl.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "eve-ship-progression.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function wireControls() {
    document.getElementById("zoom-in").addEventListener("click", function () { panZoom.zoomIn(); });
    document.getElementById("zoom-out").addEventListener("click", function () { panZoom.zoomOut(); });
    document.getElementById("fit").addEventListener("click", function () {
      panZoom.resize(); panZoom.fit(); panZoom.center();
    });
    document.getElementById("reset").addEventListener("click", function () {
      panZoom.resetZoom(); panZoom.center();
    });
    document.getElementById("download").addEventListener("click", downloadSvg);
    document.getElementById("search").addEventListener("input", function (e) { runSearch(e.target.value); });
    window.addEventListener("resize", function () {
      if (panZoom) { panZoom.resize(); panZoom.fit(); panZoom.center(); }
    });
  }

  function render(code) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "dark",
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      themeVariables: {
        darkMode: true,
        background: "#0b0e13",
        primaryColor: "#1b2432",
        primaryTextColor: "#e7edf6",
        primaryBorderColor: "#3a475d",
        lineColor: "#56657e",
        secondaryColor: "#182130",
        tertiaryColor: "#121823",
        clusterBkg: "#0f141d",
        clusterBorder: "#2a3444"
      },
      flowchart: { useMaxWidth: false, htmlLabels: false }
    });

    return mermaid.render("shipProgressGraph", code).then(function (result) {
      host.innerHTML = result.svg;
      svgEl = host.querySelector("svg");
      svgEl.removeAttribute("style");
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "100%");
      svgEl.style.maxWidth = "none";

      if (window.svgPanZoom) {
        panZoom = svgPanZoom(svgEl, {
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.02,
          maxZoom: 25,
          zoomScaleSensitivity: 0.25,
          dblClickZoomEnabled: false,
          mouseWheelZoomEnabled: true
        });
      }

      var stats = countStats(code);
      statusEl.textContent = stats.nodes + " ships · " + stats.edges + " connections";
      wireControls();
    });
  }

  ensureGlobal("mermaid", MERMAID_CDN)
    .then(function () { return ensureGlobal("svgPanZoom", PANZOOM_CDN).catch(function () { /* pan/zoom optional */ }); })
    .then(function () {
      return fetch("README.md", { cache: "no-cache" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " while fetching README.md");
        return res.text();
      });
    })
    .then(function (md) {
      var match = md.match(/```mermaid[ \t]*\r?\n([\s\S]*?)```/);
      if (!match) throw new Error("no ```mermaid block found in README.md");
      return render(match[1].trim());
    })
    .catch(function (err) {
      fail(
        "Could not load the diagram: " + err.message + "<br><br>" +
        "If you opened this file directly from disk, serve it over HTTP instead — e.g. run " +
        "<code>python3 -m http.server</code> in the project folder and open " +
        "<code>http://localhost:8000/</code>."
      );
    });
})();
