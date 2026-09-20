import * as pdfjsLib from "./pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./pdfjs/pdf.worker.mjs", import.meta.url).href;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

document.querySelectorAll("[data-pdf-reader]").forEach(async (reader) => {
  const source = reader.dataset.src;
  const canvas = reader.querySelector("canvas");
  const stage = reader.querySelector("[data-pdf-stage]");
  const status = reader.querySelector("[data-pdf-status]");
  const pageInput = reader.querySelector("[data-pdf-page]");
  const pageCount = reader.querySelector("[data-pdf-count]");
  const zoomLabel = reader.querySelector("[data-pdf-zoom]");
  const previous = reader.querySelector("[data-pdf-previous]");
  const next = reader.querySelector("[data-pdf-next]");
  const zoomOut = reader.querySelector("[data-pdf-zoom-out]");
  const zoomIn = reader.querySelector("[data-pdf-zoom-in]");
  const fullscreen = reader.querySelector("[data-pdf-fullscreen]");
  let documentHandle = null;
  let pageNumber = 1;
  let zoom = 1;
  let renderTask = null;
  let resizeTimer = null;

  const render = async () => {
    if (!documentHandle) return;
    status.textContent = "Rendering page";
    const page = await documentHandle.getPage(pageNumber);
    const natural = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(280, stage.clientWidth - 32);
    const fitScale = Math.min(availableWidth / natural.width, reader.matches(":fullscreen") ? 2.1 : 1.6);
    const viewport = page.getViewport({ scale: fitScale * zoom });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    const context = canvas.getContext("2d", { alpha: false });
    if (renderTask) renderTask.cancel();
    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
    });
    try { await renderTask.promise; } catch (error) {
      if (error?.name !== "RenderingCancelledException") throw error;
      return;
    }
    renderTask = null;
    pageInput.value = String(pageNumber);
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    previous.disabled = pageNumber <= 1;
    next.disabled = pageNumber >= documentHandle.numPages;
    status.textContent = `Page ${pageNumber} of ${documentHandle.numPages}`;
  };

  const goTo = (value) => {
    pageNumber = clamp(Number.parseInt(value, 10) || 1, 1, documentHandle.numPages);
    render();
  };

  try {
    documentHandle = await pdfjsLib.getDocument({ url: source }).promise;
    pageCount.textContent = String(documentHandle.numPages);
    pageInput.max = String(documentHandle.numPages);
    reader.classList.add("is-ready");
    await render();
  } catch (error) {
    reader.classList.add("has-error");
    status.textContent = "The PDF could not be loaded. Use Open original or Download PDF.";
    console.error("PDF reader error", error);
    return;
  }

  previous.addEventListener("click", () => goTo(pageNumber - 1));
  next.addEventListener("click", () => goTo(pageNumber + 1));
  pageInput.addEventListener("change", () => goTo(pageInput.value));
  zoomOut.addEventListener("click", () => { zoom = clamp(zoom - 0.15, 0.55, 2.2); render(); });
  zoomIn.addEventListener("click", () => { zoom = clamp(zoom + 0.15, 0.55, 2.2); render(); });
  fullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement === reader) await document.exitFullscreen();
    else await reader.requestFullscreen?.();
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreen.textContent = document.fullscreenElement === reader ? "Exit full screen" : "Full screen";
    window.setTimeout(render, 80);
  });
  reader.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); goTo(pageNumber - 1); }
    if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); goTo(pageNumber + 1); }
  });
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(render, 180);
  });
});
