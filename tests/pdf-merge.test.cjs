const assert = require("node:assert/strict");
const { PDFDocument } = require("../vendor/pdf-lib.min.js");
const { createPageOrder } = require("../pdf-ordering.js");

async function createPdfWithPageWidths(widths) {
  const pdf = await PDFDocument.create();

  widths.forEach((width) => {
    pdf.addPage([width, 300]);
  });

  return pdf;
}

async function mergeDuplexScans(frontPdf, backPdf, options) {
  const outputPdf = await PDFDocument.create();
  const pageOrder = createPageOrder(frontPdf.getPageCount(), backPdf.getPageCount(), options);

  for (const pageRef of pageOrder) {
    const sourcePdf = pageRef.side === "front" ? frontPdf : backPdf;
    const [copiedPage] = await outputPdf.copyPages(sourcePdf, [pageRef.sourcePageIndex]);
    outputPdf.addPage(copiedPage);
  }

  return outputPdf.save();
}

(async () => {
  const frontPdf = await createPdfWithPageWidths([101, 102, 103]);
  const backPdf = await createPdfWithPageWidths([201, 202, 203]);
  const mergedBytes = await mergeDuplexScans(frontPdf, backPdf, {
    reverseFront: false,
    reverseBack: true,
  });
  const mergedPdf = await PDFDocument.load(mergedBytes);

  assert.equal(mergedPdf.getPageCount(), 6);
  assert.deepEqual(
    mergedPdf.getPages().map((page) => page.getWidth()),
    [101, 203, 102, 202, 103, 201],
  );

  console.log("PDF merge test passed.");
})();
