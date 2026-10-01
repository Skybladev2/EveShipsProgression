/* Renders the Mermaid diagram from README.md and adds pan / zoom / search.
   Clicking a ship rebuilds the chart from just its connected component, so the
   remaining ships are laid out as their own compact diagram; the two views
   cross-fade. Clicking the background brings the full chart back.
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
  var FADE_MS = 200;

  var host = document.getElementById("graph");
  var statusEl = document.getElementById("status");
  var viewport = document.getElementById("viewport");
  var panZoom = null;
  var svgEl = null;

  var baseCode = "";      // full Mermaid source
  var fullMarkup = null;  // pristine full-diagram SVG, reused when restoring
  var graph = null;       // parsed source: nodes, adjacency, clusters
  var domIndex = null;    // rendered elements keyed by source id
  var selectedId = null;  // currently isolated ship, or null for the full chart
  var selectedEdgeId = null; // currently highlighted edge (does not filter)

  var renderSeq = 0;      // unique Mermaid render ids
  var viewToken = 0;      // guards against stale async renders
  var rendering = false;  // serialises Mermaid renders
  var pendingView = null;

  var EDGE_HIT_PX = 18;     // clickable edge width, in screen pixels
  var hitWidthRaf = null;   // debounces hit-width updates during zoom/pan

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

  /* Every ship reachable from `id` through any chain of variants. */
  function connectedComponent(id) {
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
    return visible;
  }

  /* Rebuild the Mermaid source keeping only the visible ships: their node
     declarations, the edges between them and the subgraphs that still hold
     something. Everything else is dropped so the layout recomputes compactly. */
  function buildFilteredCode(code, visible) {
    var needed = Object.create(null);
    Object.keys(visible).forEach(function (nid) {
      (graph.nodeClusters[nid] || []).forEach(function (cid) { needed[cid] = true; });
    });

    var out = [];
    var stack = [];
    code.split(/\r?\n/).forEach(function (line) {
      var s = line.trim();
      if (!s) return;

      var sub = s.match(/^subgraph\s+([A-Za-z_]\w*)/);
      if (sub) {
        var keep = !!needed[sub[1]];
        stack.push(keep);
        if (keep) out.push(line);
        return;
      }
      if (s === "end") {
        if (stack.pop()) out.push(line);
        return;
      }

      var edge = s.match(/^([A-Za-z_]\w*)\s*-->\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/);
      if (edge) {
        if (visible[edge[1]] && visible[edge[2]]) out.push(line);
        return;
      }

      var decl = s.match(/^([A-Za-z_]\w*)\s*\[/);
      if (decl) {
        if (visible[decl[1]]) out.push(line);
        return;
      }
      out.push(line); // the `flowchart` header and anything else
    });

    return out.join("\n");
  }

  /* Recover a rendered node's source id from its group id, e.g.
     "shipGraph3-flowchart-n_Kestrel-0" -> "n_Kestrel". */
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

  function collect(scope, selector) {
    return Array.prototype.slice.call(scope.querySelectorAll(selector));
  }

  /* Build a lookup from source ids to the SVG elements Mermaid produced for
     the currently displayed layer. */
  function buildDomIndex() {
    var nodes = graph.nodes;

    var nodeItems = [];
    var byId = Object.create(null);
    collect(svgEl, "g.node").forEach(function (el) {
      var id = nodeIdFromDom(el);
      if (!id || !nodes[id]) return;
      var item = { id: id, el: el };
      nodeItems.push(item);
      byId[id] = item;
    });

    var edgeItems = [];
    var pathByEdgeId = Object.create(null);
    collect(svgEl, 'path[data-et="edge"]').forEach(function (el) {
      var id = el.getAttribute("data-id");
      if (!id) return;
      pathByEdgeId[id] = el;
      var ends = splitEndpoints(id, nodes);
      if (ends) edgeItems.push({ el: el, src: ends[0], dst: ends[1] });
    });

    var labelByEdgeId = Object.create(null);
    collect(svgEl, "g.edgeLabel").forEach(function (el) {
      var label = el.querySelector(".label[data-id]");
      if (label) labelByEdgeId[label.getAttribute("data-id")] = el;
    });

    domIndex = {
      nodes: nodeItems,
      byId: byId,
      edges: edgeItems,
      pathByEdgeId: pathByEdgeId,
      labelByEdgeId: labelByEdgeId
    };
  }

  function markSelected() {
    if (domIndex && selectedId && domIndex.byId[selectedId]) {
      domIndex.byId[selectedId].el.classList.add("ship-selected");
    }
    if (domIndex && selectedEdgeId) {
      var path = domIndex.pathByEdgeId[selectedEdgeId];
      var label = domIndex.labelByEdgeId[selectedEdgeId];
      if (path) path.classList.add("edge-selected");
      if (label) label.classList.add("edge-selected");
    }
  }

  /* Edges are drawn ~1px wide, which is very hard to click. Lay an invisible
     but much thicker copy of each edge on top of it (inside the same layer, so
     it stays below the node and label layers) purely as a hit target. */
  function addEdgeHitAreas() {
    collect(svgEl, 'path[data-et="edge"]').forEach(function (path) {
      var hit = path.cloneNode(false);
      hit.removeAttribute("id");
      hit.removeAttribute("style");
      hit.removeAttribute("marker-end");
      hit.removeAttribute("marker-start");
      hit.setAttribute("class", "edge-hit");
      hit.setAttribute("data-et", "edge-hit");
      hit.setAttribute("fill", "none");
      hit.setAttribute("stroke", "transparent");
      hit.style.stroke = "transparent";
      hit.style.fill = "none";
      hit.style.pointerEvents = "stroke";
      path.parentNode.insertBefore(hit, path.nextSibling);

      // A thin overlay revealed while the hit area is hovered, so the edge
      // under the cursor is obvious. It ignores pointer events itself.
      var glow = path.cloneNode(false);
      glow.removeAttribute("id");
      glow.removeAttribute("style");
      glow.removeAttribute("marker-end");
      glow.removeAttribute("marker-start");
      glow.setAttribute("class", "edge-hover-line");
      glow.setAttribute("data-et", "edge-glow");
      glow.setAttribute("fill", "none");
      glow.style.pointerEvents = "none";
      path.parentNode.insertBefore(glow, hit.nextSibling);
    });
    updateHitWidth();
  }

  /* The chart is scaled far below 1:1, so a stroke width in diagram units is
     only a fraction of a pixel on screen. Measure the live user-to-screen
     scale and size the hit strokes in screen pixels instead, so they stay
     comfortably wide no matter how far the user zooms out. */
  function updateHitWidth() {
    if (!svgEl) return;
    var sample = svgEl.querySelector("path.edge-hit");
    if (!sample) return;
    var scale = 1;
    if (sample.getScreenCTM) {
      var m = sample.getScreenCTM();
      if (m) scale = Math.sqrt(m.a * m.a + m.b * m.b) || 1;
    }
    if (scale === 1) {
      var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
      var rect = svgEl.getBoundingClientRect();
      if (vb && vb.width && rect && rect.width) scale = rect.width / vb.width;
    }
    svgEl.style.setProperty("--edge-hit-w", (EDGE_HIT_PX / (scale || 1)) + "px");
  }

  function scheduleHitWidth() {
    if (hitWidthRaf) return;
    hitWidthRaf = requestAnimationFrame(function () {
      hitWidthRaf = null;
      updateHitWidth();
    });
  }

  /* Highlight a single edge (line + label). Highlighting never filters: it is
     independent of the isolated-ship view and works while a ship is selected. */
  function toggleEdge(edgeId) {
    if (!domIndex) return;
    var previous = selectedEdgeId;
    if (previous) {
      if (domIndex.pathByEdgeId[previous]) domIndex.pathByEdgeId[previous].classList.remove("edge-selected");
      if (domIndex.labelByEdgeId[previous]) domIndex.labelByEdgeId[previous].classList.remove("edge-selected");
    }
    selectedEdgeId = previous === edgeId ? null : edgeId;
    markSelected();
  }

  function edgeIdFromTarget(target) {
    if (!target || !target.closest) return null;
    var hit = target.closest("path.edge-hit");
    if (hit) return hit.getAttribute("data-id");
    var path = target.closest('path[data-et="edge"]');
    if (path) return path.getAttribute("data-id");
    var label = target.closest("g.edgeLabel");
    if (label) {
      var inner = label.querySelector(".label[data-id]");
      if (inner) return inner.getAttribute("data-id");
    }
    return null;
  }

  function updateStatus(visibleCount, edgeCount) {
    if (visibleCount == null) {
      var stats = countStats(baseCode);
      statusEl.textContent = stats.nodes + " ships · " + stats.edges + " connections";
    } else {
      statusEl.textContent = visibleCount + " ships · " + edgeCount + " connections · isolated";
    }
  }

  function countStats(code) {
    var nodes = (code.match(/\bn_[A-Za-z0-9_]+\["/g) || []).length;
    var edges = (code.match(/-->/g) || []).length;
    return { nodes: nodes, edges: edges };
  }

  function renderMermaid(code) {
    return mermaid.render("shipGraph" + (++renderSeq), code).then(function (result) {
      return result.svg;
    });
  }

  function svgFromMarkup(markup) {
    var tmp = document.createElement("div");
    tmp.innerHTML = markup;
    var svg = tmp.querySelector("svg");
    svg.removeAttribute("style");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.maxWidth = "none";
    svg.classList.add("graph-layer");
    return svg;
  }

  function initPanZoom(svg) {
    if (panZoom) { try { panZoom.destroy(); } catch (e) { /* ignore */ } panZoom = null; }
    if (!window.svgPanZoom) return;
    panZoom = svgPanZoom(svg, {
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 0.02,
      maxZoom: 25,
      zoomScaleSensitivity: 0.25,
      dblClickZoomEnabled: false,
      mouseWheelZoomEnabled: true,
      onZoom: scheduleHitWidth,
      onPan: scheduleHitWidth
    });
    updateHitWidth();
  }

  /* Put a freshly rendered SVG on top of the current one and cross-fade. */
  function applyView(markup, selected, visibleCount, edgeCount) {
    var placeholder = host.querySelector(".loading");
    if (placeholder) placeholder.remove();

    var old = svgEl;
    var svg = svgFromMarkup(markup);
    svg.style.opacity = "0";
    host.appendChild(svg);
    svgEl = svg;

    buildDomIndex();
    addEdgeHitAreas();
    markSelected();
    // Let the new layer take layout before initialising pan/zoom on it.
    svg.getBoundingClientRect();
    initPanZoom(svg);
    updateStatus(visibleCount, edgeCount);

    if (old) old.style.pointerEvents = "none";
    requestAnimationFrame(function () {
      svg.style.opacity = "1";
      if (old) old.style.opacity = "0";
    });
    if (old) {
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, FADE_MS + 60);
    }
  }

  /* Render requests are serialised and only the newest one is applied, so
     rapid clicks never scramble the diagram or leave a stale view behind. */
  function requestView(request) {
    request.token = ++viewToken;
    pendingView = request;
    if (!rendering) pump();
  }

  function pump() {
    if (!pendingView) { rendering = false; return; }
    var req = pendingView;
    pendingView = null;
    rendering = true;

    var markup;
    if (req.full && fullMarkup) {
      markup = Promise.resolve(fullMarkup);
    } else {
      markup = renderMermaid(req.code).then(function (svg) {
        if (req.full) fullMarkup = svg;
        return svg;
      });
    }

    markup.then(function (svg) {
      if (req.token !== viewToken) { rendering = false; pump(); return; }
      applyView(svg, req.selectedId, req.visibleCount, req.edgeCount);
      rendering = false;
      pump();
    }).catch(function (err) {
      rendering = false;
      fail("Could not draw the diagram: " + err.message);
    });
  }

  function selectShip(id) {
    if (!graph.nodes[id] || selectedId === id) return;
    selectedId = id;
    selectedEdgeId = null;
    var visible = connectedComponent(id);
    var visibleCount = Object.keys(visible).length;
    var edgeCount = graph.edges.filter(function (e) {
      return visible[e.src] && visible[e.dst];
    }).length;
    requestView({
      code: buildFilteredCode(baseCode, visible),
      full: false,
      selectedId: id,
      visibleCount: visibleCount,
      edgeCount: edgeCount
    });
  }

  function clearSelection() {
    if (!selectedId) return;
    selectedId = null;
    selectedEdgeId = null;
    requestView({ code: baseCode, full: true, selectedId: null, visibleCount: null, edgeCount: null });
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

      // Edges are checked first: highlighting one must never filter or reset
      // the view, even while a ship is isolated.
      var edgeId = edgeIdFromTarget(target);
      if (edgeId) { toggleEdge(edgeId); return; }

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
      if (selectedEdgeId) toggleEdge(selectedEdgeId);
      if (selectedId) clearSelection();
    });
  }

  function wireControls() {
    document.getElementById("zoom-in").addEventListener("click", function () { if (panZoom) panZoom.zoomIn(); });
    document.getElementById("zoom-out").addEventListener("click", function () { if (panZoom) panZoom.zoomOut(); });
    document.getElementById("fit").addEventListener("click", function () {
      if (!panZoom) return;
      panZoom.resize(); panZoom.fit(); panZoom.center();
      scheduleHitWidth();
    });
    document.getElementById("reset").addEventListener("click", function () {
      if (!panZoom) return;
      panZoom.resetZoom(); panZoom.center();
      scheduleHitWidth();
    });
    document.getElementById("download").addEventListener("click", downloadSvg);
    document.getElementById("search").addEventListener("input", function (e) { runSearch(e.target.value); });
    window.addEventListener("resize", function () {
      if (panZoom) { panZoom.resize(); panZoom.fit(); panZoom.center(); }
      scheduleHitWidth();
    });
  }

  function boot(code) {
    baseCode = code;
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
        clusterBorder: "#2a3444",
        fontSize: "24px"
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: false,
        minNodeWidth: 16,
        wrappingWidth: 400
      }
    });

    wireSelection();
    wireControls();
    requestView({ code: baseCode, full: true, selectedId: null, visibleCount: null, edgeCount: null });
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
      boot(match[1].trim());
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
