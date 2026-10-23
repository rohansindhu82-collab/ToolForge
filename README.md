# ToolForge

ToolForge is a browser-first utility platform for media, PDF, image, text, developer and everyday tools.

## Foundation contract
The long-term product and architecture rules live in [`docs/TOOLFORGE_BASE.md`](docs/TOOLFORGE_BASE.md). Every new feature must preserve the shared design system, tool registry, route stability, SEO, accessibility, and test expectations.

## Stack
- Next.js App Router + TypeScript
- Responsive CSS design system
- Central tool registry and generated tool routes
- Metadata, canonical URLs, Open Graph, JSON-LD, sitemap and robots.txt
- Vercel deployment from `main`

## Run locally
```bash
npm install
npm run dev
```

## Current implementation
The homepage has working category filters and search. Initial working utilities include word counter, case converter, JSON formatter/validator, password generator, GST calculator, EMI calculator, and browser-side image compression/resizing/conversion. Video/PDF/QR tools are listed but their processors are explicitly marked as not enabled yet; they must not be presented as working until implemented and tested.

## Quality gate
Before release, run `npm run build` and verify tool pages, keyboard navigation, mobile layouts, SEO output, sitemap, robots, and browser-side file handling. Keep URLs stable after indexing.
