# Client-Side PDF Reorder Web App

## Summary
Build a local browser-based JavaScript app that takes two PDFs: one containing all front-side scans and one containing all back-side scans. The app will reorder them into one downloadable PDF, defaulting to back pages scanned last-to-first while letting the user switch the back-page order before export.

Use a client-only JS stack because PDF merging can be done in-browser with `pdf-lib`, which supports copying and merging PDF pages without native dependencies, and browser File APIs can read user-selected local files. Add `pdf.js` only if preview thumbnails are implemented, since it is designed for rendering PDFs in the browser.

## Key Changes
- Create a small local web app with:
  - Two PDF upload controls: `Front sides PDF` and `Back sides PDF`.
  - A back-order selector:
    - `Back PDF is reversed` as default.
    - `Back PDF is already in order`.
  - Page count validation before export.
  - A generated order preview like `F1, B1, F2, B2...`.
  - A primary `Download combined PDF` action.
- PDF ordering logic:
  - If back PDF is reversed, pair `front[i]` with `back[backCount - 1 - i]`.
  - If back PDF is in order, pair `front[i]` with `back[i]`.
  - Output page order is always physical sheet order: front page, then its back page.
- Error handling:
  - Reject non-PDF files.
  - Show a clear warning if front/back page counts differ.
  - Disable export until both PDFs are loaded and counts are valid.
  - Surface PDF parsing/export failures in the UI.
- Privacy/default behavior:
  - Process files locally in the browser.
  - Do not upload PDFs anywhere.
  - Use pinned npm dependencies rather than unversioned CDN scripts.

## Implementation Approach
- Use Vite with TypeScript for a lightweight local app.
- Use `pdf-lib` for loading PDFs, copying pages, assembling the final PDF, and saving bytes for download.
- Keep the UI simple and task-focused: upload area, order mode control, validation/status, preview list, download button.
- Use `pdf.js` only if adding rendered page thumbnails; otherwise avoid it to keep the first version simpler and faster.

## Test Plan
- Unit test ordering logic:
  - 3 front pages + 3 reversed back pages produces `F1, B1, F2, B2, F3, B3`.
  - 3 front pages + 3 in-order back pages produces the expected direct pairing.
  - mismatched counts blocks export.
- Manual browser tests:
  - Upload two valid PDFs and download the combined PDF.
  - Toggle back order and verify preview/order changes.
  - Try missing files, non-PDF files, corrupted PDFs, and unequal page counts.
  - Test with a larger scanned document to check responsiveness and memory behavior.

## Assumptions
- The first version is a local web app, not a hosted service.
- Default scanner behavior is back-side PDF in last-to-first order, but the app exposes a user-selectable order mode.
- No OCR, image cleanup, deskewing, compression, or duplex auto-detection is included in v1.
- Sources used for feasibility:
  - [`pdf-lib` documentation](https://pdf-lib.js.org/) for browser-compatible PDF creation/modification and page copying/merging.
  - [`pdf.js` documentation](https://mozilla.github.io/pdf.js/) for browser PDF rendering if previews are added.
  - [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API) for browser-side local file handling.
