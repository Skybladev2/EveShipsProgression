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

  /* Mermaid builds the diagram inside a temporary element before handing back
     the SVG string. Left in the normal document flow, that element briefly
     shows up as a full-width strip at the bottom of the page while a large
     diagram renders. Park it off-screen instead: it stays laid out (Mermaid
     measures it with getBBox) but can never affect or appear in the page. */
  var renderHost = document.createElement("div");
  renderHost.setAttribute("aria-hidden", "true");
  renderHost.style.cssText =
    "position:fixed;left:-100000px;top:0;width:1000px;height:1000px;" +
    "overflow:hidden;pointer-events:none;visibility:hidden;";
  document.body.appendChild(renderHost);

  var baseCode = "";      // full Mermaid source
  var fullMarkup = null;  // pristine full-diagram SVG, reused when restoring
  var graph = null;       // parsed source: nodes, adjacency, clusters
  var domIndex = null;    // rendered elements keyed by source id
  var selectedId = null;  // currently isolated ship, or null for the full chart
  var selectedEdgeId = null; // currently highlighted edge (does not filter)
  var displayNames = Object.create(null); // source id -> label shown on the chart
  var tooltipEl = null;   // floating tooltip for the edge under the cursor
  var tooltipEdgeId = null; // edge the tooltip currently describes

  var renderSeq = 0;      // unique Mermaid render ids
  var viewToken = 0;      // guards against stale async renders
  var rendering = false;  // serialises Mermaid renders
  var pendingView = null;

  var EDGE_HIT_PX = 18;     // clickable edge width, in screen pixels
  var EDGE_STROKE_PX = 1.6; // visible edge width, in screen pixels
  var EDGE_DASH_PX = 6;     // dash length of weak links, in screen pixels
  var EDGE_GAP_PX = 5;      // gap length of weak links, in screen pixels
  var hitWidthRaf = null;   // debounces hit-width updates during zoom/pan

  // The full chart is far too wide to read at once, so the default view is
  // framed on this group (by its subgraph label) instead of the whole diagram.
  var DEFAULT_GROUP_LABEL = "Empire Faction Frigates";
  var FOCUS_PADDING_PX = 24; // breathing room left around the focused group

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
    var outAdj = Object.create(null);       // id -> { dstId: true }  (variants)
    var inAdj = Object.create(null);        // id -> { srcId: true }  (predecessors)
    var edges = [];                         // { src, dst }
    var clusters = Object.create(null);     // id -> { label, parent, children }
    var nodeClusters = Object.create(null); // nodeId -> [clusterId, ...]

    var stack = [];

    function ensure(id) {
      if (!outAdj[id]) { outAdj[id] = Object.create(null); inAdj[id] = Object.create(null); nodes[id] = true; }
      return id;
    }

    // First pass: collect clusters and node->cluster mappings
    var lines = code.split(/\r?\n/);
    var subgraphStack = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var sub = line.match(/^subgraph\s+([A-Za-z_]\w*)/);
      if (sub) {
        var cid = sub[1];
        if (!clusters[cid]) clusters[cid] = { label: cid, parent: null, children: [] };
        var parent = subgraphStack.length ? subgraphStack[subgraphStack.length - 1] : null;
        clusters[cid].parent = parent;
        if (parent) clusters[parent].children.push(cid);
        subgraphStack.push(cid);
        continue;
      }
      if (line === "end") { subgraphStack.pop(); continue; }
      var decl = line.match(/^([A-Za-z_]\w*)\s*\[/);
      if (decl) {
        var nid = ensure(decl[1]);
        nodeClusters[nid] = subgraphStack.slice();
      }
    }

    // Build reverse mapping: cluster -> nodes in it
    var clusterNodes = Object.create(null);
    Object.keys(nodeClusters).forEach(function(nid) {
      var cids = nodeClusters[nid];
      for (var k = 0; k < cids.length; k++) {
        var cid = cids[k];
        if (!clusterNodes[cid]) clusterNodes[cid] = [];
        clusterNodes[cid].push(nid);
      }
    });

    // Second pass: process edges (expanding group-to-group)
    subgraphStack = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var sub = line.match(/^subgraph\s+([A-Za-z_]\w*)/);
      if (sub) { subgraphStack.push(sub[1]); continue; }
      if (line === "end") { subgraphStack.pop(); continue; }
      var edge = line.match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/);
      if (edge) {
        var a = edge[1];
        var b = edge[2];
        // Check if they're subgraphs (clusters)
        var aIsCluster = clusters[a] !== undefined;
        var bIsCluster = clusters[b] !== undefined;
        if (aIsCluster && bIsCluster) {
          // Expand: connect all nodes in a to all nodes in b
          var nodesA = clusterNodes[a] || [];
          var nodesB = clusterNodes[b] || [];
          for (var na = 0; na < nodesA.length; na++) {
            for (var nb = 0; nb < nodesB.length; nb++) {
              var naId = ensure(nodesA[na]);
              var nbId = ensure(nodesB[nb]);
              outAdj[naId][nbId] = true;
              inAdj[nbId][naId] = true;
              edges.push({ src: naId, dst: nbId });
            }
          }
        } else if (aIsCluster && !bIsCluster) {
          var nodesA = clusterNodes[a] || [];
          var nbId = ensure(b);
          for (var na = 0; na < nodesA.length; na++) {
            var naId = ensure(nodesA[na]);
            outAdj[naId][nbId] = true;
            inAdj[nbId][naId] = true;
            edges.push({ src: naId, dst: nbId });
          }
        } else if (!aIsCluster && bIsCluster) {
          var naId = ensure(a);
          var nodesB = clusterNodes[b] || [];
          for (var nb = 0; nb < nodesB.length; nb++) {
            var nbId = ensure(nodesB[nb]);
            outAdj[naId][nbId] = true;
            inAdj[nbId][naId] = true;
            edges.push({ src: naId, dst: nbId });
          }
        } else {
          // Both are nodes
          var naId = ensure(a);
          var nbId = ensure(b);
          outAdj[naId][nbId] = true;
          inAdj[nbId][naId] = true;
          edges.push({ src: naId, dst: nbId });
        }
        continue;
      }
    }

    return { nodes: nodes, outAdj: outAdj, inAdj: inAdj, edges: edges, clusters: clusters, nodeClusters: nodeClusters };
  }

  /* Map every node and subgraph id to the label shown on the chart, so the
     tooltip can name the ship an edge leads to. Both `n_X["Name"]` node
     declarations and `subgraph sN["Name"]` blocks use the same shape. */
  function buildDisplayNames(code) {
    var names = Object.create(null);
    code.split(/\r?\n/).forEach(function (line) {
      var m = line.trim().match(/^(?:subgraph\s+)?([A-Za-z_]\w*)\s*\["([^"]*)"\]/);
      if (m) names[m[1]] = m[2];
    });
    return names;
  }

  function connectedComponent(id) {
    var visible = Object.create(null);
    visible[id] = true;

    function walk(adjacency) {
      var queue = [id];
      while (queue.length) {
        var current = queue.pop();
        var neighbours = adjacency[current] || {};
        for (var key in neighbours) {
          if (!visible[key]) { visible[key] = true; queue.push(key); }
        }
      }
    }

    walk(graph.outAdj);  // ships reachable from `id`
    walk(graph.inAdj);   // ships that can reach `id`
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

    // Group connections that survive the filter. A direct ship edge is
    // redundant when a surviving group edge already joins the two groups the
    // ships sit in, so the direct edge is dropped in favour of the group one.
    var groupEdges = [];
    code.split(/\r?\n/).forEach(function (line) {
      var m = line.trim().match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/);
      if (!m) return;
      if (graph.clusters[m[1]] === undefined || graph.clusters[m[2]] === undefined) return;
      if (needed[m[1]] && needed[m[2]]) groupEdges.push([m[1], m[2]]);
    });

    function inGroup(nid, groupId) {
      if (graph.clusters[groupId] === undefined) return nid === groupId;
      var parents = graph.nodeClusters[nid];
      return !!parents && parents.indexOf(groupId) !== -1;
    }

    function coveredByGroup(a, b) {
      for (var k = 0; k < groupEdges.length; k++) {
        if (inGroup(a, groupEdges[k][0]) && inGroup(b, groupEdges[k][1])) return true;
      }
      return false;
    }

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

      var edge = s.match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|[^|]*\|\s*)?([A-Za-z_]\w*)/);
      if (edge) {
        var a = edge[1], b = edge[2];
        var aIsCluster = graph.clusters[a] !== undefined;
        var bIsCluster = graph.clusters[b] !== undefined;
        var keep;
        if (aIsCluster || bIsCluster) {
          // A group-to-group edge is kept only while both of its subgraph
          // blocks survive the filter. Otherwise Mermaid would draw a phantom
          // node for the dropped group id, showing a raw `s2`-style name.
          keep = (aIsCluster ? !!needed[a] : !!visible[a]) &&
                 (bIsCluster ? !!needed[b] : !!visible[b]);
        } else {
          keep = !!visible[a] && !!visible[b] && !coveredByGroup(a, b);
        }
        if (keep) out.push(line);
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
    // The visible edges are sized in user units (so their dashes keep the
    // screen-pixel length set below); the var just keeps the width constant
    // on screen, matching the hit strokes.
    svgEl.style.setProperty("--edge-w", (EDGE_STROKE_PX / (scale || 1)) + "px");
    svgEl.style.setProperty("--edge-dash", (EDGE_DASH_PX / (scale || 1)) + " " + (EDGE_GAP_PX / (scale || 1)));
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

  /* Like splitEndpoints, but also accepts subgraph ids as endpoints, so the
     tooltip works on group connections ("Slasher -> Interceptors") too. */
  function edgeEndpoints(edgeId) {
    var mid = edgeId.replace(/^L_/, "").replace(/_\d+$/, "");
    for (var i = mid.length - 1; i > 0; i--) {
      if (mid.charAt(i) !== "_") continue;
      var a = mid.slice(0, i);
      var b = mid.slice(i + 1);
      if ((graph.nodes[a] || graph.clusters[a]) && (graph.nodes[b] || graph.clusters[b])) {
        return [a, b];
      }
    }
    return null;
  }

  function ensureTooltip() {
    if (tooltipEl && tooltipEl.isConnected) return tooltipEl;
    tooltipEl = document.createElement("div");
    tooltipEl.className = "edge-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  /* Full path to a subgraph, e.g. the "Missiles" group inside "Cruisers"
     becomes "Cruisers/Missiles". Top-level groups keep just their own name. */
  function clusterPath(cid) {
    var parts = [];
    var guard = 0;
    while (cid && guard++ < 50) {
      parts.unshift(displayNames[cid] || cid);
      var cluster = graph.clusters[cid];
      cid = cluster ? cluster.parent : null;
    }
    return parts.join("/");
  }

  /* Name shown for an endpoint: a ship's name, or a group's full path. */
  function endpointName(id) {
    if (graph.clusters[id]) return clusterPath(id);
    return displayNames[id] || id;
  }

  function placeTooltip(e) {
    var pad = 14;
    var r = tooltipEl.getBoundingClientRect();
    var x = e.clientX + pad;
    var y = e.clientY + pad;
    if (x + r.width > window.innerWidth - 6) x = e.clientX - pad - r.width;
    if (y + r.height > window.innerHeight - 6) y = e.clientY - pad - r.height;
    tooltipEl.style.left = Math.max(6, x) + "px";
    tooltipEl.style.top = Math.max(6, y) + "px";
  }

  /* Show the connection's label and the ship it leads to, e.g.
     "Projectile turrets → Claw". Group targets show their full path,
     e.g. "Missiles → Cruisers/Missiles". Shown on the first hover frame,
     with no delay or fade, so it feels immediate. */
  /* Mermaid wraps a multi-word edge label into one row per word, each word in
     its own <tspan>. textContent then glues the rows together ("Weapon" +
     "disruption" -> "Weapondisruption"), so read the leaf tspans and rejoin
     them with a space. */
  function edgeLabelText(labelEl) {
    var words = collect(labelEl, "tspan").filter(function (t) {
      return !t.querySelector("tspan");
    });
    var text = words.length
      ? words.map(function (t) { return t.textContent; }).join(" ")
      : labelEl.textContent;
    return text.replace(/\s+/g, " ").trim();
  }

  function showEdgeTooltip(e, edgeId) {
    var tip = ensureTooltip();
    if (tip.hidden || edgeId !== tooltipEdgeId) {
      tooltipEdgeId = edgeId;
      var label = domIndex && domIndex.labelByEdgeId[edgeId];
      var text = label ? edgeLabelText(label) : "";
      var ends = edgeEndpoints(edgeId);
      var name = ends ? endpointName(ends[1]) : "";
      tip.textContent = text && name ? text + " → " + name : (name || text);
    }
    if (!tip.textContent) { hideEdgeTooltip(); return; }
    tip.hidden = false;
    placeTooltip(e);
  }

  function hideEdgeTooltip() {
    if (tooltipEl) tooltipEl.hidden = true;
    tooltipEdgeId = null;
  }

  function wireEdgeTooltip() {
    viewport.addEventListener("mousemove", function (e) {
      var edgeId = edgeIdFromTarget(e.target);
      if (edgeId) showEdgeTooltip(e, edgeId);
      else hideEdgeTooltip();
    });
    viewport.addEventListener("mouseleave", hideEdgeTooltip);
    // A drag (pan) or a scroll would leave the tooltip stranded.
    viewport.addEventListener("mousedown", hideEdgeTooltip, true);
    window.addEventListener("scroll", hideEdgeTooltip, true);
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
    var edges = (code.match(/-->|-\.->/g) || []).length;
    return { nodes: nodes, edges: edges };
  }

  function renderMermaid(code) {
    return mermaid.render("shipGraph" + (++renderSeq), code, renderHost).then(function (result) {
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
    hideEdgeTooltip(); // the previous layer's edge ids are about to be replaced

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
    // The full chart opens framed on the default group; isolated components are
    // left fitted to their own bounds.
    if (!selected) focusDefaultGroup();
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

  /* Find a rendered subgraph by its visible label, e.g. "Empire Faction
     Frigates". Cluster ids are Mermaid internals, so match the label instead.
     `:scope >` keeps nested subgraphs from matching their parent's label. */
  function findClusterByLabel(label) {
    var clusters = collect(svgEl, "g.cluster");
    for (var i = 0; i < clusters.length; i++) {
      var labelEl = clusters[i].querySelector(":scope > g.cluster-label");
      var text = (labelEl || clusters[i]).textContent.replace(/\s+/g, " ").trim();
      if (text === label) return clusters[i];
    }
    return null;
  }

  /* Zoom and pan so `el` fills the viewport with a little padding. Works from
     the diagram-space bbox plus the live pan/zoom, so it does not depend on the
     browser having repainted the deferred transform yet. */
  function focusOnElement(el) {
    if (!panZoom || !svgEl || !el) return;
    var bbox;
    try { bbox = el.getBBox(); } catch (e) { return; }
    if (!bbox || !bbox.width || !bbox.height) return;

    var vp = viewport.getBoundingClientRect();
    var svgRect = svgEl.getBoundingClientRect();
    var availW = Math.max(1, vp.width - FOCUS_PADDING_PX * 2);
    var availH = Math.max(1, vp.height - FOCUS_PADDING_PX * 2);

    var absZoom = panZoom.getSizes().realZoom || 1; // diagram units -> screen px
    var relZoom = panZoom.getZoom() || 1;           // 1 == initial fit
    var targetRel = Math.min(availW / bbox.width, availH / bbox.height) / absZoom * relZoom;

    panZoom.zoom(targetRel); // clamps to the configured zoom limits

    var abs = panZoom.getSizes().realZoom || absZoom;
    var centerX = vp.left + vp.width / 2 - svgRect.left;
    var centerY = vp.top + vp.height / 2 - svgRect.top;
    panZoom.pan({
      x: centerX - (bbox.x + bbox.width / 2) * abs,
      y: centerY - (bbox.y + bbox.height / 2) * abs
    });
    scheduleHitWidth();
  }

  /* Frame the default group on the full chart. Returns false when the group is
     not part of the current diagram (e.g. an isolated ship's component). */
  function focusDefaultGroup() {
    if (!panZoom || !svgEl) return false;
    var cluster = findClusterByLabel(DEFAULT_GROUP_LABEL);
    if (!cluster) return false;
    focusOnElement(cluster);
    return true;
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
      // Reset means "back to the default view": drop any isolated ship so the
      // full chart comes back, then frame the default group on it.
      if (selectedId) { clearSelection(); return; }
      if (!focusDefaultGroup()) { panZoom.resetZoom(); panZoom.center(); scheduleHitWidth(); }
    });
    document.getElementById("download").addEventListener("click", downloadSvg);
    document.getElementById("search").addEventListener("input", function (e) { runSearch(e.target.value); });
    window.addEventListener("resize", function () {
      if (!panZoom) return;
      panZoom.resize(); panZoom.fit(); panZoom.center();
      if (!selectedId && focusDefaultGroup()) return;
      scheduleHitWidth();
    });
  }

  function boot(code) {
    baseCode = code;
    graph = parseGraph(code);
    displayNames = buildDisplayNames(code);

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
        lineColor: "#9aa8bf",
        secondaryColor: "#182130",
        tertiaryColor: "#121823",
        clusterBkg: "#0f141d",
        clusterBorder: "#46566e",
        fontSize: "24px"
      },
      flowchart: {
        look: "classic",
        useMaxWidth: false,
        htmlLabels: false,
        minNodeWidth: 16,
        wrappingWidth: 400
      }
    });

    wireSelection();
    wireControls();
    wireEdgeTooltip();
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
