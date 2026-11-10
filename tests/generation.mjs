import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=String(4800+Math.floor(Math.random()*500));
const mockFile=pathToFileURL(path.join(root,'tests','mock-openai.mjs')).href;
const proc=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:port,OPENAI_API_KEY:'test-key-not-real',OPENAI_IMAGE_MODEL:'gpt-image-2.6-sunburst',OPENAI_IMAGE_QUALITY:'medium',NODE_OPTIONS:'--import='+mockFile},stdio:'pipe'});
try{
 let ok=false;for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,100));try{let r=await fetch(`http://127.0.0.1:${port}/api/status`);if(r.ok){ok=true;break}}catch{}}
 assert.ok(ok,'Could not start mock-backed server');
 const source=fs.readFileSync(path.join(root,'public','art','01-acid.webp'));
 const reference='data:image/webp;base64,'+source.toString('base64');
 const base={prompt:'An original experimental art direction with strange sculptural pigments and moody shadows',direction:'Black negative space and vivid acid glow',reference,feedback:'Keep tactile texture but less pink'};
 for(const [distance,revision,method] of [['reimagined',undefined,'reference-edit'],['connected',reference,'reference-edit'],['experimental',undefined,'visual-DNA-to-original']]){
   const r=await fetch(`http://127.0.0.1:${port}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json',Origin:`http://localhost:${port}`},body:JSON.stringify({...base,distance,revision})});
   const body=await r.json();
   assert.equal(r.status,200,`Generation ${distance} failed: ${JSON.stringify(body)}`);
   assert.ok(body.image.startsWith('data:image/webp;base64,'));
   assert.equal(body.method,method);
   console.log('PASS',distance,'reference image request');
 }
 let r=await fetch(`http://127.0.0.1:${port}/api/status`);let status=await r.json();assert.equal(status.remaining,7);
 r=await fetch(`http://127.0.0.1:${port}/api/generate`,{method:'POST',headers:{Origin:'https://malicious.example','Content-Type':'application/json'},body:JSON.stringify(base)});assert.equal(r.status,403);
 r=await fetch(`http://127.0.0.1:${port}/.env.example`);assert.equal(r.status,403);
 console.log('PASS: model, dual-image revisions, visual-DNA pathway, limits, origin checks.');
}finally{proc.kill()}
