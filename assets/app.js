/* Renders the Mermaid diagram from README.md and adds pan / zoom / search,
   plus click-to-isolate: clicking a ship keeps only the ships reachable from
   it and hides everything else; clicking the background restores the diagram.
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

  var graph = null;     // parsed source: nodes, adjacency, clusters
  var domIndex = null;  // rendered elements keyed by source id
  var selectedId = null;

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

  /* Parse the flowchart source into an undirected graph. Only the subset of
     Mermaid syntax used by this project is understood: subgraph blocks,
     `id["label"]` node declarations and `A -->|"label"| B` edges. */
  function parseGraph(code) {
    var nodes = Object.create(null);        // id -> true
    var adj = Object.create(null);          // id -> { neighbourId: true }
    var edges = [];                         // { src, dst }
    var clusters = Object.create(null);     // id -> { label, parent, children }
    var nodeClusters = Object.create(null); // nodeId -> [clusterId, ...]
    var stack = [];

    function ensure(id) {
      if (!adj[id]) { adj[id] = Object.create(null); nodes[id] = true; }
      return id;
    }

    code.split(/\r?\n/).forEach(function (line) {
      var s = line.trim();
      if (!s) return;

      var sub = s.match(/^subgraph\s+([A-Za-z_]\w*)\s*(?:\["([^"]*)"\])?/);
      if (sub) {
        var cid = sub[1];
        if (!clusters[cid]) clusters[cid] = { label: sub[2] || cid, parent: null, children: [] };
        var parent = stack.length ? stack[stack.length - 1] : null;
        clusters[cid].parent = parent;
        if (parent) clusters[parent].children.push(cid);
        stack.push(cid);
        return;
      }

      if (s === "end") { stack.pop(); return; }

      var edge = s.match(/^([A-Za-z_]\w*)\s*-->\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/);
      if (edge) {
        var a = ensure(edge[1]);
        var b = ensure(edge[2]);
        adj[a][b] = true;
        adj[b][a] = true;
        edges.push({ src: a, dst: b });
        return;
      }

      var decl = s.match(/^([A-Za-z_]\w*)\s*\[/);
      if (decl) {
        var id = ensure(decl[1]);
        nodeClusters[id] = stack.slice();
      }
    });

    return { nodes: nodes, adj: adj, edges: edges, clusters: clusters, nodeClusters: nodeClusters };
  }

  /* Recover a rendered node's source id from its group id, e.g.
     "shipProgressGraph-flowchart-n_Kestrel-0" -> "n_Kestrel". */
  function nodeIdFromDom(el) {
    var m = el.id.match(/-flowchart-(.+?)-\d+$/);
    return m ? m[1] : null;
  }

  /* Recover the two endpoints of an edge path from its data-id, e.g.
     "L_n_Atron_n_Ares_0" -> ["n_Atron", "n_Ares"]. Node ids contain
     underscores, so both halves are matched against the known node set. */
  function splitEndpoints(edgeId, nodes) {
    var mid = edgeId.replace(/^L_/, "").replace(/_\d+$/, "");
    for (var i = mid.length - 1; i > 0; i--) {
      if (mid.charAt(i) !== "_") continue;
      var a = mid.slice(0, i);
      var b = mid.slice(i + 1);
      if (nodes[a] && nodes[b]) return [a, b];
    }
    return null;
  }

  function collect(selector) {
    return Array.prototype.slice.call(host.querySelectorAll(selector));
  }

  /* Build a lookup from source ids to the SVG elements Mermaid produced. */
  function buildDomIndex() {
    var nodes = graph.nodes;

    var nodeItems = [];
    var byId = Object.create(null);
    collect("g.node").forEach(function (el) {
      var id = nodeIdFromDom(el);
      if (!id || !nodes[id]) return;
      var item = { id: id, el: el };
      nodeItems.push(item);
      byId[id] = item;
    });

    var edgeItems = [];
    collect('path[data-et="edge"]').forEach(function (el) {
      var id = el.getAttribute("data-id");
      if (!id) return;
      var ends = splitEndpoints(id, nodes);
      if (ends) edgeItems.push({ el: el, src: ends[0], dst: ends[1] });
    });

    // Edge labels sit in their own layer; map them by the same edge id.
    var labelByEdgeId = Object.create(null);
    collect("g.edgeLabel").forEach(function (el) {
      var label = el.querySelector(".label[data-id]");
      if (label) labelByEdgeId[label.getAttribute("data-id")] = el;
    });

    var clusterItems = [];
    collect("g.cluster").forEach(function (el) {
      var cid = el.id.replace(/^.*-/, "");
      if (!graph.clusters[cid]) return;
      clusterItems.push({ id: cid, el: el, members: [] });
    });
    var clusterById = Object.create(null);
    clusterItems.forEach(function (c) { clusterById[c.id] = c; });

    // A cluster is visible while any ship inside it (directly or nested) is visible.
    Object.keys(graph.nodeClusters).forEach(function (nid) {
      graph.nodeClusters[nid].forEach(function (cid) {
        if (clusterById[cid]) clusterById[cid].members.push(nid);
      });
    });

    domIndex = {
      nodes: nodeItems,
      byId: byId,
      edges: edgeItems,
      labelByEdgeId: labelByEdgeId,
      clusters: clusterItems
    };
  }

  function clearSelection() {
    if (!domIndex) return;
    selectedId = null;
    svgEl.classList.remove("isolating");
    domIndex.nodes.forEach(function (n) { n.el.classList.remove("ship-hidden", "ship-selected"); });
    domIndex.clusters.forEach(function (c) { c.el.classList.remove("ship-hidden"); });
    domIndex.edges.forEach(function (e) { e.el.classList.remove("ship-hidden"); });
    Object.keys(domIndex.labelByEdgeId).forEach(function (id) {
      domIndex.labelByEdgeId[id].classList.remove("ship-hidden");
    });
  }

  function selectShip(id) {
    if (!domIndex || !graph.nodes[id]) return;

    // Undirected breadth/depth-first walk over every edge.
    var visible = Object.create(null);
    var queue = [id];
    visible[id] = true;
    while (queue.length) {
      var current = queue.pop();
      var neighbours = graph.adj[current] || {};
      for (var key in neighbours) {
        if (!visible[key]) { visible[key] = true; queue.push(key); }
      }
    }

    selectedId = id;
    svgEl.classList.add("isolating");

    domIndex.nodes.forEach(function (n) {
      var show = !!visible[n.id];
      n.el.classList.toggle("ship-hidden", !show);
      n.el.classList.toggle("ship-selected", n.id === id);
    });
    domIndex.clusters.forEach(function (c) {
      c.el.classList.toggle("ship-hidden", !c.members.some(function (m) { return visible[m]; }));
    });
    domIndex.edges.forEach(function (e) {
      var show = !!visible[e.src] && !!visible[e.dst];
      e.el.classList.toggle("ship-hidden", !show);
    });
    Object.keys(domIndex.labelByEdgeId).forEach(function (edgeId) {
      var ends = splitEndpoints(edgeId, graph.nodes);
      var show = !!ends && !!visible[ends[0]] && !!visible[ends[1]];
      domIndex.labelByEdgeId[edgeId].classList.toggle("ship-hidden", !show);
    });
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

  /* Keep the two behaviours apart: a drag (pan) must not be read as a click. */
  var pointerDown = null;
  var movedFar = false;

  function wireSelection() {
    viewport.addEventListener("mousedown", function (e) {
      pointerDown = { x: e.clientX, y: e.clientY };
      movedFar = false;
    }, true);
    viewport.addEventListener("mousemove", function (e) {
      if (!pointerDown) return;
      if (Math.abs(e.clientX - pointerDown.x) + Math.abs(e.clientY - pointerDown.y) > 5) {
        movedFar = true;
      }
    }, true);

    document.addEventListener("click", function (e) {
      if (movedFar) { pointerDown = null; return; }
      pointerDown = null;
      var target = e.target;
      var nodeGroup = target && target.closest ? target.closest("g.node") : null;
      if (nodeGroup) {
        var id = nodeIdFromDom(nodeGroup);
        if (id && graph.nodes[id]) {
          if (selectedId === id) clearSelection();
          else selectShip(id);
          return;
        }
      }
      // Clicks in the toolbar (search, zoom, download) should not reset the view.
      if (target && target.closest && target.closest(".topbar")) return;
      if (selectedId) clearSelection();
    });
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
    graph = parseGraph(code);

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

      buildDomIndex();
      wireSelection();

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
