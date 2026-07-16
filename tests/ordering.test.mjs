import assert from "node:assert/strict";
import ordering from "../pdf-ordering.js";

const { createPageOrder, formatPageOrder } = ordering;

const reversedOrder = createPageOrder(3, 3, { reverseFront: false, reverseBack: true });
assert.equal(formatPageOrder(reversedOrder), "F1, B1, F2, B2, F3, B3");
assert.deepEqual(
  reversedOrder.map((page) => page.sourcePageIndex),
  [0, 2, 1, 1, 2, 0],
);

const inOrder = createPageOrder(3, 3, { reverseFront: false, reverseBack: false });
assert.equal(formatPageOrder(inOrder), "F1, B1, F2, B2, F3, B3");
assert.deepEqual(
  inOrder.map((page) => page.sourcePageIndex),
  [0, 0, 1, 1, 2, 2],
);

const bothReversed = createPageOrder(3, 3, { reverseFront: true, reverseBack: true });
assert.equal(formatPageOrder(bothReversed), "F1, B1, F2, B2, F3, B3");
assert.deepEqual(
  bothReversed.map((page) => page.sourcePageIndex),
  [2, 2, 1, 1, 0, 0],
);

assert.throws(
  () => createPageOrder(3, 2, { reverseFront: false, reverseBack: true }),
  /Front and back PDFs must have the same page count/,
);

console.log("Ordering tests passed.");
