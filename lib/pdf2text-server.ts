import "server-only";
import path from "path";
import { pathToFileURL } from "url";

// We need to use standard import for node environment
// const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js"); 
// Next.js dynamic import might be needed or just standard import if ESM is enabled.
// CareerCraft package.json has "pdfjs-dist": "^5.4.530" which is ESM.

// Re-using the logic but adapted for Node Buffer
export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
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

            global.DOMMatrix = class DOMMatrix {
                a: number; b: number; c: number; d: number; e: number; f: number;
                constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
                setMatrixValue() { return this; }
                multiply() { return this; }
                translate() { return this; }
                scale() { return this; }
                rotate() { return this; }
            } as unknown as typeof DOMMatrix;
        }

        // Dynamic import to avoid build issues
        // Use legacy build for better Node.js compatibility
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

        // Manually configure the worker source for Node.js environment
        // preventing the "Setting up fake worker failed" error
        const workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");

        // Convert to file URL for Windows compatibility (ESM loader requirement)
        pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

        // In Node, we don't set GlobalWorkerOptions.workerSrc usually, or we assume it runs in main thread.
        // For simple text extraction, often worker is not strictly required if we disable it? 
        // Or we might need to Mock it. 
        // pdfjs-dist in Node usage usually requires setting up a DOM polyfill or using legacy build?
        // Let's try standard import first.

        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(buffer);

        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            // Disable worker for serverless/node environment often helps avoid path issues
            disableFontFace: true,
            verbosity: 0
        });

        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
        }

        return fullText.trim();

    } catch (error) {
        console.error("Server PDF Extraction Error:", error);
        throw new Error(`Failed to extract text from PDF on server: ${error instanceof Error ? error.message : String(error)}`);
    }
}
