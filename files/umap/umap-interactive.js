(() => {
  const frame = document.getElementById("umap-frame");
  const isZh = new URLSearchParams(location.search).get("lang") === "zh";
  const initialCamera = { eye: { x: 1.55, y: 1.55, z: 1.2 } };
  let legendVisible = false;
  let layoutTimer = null;
  let layoutAttempts = 0;

  document.title = isZh ? "泛癌单细胞整合 3D UMAP" : "Interactive Pan-cancer 3D UMAP";

  const getPlot = () => {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) {
      return null;
    }
    return { doc, win, plot: doc.querySelector(".js-plotly-plot") };
  };

  const injectStyles = (doc) => {
    if (doc.getElementById("umap-embed-style")) {
      return;
    }
    const style = doc.createElement("style");
    style.id = "umap-embed-style";
    style.textContent = `
      html,
      body,
      #htmlwidget_container,
      .html-widget,
      .plotly,
      .js-plotly-plot {
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        overflow: hidden !important;
      }

      .modebar {
        right: 8px !important;
        top: 8px !important;
      }
    `;
    doc.head.append(style);
  };

  const legendLayout = () => ({
    showlegend: legendVisible,
    margin: { l: 0, r: 0, b: 0, t: 18 },
    title: { text: "" },
    "legend.title.text": isZh ? "精细细胞注释" : "Refined cell annotation",
    "legend.font.size": 8,
    "legend.orientation": "v",
    "legend.x": 0.99,
    "legend.xanchor": "right",
    "legend.y": 0.98,
    "legend.yanchor": "top",
    "legend.bgcolor": "rgba(255,255,255,0.94)",
    "legend.bordercolor": "rgba(17,17,17,0.22)",
    "legend.borderwidth": 1
  });

  const applyLayout = () => {
    layoutAttempts += 1;
    const context = getPlot();
    if (!context) {
      return false;
    }

    const { doc, win, plot } = context;
    injectStyles(doc);
    if (!plot || !win.Plotly) {
      return false;
    }

    win.Plotly.relayout(plot, {
      ...legendLayout(),
      paper_bgcolor: "#ffffff",
      "scene.bgcolor": "#ffffff",
      "scene.camera": initialCamera
    });
    win.Plotly.Plots.resize(plot);
    window.parent.postMessage({ type: "umap-ready" }, location.origin);
    return true;
  };

  const startLayoutChecks = () => {
    window.clearInterval(layoutTimer);
    layoutAttempts = 0;
    if (applyLayout()) {
      return;
    }
    layoutTimer = window.setInterval(() => {
      if (applyLayout() || layoutAttempts >= 30) {
        window.clearInterval(layoutTimer);
      }
    }, 500);
  };

  const resetView = () => {
    const context = getPlot();
    if (context?.plot && context.win.Plotly) {
      context.win.Plotly.relayout(context.plot, { "scene.camera": initialCamera });
    }
  };

  const resizePlot = () => {
    const context = getPlot();
    if (context?.plot && context.win.Plotly) {
      context.win.Plotly.Plots.resize(context.plot);
    }
  };

  const setLegend = (visible) => {
    legendVisible = visible;
    const context = getPlot();
    if (context?.plot && context.win.Plotly) {
      context.win.Plotly.relayout(context.plot, legendLayout());
    }
  };

  frame.addEventListener("load", startLayoutChecks);

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) {
      return;
    }
    if (event.data?.type === "umap-reset-view") {
      resetView();
    }
    if (event.data?.type === "umap-resize") {
      window.setTimeout(resizePlot, 80);
    }
    if (event.data?.type === "umap-set-legend") {
      setLegend(Boolean(event.data.visible));
    }
  });
})();
