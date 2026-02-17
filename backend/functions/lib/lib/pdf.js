"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromBuffer = void 0;
const path = require("path");
const url_1 = require("url");
// Polyfill Promise.withResolvers if needed (Node < 22)
if (typeof Promise.withResolvers === "undefined") {
    // @ts-expect-error - Polyfill for Node.js environment
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
// Polyfill DOMMatrix if needed (required by pdfjs-dist)
if (typeof DOMMatrix === "undefined") {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
        setMatrixValue() { return this; }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
    };
}
async function extractTextFromBuffer(buffer) {
    try {
        // Dynamic import to avoid build issues
        // Use legacy build for better Node.js compatibility
        const pdfjsLib = await Promise.resolve().then(() => require("pdfjs-dist/legacy/build/pdf.mjs"));
        // Manually configure the worker source for Node.js environment
        const workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
        // Convert to file URL for Windows compatibility (ESM loader requirement)
        pdfjsLib.GlobalWorkerOptions.workerSrc = (0, url_1.pathToFileURL)(workerPath).href;
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            disableFontFace: true,
            verbosity: 0
        });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
        }
        return fullText.trim();
    }
    catch (error) {
        console.error("Server PDF Extraction Error:", error);
        throw new Error(`Failed to extract text from PDF on server: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.extractTextFromBuffer = extractTextFromBuffer;
//# sourceMappingURL=pdf.js.map