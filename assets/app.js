/* Renders the Mermaid diagram from README.md and adds pan / zoom, a ship picker
   and a connection-type picker. Clicking a ship rebuilds the chart from just its
   connected component, so the remaining ships are laid out as their own compact
   diagram; picking a connection type keeps every ship joined by that type, direct
   or group; the views cross-fade. Clicking an edge either highlights it in place
   or narrows the chart to links of the same connection type, depending on the
   Filter / Highlight selector. Clicking the background brings the full chart
   back. Libraries are vendored under assets/vendor; CDNs are only a fallback. */
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
  var viewport = document.getElementById("viewport");
  var panZoom = null;
  var panZoomSvg = null;  // svg element the current panZoom instance controls
  var svgEl = null;

  var SVG_NS = "http://www.w3.org/2000/svg";
  var minimap = document.getElementById("minimap");
  var minimapSvg = document.getElementById("minimap-svg");
  var minimapView = null;    // rectangle marking the visible region
  var minimapDragging = false;
  var minimapEnabled = true; // toggled from the toolbar
  var contentBounds = null;  // tight diagram bounds, used to clamp panning

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
  var selectedEdge = null; // connection-type filter: { src, dst, label }, or null
  var selectedType = null; // connection type picked from the edge combobox, or null
  var highlightedEdgeId = null; // rendered edge id highlighted in place (highlight mode)
  var filterOnEdgeClick = true; // true: edge click filters; false: it only highlights
  var displayNames = Object.create(null); // source id -> label shown on the chart
  // Node ids that can only be flown by an Omega clone. Generated offline from
  // the EVE SDE (see tools/generate_omega_ships.py) and merely read here, so
  // no skill data has to be shipped to or processed by the browser.
  var omegaShips = Object.create(null);
  (window.OMEGA_SHIP_IDS || []).forEach(function (id) { omegaShips[id] = true; });

  /* EVE SSO + flyability. Ships are classified offline into
     assets/ship-skills.js (skill type id -> required level, see
     tools/generate_omega_ships.py); after the pilot signs in through EVE SSO
     their skills are fetched from ESI and each ship is marked flyable when the
     character has every required skill at or above its level. Alpha/Omega is
     captured by the skill levels themselves, because EVE enforces training
     caps server-side, so no clone-state flag is needed. */
  var SSO_STORAGE_KEY = "eve.sso.session.v1";
  var EVE_AUTH = "https://login.eveonline.com/v2/oauth/authorize";
  var EVE_TOKEN = "https://login.eveonline.com/v2/oauth/token";
  var EVE_ESI = "https://esi.evetech.net/";
  var ssoConfig = Object.assign({ client_id: "", redirect_uri: null, scope: "esi-skills.read_skills.v1" }, window.EVE_SSO_CONFIG || {});
  // allow per-deployment overrides without editing config.js
  var ssoQuery = new URLSearchParams(location.search);
  if (ssoQuery.get("sso_client_id")) ssoConfig.client_id = ssoQuery.get("sso_client_id");
  if (ssoQuery.get("sso_redirect_uri")) ssoConfig.redirect_uri = ssoQuery.get("sso_redirect_uri");

  var shipSkills = Object.create(null); // node id -> [[skillTypeID, level], ...]
  var shipSkillsRaw = window.SHIP_SKILLS || {};
  Object.keys(shipSkillsRaw).forEach(function (id) { shipSkills[id] = shipSkillsRaw[id]; });

  var sso = {
    session: null,        // { accessToken, exp, charId, charName, skills }
    flyable: null,        // node id -> true for ships the character can fly
    filterFlyable: false, // chart narrowed to flyable ships
    highlightFlyable: true
  };

  var tooltipEl = null;   // floating tooltip for the edge under the cursor
  var tooltipEdgeId = null; // edge the tooltip currently describes

  var renderSeq = 0;      // unique Mermaid render ids
  var viewToken = 0;      // guards against stale async renders
  var rendering = false;  // serialises Mermaid renders
  var pendingView = null;
  var savedFullView = null; // full-chart { zoom, pan } to restore after filtering

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

    return {
      nodes: nodes, outAdj: outAdj, inAdj: inAdj, edges: edges,
      clusters: clusters, nodeClusters: nodeClusters, clusterNodes: clusterNodes
    };
  }

  /* Every edge of the source, with its connection-type label. Group-to-group
     edges (e.g. `s2 ==>|"Missiles"| s35`) keep their cluster ids here; the
     expansion into ship pairs happens in buildLabelAdjacency. */
  function parseRawEdges(code) {
    var out = [];
    code.split(/\r?\n/).forEach(function (line) {
      var m = line.trim().match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|"([^"]*)"\|\s*)?([A-Za-z_]\w*)/);
      if (m) out.push({ src: m[1], dst: m[3], label: m[2] || "" });
    });
    return out;
  }

  /* The ship ids an endpoint stands for: a ship itself, or every ship inside
     the subgraph when the endpoint is a group. */
  function endpointNodes(id) {
    if (graph.clusters[id] !== undefined) return graph.clusterNodes[id] || [];
    return graph.nodes[id] ? [id] : [];
  }

  /* Adjacency keyed by connection type: label -> { nodeId -> { nodeId: true } }.
     Group edges are expanded to all their ship pairs, so traversal can follow
     only edges that carry the selected connection type. */
  function buildLabelAdjacency(rawEdges) {
    var byLabel = Object.create(null);
    rawEdges.forEach(function (e) {
      var from = endpointNodes(e.src);
      var to = endpointNodes(e.dst);
      var map = byLabel[e.label] || (byLabel[e.label] = Object.create(null));
      for (var i = 0; i < from.length; i++) {
        for (var j = 0; j < to.length; j++) {
          var a = from[i], b = to[j];
          if (a === b) continue;
          (map[a] || (map[a] = Object.create(null)))[b] = true;
          (map[b] || (map[b] = Object.create(null)))[a] = true;
        }
      }
    });
    return byLabel;
  }

  /* Ships reachable from the seed ships using only edges whose label matches
     the selected connection type. This is the stricter counterpart of
     connectedComponent, which follows every edge regardless of type. */
  function sameTypeComponent(seedIds, label) {
    var adjacency = graph.labelAdj[label] || Object.create(null);
    var visible = Object.create(null);
    var queue = [];
    seedIds.forEach(function (id) {
      if (!visible[id]) { visible[id] = true; queue.push(id); }
    });
    while (queue.length) {
      var neighbours = adjacency[queue.pop()] || {};
      for (var key in neighbours) {
        if (!visible[key]) { visible[key] = true; queue.push(key); }
      }
    }
    return visible;
  }

  /* Every ship that is an endpoint of at least one connection of this type,
     whether the edge runs between two ships or between a ship and a group.
     This is the whole graph for the combobox filter, not just one component. */
  function nodesForLabel(label) {
    var visible = Object.create(null);
    parseRawEdges(baseCode).forEach(function (e) {
      if (e.label !== label) return;
      endpointNodes(e.src).forEach(function (id) { visible[id] = true; });
      endpointNodes(e.dst).forEach(function (id) { visible[id] = true; });
    });
    return visible;
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

  /* Deepest subgraph a ship lives in, e.g. n_Hurricane -> bc_proj. Used to
     decide which group a filtered connection belongs to. */
  function deepestCluster(nid) {
    var chain = graph.nodeClusters[nid];
    return chain && chain.length ? chain[chain.length - 1] : null;
  }

  /* True when `cid` is `ancestor` or sits inside it. Keeps a group edge from
     being drawn between a group and its own container. */
  function clusterContains(ancestor, cid) {
    var guard = 0;
    while (cid && guard++ < 50) {
      if (cid === ancestor) return true;
      var cluster = graph.clusters[cid];
      cid = cluster ? cluster.parent : null;
    }
    return false;
  }

  /* Rebuild the Mermaid source keeping only the visible ships: their node
     declarations, the edges between them and the subgraphs that still hold
     something. Everything else is dropped so the layout recomputes compactly. */
  function buildFilteredCode(code, visible, labelFilter) {
    // When set, only connections of this type are kept: clicking a "Tackle"
    // edge leaves nothing but Tackle links, a "Projectile turrets" edge
    // nothing but Projectile turrets, and so on.
    var exactType = labelFilter != null;
    var needed = Object.create(null);
    Object.keys(visible).forEach(function (nid) {
      (graph.nodeClusters[nid] || []).forEach(function (cid) { needed[cid] = true; });
    });

    // Group connections that survive the filter. A direct ship edge is
    // redundant when a surviving group edge already joins the two groups the
    // ships sit in, so the direct edge is dropped in favour of the group one.
    var groupEdges = [];
    code.split(/\r?\n/).forEach(function (line) {
      var m = line.trim().match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|"([^"]*)"\|\s*)?([A-Za-z_]\w*)/);
      if (!m) return;
      var a = m[1], b = m[3], label = m[2] || "";
      if (graph.clusters[a] === undefined || graph.clusters[b] === undefined) return;
      if (exactType && label !== labelFilter) return;
      if (needed[a] && needed[b]) groupEdges.push([a, b]);
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

    /* Ships whose connection is expressed at group level: several ship-to-ship
       edges that all run between the same two subgraphs collapse into a single
       group edge, so every isolated view stays readable however it is filtered.
       The label is the source subgroup's name when the edges agree on it, and
       otherwise the most common edge label. */
    var shipGroups = Object.create(null); // "srcGroup\tdstGroup" -> { src, dst, labels, count }
    code.split(/\r?\n/).forEach(function (line) {
      var m = line.trim().match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|"([^"]*)"\|\s*)?([A-Za-z_]\w*)/);
      if (!m) return;
      var a = m[1], b = m[3];
      if (graph.clusters[a] !== undefined || graph.clusters[b] !== undefined) return;
      var label = m[2] || "";
      if (exactType && label !== labelFilter) return;
      if (!visible[a] || !visible[b] || coveredByGroup(a, b)) return;
      var src = deepestCluster(a), dst = deepestCluster(b);
      if (!src || !dst || src === dst) return;
      if (clusterContains(src, dst) || clusterContains(dst, src)) return;
      var key = src + "\t" + dst;
      var g = shipGroups[key] || (shipGroups[key] = { src: src, dst: dst, labels: Object.create(null), count: 0 });
      g.count++;
      g.labels[label] = (g.labels[label] || 0) + 1;
    });

    var mergedGroups = Object.create(null); // "srcGroup\tdstGroup" -> { src, dst, label }
    Object.keys(shipGroups).forEach(function (key) {
      var g = shipGroups[key];
      if (g.count < 2) return;
      var name = displayNames[g.src] || "";
      var labels = Object.keys(g.labels).sort(function (x, y) {
        var xn = x === name ? 1 : 0, yn = y === name ? 1 : 0;
        if (xn !== yn) return yn - xn;
        return g.labels[y] - g.labels[x];
      });
      mergedGroups[key] = { src: g.src, dst: g.dst, label: labels[0] || "" };
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

      var edge = s.match(/^([A-Za-z_]\w*)\s*(?:==>|-->|-\.->)\s*(?:\|"([^"]*)"\|\s*)?([A-Za-z_]\w*)/);
      if (edge) {
        var a = edge[1], b = edge[3], label = edge[2] || "";
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
          if (keep) {
            var src = deepestCluster(a), dst = deepestCluster(b);
            if (src && dst && mergedGroups[src + "\t" + dst]) keep = false;
          }
        }
        if (keep && exactType && label !== labelFilter) keep = false;
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

    Object.keys(mergedGroups).forEach(function (key) {
      var g = mergedGroups[key];
      out.push("\t" + g.src + " ==>|" + JSON.stringify(g.label) + "| " + g.dst);
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
    if (selectedEdge) paintEdgeHighlight(findEdgePathId(selectedEdge.src, selectedEdge.dst));
  }

  /* Mark every ship that needs an Omega clone: a distinct outline plus a small
     "Ω" in the corner of the hull, so the restriction is visible without
     hovering. The list is static (assets/omega-ships.js), so this only tags
     the nodes Mermaid just rendered. */
  function markOmegaShips() {
    if (!domIndex) return;
    domIndex.nodes.forEach(function (item) {
      if (!omegaShips[item.id]) return;
      item.el.classList.add("ship-omega");
      if (item.el.querySelector(".omega-badge")) return;
      var shape = item.el.querySelector("rect, polygon, circle, ellipse");
      var box;
      try { box = (shape || item.el).getBBox(); } catch (e) { return; }
      if (!box || !box.width) return;
      var badge = document.createElementNS(SVG_NS, "text");
      badge.setAttribute("class", "omega-badge");
      badge.setAttribute("x", box.x + box.width - 4);
      badge.setAttribute("y", box.y + 14);
      badge.setAttribute("text-anchor", "end");
      badge.textContent = "Ω";
      item.el.appendChild(badge);
    });
  }

  var SSO_POPUP_KEY = "eve.sso.popup.v1";
  /* Add flyable / locked styling to every rendered ship node. Kept separate
     from the Omega badge so a signed-in pilot sees their options at a glance. */
  function markFlyability() {
    if (!sso.session || !domIndex) return;
    var active = !!document.getElementById("fly-highlight") && sso.highlightFlyable;
    domIndex.nodes.forEach(function (item) {
      item.el.classList.remove("ship-flyable");
      item.el.classList.remove("ship-locked");
      if (!active) return;
      if (sso.flyable && sso.flyable[item.id]) item.el.classList.add("ship-flyable");
      else if (shipSkills[item.id]) item.el.classList.add("ship-locked");
      // ships with no recorded requirements stay unstyled
    });
  }

  /* Rebuild the chart showing only ships the character can fly. */
  function requestFlyableView() {
    var visible = Object.create(null);
    Object.keys(sso.flyable || {}).forEach(function (id) {
      if (graph.nodes[id]) visible[id] = true;
    });
    var keys = Object.keys(visible);
    if (!keys.length) {
      // Nothing flyable yet: keep the full chart so the locked state is visible.
      restoreFullChart();
      return;
    }
    selectedId = null;
    selectedEdge = null;
    selectedType = null;
    highlightedEdgeId = null;
    syncComboValues();
    requestView({ code: buildFilteredCode(baseCode, visible, null), full: false, selectedId: null });
  }

  /* Clear the flyable filter, the edge filter and any isolation: the regular
     "back to the full chart" path. */
  function restoreFullChart() {
    selectedId = null;
    selectedEdge = null;
    selectedType = null;
    highlightedEdgeId = null;
    syncComboValues();
    requestView({ code: baseCode, full: true, selectedId: null });
  }

  function ssoRedirectUri() {
    return ssoConfig.redirect_uri || (location.origin + location.pathname);
  }

  /* --- PKCE helpers (RFC 7636) -------------------------------------------
     EVE SSO supports the Authorization Code flow and the Authorization Code
     flow with PKCE; it does NOT support the implicit flow (`response_type=
     token`), which older builds of this page used. PKCE needs no Client
     Secret, so it still runs entirely in the browser. */
  function ssoRandomBytes(n) {
    var buf = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf);
    else for (var i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
    return buf;
  }
  function base64Url(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function createCodeVerifier() { return base64Url(ssoRandomBytes(32)); }
  function ssoRandomState() { return base64Url(ssoRandomBytes(16)); }
  function createCodeChallenge(verifier) {
    // crypto.subtle needs a secure context: https (GitHub Pages) or localhost.
    if (!(window.crypto && crypto.subtle && crypto.subtle.digest)) {
      return Promise.reject(new Error("EVE login needs a secure context (https or localhost)"));
    }
    var data = new TextEncoder().encode(verifier);
    return crypto.subtle.digest("SHA-256", data).then(function (digest) {
      return base64Url(new Uint8Array(digest));
    });
  }

  /* The verifier + state are kept for the round trip; the popup/reload reads
     them back to prove the returned code belongs to the login we started. */
  function readPkceState() {
    try { return JSON.parse(sessionStorage.getItem(SSO_POPUP_KEY) || "null"); } catch (e) { return null; }
  }
  function clearPkceState() {
    try { sessionStorage.removeItem(SSO_POPUP_KEY); } catch (e) {}
  }

  /* POST a form-encoded body to EVE's token endpoint. That endpoint answers
     cross-origin requests (Access-Control-Allow-Origin: *), so the whole flow
     works from the browser without any backend. Resolves with the token
     response, or rejects with EVE's own error text. */
  function postTokenRequest(fields) {
    return fetch(EVE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString()
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data.access_token) {
          throw new Error(data.error_description || data.error || ("HTTP " + res.status));
        }
        return data;
      });
    });
  }

  /* Exchange the authorization code for an access token (PKCE, no secret). */
  function exchangeCodeForToken(code, verifier) {
    return postTokenRequest({
      grant_type: "authorization_code",
      code: code,
      client_id: ssoConfig.client_id,
      code_verifier: verifier
    }).catch(function (err) {
      throw new Error("EVE token exchange failed: " + err.message);
    });
  }

  /* Swap a stored refresh token for a fresh access token (no secret needed). */
  function refreshAccessToken(refreshToken) {
    return postTokenRequest({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ssoConfig.client_id
    }).then(function (data) {
      return sessionFromToken(data.access_token, data.refresh_token || refreshToken);
    }).catch(function (err) {
      throw new Error("EVE token refresh failed: " + err.message);
    });
  }

  function decodeIdToken(jwt) {
    var part = jwt.split(".")[1];
    if (!part) return null;
    try {
      var base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      var json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  /* Set `flyable` from the character's skill levels. A ship is flyable when
     the pilot holds every required skill at or above its level; the cloaking /
     Omega distinction is already baked into those levels by EVE. */
  function computeFlyable(skills) {
    var out = Object.create(null);
    Object.keys(shipSkills).forEach(function (id) {
      var req = shipSkills[id];
      var ok = true;
      for (var i = 0; i < req.length; i++) {
        var need = req[i];
        if ((skills[need[0]] || 0) < need[1]) { ok = false; break; }
      }
      if (ok) out[id] = true;
    });
    return out;
  }

  function fetchCharacterSkills(session) {
    return fetch(EVE_ESI + "latest/characters/" + session.charId + "/skills/?datasource=tranquility", {
      headers: { Authorization: "Bearer " + session.accessToken }
    }).then(function (res) {
      if (res.status === 401) {
        var err = new Error("Session expired");
        err.status = 401;
        throw err;
      }
      if (!res.ok) throw new Error("ESI returned HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.skills)) return null;
      var map = Object.create(null);
      data.skills.forEach(function (skill) {
        map[skill.skill_id] = skill.active_skill_level;
      });
      return map;
    });
  }

  function saveSsoSession(session) {
    sso.session = session;
    try { localStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(session)); } catch (e) {}
    sso.flyable = computeFlyable(session.skills || {});
  }

  function clearSsoSession() {
    sso.session = null;
    sso.flyable = null;
    sso.filterFlyable = false;
    try { localStorage.removeItem(SSO_STORAGE_KEY); } catch (e) {}
  }

  /* Apply the signed-in / signed-out toolbar state and flyability highlight.
     The single button reads "Sign in with EVE" when signed out and "Logout"
     when signed in; the character name (when known) sits beside it. */
  function applySsoUi(message) {
    var loginBtn = document.getElementById("sso-login");
    var nameEl = document.getElementById("sso-name");
    var flyctl = document.getElementById("flyctl");
    var menu = document.getElementById("sso-menu");
    var signedIn = !!sso.session;
    if (loginBtn) {
      loginBtn.hidden = !ssoConfig.client_id;
      loginBtn.textContent = signedIn ? "Logout" : "Sign in with EVE";
    }
    if (nameEl) {
      nameEl.hidden = !signedIn || !sso.session.charName;
      nameEl.textContent = signedIn ? (sso.session.charName || "") : "";
    }
    if (flyctl) flyctl.hidden = !signedIn;
    if (flyctl) {
      var filter = document.getElementById("fly-filter");
      var hl = document.getElementById("fly-highlight");
      if (filter) filter.checked = sso.filterFlyable;
      if (hl) hl.checked = !sso.filterFlyable;
    }
    if (menu) menu.hidden = true;
    if (message) showSsoMessage(message);
    markFlyability();
  }

  /* Sign the pilot out: forget the session and drop the flyability view. */
  function logout() {
    clearSsoSession();
    sso.filterFlyable = false;
    sso.highlightFlyable = true;
    applySsoUi(null);
    restoreFullChart();
  }

  function showSsoMessage(msg) {
    var menu = document.getElementById("sso-menu");
    if (!menu) return;
    menu.textContent = "";
    var li = document.createElement("li");
    li.className = "sso-error";
    li.textContent = msg;
    menu.appendChild(li);
    menu.hidden = false;
    // let the error clear itself but keep the dropdown dismissible
    setTimeout(function () {
      if (menu.querySelector(".sso-error") && menu.childNodes.length === 1) menu.hidden = true;
    }, 4000);
  }

  /* Build the in-memory session from the token response. EVE returns a JWT
     access token whose `sub` is `CHARACTER:EVE:<id>` and whose `name` is the
     character name — there is no separate `id_token` to decode. */
  function sessionFromToken(accessToken, refreshToken) {
    if (!accessToken) throw new Error("EVE login returned no access token");
    var payload = decodeIdToken(accessToken);
    if (!payload) throw new Error("Could not read the EVE token");
    var charId = String(payload.sub || "").split(":").pop();
    if (!charId) throw new Error("EVE token does not identify a character");
    var charName = payload.name || ("Character " + charId);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken || null,
      charId: charId,
      charName: charName,
      exp: payload.exp ? payload.exp * 1000 : (Date.now() + 20 * 60 * 1000),
      skills: null
    };
  }

  /* Called once the token has been obtained, from either the popup relay or a
     same-window redirect. Fetches skills, saves the session and updates UI. */
  function completeLogin(session) {
    applySsoUi("Fetching skills…");
    fetchCharacterSkills(session).then(function (skills) {
      if (skills) session.skills = skills;
      saveSsoSession(session);
      sso.filterFlyable = false;
      sso.highlightFlyable = true;
      applySsoUi(null);
      // if a flyable-only view was requested through the URL, honour it
      var q = new URLSearchParams(location.search);
      if (q.get("fly") === "1") setFlyMode("filter");
      else markFlyability();
    }).catch(function (err) {
      applySsoUi(err && err.status === 401
        ? "EVE session expired — sign in again"
        : "Could not load skills: " + (err && err.message ? err.message : "unknown error"));
    });
  }

  /* The two flyability views are mutually exclusive (a radio group): "filter"
     narrows the chart to ships the character can fly, "highlight" colours the
     full chart. Switching rebuilds the diagram so the change is visible. */
  function setFlyMode(mode) {
    var filter = mode === "filter";
    sso.filterFlyable = filter;
    sso.highlightFlyable = !filter;
    var filterInput = document.getElementById("fly-filter");
    var hlInput = document.getElementById("fly-highlight");
    if (filterInput) filterInput.checked = filter;
    if (hlInput) hlInput.checked = !filter;
    if (filter) {
      if (sso.session && sso.flyable) requestFlyableView();
    } else {
      restoreFullChart();
    }
  }

  function wireSso() {
    var loginBtn = document.getElementById("sso-login");
    var menu = document.getElementById("sso-menu");
    var flyctl = document.getElementById("flyctl");

    if (ssoConfig.client_id && loginBtn) loginBtn.hidden = false;

    if (loginBtn) loginBtn.addEventListener("click", function () {
      if (sso.session) { logout(); return; }
      if (!ssoConfig.client_id) { showSsoMessage("EVE SSO is not configured — set a Client ID in assets/config.js"); return; }
      startSsoProcess();
    });

    // The active browser window acts as the relay: it keeps a listener open
    // (see listenForPopup) while the EVE popup does the redirect dance.
    function startSsoProcess() {
      var verifier = createCodeVerifier();
      createCodeChallenge(verifier).then(function (challenge) {
        var state = ssoRandomState();
        try {
          sessionStorage.setItem(SSO_POPUP_KEY, JSON.stringify({
            verifier: verifier, state: state, origin: location.origin
          }));
        } catch (e) { /* private mode */ }
        var params = new URLSearchParams({
          response_type: "code",
          client_id: ssoConfig.client_id,
          redirect_uri: ssoRedirectUri(),
          scope: ssoConfig.scope,
          state: state,
          code_challenge: challenge,
          code_challenge_method: "S256"
        });
        var authUrl = EVE_AUTH + "?" + params.toString();
        var w = null;
        try { w = window.open(authUrl, "eve_sso", "width=520,height=720"); } catch (e) {}
        if (!w) location.assign(authUrl); // popup blocked: same-window fallback
      }).catch(function (err) {
        applySsoUi(err && err.message ? err.message : "EVE login could not start");
      });
    }

    // The two views are a radio group, so one "change" listener covers both.
    if (flyctl) flyctl.addEventListener("change", function (e) {
      if (e.target && e.target.name === "fly-mode") setFlyMode(e.target.value);
    });
    // Clicking elsewhere dismisses the SSO message popup.
    document.addEventListener("click", function (e) {
      if (menu && !menu.hidden && !(e.target.closest && e.target.closest("#sso"))) menu.hidden = true;
    });
  }

  /* Turn a returned authorization code into a session and load the skills. */
  function exchangeAndFinish(code) {
    var stored = readPkceState();
    if (!stored || !stored.verifier) {
      applySsoUi("EVE login could not be completed — please try again");
      return;
    }
    exchangeCodeForToken(code, stored.verifier).then(function (data) {
      clearPkceState();
      completeLogin(sessionFromToken(data.access_token, data.refresh_token));
    }).catch(function (err) {
      console.error("[EVE SSO] token exchange failed", err);
      applySsoUi(err && err.message ? err.message : "EVE login failed");
    });
  }

  /* Relay messages sent by the EVE SSO popup once EVE redirects back to this
     page inside it. The popup closes itself; here we take the code and finish
     the login in this (the opener) window. */
  function listenForPopup() {
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || data.type !== "eve_sso") return;
      if (event.origin !== location.origin) return; // only trust our own origin
      var stored = readPkceState();
      if (!stored || stored.state !== data.state) return; // stale / wrong popup
      if (data.error) {
        console.error("[EVE SSO] authorize error", data.error, data.error_description);
        clearPkceState();
        applySsoUi("EVE login failed: " + (data.error_description || data.error));
        return;
      }
      exchangeAndFinish(data.code);
    });
  }

  /* Handle the same-window redirect fallback (popup blocked). EVE returns the
     app to `?code=...&state=...` in the query string. */
  function handleCodeLogin() {
    var q = new URLSearchParams(location.search);
    if (!q.has("code") && !q.has("error")) return false;
    var stored = readPkceState();
    var state = q.get("state");
    // Drop the OAuth params from the address bar but keep anything else.
    ["code", "state", "error", "error_description"].forEach(function (k) { q.delete(k); });
    var rest = q.toString();
    history.replaceState(null, "", location.pathname + (rest ? "?" + rest : ""));
    if (q.get("error")) {
      console.error("[EVE SSO] authorize error", q.get("error"), q.get("error_description"));
      clearPkceState();
      applySsoUi("EVE login failed: " + (q.get("error_description") || q.get("error")));
      return true;
    }
    if (!stored || stored.state !== state) {
      applySsoUi("EVE login could not be verified — please try again");
      return true;
    }
    exchangeAndFinish(q.get("code"));
    return true;
  }

  /* Run only inside the popup that EVE redirects to after a login attempt:
     hand the code (or the error) back to the window that opened us, close up. */
  function handlePopupReturn() {
    if (!window.opener || window.opener === window) return false;
    var q = new URLSearchParams(location.search);
    if (!q.has("code") && !q.has("error")) return false;
    var stored = readPkceState();
    var payload = {
      type: "eve_sso",
      state: q.get("state"),
      code: q.get("code"),
      error: q.get("error"),
      error_description: q.get("error_description")
    };
    try { window.opener.postMessage(payload, (stored && stored.origin) || "*"); } catch (e) {}
    clearPkceState();
    window.close();
    return true;
  }

  /* Restore a saved session from localStorage at boot. */
  function restoreSsoSession(cb) {
    var raw = null;
    try { raw = localStorage.getItem(SSO_STORAGE_KEY); } catch (e) {}
    if (!raw) { cb(false); return; }
    var session = null;
    try { session = JSON.parse(raw); } catch (e) {}
    if (!session || !session.accessToken || !session.charId) { cb(false); return; }
    // Access token still valid: use it as-is.
    if (!session.exp || session.exp > Date.now() + 30000) {
      saveSsoSession(session);
      cb(true);
      return;
    }
    // Expired: silently refresh using the stored refresh token, if we have one.
    if (!session.refreshToken) { clearSsoSession(); cb(false); return; }
    refreshAccessToken(session.refreshToken).then(function (fresh) {
      fresh.skills = session.skills || null; // keep last known skills until re-fetched
      saveSsoSession(fresh);
      cb(true);
    }).catch(function () { clearSsoSession(); cb(false); });
  }

  /* Brighten one rendered edge's line and label. */
  function paintEdgeHighlight(id) {
    if (!domIndex || !id) return;
    var path = domIndex.pathByEdgeId[id];
    var label = domIndex.labelByEdgeId[id];
    if (path) path.classList.add("edge-selected");
    if (label) label.classList.add("edge-selected");
  }

  /* Recompute the in-place edge highlight on the layer that is already shown,
     without rebuilding the diagram (highlight mode). */
  function refreshEdgeHighlight() {
    if (!domIndex || !svgEl) return;
    collect(svgEl, "path.edge-selected, g.edgeLabel.edge-selected").forEach(function (el) {
      el.classList.remove("edge-selected");
    });
    paintEdgeHighlight(highlightedEdgeId);
  }

  /* Find the rendered edge joining two source endpoints, so the highlight can
     follow the selected connection into the rebuilt diagram. */
  function findEdgePathId(src, dst) {
    if (!domIndex) return null;
    for (var id in domIndex.pathByEdgeId) {
      var ends = edgeEndpoints(id);
      if (!ends) continue;
      if ((ends[0] === src && ends[1] === dst) || (ends[0] === dst && ends[1] === src)) return id;
    }
    return null;
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
    // svg-pan-zoom updates its own zoom state synchronously but writes the DOM
    // transform on the next animation frame. Right after a programmatic zoom
    // getScreenCTM can therefore still report the previous scale, which would
    // leave the edges sized for the old view. Trust the library's live zoom for
    // the svg it controls and fall back to measuring the rendered transform.
    if (panZoom && panZoomSvg === svgEl) {
      try { scale = panZoom.getSizes().realZoom || 1; } catch (e) { scale = 1; }
    } else if (sample.getScreenCTM) {
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

  /* Clicking an edge does one of two things, set by the Filter / Highlight
     radio group. In filter mode it narrows the diagram to the clicked edge's
     connection type: only links that share its label survive, so a "Tackle"
     click leaves nothing but Tackle and a "Projectile turrets" click nothing
     but Projectile turrets; clicking the same edge again restores the full
     chart. In highlight mode it just marks that one link in place, leaving the
     diagram untouched. The label is read from the rendered edge, which is
     reliable for group edges and for edges that only exist in a filtered view. */
  function selectEdge(edgeId) {
    if (!graph || !domIndex) return;
    var ends = edgeEndpoints(edgeId);
    if (!ends) return;

    if (!filterOnEdgeClick) {
      // Highlight mode: toggle that exact link in place, no rebuild.
      highlightedEdgeId = highlightedEdgeId === edgeId ? null : edgeId;
      refreshEdgeHighlight();
      return;
    }

    if (selectedEdge && sameEnds(selectedEdge, ends)) { clearSelection(); return; }
    captureFullView();
    var label = renderedEdgeLabel(edgeId);
    var seeds = endpointNodes(ends[0]).concat(endpointNodes(ends[1]));
    var visible = sameTypeComponent(seeds, label);
    if (!Object.keys(visible).length) return;
    highlightedEdgeId = null;
    selectedId = null;
    selectedType = null;
    selectedEdge = { src: ends[0], dst: ends[1], label: label };
    syncComboValues();
    requestView({
      code: buildFilteredCode(baseCode, visible, label),
      full: false,
      selectedId: null,
      edgeFilter: true
    });
  }

  function sameEnds(sel, ends) {
    return (sel.src === ends[0] && sel.dst === ends[1]) ||
           (sel.src === ends[1] && sel.dst === ends[0]);
  }

  /* Filter the whole chart to one connection type chosen from the combobox:
     every ship joined by a direct or group connection of that type is kept,
     and every other edge is dropped. Unlike an edge click this is not tied to
     one component, so a "Tackle" pick shows every Tackle connection at once. */
  function selectEdgeType(label) {
    if (!label || (selectedType === label && !selectedEdge)) return;
    captureFullView();
    highlightedEdgeId = null;
    selectedId = null;
    selectedEdge = null;
    selectedType = label;
    syncComboValues();
    var visible = nodesForLabel(label);
    if (!Object.keys(visible).length) { selectedType = null; syncComboValues(); return; }
    requestView({
      code: buildFilteredCode(baseCode, visible, label),
      full: false,
      selectedId: null,
      edgeFilter: true
    });
  }

  function renderedEdgeLabel(edgeId) {
    var labelEl = domIndex && domIndex.labelByEdgeId[edgeId];
    return labelEl ? edgeLabelText(labelEl) : "";
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
    panZoomSvg = null;
    if (!window.svgPanZoom) return;
    panZoom = svgPanZoom(svg, {
      controlIconsEnabled: false,
      fit: true,
      center: true,
      // Zoom is relative to the fit of the whole diagram: 1 shows all of it,
      // so there is nothing smaller to reach and no reason to allow it.
      minZoom: 1,
      maxZoom: 16,
      zoomScaleSensitivity: 0.25,
      dblClickZoomEnabled: false,
      mouseWheelZoomEnabled: true,
      // Drag panning is handled in wirePan so a held button keeps panning even
      // after the pointer leaves the canvas. The library's own drag would stop
      // at the SVG edge (its mouseleave handler ends the gesture).
      panEnabled: false,
      onZoom: onViewChanged,
      onPan: onViewChanged,
      beforePan: clampPan,
      // Fires once the new CTM has actually been applied, which onZoom/onPan
      // do not guarantee: keeps the minimap box from lagging a step behind and
      // pulls programmatic pans (focus, fit, restore) back inside the bounds.
      onUpdatedCTM: handleCTM
    });
    panZoomSvg = svg;
    updateHitWidth();
    updateMinimapView();
  }

  /* Pan/zoom moved the view: refresh the edge hit widths and the minimap box. */
  function onViewChanged() {
    scheduleHitWidth();
    updateMinimapView();
  }

  /* Put a freshly rendered SVG on top of the current one and cross-fade. When
     `restoreView` is set, a full chart comes back with the pan/zoom the user
     had before filtering; otherwise it opens framed on the default group. */
  function applyView(markup, filtered, restoreView) {
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
    markOmegaShips();
    markFlyability();
    // Let the new layer take layout before initialising pan/zoom on it.
    svg.getBoundingClientRect();
    initPanZoom(svg);
    // Bounds for the pan clamp; measured from the new layer before it is framed.
    contentBounds = diagramBounds();
    // The full chart opens framed on the default group; isolated components are
    // left fitted to their own bounds.
    if (!filtered && !(restoreView && restoreFullView())) focusDefaultGroup();

    if (old) old.style.pointerEvents = "none";
    setupMinimap();
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
      applyView(svg, !!(req.selectedId || req.edgeFilter), !!req.restoreView);
      rendering = false;
      pump();
    }).catch(function (err) {
      rendering = false;
      fail("Could not draw the diagram: " + err.message);
    });
  }

  function selectShip(id) {
    if (!graph.nodes[id] || selectedId === id) return;
    captureFullView();
    highlightedEdgeId = null;
    selectedId = id;
    selectedEdge = null;
    selectedType = null;
    syncComboValues();
    var visible = connectedComponent(id);
    requestView({
      code: buildFilteredCode(baseCode, visible),
      full: false,
      selectedId: id
    });
  }

  function clearSelection() {
    if (!selectedId && !selectedEdge && !selectedType && !highlightedEdgeId) return;
    var wasFiltered = !!(selectedId || selectedEdge || selectedType);
    selectedId = null;
    selectedEdge = null;
    selectedType = null;
    highlightedEdgeId = null;
    syncComboValues();
    if (wasFiltered) {
      requestView({ code: baseCode, full: true, selectedId: null, restoreView: true });
    } else {
      // Highlight mode never rebuilt the chart, so just drop the in-place highlight.
      refreshEdgeHighlight();
    }
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

  /* Remember how the full chart is framed right now, so returning from a
     filtered view can put it back instead of snapping to the default group.
     Only the full chart is captured; filtering one view from another keeps the
     view that was current before the first filter. */
  function captureFullView() {
    if (!panZoom || selectedId || selectedEdge || selectedType) return;
    savedFullView = { zoom: panZoom.getZoom(), pan: panZoom.getPan() };
  }

  /* Re-apply the remembered full-chart framing. Returns false when there is
     nothing to restore, so the caller can fall back to the default group. */
  function restoreFullView() {
    if (!panZoom || !savedFullView) return false;
    panZoom.zoom(savedFullView.zoom);
    panZoom.pan(savedFullView.pan);
    scheduleHitWidth();
    return true;
  }

  /* ---- Minimap ---------------------------------------------------------
     A small picture of the whole diagram with a box around the region that is
     currently on screen. It is redrawn whenever a new diagram layer is built
     and only its box moves while panning or zooming. Dragging inside it
     re-centres the main view, so the wide chart can be navigated directly. */

  /* svg-pan-zoom moves the diagram by transforming a wrapper group instead of
     the svg's viewBox, so all coordinates here come from that group: its bbox
     is the diagram in its own units, and its CTM maps those units to the
     screen. */
  function pzViewportGroup(svg) {
    return svg && svg.querySelector ? svg.querySelector("g.svg-pan-zoom_viewport") : null;
  }

  /* Tight bounds of the diagram in its own units. */
  function diagramBounds() {
    var source = pzViewportGroup(svgEl) || svgEl;
    if (!source) return null;
    var bbox;
    try { bbox = source.getBBox(); } catch (e) { return null; }
    if (!bbox || !bbox.width || !bbox.height) return null;
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  }

  /* The region the viewport can move over — the diagram bounds with no extra
     margin, so the visible-area box reaches the minimap edges at the limits. */
  function movementBounds() {
    return diagramBounds();
  }

  /* Rebuild the minimap picture from the current SVG layer and fit the whole
     diagram into it. The minimap's viewBox is the diagram bounds, so the
     viewport rectangle is drawn directly in diagram units. */
  function setupMinimap() {
    if (!minimap || !minimapSvg) return;
    if (!minimapEnabled || !panZoom || !svgEl) { minimap.hidden = true; return; }
    var box = movementBounds();
    if (!box) { minimap.hidden = true; return; }
    minimap.hidden = false;
    minimapSvg.setAttribute("viewBox", box.x + " " + box.y + " " + box.width + " " + box.height);

    while (minimapSvg.firstChild) minimapSvg.removeChild(minimapSvg.firstChild);

    // Copy the diagram's contents into a plain group so they render in the
    // parent's diagram coordinates. The pan/zoom wrapper is stripped of its
    // transform (svg-pan-zoom writes it as both an attribute and an inline
    // style) so the copy shows the whole chart, not just the region on screen.
    // The group takes over the svg's id so Mermaid's id-scoped styles still
    // apply; only the minimap svg itself handles pointer events.
    var source = svgEl.cloneNode(true);
    var sourceViewport = pzViewportGroup(source);
    if (sourceViewport) {
      sourceViewport.removeAttribute("transform");
      sourceViewport.style.transform = "";
      if (!sourceViewport.getAttribute("style")) sourceViewport.removeAttribute("style");
    }
    var copy = document.createElementNS(SVG_NS, "g");
    copy.setAttribute("id", svgEl.id);
    copy.setAttribute("aria-hidden", "true");
    while (source.firstChild) copy.appendChild(source.firstChild);
    minimapSvg.appendChild(copy);

    minimapView = document.createElementNS(SVG_NS, "rect");
    minimapView.setAttribute("class", "minimap-view");
    minimapSvg.appendChild(minimapView);

    updateMinimapView();
  }

  /* The pan/zoom matrix as { a, d, e, f } (scale and translate; svg-pan-zoom
     never rotates). Read from computed style so it is current even on the same
     tick the transform was written, which getCTM is not. */
  function viewportMatrix() {
    var group = pzViewportGroup(svgEl);
    if (!group) return null;
    var value = window.getComputedStyle ? getComputedStyle(group).transform : "";
    if (value && value !== "none") {
      var m = value.match(/matrix\(([^)]+)\)/);
      if (m) {
        var v = m[1].split(",").map(function (n) { return parseFloat(n); });
        if (v.length === 6) return { a: v[0], d: v[3], e: v[4], f: v[5] };
      }
      var m3 = value.match(/matrix3d\(([^)]+)\)/);
      if (m3) {
        var v3 = m3[1].split(",").map(function (n) { return parseFloat(n); });
        if (v3.length === 16) return { a: v3[0], d: v3[5], e: v3[12], f: v3[13] };
      }
    }
    var ctm = group.getCTM ? group.getCTM() : null;
    return ctm ? { a: ctm.a, d: ctm.d, e: ctm.e, f: ctm.f } : null;
  }

  /* Move the viewport rectangle to match the region currently on screen. */
  function updateMinimapView() {
    if (!minimapView || !svgEl) return;
    var m = viewportMatrix();
    if (!m || !m.a || !m.d) return;
    var w = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 1;
    var h = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 1;
    minimapView.setAttribute("x", -m.e / m.a);
    minimapView.setAttribute("y", -m.f / m.d);
    minimapView.setAttribute("width", w / m.a);
    minimapView.setAttribute("height", h / m.d);
  }

  /* Keep the diagram reachable without letting it be dragged entirely off the
     screen. The viewport centre is allowed to reach any point of the content,
     so any ship can be centred at any zoom level — including when the whole
     chart is smaller than the viewport. The pan is limited to the range that
     keeps the viewport centre inside the content bounds. */
  function clampPan(oldPan, newPan) {
    if (!contentBounds || !svgEl || !panZoom) return newPan;
    var w = svgEl.clientWidth;
    var h = svgEl.clientHeight;
    var b = contentBounds;
    if (!w || !h || !b.width || !b.height) return newPan;
    // Scale from svg-pan-zoom's own state, not the rendered transform: the
    // transform lags a frame behind a programmatic zoom, which would make the
    // content look smaller than the viewport and wrongly re-centre it.
    var scale = Math.min(w / b.width, h / b.height) * panZoom.getZoom();
    if (!scale) return newPan;
    var minX = w / 2 - scale * (b.x + b.width);
    var maxX = w / 2 - scale * b.x;
    var minY = h / 2 - scale * (b.y + b.height);
    var maxY = h / 2 - scale * b.y;
    return {
      x: Math.min(maxX, Math.max(minX, newPan.x)),
      y: Math.min(maxY, Math.max(minY, newPan.y))
    };
  }

  /* After any view transform change, refresh the minimap box and pull the pan
     back inside the bounds. Programmatic pan()/zoom() calls skip beforePan, so
     this is what keeps framed and restored views tidy. */
  function handleCTM() {
    updateMinimapView();
    if (!panZoom || !contentBounds) return;
    var pan = panZoom.getPan();
    var clamped = clampPan(pan, pan);
    if (clamped && (Math.abs(clamped.x - pan.x) > 0.5 || Math.abs(clamped.y - pan.y) > 0.5)) {
      panZoom.pan(clamped);
    }
  }

  /* Centre the main view on a point in the minimap (given in screen pixels). */
  function panToMinimapPoint(clientX, clientY) {
    if (!panZoom || panZoomSvg !== svgEl || !minimapSvg || !minimapSvg.getScreenCTM || !svgEl.createSVGPoint) return;
    var ctm = minimapSvg.getScreenCTM();
    if (!ctm) return;
    var point = minimapSvg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    point = point.matrixTransform(ctm.inverse()); // diagram units

    // Where that diagram point sits on screen right now, and how far it must
    // move to reach the centre of the main viewport.
    var m = viewportMatrix();
    if (!m || !m.a || !m.d) return;
    var rect = svgEl.getBoundingClientRect();
    var dx = rect.left + rect.width / 2 - (rect.left + m.a * point.x + m.e);
    var dy = rect.top + rect.height / 2 - (rect.top + m.d * point.y + m.f);
    panZoom.panBy({ x: dx, y: dy });
    scheduleHitWidth();
    updateMinimapView();
  }

  function wireMinimap() {
    if (!minimapSvg) return;
    minimapSvg.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || !panZoom) return;
      minimapDragging = true;
      if (minimapSvg.setPointerCapture) {
        try { minimapSvg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      panToMinimapPoint(e.clientX, e.clientY);
      e.preventDefault();
    });
    minimapSvg.addEventListener("pointermove", function (e) {
      if (!minimapDragging) return;
      panToMinimapPoint(e.clientX, e.clientY);
    });
    var stop = function () { minimapDragging = false; };
    minimapSvg.addEventListener("pointerup", stop);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function setMinimapEnabled(on) {
    minimapEnabled = !!on;
    var toggle = document.getElementById("minimap-toggle");
    if (toggle) toggle.setAttribute("aria-pressed", minimapEnabled ? "true" : "false");
    if (minimapEnabled) setupMinimap();
    else if (minimap) minimap.hidden = true;
  }

  /* A filterable combobox: a text input plus a dropdown list. Typing narrows
     the options; Arrow Up/Down move the highlight, Enter picks, Escape closes.
     `config.options()` returns [{ id, label }] and `config.onPick(id)` receives
     the chosen id. The same widget backs the ship picker and the connection-type
     picker. */
  var shipCombo = null;
  var edgeCombo = null;

  function comboName(id) { return displayNames[id] || id; }

  function createCombobox(input, list, config) {
    if (!input || !list) return null;
    var options = []; // [{ id, label, el }]
    var active = -1;  // index of the keyboard-highlighted option
    var open = false;

    function build() {
      options = config.options().map(function (o, i) {
        var li = document.createElement("li");
        li.className = "ship-option";
        if (o.omega) li.classList.add("is-omega");
        li.id = config.idPrefix + i;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        li.dataset.value = o.id;
        li.textContent = o.label;
        o.el = li;
        return o;
      });
    }

    function matches() {
      var q = input.value.trim().toLowerCase();
      if (!q) return options.slice();
      return options.filter(function (o) {
        return o.label.toLowerCase().indexOf(q) !== -1;
      });
    }

    function render(matched) {
      list.textContent = "";
      if (!matched.length) {
        var empty = document.createElement("li");
        empty.className = "ship-option-empty";
        empty.textContent = config.emptyText || "No matches";
        list.appendChild(empty);
        return;
      }
      matched.forEach(function (o) { list.appendChild(o.el); });
    }

    function visibleOptions() {
      return collect(list, ".ship-option");
    }

    function openList() {
      if (open) return;
      open = true;
      input.setAttribute("aria-expanded", "true");
      list.hidden = false;
    }

    function closeList() {
      if (!open) return;
      open = false;
      input.setAttribute("aria-expanded", "false");
      list.hidden = true;
      setActive(-1);
    }

    function setActive(index) {
      active = index;
      visibleOptions().forEach(function (el, i) {
        var isActive = i === index;
        el.classList.toggle("is-active", isActive);
        if (isActive) {
          input.setAttribute("aria-activedescendant", el.id);
          if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
        }
      });
      if (index < 0) input.removeAttribute("aria-activedescendant");
    }

    function refresh() {
      render(matches());
      openList();
      setActive(-1);
    }

    function choose(optionEl) {
      if (!optionEl) return;
      var id = optionEl.dataset.value;
      input.value = optionEl.textContent;
      closeList();
      input.blur();
      config.onPick(id);
    }

    // Focusing opens the full list and selects the current value, so a new
    // query can be typed straight away.
    input.addEventListener("focus", function () {
      input.select();
      render(options);
      openList();
      setActive(-1);
    });
    input.addEventListener("input", refresh);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) { refresh(); return; }
        var opts = visibleOptions();
        if (!opts.length) return;
        var next = active + (e.key === "ArrowDown" ? 1 : -1);
        if (next < 0) next = opts.length - 1;
        if (next >= opts.length) next = 0;
        setActive(next);
      } else if (e.key === "Enter") {
        if (!open) return;
        var opts = visibleOptions();
        var target = active >= 0 ? opts[active] : null;
        if (!target) {
          // No arrow-key highlight yet: accept an exact match, or the only
          // remaining option, so typing a full value and pressing Enter works.
          var typed = input.value.trim().toLowerCase();
          target = opts.filter(function (el) {
            return el.textContent.trim().toLowerCase() === typed;
          })[0] || (opts.length === 1 ? opts[0] : null);
        }
        if (target) { e.preventDefault(); choose(target); }
      } else if (e.key === "Escape") {
        if (open) { e.preventDefault(); closeList(); }
      }
    });
    // Pick on click, not mousedown: hiding the list on mousedown removes the
    // option from under the cursor, so the trailing click would land on the
    // graph behind the toolbar and be read as "click background" (resetting the
    // view). Keeping the list up until click makes the option the click target.
    list.addEventListener("click", function (e) {
      var optionEl = e.target.closest ? e.target.closest(".ship-option") : null;
      if (!optionEl) return;
      e.preventDefault();
      e.stopPropagation();
      choose(optionEl);
    });
    document.addEventListener("mousedown", function (e) {
      if (!e.target.closest || !e.target.closest(config.scopeSelector)) closeList();
    });

    build();

    return {
      /* Mirror an external selection: show `label` and flag the matching option. */
      setValue: function (id, label) {
        input.value = label || "";
        options.forEach(function (o) {
          o.el.setAttribute("aria-selected", o.id === id ? "true" : "false");
        });
      }
    };
  }

  /* Every distinct connection type in the chart, e.g. "Projectile turrets",
     "Scan" or "Tackle". Group paths are not part of a label, so only the bonus
     type or playstyle shows up here. */
  var connectionTypeCache = null;
  function connectionTypes() {
    if (!connectionTypeCache) {
      var seen = Object.create(null);
      parseRawEdges(baseCode).forEach(function (e) {
        var label = (e.label || "").trim();
        if (label) seen[label] = true;
      });
      connectionTypeCache = Object.keys(seen).sort(function (a, b) {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
    }
    return connectionTypeCache;
  }

  function wireComboboxes() {
    shipCombo = createCombobox(document.getElementById("ship-input"), document.getElementById("ship-list"), {
      idPrefix: "ship-option-",
      scopeSelector: ".ship-select",
      emptyText: "No ships found",
      options: function () {
        return Object.keys(graph.nodes)
          .map(function (id) {
            return { id: id, label: comboName(id), omega: !!omegaShips[id] };
          })
          .sort(function (a, b) {
            return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
          });
      },
      onPick: function (id) { if (selectedId !== id) selectShip(id); }
    });

    edgeCombo = createCombobox(document.getElementById("edge-input"), document.getElementById("edge-list"), {
      idPrefix: "edge-option-",
      scopeSelector: ".edge-select",
      emptyText: "No connection types found",
      options: function () {
        return connectionTypes().map(function (label) { return { id: label, label: label }; });
      },
      onPick: selectEdgeType
    });
  }

  /* Keep both comboboxes in step with the chart's current selection, however it
     was made (diagram click, picker, reset). */
  function syncComboValues() {
    if (shipCombo) shipCombo.setValue(selectedId, selectedId ? comboName(selectedId) : "");
    var type = selectedEdge ? selectedEdge.label : selectedType;
    if (edgeCombo) edgeCombo.setValue(type, type || "");
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

  /* Drag to pan, driven by pointer events with pointer capture. svg-pan-zoom
     ends its own drag as soon as the cursor leaves the SVG, so the view stops
     following the pointer at the canvas edge. Capturing the pointer keeps the
     gesture alive anywhere on the page (and outside the window) until the
     button is released. Capture starts only once the drag leaves a small
     threshold, so a plain click still reaches nodes and edges normally. */
  var panDrag = null;

  function wirePan() {
    viewport.addEventListener("pointerdown", function (e) {
      if (!panZoom || panDrag) return;
      // Left and right button; touch and pen report button 0.
      if (e.button !== 0 && e.button !== 2) return;
      // The minimap runs its own drag-to-jump gesture.
      if (e.target && e.target.closest && e.target.closest("#minimap")) return;
      panDrag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPan: panZoom.getPan(),
        captured: false
      };
    });

    viewport.addEventListener("pointermove", function (e) {
      if (!panDrag || e.pointerId !== panDrag.pointerId || !panZoom) return;
      var dx = e.clientX - panDrag.startX;
      var dy = e.clientY - panDrag.startY;
      if (!panDrag.captured) {
        // Wait until it is clearly a drag, so a click is not turned into one.
        if (Math.abs(dx) + Math.abs(dy) <= 3) return;
        panDrag.captured = true;
        if (viewport.setPointerCapture) {
          try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
      }
      panZoom.pan({ x: panDrag.startPan.x + dx, y: panDrag.startPan.y + dy });
    });

    function endPan(e) {
      if (!panDrag || (e && e.pointerId !== panDrag.pointerId)) return;
      if (panDrag.captured && viewport.releasePointerCapture) {
        try { viewport.releasePointerCapture(panDrag.pointerId); } catch (err) { /* ignore */ }
      }
      panDrag = null;
    }
    // The window listeners catch a release outside the viewport even when the
    // pointer was never captured (it left before passing the drag threshold).
    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);
    window.addEventListener("pointerup", endPan);
    window.addEventListener("pointercancel", endPan);
  }

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

    // A right-button drag pans the diagram (see wirePan), so suppress the
    // browser context menu over it; the toolbar keeps its normal menu.
    viewport.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });

    document.addEventListener("click", function (e) {
      if (movedFar) { pointerDown = null; return; }
      pointerDown = null;
      var target = e.target;

      // Clicks in the minimap pan the view; they must not reset the selection.
      if (target && target.closest && target.closest("#minimap")) return;

      // Edges are checked first: clicking one highlights it and narrows the
      // chart to its connection type.
      var edgeId = edgeIdFromTarget(target);
      if (edgeId) { selectEdge(edgeId); return; }

      var nodeGroup = target && target.closest ? target.closest("g.node") : null;
      if (nodeGroup) {
        var id = nodeIdFromDom(nodeGroup);
        if (id && graph.nodes[id]) {
          if (selectedId === id) clearSelection();
          else selectShip(id);
          return;
        }
      }
      // Clicks in the toolbar (ship picker, zoom, download) should not reset the view.
      if (target && target.closest && target.closest(".topbar")) return;
      if (selectedId || selectedEdge) clearSelection();
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
      // Reset means "back to the default view": forget any remembered framing,
      // drop the isolated ship and frame the default group on the full chart.
      savedFullView = null;
      highlightedEdgeId = null;
      if (sso.filterFlyable) {
        setFlyMode("highlight");
        return;
      }
      if (selectedId || selectedEdge || selectedType) {
        selectedId = null;
        selectedEdge = null;
        selectedType = null;
        syncComboValues();
        requestView({ code: baseCode, full: true, selectedId: null });
        return;
      }
      refreshEdgeHighlight();
      if (!panZoom) return;
      if (!focusDefaultGroup()) { panZoom.resetZoom(); panZoom.center(); scheduleHitWidth(); }
    });
    document.getElementById("download").addEventListener("click", downloadSvg);
    document.getElementById("minimap-toggle").addEventListener("click", function () {
      setMinimapEnabled(!minimapEnabled);
    });
    window.addEventListener("resize", function () {
      if (!panZoom) return;
      panZoom.resize(); panZoom.fit(); panZoom.center();
      if (!selectedId && focusDefaultGroup()) { updateMinimapView(); return; }
      scheduleHitWidth();
      updateMinimapView();
    });

    // Choose what clicking an edge does. Switching modes drops the current
    // selection so the two kinds of highlight never linger out of step.
    collect(document, 'input[name="edge-mode"]').forEach(function (radio) {
      if (radio.checked) filterOnEdgeClick = radio.value === "filter";
      radio.addEventListener("change", function () {
        if (!radio.checked) return;
        filterOnEdgeClick = radio.value === "filter";
        clearSelection();
      });
    });
  }

  function boot(code) {
    // Inside the EVE SSO popup this page only relays the token back to the
    // tab that started the login, then closes; it never draws the chart.
    if (handlePopupReturn()) {
      host.innerHTML = '<div class="loading">Signing in…</div>';
      return;
    }

    baseCode = code;
    graph = parseGraph(code);
    graph.labelAdj = buildLabelAdjacency(parseRawEdges(code));
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
    wirePan();
    wireControls();
    wireEdgeTooltip();
    wireComboboxes();
    wireMinimap();
    wireSso();
    listenForPopup();
    requestView({ code: baseCode, full: true, selectedId: null });

    // A saved session restores immediately; a hash login (same-window SSO
    // fallback) takes precedence over it and fetches fresh skills.
    if (!handleCodeLogin()) {
      restoreSsoSession(function (ok) {
        applySsoUi(null);
      });
    } else {
      applySsoUi(null);
    }
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
