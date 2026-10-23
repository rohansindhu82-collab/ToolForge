export type ToolCategory = 'Video' | 'Audio' | 'PDF' | 'Images' | 'Text' | 'Developer' | 'Everyday' | 'SEO';

export type ToolDefinition = {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  kind: 'video' | 'audio' | 'image' | 'pdf' | 'text' | 'utility';
  popular?: boolean;
};

export const categories: ToolCategory[] = ['Video', 'Audio', 'PDF', 'Images', 'Text', 'Developer', 'Everyday', 'SEO'];

export const tools: ToolDefinition[] = [
  { slug: 'meta-tag-generator', name: 'Meta Tag Generator', category: 'SEO', description: 'Generate copy-ready SEO title, description, canonical and robots meta tags.', kind: 'text', popular: true },
  { slug: 'google-serp-preview', name: 'Google SERP Preview', category: 'SEO', description: 'Preview a search snippet and check title and description lengths.', kind: 'text', popular: true },
  { slug: 'title-tag-checker', name: 'Title Tag Length Checker', category: 'SEO', description: 'Check title tag character length and preview its search result headline.', kind: 'text', popular: true },
  { slug: 'meta-description-checker', name: 'Meta Description Checker', category: 'SEO', description: 'Count meta description characters and review a search snippet preview.', kind: 'text', popular: true },
  { slug: 'url-slug-generator', name: 'URL Slug Generator', category: 'SEO', description: 'Turn a title into a clean, readable, SEO-friendly URL slug.', kind: 'text' },
  { slug: 'robots-txt-generator', name: 'Robots.txt Generator', category: 'SEO', description: 'Create a robots.txt starter file with crawler rules and sitemap location.', kind: 'text', popular: true },
  { slug: 'xml-sitemap-generator', name: 'XML Sitemap Generator', category: 'SEO', description: 'Build an XML sitemap from URLs you provide and download it.', kind: 'text', popular: true },
  { slug: 'schema-markup-generator', name: 'Schema Markup Generator', category: 'SEO', description: 'Generate JSON-LD structured data for websites, articles and local businesses.', kind: 'text', popular: true },
  { slug: 'open-graph-generator', name: 'Open Graph Meta Generator', category: 'SEO', description: 'Generate social sharing meta tags for Open Graph and Twitter cards.', kind: 'text' },
  { slug: 'faq-schema-generator', name: 'FAQ Schema Generator', category: 'SEO', description: 'Turn FAQ questions and answers into JSON-LD structured data.', kind: 'text' }
  { slug: 'video-to-audio', name: 'Video to Audio', category: 'Audio', description: 'Extract the audio track from a video file in your browser.', kind: 'video', popular: true },
  { slug: 'video-clipper', name: 'Video Clipper', category: 'Video', description: 'Trim a video to the exact section you need.', kind: 'video', popular: true },
  { slug: 'video-reverser', name: 'Video Reverser', category: 'Video', description: 'Reverse a video clip locally in your browser.', kind: 'video' },
  { slug: 'video-looper', name: 'Video Looper', category: 'Video', description: 'Repeat a clip to create a longer loop.', kind: 'video' },
  { slug: 'image-to-pdf', name: 'Image to PDF', category: 'PDF', description: 'Turn images into a downloadable PDF document.', kind: 'image', popular: true },
  { slug: 'pdf-merger', name: 'PDF Merger', category: 'PDF', description: 'Combine multiple PDF files into one document in your browser.', kind: 'pdf', popular: true },
  { slug: 'pdf-splitter', name: 'PDF Splitter', category: 'PDF', description: 'Split a PDF into separate page-range documents locally.', kind: 'pdf', popular: true },
  { slug: 'pdf-page-extractor', name: 'PDF Page Extractor', category: 'PDF', description: 'Extract selected pages from a PDF into a new file.', kind: 'pdf' },
  { slug: 'pdf-rotate', name: 'Rotate PDF', category: 'PDF', description: 'Rotate all pages in a PDF and download the result.', kind: 'pdf' },
  { slug: 'pdf-to-text', name: 'PDF Text Extractor', category: 'PDF', description: 'Extract selectable text from PDF documents.', kind: 'pdf', popular: true },
  { slug: 'pdf-resizer', name: 'PDF Page Resizer', category: 'PDF', description: 'Resize PDF page dimensions while preserving page content.', kind: 'pdf' },
  { slug: 'pdf-sign', name: 'Sign PDF', category: 'PDF', description: 'Place a simple drawn signature on a PDF.', kind: 'pdf' },
  { slug: 'image-compressor', name: 'Image Compressor', category: 'Images', description: 'Reduce image file size with adjustable quality.', kind: 'image', popular: true },
  { slug: 'image-resizer', name: 'Image Resizer', category: 'Images', description: 'Resize images to custom pixel dimensions.', kind: 'image' },
  { slug: 'image-converter', name: 'Image Converter', category: 'Images', description: 'Convert images to PNG, JPEG, or WebP.', kind: 'image' },
  { slug: 'word-counter', name: 'Word Counter', category: 'Text', description: 'Count words, characters, sentences, and reading time.', kind: 'text', popular: true },
  { slug: 'case-converter', name: 'Case Converter', category: 'Text', description: 'Convert text to uppercase, lowercase, and title case.', kind: 'text' },
  { slug: 'base64-tool', name: 'Base64 Encoder / Decoder', category: 'Developer', description: 'Encode text to Base64 or decode Base64 locally.', kind: 'text' },
  { slug: 'json-formatter', name: 'JSON Formatter', category: 'Developer', description: 'Format and validate JSON with readable errors.', kind: 'text' },
  { slug: 'password-generator', name: 'Password Generator', category: 'Everyday', description: 'Generate a strong random password on your device.', kind: 'utility', popular: true },
  { slug: 'qr-generator', name: 'QR Code Generator', category: 'Everyday', description: 'Create a QR code for a link or short message.', kind: 'utility' },
  { slug: 'percentage-calculator', name: 'Percentage Calculator', category: 'Everyday', description: 'Calculate percentages, percentage changes, and proportions.', kind: 'utility', popular: true },
  { slug: 'age-calculator', name: 'Age Calculator', category: 'Everyday', description: 'Calculate age from a date of birth.', kind: 'utility' },
  { slug: 'gst-calculator', name: 'GST Calculator', category: 'Everyday', description: 'Calculate GST amounts and inclusive or exclusive prices.', kind: 'utility' },
  { slug: 'emi-calculator', name: 'EMI Calculator', category: 'Everyday', description: 'Estimate monthly loan payments and total interest.', kind: 'utility' },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
