'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, AudioLines, Braces, Calculator, Check, FileImage, FileText, Image as ImageIcon, LockKeyhole, Search, ShieldCheck, Sparkles, Video, WandSparkles, Zap } from 'lucide-react';
import { categories, tools, type ToolCategory } from '@/lib/tools';

const icons: Record<string, React.ReactNode> = { video: <Video size={19}/>, audio: <AudioLines size={19}/>, image: <ImageIcon size={19}/>, pdf: <FileText size={19}/>, text: <Braces size={19}/>, utility: <Calculator size={19}/> };

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'All'>('All');
  const filtered = useMemo(() => tools.filter((tool) => (category === 'All' || tool.category === category) && `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.toLowerCase())), [query, category]);
  return <main>
    <header className="shell topbar"><Link className="brand" href="/"><span className="brandmark">t.</span>toolforge</Link><nav className="navlinks"><a href="#tools">Explore tools</a><a href="#privacy">Privacy</a><a href="#about">About</a></nav><div className="navright"><a className="pillbtn" href="#tools">Browse tools <ArrowDownRight size={14}/></a></div></header>
    <section className="shell hero"><span className="eyebrow"><span className="eyedot"/> A calmer way to get things done</span><h1>Small tools.<br/><span>Big time saved.</span></h1><p>Useful utilities for your files, media and everyday work. No clutter, no complicated setup — just get in, get it done.</p>
      <div className="searchwrap"><Search className="searchicon" size={18}/><input className="searchinput" aria-label="Search tools" placeholder="What do you need to do today? Try ‘compress image’" value={query} onChange={(e) => {setQuery(e.target.value); if(e.target.value) document.getElementById('tools')?.scrollIntoView({behavior:'smooth',block:'start'});}}/></div>
      <div className="quickcats"><button className={`chip ${category==='All'?'active':''}`} onClick={()=>setCategory('All')}>All tools</button>{categories.map((c)=><button key={c} className={`chip ${category===c?'active':''}`} onClick={()=>{setCategory(c);document.getElementById('tools')?.scrollIntoView({behavior:'smooth',block:'start'});}}>{c}</button>)}</div>
      <div className="trustrow"><span><ShieldCheck size={14} style={{verticalAlign:'-3px'}}/> Privacy-first by design</span><span><Zap size={14} style={{verticalAlign:'-3px'}}/> Quick and easy</span><span><Check size={14} style={{verticalAlign:'-3px'}}/> No account needed</span></div>
    </section>
    <section id="tools" className="shell section"><div className="sectionhead"><div><h2>{query ? 'Search results' : category === 'All' ? 'Your everyday toolkit' : `${category} tools`}</h2><p>{filtered.length} tools to help you get it done.</p></div><span style={{fontSize:12,color:'#8a909a'}}>Built for real life <Sparkles size={13} style={{verticalAlign:'-2px'}}/></span></div>
      <div className="toolgrid">{filtered.map((tool)=><Link className="toolcard" href={`/tools/${tool.slug}`} key={tool.slug}><div className="toolicon">{icons[tool.kind]}</div><h3>{tool.name}</h3><p>{tool.description}</p><div className="cardfoot"><span>{tool.category}{tool.popular?' · Popular':''}</span><ArrowRight className="arrow" size={16}/></div></Link>)}{filtered.length===0&&<div className="empty"><h3>No tools found yet</h3><p>Try a shorter search or choose another category.</p><button className="pillbtn" onClick={()=>{setQuery('');setCategory('All')}}>Clear filters</button></div>}</div>
    </section>
    <section id="privacy" className="shell"><div className="privacyband"><div><h2>Your files deserve a little privacy.</h2><p>ToolForge is designed to favor processing on your own device wherever practical. Each tool will clearly explain what it does and whether your file stays in your browser before you start.</p></div><div className="privacyicon"><LockKeyhole size={25}/></div></div></section>
    <section id="about" className="shell section" style={{paddingTop:0}}><div className="sectionhead"><div><h2>Simple by intention.</h2><p>One focused job per tool. No maze of settings.</p></div></div><div className="toolgrid"><div className="toolcard"><div className="toolicon"><WandSparkles size={19}/></div><h3>Thoughtful design</h3><p>A clean workspace that keeps the task in focus.</p></div><div className="toolcard"><div className="toolicon"><FileImage size={19}/></div><h3>Made for everyday files</h3><p>Useful utilities for images, documents, media and text.</p></div><div className="toolcard"><div className="toolicon"><ShieldCheck size={19}/></div><h3>Clear about privacy</h3><p>No vague promises. Each tool states its processing behavior.</p></div><div className="toolcard"><div className="toolicon"><Zap size={19}/></div><h3>Less friction</h3><p>Open a tool, do the task, download your result.</p></div></div></section>
    <footer className="shell footer"><Link className="brand" href="/"><span className="brandmark">t.</span>toolforge</Link><div>Useful tools. Less friction. © {new Date().getFullYear()} ToolForge</div><div className="footerlinks"><a href="#tools">Tools</a><a href="#privacy">Privacy approach</a><a href="mailto:hello@toolforge.app">Contact</a></div></footer>
  </main>;
}
