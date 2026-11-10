import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=String(4200+Math.floor(Math.random()*500));
const proc=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:port,OPENAI_API_KEY:''},stdio:'pipe'});
try{
 let ready=false;for(let i=0;i<35;i++){await new Promise(r=>setTimeout(r,120));try{let r=await fetch(`http://127.0.0.1:${port}/api/status`);if(r.ok){ready=true;break}}catch{}}
 assert.ok(ready,'local test server did not start');
 for(const [u,type] of [['/','text/html'],['/src/app.js','text/javascript'],['/src/styles.css','text/css'],['/public/art/01-acid.webp','image/webp']]){
  let r=await fetch(`http://127.0.0.1:${port}${u}`);assert.equal(r.status,200,`HTTP ${u}`);assert.ok(r.headers.get('content-type').includes(type),`MIME ${u}`);assert.ok((await r.arrayBuffer()).byteLength>400,`nonempty ${u}`);console.log('OK',u)
 }
 let status=await(await fetch(`http://127.0.0.1:${port}/api/status`)).json();assert.equal(status.enabled,false);
 let r=await fetch(`http://127.0.0.1:${port}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'test'})});assert.equal(r.status,400);
 let forbidden=await fetch(`http://127.0.0.1:${port}/.env.example`);assert.equal(forbidden.status,403);
 assert.equal(fs.readdirSync(path.join(root,'public','art')).filter(x=>x.endsWith('.webp')).length,8);
 console.log('PASS: DRIFT + LIVING EDITIONS server, art assets and API-key protection.');
}finally{proc.kill()}
