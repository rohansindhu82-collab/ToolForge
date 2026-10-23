# ToolForge

ToolForge is a clean, browser-first utility platform for media, PDF, image, text, developer and everyday tools.

## Permanent product contract
The architecture and release rules live in [docs/TOOLFORGE_BASE.md](docs/TOOLFORGE_BASE.md). Every feature must preserve shared styling, the central tool registry, stable routes, SEO, accessibility and quality checks.

## Stack
- Next.js App Router + TypeScript
- Shared responsive CSS design system
- Central tool registry and generated tool routes
- Metadata, canonical URLs, Open Graph, JSON-LD, sitemap and robots.txt
- Vercel deployment from `main`

## Run locally
```bash
npm install
npm run dev
```

## Current tool status
- **Working browser-side tools:** word counter, case converter, JSON formatter/validator, password generator, QR generator, GST calculator, EMI calculator, image compressor/resizer/converter, image-to-PDF, selectable PDF text extraction, PDF page resizing, typed PDF signature mark, video clipping, video looping and audio extraction from video (browser support varies).
- **Not yet implemented:** video reverse, OCR for scanned PDFs, true cryptographic/certificate-backed PDF signatures, arbitrary audio/video formats outside browser codecs, PDF-to-Word and advanced PDF editing.
- **Known limits:** video output is WebM and depends on MediaRecorder/captureStream support; PDF text extraction cannot OCR scanned pages. Typed signature marks are visual annotations, not legal digital-signature certificates.

## SEO and quality gate
Tool routes are generated from the central registry and expose per-tool metadata, canonical URLs, internal links, FAQs and SoftwareApplication structured data. Sitemap and robots.txt use the production base URL. Before a release, run `npm run build`, verify keyboard/mobile behavior and test real file samples in a supported browser. Do not call a feature production-ready until the build and deployment pass.
