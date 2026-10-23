import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { getTool, tools } from '@/lib/tools';
import ToolWorkspace from './workspace';

export function generateStaticParams() { return tools.map((tool) => ({ slug: tool.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const tool = getTool(slug); if (!tool) return {};
  return { title: tool.name, description: tool.description, alternates: { canonical: `/tools/${tool.slug}` }, openGraph: { title: `${tool.name} — ToolForge`, description: tool.description, type: 'website' } };
}
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const tool = getTool(slug); if (!tool) notFound();
  const related = tools.filter((item) => item.slug !== tool.slug && (item.category === tool.category || item.kind === tool.kind)).slice(0, 4);
  const schema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: tool.name, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', description: tool.description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
  return <main><header className="shell topbar"><Link className="brand" href="/"><span className="brandmark">t.</span>toolforge</Link><Link className="pillbtn" href="/"><ArrowLeft size={14}/> All tools</Link></header><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/><section className="shell toolhero"><div className="breadcrumb"><Link href="/">Home</Link> / {tool.category} / {tool.name}</div><h1>{tool.name}</h1><p>{tool.description}</p><p style={{fontSize:12}}><ShieldCheck size={14} style={{verticalAlign:'-3px'}}/> Processing is performed in your browser for supported tools. Unsupported operations are clearly labelled.</p></section><ToolWorkspace tool={tool}/><section className="shell section" style={{paddingTop:0}}><div className="sectionhead"><div><h2>Keep going</h2><p>Related tools you may find useful.</p></div></div><div className="toolgrid">{related.map((item)=><Link key={item.slug} className="toolcard" href={`/tools/${item.slug}`}><div className="toolicon">↗</div><h3>{item.name}</h3><p>{item.description}</p><div className="cardfoot"><span>{item.category}</span><ArrowRight size={16}/></div></Link>)}</div></section><footer className="shell footer"><Link className="brand" href="/"><span className="brandmark">t.</span>toolforge</Link><span>Useful tools. Less friction.</span><Link href="/">Browse all tools</Link></footer></main>;
}
