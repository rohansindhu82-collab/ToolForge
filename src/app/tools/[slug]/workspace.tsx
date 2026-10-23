'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ToolDefinition } from '@/lib/tools';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import QRCode from 'qrcode';
import JSZip from 'jszip';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

function parsePageRanges(input: string, total: number): number[] { const picked = new Set<number>(); for (const part of input.split(',').map(s => s.trim()).filter(Boolean)) { const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!match) throw new Error('Use page numbers like 1-3,5.'); const first = Number(match[1]); const last = Number(match[2] || match[1]); if (first < 1 || last < first || last > total) throw new Error('Page range is outside this PDF (1–' + total + ').'); for (let n = first; n <= last; n++) picked.add(n - 1); } return [...picked].sort((a,b) => a-b); }

type Props = { tool: ToolDefinition };
export default function ToolWorkspace({ tool }: Props) {
  const [text, setText] = useState(''); const [result, setResult] = useState(''); const [file, setFile] = useState<File | null>(null); const [quality, setQuality] = useState('0.75'); const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp'); const [width, setWidth] = useState(''); const [height, setHeight] = useState(''); const [gst, setGst] = useState('18'); const [amount, setAmount] = useState('1000'); const [rate, setRate] = useState('10'); const [months, setMonths] = useState('12'); const [length, setLength] = useState('16'); const [password, setPassword] = useState(''); const [downloadUrl, setDownloadUrl] = useState(''); const [downloadName, setDownloadName] = useState('toolforge-result');
  const [status, setStatus] = useState(''); const [selectedFiles,setSelectedFiles]=useState<File[]>([]); const [pageRange,setPageRange]=useState('1-3'); const [pagesPerFile,setPagesPerFile]=useState('1'); const [rotation,setRotation]=useState('90'); const [base64Mode,setBase64Mode]=useState<'encode'|'decode'>('encode'); const [percentage,setPercentage]=useState('10'); const [baseAmount,setBaseAmount]=useState('100'); const [birthDate,setBirthDate]=useState(''); const [seoTitle,setSeoTitle]=useState(''); const [seoDescription,setSeoDescription]=useState(''); const [seoUrl,setSeoUrl]=useState('https://example.com/page'); const [siteName,setSiteName]=useState(''); const [slugText,setSlugText]=useState(''); const [robotsPreset,setRobotsPreset]=useState<'all'|'none'|'images'|'noai'>('all'); const [sitemapUrls,setSitemapUrls]=useState('https://example.com/\nhttps://example.com/about'); const [schemaKind,setSchemaKind]=useState<'WebSite'|'Organization'|'Article'|'LocalBusiness'|'Product'>('WebSite'); const [schemaName,setSchemaName]=useState(''); const [schemaDescription,setSchemaDescription]=useState(''); const [faqQuestion,setFaqQuestion]=useState(''); const [faqAnswer,setFaqAnswer]=useState(''); const [qrInput,setQrInput]=useState(''); const [qrDataUrl,setQrDataUrl]=useState(''); const [clipStart,setClipStart]=useState('0'); const [clipEnd,setClipEnd]=useState('10'); const [loopCount,setLoopCount]=useState('3');
  const stats = useMemo(() => ({ words: text.trim() ? text.trim().split(/\s+/).length : 0, chars: text.length, sentences: text.trim() ? (text.trim().match(/[.!?]+(?=\s|$)/g) || []).length : 0 }), [text]);
  function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); setDownloadUrl(url); setDownloadName(name); setStatus('Your file is ready. Use the download link below.'); }
  async function handleFileAction() {
    if (!file) { setStatus('Choose a file first.'); return; }
    setStatus('Processing locally in your browser…');
    try {
      if (tool.slug === 'pdf-merger') {
        const files=selectedFiles.length?selectedFiles:(file?[file]:[]);
        if(files.length<2)throw new Error('Choose at least two PDF files to merge.');
        const merged=await PDFDocument.create();
        for(const f of files){if(f.type!=='application/pdf'&&!f.name.toLowerCase().endsWith('.pdf'))throw new Error(f.name+' is not a PDF.');const source=await PDFDocument.load(await f.arrayBuffer());const pages=await merged.copyPages(source,source.getPageIndices());pages.forEach(p=>merged.addPage(p));}
        const bytes=new Uint8Array(await merged.save());downloadBlob(new Blob([bytes.buffer as ArrayBuffer],{type:'application/pdf'}),'toolforge-merged.pdf');
        setStatus('Merged '+files.length+' PDF files into '+merged.getPageCount()+' pages locally.');return;
      }
      if (['pdf-splitter','pdf-page-extractor','pdf-rotate'].includes(tool.slug)) {
        if(!file||(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')))throw new Error('Choose a PDF document.');
        const pdf=await PDFDocument.load(await file.arrayBuffer());
        if(tool.slug==='pdf-rotate'){
          const degrees=((Number(rotation)%360)+360)%360;if(![0,90,180,270].includes(degrees))throw new Error('Rotation must be 0, 90, 180 or 270 degrees.');
          pdf.getPages().forEach(p=>p.setRotation({angle:(p.getRotation().angle+degrees)%360} as any));
          const bytes=new Uint8Array(await pdf.save());downloadBlob(new Blob([bytes.buffer as ArrayBuffer],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-rotated.pdf');setStatus('Rotated '+pdf.getPageCount()+' page(s) by '+degrees+' degrees.');return;
        }
        if(tool.slug==='pdf-page-extractor'){
          const indices=parsePageRanges(pageRange,pdf.getPageCount());if(!indices.length)throw new Error('Enter page numbers such as 1-3,5.');
          const out=await PDFDocument.create();(await out.copyPages(pdf,indices)).forEach(p=>out.addPage(p));
          const bytes=new Uint8Array(await out.save());downloadBlob(new Blob([bytes.buffer as ArrayBuffer],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-pages.pdf');setStatus('Extracted '+indices.length+' page(s) into a new PDF.');return;
        }
        const chunkSize=Math.max(1,Math.min(100,Number(pagesPerFile)||1));const total=pdf.getPageCount();const zip=new JSZip();let parts=0;
        for(let start=0;start<total;start+=chunkSize){const out=await PDFDocument.create();const ids=Array.from({length:Math.min(chunkSize,total-start)},(_,i)=>start+i);(await out.copyPages(pdf,ids)).forEach(p=>out.addPage(p));zip.file('part-'+String(parts+1).padStart(2,'0')+'.pdf',await out.save());parts++;}
        const blob=await zip.generateAsync({type:'blob'});downloadBlob(blob,file.name.replace(/\.pdf$/i,'')+'-split.zip');setStatus('Split '+total+' pages into '+parts+' PDF files in a ZIP archive.');return;
      }
      if (['image-compressor','image-resizer','image-converter'].includes(tool.slug)) {
        if (!file.type.startsWith('image/')) { setStatus('Please choose a supported image file.'); return; }
        const image = new Image(); const source = URL.createObjectURL(file);
        image.onload = () => {
          const w = Math.min(12000, Math.max(1, Number(width) || image.naturalWidth));
          const h = Math.min(12000, Math.max(1, Number(height) || Math.round(image.naturalHeight * w / image.naturalWidth)));
          const canvas = document.createElement('canvas');
          canvas.width = tool.slug === 'image-compressor' ? image.naturalWidth : w;
          canvas.height = tool.slug === 'image-compressor' ? image.naturalHeight : h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { setStatus('Your browser could not create an image canvas.'); URL.revokeObjectURL(source); return; }
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const mime: 'image/png' | 'image/jpeg' | 'image/webp' = tool.slug === 'image-converter' || tool.slug === 'image-compressor' ? outputFormat : 'image/jpeg';
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(source);
            if (!blob) { setStatus('Could not create the output image. Try another file.'); return; }
            const actualMime = blob.type || mime;
            const extension = actualMime === 'image/png' ? 'png' : actualMime === 'image/webp' ? 'webp' : 'jpg';
            downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '-' + tool.slug + '.' + extension);
            const formatLabel = actualMime === 'image/png' ? 'PNG' : actualMime === 'image/webp' ? 'WebP' : 'JPEG';
            const fallbackNotice = actualMime !== mime ? ' Your browser did not support the selected format, so it exported ' + formatLabel + ' instead.' : '';
            setStatus('Output format: ' + formatLabel + ' (' + actualMime + '). Dimensions: ' + canvas.width + ' × ' + canvas.height + '. Output: ' + (blob.size / 1024).toFixed(1) + ' KB. Original: ' + (file.size / 1024).toFixed(1) + ' KB.' + fallbackNotice);
          }, mime, mime === 'image/png' ? undefined : Number(quality));
        };
        image.onerror = () => { URL.revokeObjectURL(source); setStatus('Could not read this image format.'); };
        image.src = source; return;
      }
      if (tool.slug === 'image-to-pdf') {
        if (!file.type.startsWith('image/')) { setStatus('Choose a JPG, PNG, or another browser-supported image.'); return; }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await PDFDocument.create();
        let image;
        if (file.type === 'image/png') image = await pdf.embedPng(bytes);
        else if (['image/jpeg','image/jpg'].includes(file.type)) image = await pdf.embedJpg(bytes);
        else {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not read image.');
          ctx.drawImage(bitmap,0,0); bitmap.close();
          const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image conversion failed.')),'image/jpeg',0.94));
          image = await pdf.embedJpg(await blob.arrayBuffer());
        }
        const page = pdf.addPage([image.width,image.height]);
        page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});
        downloadBlob(new Blob([new Uint8Array(await pdf.save()).buffer as ArrayBuffer],{type:'application/pdf'}),file.name.replace(/\.[^.]+$/,'')+'.pdf');
        setStatus('Created a PDF locally. Your image was not uploaded.'); return;
      }
      if (tool.slug === 'pdf-resizer') {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setStatus('Choose a PDF document.'); return; }
        const pdf=await PDFDocument.load(await file.arrayBuffer());
        const targetWidth=Math.max(72,Math.min(2000,Number(width)||595));
        const targetHeight=Math.max(72,Math.min(2000,Number(height)||842));
        for(const page of pdf.getPages()){const size=page.getSize();page.scaleContent(targetWidth/size.width,targetHeight/size.height);page.setSize(targetWidth,targetHeight);}
        downloadBlob(new Blob([new Uint8Array(await pdf.save()).buffer as ArrayBuffer],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-resized.pdf');
        setStatus('Resized '+pdf.getPageCount()+' page(s) locally to '+targetWidth+' × '+targetHeight+' PDF points. Check the result for complex layouts.');return;
      }
      if (tool.slug === 'pdf-to-text') {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setStatus('Choose a PDF document.'); return; }
        const pdf = await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
        const pages:string[]=[];
        for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const textContent=await page.getTextContent();pages.push('--- Page '+i+' ---\n'+textContent.items.map((item:any)=>'str' in item?item.str:'').join(' '));}
        const output=pages.join('\n\n');
        if(!output.replace(/--- Page \d+ ---/g,'').trim()){setStatus('No selectable text found. This PDF may contain scanned images and needs OCR.');return;}
        downloadBlob(new Blob([output],{type:'text/plain;charset=utf-8'}),file.name.replace(/\.pdf$/i,'')+'.txt');
        setResult(output);setStatus('Extracted text from '+pdf.numPages+' page(s). Scanned-image OCR is not included.');return;
      }
      if (tool.slug === 'pdf-sign') {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setStatus('Choose a PDF document.'); return; }
        const pdf=await PDFDocument.load(await file.arrayBuffer());
        const page=pdf.getPages()[0]; if(!page) throw new Error('This PDF has no pages.');
        const font=await pdf.embedFont(StandardFonts.HelveticaOblique);
        page.drawText(text.trim() || 'Signed digitally',{x:40,y:40,size:24,font,color:rgb(0.08,0.2,0.55)});
        downloadBlob(new Blob([new Uint8Array(await pdf.save()).buffer as ArrayBuffer],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-signed.pdf');
        setStatus('Added a typed signature mark to the first page. This is not a certificate-backed digital signature.');return;
      }
      setStatus('This processor is not enabled yet. No file was uploaded and no conversion was claimed.');
    } catch (error) { setStatus('Could not process this file: '+(error instanceof Error ? error.message : 'Please check the file and try again.')); }
  }
  async function handleVideoAction() {
    if(!file){setStatus('Choose a video file first.');return;}
    if(!['video-clipper','video-looper','video-to-audio','video-reverser'].includes(tool.slug)){setStatus('This video processor is not available yet.');return;}
    const video=document.createElement('video'); const source=URL.createObjectURL(file); video.src=source; video.muted=false; video.playsInline=true;
    try {
      await new Promise<void>((resolve,reject)=>{video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(new Error('This video format could not be opened by your browser.'));});
      const start=Math.max(0,Number(clipStart)||0); const end=Math.min(video.duration,Number(clipEnd)||video.duration);
      if(tool.slug!=='video-to-audio'&&(!(end>start)||end-start>600))throw new Error('Choose a valid clip up to 10 minutes long.');
      if(tool.slug==='video-to-audio'){
        const capture=(video as HTMLVideoElement & {captureStream?:()=>MediaStream}).captureStream;
        if(!capture)throw new Error('Your browser does not support local audio capture. Try desktop Chrome.');
        video.currentTime=0; await new Promise<void>(resolve=>{video.onseeked=()=>resolve();});
        const audioTracks=capture.call(video).getAudioTracks();if(!audioTracks.length)throw new Error('No audio track was detected in this video.');
        const stream=new MediaStream(audioTracks);const mime=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm';
        const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks:BlobPart[]=[];
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onstop=()=>{downloadBlob(new Blob(chunks,{type:'audio/webm'}),file.name.replace(/\.[^.]+$/,'')+'-audio.webm');URL.revokeObjectURL(source);video.remove();};
        recorder.start();await video.play();video.onended=()=>recorder.stop();setStatus('Extracting audio in your browser…');return;
      }
      if(tool.slug==='video-reverser'){
        const duration=end-start;
        if(duration>120)throw new Error('For reliable browser processing, reverse clips up to 120 seconds at a time.');
        const canvas=document.createElement('canvas');canvas.width=Math.min(1280,video.videoWidth||1280);canvas.height=Math.max(1,Math.round(canvas.width*(video.videoHeight||720)/(video.videoWidth||1280)));
        const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas recording is unavailable.');
        video.pause();const stream=canvas.captureStream(24);const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
        const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks:BlobPart[]=[];
        const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
        const seek=(time:number)=>new Promise<void>((resolve,reject)=>{const done=()=>{video.removeEventListener('seeked',done);video.removeEventListener('error',fail);resolve();};const fail=()=>{video.removeEventListener('seeked',done);video.removeEventListener('error',fail);reject(new Error('Could not seek this video frame.'));};video.addEventListener('seeked',done,{once:true});video.addEventListener('error',fail,{once:true});video.currentTime=Math.max(0,time);});
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());URL.revokeObjectURL(source);setStatus('The browser could not encode this video.');};
        recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());downloadBlob(new Blob(chunks,{type:'video/webm'}),file.name.replace(/\\.[^.]+$/,'')+'-reversed.webm');URL.revokeObjectURL(source);video.remove();setStatus('Reversed video exported as WebM without audio.');};
        setStatus('Reversing frames locally. Keep this tab open until export finishes…');recorder.start();
        try{const fps=24;for(let t=end;t>=start;t-=1/fps){await seek(t);ctx.drawImage(video,0,0,canvas.width,canvas.height);await wait(1000/fps);}recorder.stop();}catch(error){recorder.stop();throw error;}
        return;
      }
      const canvas=document.createElement('canvas');canvas.width=Math.min(1920,video.videoWidth||1280);canvas.height=Math.max(1,Math.round(canvas.width*(video.videoHeight||720)/(video.videoWidth||1280)));
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas recording is unavailable.');
      const stream=canvas.captureStream(30);const capture=(video as HTMLVideoElement & {captureStream?:()=>MediaStream}).captureStream;
      if(capture)for(const track of capture.call(video).getAudioTracks())stream.addTrack(track);
      const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';
      const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks:BlobPart[]=[];let loops=0;let frame=0;
      const draw=()=>{if(video.readyState>=2)ctx.drawImage(video,0,0,canvas.width,canvas.height);if(!video.paused&&!video.ended)frame=requestAnimationFrame(draw);};
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=()=>{cancelAnimationFrame(frame);URL.revokeObjectURL(source);setStatus('The browser could not encode this video.');};
      recorder.onstop=()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(t=>t.stop());downloadBlob(new Blob(chunks,{type:'video/webm'}),file.name.replace(/\.[^.]+$/,'')+'-'+tool.slug+'.webm');URL.revokeObjectURL(source);video.remove();};
      video.currentTime=start;await new Promise<void>(resolve=>{video.onseeked=()=>resolve();});recorder.start();await video.play();draw();
      const maxLoops=tool.slug==='video-looper'?Math.max(1,Math.min(20,Number(loopCount)||3)):1;
      video.ontimeupdate=()=>{if(video.currentTime>=end){loops++;if(loops>=maxLoops){video.pause();recorder.stop();setStatus('Video processed locally. Download your WebM result below.');}else video.currentTime=start;}};
      setStatus(tool.slug==='video-looper'?'Recording repeated clip in your browser…':'Recording trimmed clip in your browser…');
    } catch(error){URL.revokeObjectURL(source);video.remove();setStatus('Could not process video: '+(error instanceof Error?error.message:'Try another file or browser.'));}
  }
  function runTextAction() {
    try {
      if (tool.slug === 'base64-tool') { if(base64Mode==='encode') setResult(btoa(unescape(encodeURIComponent(text)))); else setResult(decodeURIComponent(escape(atob(text.trim())))); }
      else if (tool.slug === 'word-counter') setResult(`Words: ${stats.words}\nCharacters: ${stats.chars}\nCharacters without spaces: ${text.replace(/\s/g, '').length}\nSentences: ${stats.sentences}\nEstimated reading time: ${Math.max(1, Math.ceil(stats.words / 200))} min`);
      else if (tool.slug === 'case-converter') setResult(text.toUpperCase() === text ? text.toLowerCase() : text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()));
      else if (tool.slug === 'json-formatter') setResult(JSON.stringify(JSON.parse(text), null, 2));
    } catch (error) { setResult(`Invalid JSON: ${error instanceof Error ? error.message : 'Please check the input.'}`); }
  }
  function runSeoAction() {
    const esc=(value:string)=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const validUrl=(value:string)=>{try{return new URL(value).toString();}catch{return ''; }};
    try {
      if(tool.slug==='url-slug-generator'){
        const slug=slugText.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
        if(!slug)throw new Error('Enter a title or phrase first.');
        setResult(slug);setStatus('Generated a clean URL slug. Review it for accuracy before publishing.');return;
      }
      if(tool.slug==='robots-txt-generator'){
        const sitemap=validUrl(seoUrl);let output='User-agent: *\n';
        if(robotsPreset==='none')output+='Disallow: /\n';
        else {output+='Allow: /\n';if(robotsPreset==='images')output+='Disallow: /*.jpg$\nDisallow: /*.png$\n';if(robotsPreset==='noai')output+='# Review individual crawler names and applicable policies before using AI crawler rules.\n';}
        if(sitemap)output+='\nSitemap: '+sitemap+'\n';
        setResult(output);setStatus('Generated a robots.txt draft. Check it against your site and hosting rules before deployment.');return;
      }
      if(tool.slug==='xml-sitemap-generator'){
        const urls=sitemapUrls.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
        if(!urls.length)throw new Error('Enter at least one absolute URL, one per line.');
        const normalized=urls.map(value=>{const u=validUrl(value);if(!u||!/^https?:/.test(u))throw new Error('Invalid absolute URL: '+value);return u;});
        const unique=[...new Set(normalized)];
        setResult('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+unique.map(u=>'  <url><loc>'+u.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</loc></url>').join('\n')+'\n</urlset>');
        setStatus('Generated XML for '+unique.length+' unique URLs. This tool does not crawl your website automatically.');return;
      }
      if(tool.slug==='schema-markup-generator'){
        const url=validUrl(seoUrl);if(!url)throw new Error('Enter a valid absolute website URL.');
        if(!schemaName.trim())throw new Error('Enter a name for the structured data.');
        const data:any={'@context':'https://schema.org','@type':schemaKind,name:schemaName.trim(),url};
        if(schemaDescription.trim())data.description=schemaDescription.trim();
        if(siteName.trim()&&schemaKind==='WebSite')data.publisher={'@type':'Organization',name:siteName.trim()};
        setResult(JSON.stringify(data,null,2));setStatus('Generated JSON-LD. Validate required properties and eligibility before publishing.');return;
      }
      if(tool.slug==='faq-schema-generator'){
        if(!faqQuestion.trim()||!faqAnswer.trim())throw new Error('Enter both a question and its answer.');
        setResult(JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':[{'@type':'Question','name':faqQuestion.trim(),'acceptedAnswer':{'@type':'Answer','text':faqAnswer.trim()}}]},null,2));
        setStatus('Generated FAQ JSON-LD. Google limits FAQ rich results eligibility; valid markup does not guarantee a rich result.');return;
      }
      const title=seoTitle.trim(),description=seoDescription.trim(),url=validUrl(seoUrl);
      if(!title&&tool.slug!=='meta-description-checker')throw new Error('Enter a page title.');
      if(!description&&tool.slug!=='title-tag-checker')throw new Error('Enter a meta description.');
      if(['meta-tag-generator','open-graph-generator'].includes(tool.slug)&&!url)throw new Error('Enter a valid absolute page URL.');
      if(tool.slug==='meta-tag-generator'){
        setResult('<title>'+esc(title)+'</title>\n<meta name="description" content="'+esc(description)+'">\n<link rel="canonical" href="'+esc(url)+'">\n<meta name="robots" content="index,follow">');
      } else if(tool.slug==='open-graph-generator'){
        setResult('<meta property="og:type" content="website">\n<meta property="og:title" content="'+esc(title)+'">\n<meta property="og:description" content="'+esc(description)+'">\n<meta property="og:url" content="'+esc(url)+'">\n<meta property="og:site_name" content="'+esc(siteName||'Website')+'">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="'+esc(title)+'">\n<meta name="twitter:description" content="'+esc(description)+'">');
      } else {
        setResult('Title: '+(title||'(not provided)')+'\nTitle length: '+title.length+' characters\nDescription: '+(description||'(not provided)')+'\nDescription length: '+description.length+' characters\nPage URL: '+(url||'(add a valid URL for a full preview)'));
      }
      setStatus('Updated locally. Character counts are guidelines, not fixed Google display limits.');
    } catch(error){setStatus(error instanceof Error?error.message:'Could not generate this SEO output.');}
  }
  function generatePassword() { const size = Math.max(8, Math.min(128, Number(length) || 16)); const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+'; const values = new Uint32Array(size); crypto.getRandomValues(values); setPassword(Array.from(values, (value) => chars[value % chars.length]).join('')); setStatus('Generated locally with your browser’s secure random generator.'); }
  const seoTool = ['meta-tag-generator','google-serp-preview','title-tag-checker','meta-description-checker','url-slug-generator','robots-txt-generator','xml-sitemap-generator','schema-markup-generator','open-graph-generator','faq-schema-generator'].includes(tool.slug);\n  const textTool = ['word-counter', 'case-converter', 'json-formatter', 'base64-tool'].includes(tool.slug);
  const fileTool = ['pdf-merger','pdf-splitter','pdf-page-extractor','pdf-rotate','image-compressor', 'image-resizer', 'image-converter', 'image-to-pdf', 'video-to-audio', 'video-clipper', 'video-reverser', 'video-looper', 'pdf-to-text', 'pdf-resizer', 'pdf-sign'].includes(tool.slug);
  return <section className="shell"><div className="workspace">
    {seoTool&&<div className="seo-workspace">
      {['meta-tag-generator','google-serp-preview','title-tag-checker','meta-description-checker','open-graph-generator'].includes(tool.slug)&&<>
        {tool.slug!=='meta-description-checker'&&<><label className="field" htmlFor="seo-title">Page title</label><input id="seo-title" className="textinput" maxLength={300} value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} placeholder="Your page title"/><p className="hint">{seoTitle.length} characters · A practical starting point is around 50–60 characters.</p></>}
        {tool.slug!=='title-tag-checker'&&<><label className="field" htmlFor="seo-description">Meta description</label><textarea id="seo-description" className="textarea" maxLength={1000} value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} placeholder="Summarize this page clearly for searchers."/><p className="hint">{seoDescription.length} characters · Around 150–160 characters is a common starting point, not a Google limit.</p></>}
        {['meta-tag-generator','google-serp-preview','open-graph-generator'].includes(tool.slug)&&<><label className="field" htmlFor="seo-url">Canonical / page URL</label><input id="seo-url" className="textinput" type="url" value={seoUrl} onChange={e=>setSeoUrl(e.target.value)} placeholder="https://example.com/page"/></>}
        {tool.slug==='open-graph-generator'&&<><label className="field" htmlFor="site-name">Website / brand name</label><input id="site-name" className="textinput" value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="Your brand"/></>}
        {['google-serp-preview','title-tag-checker','meta-description-checker'].includes(tool.slug)&&<div className="result" style={{background:'#fff',color:'#202124',border:'1px solid #e5e7eb'}}><div style={{fontSize:12,color:'#188038'}}> {seoUrl}</div><div style={{fontSize:20,color:'#1a0dab',marginTop:5}}>{seoTitle||'Your page title preview'}</div><div style={{fontSize:13,color:'#4d5156',marginTop:5}}>{seoDescription||'Your meta description preview will appear here.'}</div></div>}
      </>}
      {tool.slug==='url-slug-generator'&&<><label className="field" htmlFor="slug-text">Page title or phrase</label><textarea id="slug-text" className="textarea" value={slugText} onChange={e=>setSlugText(e.target.value)} placeholder="10 Best Ways to Improve Website SEO!"/><div className="hint">Converts to lowercase, replaces spaces with hyphens and removes unsupported punctuation.</div></>}
      {tool.slug==='robots-txt-generator'&&<><label className="field" htmlFor="robots-preset">Crawler access preset</label><select id="robots-preset" className="textinput" value={robotsPreset} onChange={e=>setRobotsPreset(e.target.value as 'all'|'none'|'images'|'noai')}><option value="all">Allow all crawlers</option><option value="none">Block all crawlers (staging only)</option><option value="images">Allow pages, block common image URLs</option><option value="noai">Allow all + review AI crawler policies</option></select><label className="field" htmlFor="seo-url">Sitemap URL (optional)</label><input id="seo-url" className="textinput" value={seoUrl} onChange={e=>setSeoUrl(e.target.value)} placeholder="https://example.com/sitemap.xml"/></>}
      {tool.slug==='xml-sitemap-generator'&&<><label className="field" htmlFor="sitemap-urls">Absolute page URLs (one per line)</label><textarea id="sitemap-urls" className="textarea" value={sitemapUrls} onChange={e=>setSitemapUrls(e.target.value)} placeholder="https://example.com/&#10;https://example.com/about"/><p className="hint">Paste canonical URLs you want included. This tool does not crawl or discover pages.</p></>}
      {tool.slug==='schema-markup-generator'&&<><label className="field" htmlFor="schema-kind">Structured data type</label><select id="schema-kind" className="textinput" value={schemaKind} onChange={e=>setSchemaKind(e.target.value as 'WebSite'|'Organization'|'Article'|'LocalBusiness'|'Product')}><option>WebSite</option><option>Organization</option><option>Article</option><option>LocalBusiness</option><option>Product</option></select><label className="field" htmlFor="schema-name">Name / headline</label><input id="schema-name" className="textinput" value={schemaName} onChange={e=>setSchemaName(e.target.value)} placeholder="Name of your site, article or business"/><label className="field" htmlFor="schema-desc">Description (optional)</label><textarea id="schema-desc" className="textarea" value={schemaDescription} onChange={e=>setSchemaDescription(e.target.value)} placeholder="Brief description"/><label className="field" htmlFor="seo-url">Canonical URL</label><input id="seo-url" className="textinput" value={seoUrl} onChange={e=>setSeoUrl(e.target.value)} placeholder="https://example.com"/></>}
      {tool.slug==='faq-schema-generator'&&<><label className="field" htmlFor="faq-question">FAQ question</label><input id="faq-question" className="textinput" value={faqQuestion} onChange={e=>setFaqQuestion(e.target.value)} placeholder="How does this product work?"/><label className="field" htmlFor="faq-answer">Answer</label><textarea id="faq-answer" className="textarea" value={faqAnswer} onChange={e=>setFaqAnswer(e.target.value)} placeholder="Provide the answer shown to users."/></>}
      <div className="actionrow"><button className="pillbtn dark" onClick={runSeoAction}>{tool.slug==='url-slug-generator'?'Generate slug':tool.slug==='robots-txt-generator'?'Generate robots.txt':tool.slug==='xml-sitemap-generator'?'Generate XML sitemap':tool.slug==='schema-markup-generator'?'Generate JSON-LD':tool.slug==='faq-schema-generator'?'Generate FAQ schema':tool.slug==='meta-tag-generator'?'Generate meta tags':tool.slug==='open-graph-generator'?'Generate social tags':'Update preview & check lengths'}</button><button className="pillbtn" onClick={()=>navigator.clipboard.writeText(result).then(()=>setStatus('Copied generated output.')).catch(()=>setStatus('Clipboard access is unavailable in this browser.'))} disabled={!result}>Copy output</button>{result&&<button className="pillbtn" onClick={()=>downloadBlob(new Blob([result],{type:tool.slug==='xml-sitemap-generator'?'application/xml':'text/plain;charset=utf-8'}),tool.slug==='xml-sitemap-generator'?'sitemap.xml':tool.slug==='robots-txt-generator'?'robots.txt':'toolforge-seo-output.txt')}>Download output ↓</button>}</div>
      {result&&<pre className="result" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{result}</pre>}
      <p className="hint">SEO helper only: generated output must be reviewed before publishing. Snippet previews are estimates; Google may rewrite titles and descriptions. Generators do not measure keyword search volume or guarantee rankings.</p>
    </div>}
    {(textTool || tool.slug === 'pdf-sign') && <><label className="field" htmlFor="tool-input">{tool.slug === 'json-formatter' ? 'JSON input' : tool.slug==='base64-tool'?'Text or Base64 input':'Your text'}</label><textarea id="tool-input" className="textarea" placeholder={tool.slug === 'json-formatter' ? '{ "hello": "world" }' : tool.slug==='base64-tool'?'Paste text to encode or Base64 to decode':'Type or paste your text here…'} value={text} onChange={(e)=>setText(e.target.value)}/>{tool.slug==='word-counter'&&<div className="trustrow" style={{justifyContent:'flex-start',marginTop:12}}><span>{stats.words} words</span><span>{stats.chars} characters</span><span>{stats.sentences} sentences</span></div>}{tool.slug==='base64-tool'&&<><label className="field" htmlFor="base64-mode">Operation</label><select id="base64-mode" className="textinput" value={base64Mode} onChange={e=>setBase64Mode(e.target.value as 'encode'|'decode')}><option value="encode">Encode text to Base64</option><option value="decode">Decode Base64 to text</option></select></>}<div className="actionrow">{tool.slug!=='pdf-sign'&&<button className="pillbtn dark" onClick={runTextAction}>{tool.slug==='json-formatter'?'Format & validate':tool.slug==='case-converter'?'Convert case':tool.slug==='base64-tool'?(base64Mode==='encode'?'Encode Base64':'Decode Base64'):'Analyze text'}</button>}<button className="pillbtn" onClick={()=>{setText('');setResult('');setStatus('');}}>Clear</button>{result&&<button className="pillbtn" onClick={()=>navigator.clipboard.writeText(result).then(()=>setStatus('Copied to clipboard.')).catch(()=>setStatus('Clipboard access is unavailable in this browser.'))}>Copy result</button>}</div>{result&&<div className="result" aria-live="polite">{result}</div>}</>}
    {fileTool && <><div className="dropzone"><div style={{fontSize:28,marginBottom:12}}>↥</div><h2>Choose a file to get started</h2><p>Files are selected locally in your browser. Nothing is uploaded by this workspace.</p><input className="fileinput" type="file" multiple={tool.slug==='pdf-merger'} accept={tool.kind==='image'?'image/*':tool.kind==='pdf'?'.pdf':'video/*,audio/*'} onChange={(e)=>{const picked=Array.from(e.target.files||[]);setSelectedFiles(picked);setFile(picked[0]||null);setStatus('');setDownloadUrl('');}}/>{file&&<p style={{marginTop:14}}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}</div>
      {['image-compressor','image-converter'].includes(tool.slug)&&<><label className="field" htmlFor="output-format">Output format</label><select id="output-format" className="textinput" value={outputFormat} onChange={(e)=>setOutputFormat(e.target.value as 'image/png' | 'image/jpeg' | 'image/webp')}><option value="image/png">PNG — lossless, larger files</option><option value="image/jpeg">JPEG — smaller photos, no transparency</option><option value="image/webp">WebP — modern, usually smaller</option></select>{outputFormat!=='image/png'&&<><label className="field" htmlFor="quality">Output quality: {Math.round(Number(quality)*100)}%</label><input id="quality" type="range" min="0.2" max="1" step="0.05" value={quality} onChange={(e)=>setQuality(e.target.value)} style={{width:'100%'}}/></>}</>}
      {tool.slug==='pdf-merger'&&<p className="hint">Select two or more PDFs. Files are merged in the order shown in the file picker.</p>}
      {tool.slug==='pdf-page-extractor'&&<><label className="field" htmlFor="page-range">Pages to extract</label><input id="page-range" className="textinput" value={pageRange} onChange={e=>setPageRange(e.target.value)} placeholder="1-3,5"/></>}
      {tool.slug==='pdf-splitter'&&<><label className="field" htmlFor="pages-per-file">Pages per output PDF</label><input id="pages-per-file" className="textinput" type="number" min="1" max="100" value={pagesPerFile} onChange={e=>setPagesPerFile(e.target.value)}/><p className="hint">Use Page Extractor to save specific page ranges into separate files.</p></>}
      {tool.slug==='pdf-rotate'&&<><label className="field" htmlFor="rotation">Rotate pages clockwise</label><select id="rotation" className="textinput" value={rotation} onChange={e=>setRotation(e.target.value)}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></>}
      {['video-clipper','video-looper','video-reverser'].includes(tool.slug)&&<div style={{display:'flex',gap:12}}><div style={{flex:1}}><label className="field" htmlFor="clip-start">Start (seconds)</label><input id="clip-start" className="textinput" type="number" min="0" step="0.1" value={clipStart} onChange={e=>setClipStart(e.target.value)}/></div><div style={{flex:1}}><label className="field" htmlFor="clip-end">End (seconds)</label><input id="clip-end" className="textinput" type="number" min="0.1" step="0.1" value={clipEnd} onChange={e=>setClipEnd(e.target.value)}/></div></div>}
      {tool.slug==='video-looper'&&<><label className="field" htmlFor="loop-count">Number of repeats (1–20)</label><input id="loop-count" className="textinput" type="number" min="1" max="20" value={loopCount} onChange={e=>setLoopCount(e.target.value)}/></>}
      {['image-resizer','pdf-resizer'].includes(tool.slug)&&<div style={{display:'flex',gap:12}}><div style={{flex:1}}><label className="field" htmlFor="width">Width {tool.slug==='pdf-resizer'?'(PDF points)':'(px)'}</label><input className="textinput" id="width" type="number" min="1" max="12000" value={width} onChange={(e)=>setWidth(e.target.value)} placeholder="e.g. 1200"/></div><div style={{flex:1}}><label className="field" htmlFor="height">Height {tool.slug==='pdf-resizer'?'(PDF points)':'(px)'}</label><input className="textinput" id="height" type="number" min="1" max="12000" value={height} onChange={(e)=>setHeight(e.target.value)} placeholder="Auto if empty"/></div></div>}
      <div className="actionrow"><button className="pillbtn dark" onClick={['video-clipper','video-looper','video-to-audio','video-reverser'].includes(tool.slug)?handleVideoAction:handleFileAction}>{tool.slug.startsWith('image-')?'Process image':tool.slug==='pdf-to-text'?'Extract text':tool.slug==='pdf-resizer'?'Resize PDF':tool.slug==='pdf-sign'?'Add signature':['video-clipper','video-looper','video-to-audio','video-reverser'].includes(tool.slug)?'Process video':'Check tool availability'}</button>{downloadUrl&&<a className="pillbtn" href={downloadUrl} download={downloadName}>Download result ↓</a>}</div><p className="hint">{['image-compressor','image-resizer','image-converter','image-to-pdf','pdf-to-text','pdf-resizer','pdf-sign','video-clipper','video-looper','video-to-audio'].includes(tool.slug)?'Processed locally in supported browsers. Video export uses WebM; audio extraction depends on browser media-capture support. PDF text extraction does not include OCR. Typed PDF signing is a visual mark, not a certificate-backed digital signature.':'This tool is listed in the ToolForge catalogue, but its full processor is not enabled yet. We show this clearly rather than pretending a conversion happened.'}</p></>}
    {tool.slug==='percentage-calculator'&&<><label className="field" htmlFor="base-amount">Value</label><input id="base-amount" className="textinput" type="number" value={baseAmount} onChange={e=>setBaseAmount(e.target.value)}/><label className="field" htmlFor="percentage">Percentage (%)</label><input id="percentage" className="textinput" type="number" value={percentage} onChange={e=>setPercentage(e.target.value)}/><div className="result">{percentage}% of {baseAmount} = {(Number(baseAmount)*Number(percentage)/100).toFixed(2)}\nAfter adding percentage: {(Number(baseAmount)*(1+Number(percentage)/100)).toFixed(2)}\nAfter subtracting percentage: {(Number(baseAmount)*(1-Number(percentage)/100)).toFixed(2)}</div></>}
    {tool.slug==='age-calculator'&&<><label className="field" htmlFor="birth-date">Date of birth</label><input id="birth-date" className="textinput" type="date" max={new Date().toISOString().slice(0,10)} value={birthDate} onChange={e=>setBirthDate(e.target.value)}/>{birthDate&&<div className="result">{(()=>{const dob=new Date(birthDate+'T00:00:00');const now=new Date();if(Number.isNaN(dob.getTime())||dob>now)return 'Choose a valid date of birth.';let years=now.getFullYear()-dob.getFullYear();let monthsAge=now.getMonth()-dob.getMonth();let days=now.getDate()-dob.getDate();if(days<0){monthsAge--;days+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}if(monthsAge<0){years--;monthsAge+=12;}const totalDays=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-dob.getTime())/86400000);return 'Age: '+years+' years, '+monthsAge+' months, '+days+' days\\nApproximate total days lived: '+totalDays.toLocaleString();})()}</div>}</>}
    {tool.slug==='qr-generator'&&<><label className="field" htmlFor="qr-input">Website URL or text</label><input id="qr-input" className="textinput" value={qrInput} onChange={e=>setQrInput(e.target.value)} placeholder="https://example.com" maxLength={2000}/><div className="actionrow"><button className="pillbtn dark" onClick={async()=>{if(!qrInput.trim()){setStatus('Enter a URL or text first.');return;}try{setQrDataUrl(await QRCode.toDataURL(qrInput.trim(),{width:640,margin:2,errorCorrectionLevel:'M'}));setStatus('QR code generated locally in your browser.');}catch{setStatus('Could not generate this QR code.');}}}>Generate QR code</button>{qrDataUrl&&<a className="pillbtn" href={qrDataUrl} download="toolforge-qr.png">Download PNG ↓</a>}</div>{qrDataUrl&&<div style={{textAlign:'center',padding:20}}><img src={qrDataUrl} alt="Generated QR code" width="240" height="240" style={{maxWidth:'100%',height:'auto'}}/></div>}<p className="hint">QR content is encoded on your device. Check the destination before sharing your code.</p></>}
    {tool.slug==='password-generator'&&<><label className="field" htmlFor="pw-length">Password length</label><input id="pw-length" className="textinput" type="number" min="8" max="128" value={length} onChange={(e)=>setLength(e.target.value)}/><div className="actionrow"><button className="pillbtn dark" onClick={generatePassword}>Generate password</button>{password&&<button className="pillbtn" onClick={()=>navigator.clipboard.writeText(password).then(()=>setStatus('Password copied.')).catch(()=>setStatus('Clipboard access is unavailable.'))}>Copy password</button>}</div>{password&&<div className="result">{password}</div>}<p className="hint">Generated on your device using the Web Crypto API. Avoid reusing passwords across accounts.</p></>}
    {tool.slug==='gst-calculator'&&<><label className="field" htmlFor="gst-amount">Amount (₹)</label><input id="gst-amount" className="textinput" type="number" min="0" value={amount} onChange={(e)=>setAmount(e.target.value)}/><label className="field" htmlFor="gst-rate">GST rate</label><select id="gst-rate" className="textinput" value={gst} onChange={(e)=>setGst(e.target.value)}>{['0','5','12','18','28'].map(v=><option key={v} value={v}>{v}%</option>)}</select><div className="result">GST amount: ₹{(Number(amount)*Number(gst)/100).toFixed(2)}\nTotal including GST: ₹{(Number(amount)*(1+Number(gst)/100)).toFixed(2)}</div></>}
    {tool.slug==='emi-calculator'&&<><label className="field" htmlFor="loan-amount">Loan amount (₹)</label><input id="loan-amount" className="textinput" type="number" min="0" value={amount} onChange={(e)=>setAmount(e.target.value)}/><label className="field" htmlFor="interest-rate">Annual interest rate (%)</label><input id="interest-rate" className="textinput" type="number" min="0" step="0.1" value={rate} onChange={(e)=>setRate(e.target.value)}/><label className="field" htmlFor="loan-months">Tenure (months)</label><input id="loan-months" className="textinput" type="number" min="1" value={months} onChange={(e)=>setMonths(e.target.value)}/><div className="result">{(()=>{const p=Number(amount),n=Math.max(1,Number(months)),r=Number(rate)/1200,emi=r===0?p/n:p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);return `Estimated monthly EMI: ₹${emi.toFixed(2)}\nTotal payment: ₹${(emi*n).toFixed(2)}\nTotal interest: ₹${(emi*n-p).toFixed(2)}`})()}</div><p className="hint">Estimate only. Actual lender charges, fees and rounding may differ.</p></>}
    {!textTool&&!seoTool&&!fileTool&&!['password-generator','gst-calculator','emi-calculator','qr-generator','percentage-calculator','age-calculator'].includes(tool.slug)&&<div className="dropzone"><h2>This tool is planned, not active yet</h2><p>We have not enabled its processor yet. We will not claim an operation succeeded until the real implementation and tests are in place.</p><Link className="pillbtn dark" href="/">Explore working tools</Link></div>}
    {status&&<div className="result" role="status">{status}</div>}
  </div><section className="faq"><h2>About this tool</h2><details open><summary>Is my file uploaded to a server?</summary><p>For the working text, password and calculator utilities, processing happens in your browser. The image utilities in this first version also process locally. Tools whose processors are not ready will tell you before claiming a result.</p></details><details><summary>Is this tool free?</summary><p>Yes. This initial ToolForge release is free to use. Any future limits or paid features will be described clearly.</p></details><details><summary>What if the result looks wrong?</summary><p>Check the input and settings, then try again. This is an early release; please do not use utility output as a substitute for professional document, financial or legal review.</p></details></section></section>;
}
