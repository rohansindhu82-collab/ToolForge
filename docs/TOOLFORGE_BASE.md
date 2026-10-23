# ToolForge Base Contract

## Product
ToolForge is a professional browser-first utility platform for media, PDF, image, text, developer and everyday tasks. The UX is clean, Apple-inspired, fast, responsive, accessible and production-focused.

## Architecture
- Next.js App Router
- TypeScript
- Tailwind CSS
- Shared design tokens/components
- Central tool registry
- Shared tool-page shell
- Stable category taxonomy: video, audio, pdf, image, text, developer, everyday
- Browser-first processing wherever practical
- Server processing only where required
- Vercel deployment

## Tool contract
Every production tool must define: id, slug, category, name, short description, long description, input/output, processing mode, SEO metadata, FAQs, related tools and test cases.

## Update contract
Every change must be checked for impact on tool registry, navigation, category pages, search/filtering, related tools, SEO metadata/canonical/OG/schema, sitemap/robots, analytics, loading/error/success states, accessibility, responsive UI, tests, performance and revenue placements.

## Product rules
- Never ship fake or decorative tool buttons.
- Avoid duplicate implementations; use shared engines/components.
- Never silently break an existing public route.
- Keep indexed URLs stable. Use redirects for intentional changes.
- Avoid thin programmatic SEO pages; every indexed page needs useful, distinct content.
- Prefer client-side processing for privacy and low recurring cost.
- Consider bundle size, licensing, browser support and maintenance before adding dependencies.
- Preserve backwards compatibility unless a migration is documented.

## Delivery workflow
Idea -> Specification -> Architecture -> Design -> Development -> Testing -> SEO -> Deploy -> Analytics -> Improve.

## Revenue
Free-first and revenue-ready through non-intrusive advertising, optional Pro capabilities and contextual monetization. Monetization must not compromise the core utility experience.

## Definition of done
A feature is not done until implementation, responsive UI, accessibility, error handling, tests, SEO, internal linking, analytics and production build/deployment impact have been checked.
