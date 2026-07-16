(function exposePdfOrdering(globalScope) {
  function createPageOrder(frontPageCount, backPageCount, options) {
    if (frontPageCount !== backPageCount) {
      throw new Error("Front and back PDFs must have the same page count.");
    }

    const reverseFront = Boolean(options && options.reverseFront);
    const reverseBack =
      typeof options === "string" ? options === "reversed" : Boolean(options && options.reverseBack);
    const pages = [];

    for (let index = 0; index < frontPageCount; index += 1) {
      const frontIndex = reverseFront ? frontPageCount - 1 - index : index;
      const backIndex = reverseBack ? backPageCount - 1 - index : index;

      pages.push({
        side: "front",
        sheetNumber: index + 1,
        sourcePageIndex: frontIndex,
      });
      pages.push({
        side: "back",
        sheetNumber: index + 1,
        sourcePageIndex: backIndex,
      });
    }

    return pages;
  }

  function formatPageOrder(order) {
    return order
      .map((page) => `${page.side === "front" ? "F" : "B"}${page.sheetNumber}`)
      .join(", ");
  }

  const api = {
    createPageOrder,
    formatPageOrder,
  };

  globalScope.rectoVersoOrdering = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
