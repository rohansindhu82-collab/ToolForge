import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return <main className="shell" style={{minHeight:'70vh',display:'grid',placeItems:'center',textAlign:'center'}}>
    <div><div className="eyebrow">404 · Page not found</div><h1 style={{fontSize:'clamp(42px,7vw,72px)',letterSpacing:'-3px',margin:'24px 0 12px'}}>Lost a little?</h1><p style={{color:'var(--muted)',lineHeight:1.7,maxWidth:440,margin:'0 auto 24px'}}>That link doesn’t lead to a ToolForge page. Head back and find the tool you need.</p><Link className="pillbtn dark" href="/"><ArrowLeft size={15}/> Back to ToolForge <Search size={15}/></Link></div>
  </main>;
}
