'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ToolDefinition } from '@/lib/tools';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import QRCode from 'qrcode';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

type Props = { tool: ToolDefinition };
export default function ToolWorkspace({ tool }: Props) {
  const [text, setText] = useState(''); const [result, setResult] = useState(''); const [file, setFile] = useState<File | null>(null); const [quality, setQuality] = useState('0.75'); const [width, setWidth] = useState(''); const [height, setHeight] = useState(''); const [gst, setGst] = useState('18'); const [amount, setAmount] = useState('1000'); const [rate, setRate] = useState('10'); const [months, setMonths] = useState('12'); const [length, setLength] = useState('16'); const [password, setPassword] = useState(''); const [downloadUrl, setDownloadUrl] = useState(''); const [downloadName, setDownloadName] = useState('toolforge-result');
  const [status, setStatus] = useState(''); const [qrInput,setQrInput]=useState(''); const [qrDataUrl,setQrDataUrl]=useState(''); const [clipStart,setClipStart]=useState('0'); const [clipEnd,setClipEnd]=useState('10'); const [loopCount,setLoopCount]=useState('3');
  const stats = useMemo(() => ({ words: text.trim() ? text.trim().split(/\s+/).length : 0, chars: text.length, sentences: text.trim() ? (text.trim().match(/[.!?]+(?=\s|$)/g) || []).length : 0 }), [text]);
  function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); setDownloadUrl(url); setDownloadName(name); setStatus('Your file is ready. Use the download link below.'); }
  async function handleFileAction() {
    if (!file) { setStatus('Choose a file first.'); return; }
    setStatus('Processing locally in your browser…');
    try {
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
          const mime = tool.slug === 'image-converter' ? 'image/webp' : 'image/jpeg';
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(source);
            if (!blob) { setStatus('Could not create the output image. Try another file.'); return; }
            downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '-' + tool.slug + '.' + (mime === 'image/webp' ? 'webp' : 'jpg'));
            setStatus('Processed locally: ' + canvas.width + ' × ' + canvas.height + ', ' + (blob.size / 1024).toFixed(1) + ' KB. Original: ' + (file.size / 1024).toFixed(1) + ' KB.');
          }, mime, Number(quality));
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
        downloadBlob(new Blob([await pdf.save()],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-resized.pdf');
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
        downloadBlob(new Blob([await pdf.save()],{type:'application/pdf'}),file.name.replace(/\.pdf$/i,'')+'-signed.pdf');
        setStatus('Added a typed signature mark to the first page. This is not a certificate-backed digital signature.');return;
      }
      setStatus('This processor is not enabled yet. No file was uploaded and no conversion was claimed.');
    } catch (error) { setStatus('Could not process this file: '+(error instanceof Error ? error.message : 'Please check the file and try again.')); }
  }
  async function handleVideoAction() {
    if(!file){setStatus('Choose a video file first.');return;}
    if(!['video-clipper','video-looper','video-to-audio'].includes(tool.slug)){setStatus('Video reverse requires a dedicated encoder and is not enabled in this browser build.');return;}
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
      if (tool.slug === 'word-counter') setResult(`Words: ${stats.words}\nCharacters: ${stats.chars}\nCharacters without spaces: ${text.replace(/\s/g, '').length}\nSentences: ${stats.sentences}\nEstimated reading time: ${Math.max(1, Math.ceil(stats.words / 200))} min`);
      else if (tool.slug === 'case-converter') setResult(text.toUpperCase() === text ? text.toLowerCase() : text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()));
      else if (tool.slug === 'json-formatter') setResult(JSON.stringify(JSON.parse(text), null, 2));
    } catch (error) { setResult(`Invalid JSON: ${error instanceof Error ? error.message : 'Please check the input.'}`); }
  }
  function generatePassword() { const size = Math.max(8, Math.min(128, Number(length) || 16)); const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+'; const values = new Uint32Array(size); crypto.getRandomValues(values); setPassword(Array.from(values, (value) => chars[value % chars.length]).join('')); setStatus('Generated locally with your browser’s secure random generator.'); }
  const textTool = ['word-counter', 'case-converter', 'json-formatter'].includes(tool.slug);
  const fileTool = ['image-compressor', 'image-resizer', 'image-converter', 'image-to-pdf', 'video-to-audio', 'video-clipper', 'video-reverser', 'video-looper', 'pdf-to-text', 'pdf-resizer', 'pdf-sign'].includes(tool.slug);
  return <section className="shell"><div className="workspace">
    {(textTool || tool.slug === 'pdf-sign') && <><label className="field" htmlFor="tool-input">{tool.slug === 'json-formatter' ? 'JSON input' : 'Your text'}</label><textarea id="tool-input" className="textarea" placeholder={tool.slug === 'json-formatter' ? '{ "hello": "world" }' : 'Type or paste your text here…'} value={text} onChange={(e)=>setText(e.target.value)}/>{tool.slug==='word-counter'&&<div className="trustrow" style={{justifyContent:'flex-start',marginTop:12}}><span>{stats.words} words</span><span>{stats.chars} characters</span><span>{stats.sentences} sentences</span></div>}<div className="actionrow"><button className="pillbtn dark" onClick={runTextAction}>{tool.slug==='json-formatter'?'Format & validate':tool.slug==='case-converter'?'Convert case':tool.slug==='pdf-sign'?'Use as signature':'Analyze text'}</button><button className="pillbtn" onClick={()=>{setText('');setResult('');setStatus('');}}>Clear</button>{result&&<button className="pillbtn" onClick={()=>navigator.clipboard.writeText(result).then(()=>setStatus('Copied to clipboard.')).catch(()=>setStatus('Clipboard access is unavailable in this browser.'))}>Copy result</button>}</div>{result&&<div className="result" aria-live="polite">{result}</div>}</>}
    {fileTool && <><div className="dropzone"><div style={{fontSize:28,marginBottom:12}}>↥</div><h2>Choose a file to get started</h2><p>Files are selected locally in your browser. Nothing is uploaded by this workspace.</p><input className="fileinput" type="file" accept={tool.kind==='image'?'image/*':tool.kind==='pdf'?'.pdf':'video/*,audio/*'} onChange={(e)=>{setFile(e.target.files?.[0]||null);setStatus('');setDownloadUrl('');}}/>{file&&<p style={{marginTop:14}}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}</div>
      {['image-compressor','image-converter'].includes(tool.slug)&&<><label className="field" htmlFor="quality">Output quality: {Math.round(Number(quality)*100)}%</label><input id="quality" type="range" min="0.2" max="1" step="0.05" value={quality} onChange={(e)=>setQuality(e.target.value)} style={{width:'100%'}}/></>}
      {['image-resizer','pdf-resizer'].includes(tool.slug)&&<div style={{display:'flex',gap:12}}><div style={{flex:1}}><label className="field" htmlFor="width">Width {tool.slug==='pdf-resizer'?'(PDF points)':'(px)'}</label><input className="textinput" id="width" type="number" min="1" max="12000" value={width} onChange={(e)=>setWidth(e.target.value)} placeholder="e.g. 1200"/></div><div style={{flex:1}}><label className="field" htmlFor="height">Height {tool.slug==='pdf-resizer'?'(PDF points)':'(px)'}</label><input className="textinput" id="height" type="number" min="1" max="12000" value={height} onChange={(e)=>setHeight(e.target.value)} placeholder="Auto if empty"/></div></div>}
      <div className="actionrow"><button className="pillbtn dark" onClick={['video-clipper','video-looper','video-to-audio'].includes(tool.slug)?handleVideoAction:handleFileAction}>{tool.slug.startsWith('image-')?'Process image':tool.slug==='pdf-to-text'?'Extract text':tool.slug==='pdf-resizer'?'Resize PDF':tool.slug==='pdf-sign'?'Add signature':['video-clipper','video-looper','video-to-audio'].includes(tool.slug)?'Process video':'Check tool availability'}</button>{downloadUrl&&<a className="pillbtn" href={downloadUrl} download={downloadName}>Download result ↓</a>}</div><p className="hint">{['image-compressor','image-resizer','image-converter','image-to-pdf','pdf-to-text','pdf-resizer','pdf-sign','video-clipper','video-looper','video-to-audio'].includes(tool.slug)?'Processed locally in supported browsers. Video export uses WebM; audio extraction depends on browser media-capture support. PDF text extraction does not include OCR. Typed PDF signing is a visual mark, not a certificate-backed digital signature.':'This tool is listed in the ToolForge catalogue, but its full processor is not enabled yet. We show this clearly rather than pretending a conversion happened.'}</p></>}
    {tool.slug==='qr-generator'&&<><label className="field" htmlFor="qr-input">Website URL or text</label><input id="qr-input" className="textinput" value={qrInput} onChange={e=>setQrInput(e.target.value)} placeholder="https://example.com" maxLength={2000}/><div className="actionrow"><button className="pillbtn dark" onClick={async()=>{if(!qrInput.trim()){setStatus('Enter a URL or text first.');return;}try{setQrDataUrl(await QRCode.toDataURL(qrInput.trim(),{width:640,margin:2,errorCorrectionLevel:'M'}));setStatus('QR code generated locally in your browser.');}catch{setStatus('Could not generate this QR code.');}}}>Generate QR code</button>{qrDataUrl&&<a className="pillbtn" href={qrDataUrl} download="toolforge-qr.png">Download PNG ↓</a>}</div>{qrDataUrl&&<div style={{textAlign:'center',padding:20}}><img src={qrDataUrl} alt="Generated QR code" width="240" height="240" style={{maxWidth:'100%',height:'auto'}}/></div>}<p className="hint">QR content is encoded on your device. Check the destination before sharing your code.</p></>}
    {tool.slug==='password-generator'&&<><label className="field" htmlFor="pw-length">Password length</label><input id="pw-length" className="textinput" type="number" min="8" max="128" value={length} onChange={(e)=>setLength(e.target.value)}/><div className="actionrow"><button className="pillbtn dark" onClick={generatePassword}>Generate password</button>{password&&<button className="pillbtn" onClick={()=>navigator.clipboard.writeText(password).then(()=>setStatus('Password copied.')).catch(()=>setStatus('Clipboard access is unavailable.'))}>Copy password</button>}</div>{password&&<div className="result">{password}</div>}<p className="hint">Generated on your device using the Web Crypto API. Avoid reusing passwords across accounts.</p></>}
    {tool.slug==='gst-calculator'&&<><label className="field" htmlFor="gst-amount">Amount (₹)</label><input id="gst-amount" className="textinput" type="number" min="0" value={amount} onChange={(e)=>setAmount(e.target.value)}/><label className="field" htmlFor="gst-rate">GST rate</label><select id="gst-rate" className="textinput" value={gst} onChange={(e)=>setGst(e.target.value)}>{['0','5','12','18','28'].map(v=><option key={v} value={v}>{v}%</option>)}</select><div className="result">GST amount: ₹{(Number(amount)*Number(gst)/100).toFixed(2)}\nTotal including GST: ₹{(Number(amount)*(1+Number(gst)/100)).toFixed(2)}</div></>}
    {tool.slug==='emi-calculator'&&<><label className="field" htmlFor="loan-amount">Loan amount (₹)</label><input id="loan-amount" className="textinput" type="number" min="0" value={amount} onChange={(e)=>setAmount(e.target.value)}/><label className="field" htmlFor="interest-rate">Annual interest rate (%)</label><input id="interest-rate" className="textinput" type="number" min="0" step="0.1" value={rate} onChange={(e)=>setRate(e.target.value)}/><label className="field" htmlFor="loan-months">Tenure (months)</label><input id="loan-months" className="textinput" type="number" min="1" value={months} onChange={(e)=>setMonths(e.target.value)}/><div className="result">{(()=>{const p=Number(amount),n=Math.max(1,Number(months)),r=Number(rate)/1200,emi=r===0?p/n:p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);return `Estimated monthly EMI: ₹${emi.toFixed(2)}\nTotal payment: ₹${(emi*n).toFixed(2)}\nTotal interest: ₹${(emi*n-p).toFixed(2)}`})()}</div><p className="hint">Estimate only. Actual lender charges, fees and rounding may differ.</p></>}
    {!textTool&&!fileTool&&!['password-generator','gst-calculator','emi-calculator','qr-generator'].includes(tool.slug)&&<div className="dropzone"><h2>This tool is planned, not active yet</h2><p>We have not enabled its processor yet. We will not claim an operation succeeded until the real implementation and tests are in place.</p><Link className="pillbtn dark" href="/">Explore working tools</Link></div>}
    {status&&<div className="result" role="status">{status}</div>}
  </div><section className="faq"><h2>About this tool</h2><details open><summary>Is my file uploaded to a server?</summary><p>For the working text, password and calculator utilities, processing happens in your browser. The image utilities in this first version also process locally. Tools whose processors are not ready will tell you before claiming a result.</p></details><details><summary>Is this tool free?</summary><p>Yes. This initial ToolForge release is free to use. Any future limits or paid features will be described clearly.</p></details><details><summary>What if the result looks wrong?</summary><p>Check the input and settings, then try again. This is an early release; please do not use utility output as a substitute for professional document, financial or legal review.</p></details></section></section>;
}
