const { PDFDocument } = PDFLib;
const { createPageOrder, formatPageOrder } = window.rectoVersoOrdering;

const state = {
  frontPdf: null,
  backPdf: null,
  reverseFront: false,
  reverseBack: true,
  isExporting: false,
  warningMessage: "",
};

const elements = {
  frontInput: document.querySelector("#front-pdf"),
  backInput: document.querySelector("#back-pdf"),
  frontFile: document.querySelector("#front-file"),
  backFile: document.querySelector("#back-file"),
  countWarning: document.querySelector("#count-warning"),
  orderPreview: document.querySelector("#order-preview"),
  configPreview: document.querySelector("#config-preview"),
  downloadButton: document.querySelector("#download-button"),
  reverseFrontInput: document.querySelector("#reverse-front"),
  reverseBackInput: document.querySelector("#reverse-back"),
};

elements.frontInput.addEventListener("change", (event) => {
  void handleFileChange("front", event);
});

elements.backInput.addEventListener("change", (event) => {
  void handleFileChange("back", event);
});

elements.reverseFrontInput.addEventListener("change", () => {
  state.reverseFront = elements.reverseFrontInput.checked;
  render();
});

elements.reverseBackInput.addEventListener("change", () => {
  state.reverseBack = elements.reverseBackInput.checked;
  render();
});

elements.downloadButton.addEventListener("click", () => {
  void exportCombinedPdf();
});

async function handleFileChange(role, event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  clearWarning();

  try {
    const pdf = await readPdfFile(file);
    const loadedPdf = {
      fileName: file.name,
      pageCount: pdf.getPageCount(),
      document: pdf,
    };

    if (role === "front") {
      state.frontPdf = loadedPdf;
    } else {
      state.backPdf = loadedPdf;
    }

  } catch (error) {
    if (role === "front") {
      state.frontPdf = null;
      elements.frontFile.textContent = "Choose PDF";
      elements.frontFile.classList.remove("loaded");
    } else {
      state.backPdf = null;
      elements.backFile.textContent = "Choose PDF";
      elements.backFile.classList.remove("loaded");
    }

    event.target.value = "";
    showWarning(`Could not read ${file.name}. ${errorMessage(error)}`);
  }

  render();
}

async function readPdfFile(file) {
  const looksLikePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!looksLikePdf) {
    throw new Error("Choose a PDF file.");
  }

  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes);
}

async function exportCombinedPdf() {
  if (!canExport()) {
    return;
  }

  try {
    state.isExporting = true;
    clearWarning();
    render();

    const outputPdf = await PDFDocument.create();
    const pageOrder = createPageOrder(
      state.frontPdf.pageCount,
      state.backPdf.pageCount,
      {
        reverseFront: state.reverseFront,
        reverseBack: state.reverseBack,
      },
    );

    for (const pageRef of pageOrder) {
      const sourcePdf = pageRef.side === "front" ? state.frontPdf.document : state.backPdf.document;
      const [copiedPage] = await outputPdf.copyPages(sourcePdf, [pageRef.sourcePageIndex]);
      outputPdf.addPage(copiedPage);
    }

    const bytes = await outputPdf.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "combined-recto-verso.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showWarning(`Could not export the combined PDF. ${errorMessage(error)}`);
  } finally {
    state.isExporting = false;
    render();
  }
}

function canExport() {
  return (
    state.frontPdf !== null &&
    state.backPdf !== null &&
    state.frontPdf.pageCount === state.backPdf.pageCount &&
    !state.isExporting
  );
}

function render() {
  renderFilePill(elements.frontFile, state.frontPdf);
  renderFilePill(elements.backFile, state.backPdf);

  const hasBothPdfs = state.frontPdf !== null && state.backPdf !== null;
  const countsMatch = hasBothPdfs && state.frontPdf.pageCount === state.backPdf.pageCount;

  if (hasBothPdfs && !countsMatch) {
    elements.countWarning.textContent = `Front PDF has ${pageLabel(
      state.frontPdf.pageCount,
    )}; back PDF has ${pageLabel(state.backPdf.pageCount)}. The counts must match before export.`;
    elements.countWarning.classList.remove("hidden");
  } else {
    renderWarning();
  }

  if (countsMatch) {
    const order = createPageOrder(state.frontPdf.pageCount, state.backPdf.pageCount, {
      reverseFront: state.reverseFront,
      reverseBack: state.reverseBack,
    });
    elements.configPreview.textContent = `Final file source order: ${formatSourcePageOrder(order)}`;
    elements.configPreview.classList.remove("hidden");
  } else {
    elements.configPreview.textContent = "";
    elements.configPreview.classList.add("hidden");
  }

  elements.downloadButton.disabled = !canExport();
  elements.downloadButton.textContent = state.isExporting ? "Building PDF..." : "Download merged PDF";
}

function renderFilePill(element, pdf) {
  if (!pdf) {
    element.textContent = "Choose PDF";
    element.classList.remove("loaded");
    return;
  }

  element.textContent = `${pdf.fileName} - ${pageLabel(pdf.pageCount)}`;
  element.classList.add("loaded");
}

function showWarning(message) {
  state.warningMessage = message;
  renderWarning();
}

function clearWarning() {
  state.warningMessage = "";
  renderWarning();
}

function renderWarning() {
  if (state.warningMessage) {
    elements.countWarning.textContent = state.warningMessage;
    elements.countWarning.classList.remove("hidden");
    return;
  }

  elements.countWarning.textContent = "";
  elements.countWarning.classList.add("hidden");
}

function formatSourcePageOrder(order) {
  return order
    .map((page) => `${page.side === "front" ? "F" : "B"}${page.sourcePageIndex + 1}`)
    .join(", ");
}

function pageLabel(count) {
  return `${count} page${count === 1 ? "" : "s"}`;
}

function errorMessage(error) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Try another PDF.";
}

window.rectoVersoScanner = {
  createPageOrder,
  formatPageOrder,
};
