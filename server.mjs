/** MISRULE / DRIFT × LIVING EDITIONS
 * Local, zero-dependency server for the editor and reference-guided image generations.
 * IMPORTANT: Not public-production-ready: no authentication or persistent billing controls.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
try {
  const env=fs.readFileSync(path.join(ROOT,'.env'),'utf8');
  for(const line of env.split(/\r?\n/)){
    const match=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(match && !process.env[match[1]]) process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
}catch{}
const PORT=Number(process.env.PORT)||4317;
const KEY=process.env.OPENAI_API_KEY||'';
const MODELS=new Set(['gpt-image-2.6-sunburst','gpt-image-2.6-flare','gpt-image-2.5-sunburst','gpt-image-2.5-flare']);
const MODEL=MODELS.has(process.env.OPENAI_IMAGE_MODEL)?process.env.OPENAI_IMAGE_MODEL:'gpt-image-2.6-sunburst';
const QUALITY=['low','medium','high'].includes(process.env.OPENAI_IMAGE_QUALITY)?process.env.OPENAI_IMAGE_QUALITY:'medium';
const VISION_MODEL=process.env.OPENAI_VISION_MODEL||'gpt-6-luna';
const styleCache=new Map();
const LIMIT=Math.max(1,Math.min(30,Number(process.env.DRIFT_MAX_GENERATIONS)||10));
let requests=0,busy=false;
const mime={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon'};
const respond=(res,status,data,type='application/json')=>{
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(type==='application/json'?JSON.stringify(data):data);
};
const distances={
  connected:'Keep the visual DNA conspicuous: a related palette, physical texture, contrast and rhythmic gesture family. Recompose the spatial layout, focal point, silhouette and visual structures; it must be recognisably related but a NEW artwork, not an edited duplicate.',
  reimagined:'Take the reference as an ART DIRECTION BOARD rather than a template. Carry across its approximate palette, materiality, energy, lighting and artistic tension; use substantially different motifs, forms, focal point, depth and composition. The new work should feel like a sibling, not a reproduction.',
  experimental:'Extract only the most abstract qualities — mood, energy, selected pigments, material texture and rhythm — and invent an unexpected, original visual language with new geometry, focal subjects and spatial structure. Do not reconstruct recognisable structures from the source.'
};
function dataImage(data,label){
  if(typeof data!=='string')throw Object.assign(Error(`Missing ${label} image`),{status:400});
  const match=data.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)throw Object.assign(Error(`Invalid ${label} image; use PNG, JPEG or WebP.`),{status:400});
  const buffer=Buffer.from(match[2],'base64');
  if(!buffer.length||buffer.length>8_000_000)throw Object.assign(Error(`${label} image must be under 8 MB.`),{status:413});
  return {buffer,type:match[1],ext:match[1]==='image/jpeg'?'jpg':match[1].split('/')[1]};
}
function makePrompt({prompt,direction,feedback,variation,distance,revision}){
  const variationBrief=variation%2===0
    ? 'VERSION A: make the primary visual gesture bold and concentrated, with unexpected scale, editorial negative space and a distinct new silhouette.'
    : 'VERSION B: take a radically different compositional route: distributed / layered structures, a new focal point, surprising depth and a different balance between density and emptiness.';
  return `Create ONE original, art-directed, editorial artwork inspired by supplied image references. The original reference is a source of visual character, NOT a composition to reproduce.

ARTISTIC DISTANCE: ${distances[distance]||distances.reimagined}

${revision?'IMAGE 1 is the original reference for the artistic DNA. IMAGE 2 is the current study to revise based on human feedback. Use the review note to change that study, but create a new variation instead of making a tiny cosmetic edit.':'IMAGE 1 is the original reference artwork. Generate a materially NEW artwork derived from its high-level aesthetic cues.'}

Creative direction: ${direction}.
Project brief: ${prompt}.
${feedback?'REVIEWER FEEDBACK — PRIORITY: '+feedback+'.':'No review feedback yet.'}
${variationBrief}

OUTPUT RULES: New composition, spatial arrangement, visual subject, silhouette and identifiable structures. Do not trace, duplicate, crop, lightly recolour or replicate the reference. Avoid exact positioning of distinctive motifs. Do not recreate logos, writing, watermarks, or identifiable people. No text or typography — our campaign compositor adds editable type later. Sophisticated physical textures, intentional imperfections and strong art direction rather than generic AI patterns. Output one complete square image.`;
}
async function visualDNA(source){
  const id=createHash('sha256').update(source.buffer).digest('hex');
  if(styleCache.has(id))return styleCache.get(id);
  const url=`data:${source.type};base64,${source.buffer.toString('base64')}`;
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},
    body:JSON.stringify({model:VISION_MODEL,max_output_tokens:1200,input:[{role:'user',content:[
      {type:'input_text',text:'Look at this image solely as art direction. Write a 100–170 word visual DNA description: a small precise palette, tonal contrast, surface materials, texture, mark-making, spatial energy, light, mood and visual rhythm. Avoid reconstructing its particular layout, subject, recognisable objects, identities, logo, or exact motifs. No artist names. Describe an aesthetic that could be used to create entirely NEW work. Return only the description.'},
      {type:'input_image',image_url:url,detail:'low'}
    ]}]}),signal:AbortSignal.timeout(90000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(Error('Visual analysis failed: '+(data.error?.message||response.status)),{status:502});
  const text=(data.output||[]).flatMap(o=>o.content||[]).find(part=>part.type==='output_text')?.text||data.output_text;
  if(!text||text.length<50)throw Object.assign(Error('Visual analysis returned no usable creative direction.'),{status:502});
  if(styleCache.size>25)styleCache.delete(styleCache.keys().next().value);
  styleCache.set(id,text.slice(0,1600));
  return text.slice(0,1600);
}
async function generate(body){
  const prompt=String(body.prompt||'').slice(0,1600).trim();
  const direction=String(body.direction||'').slice(0,1500).trim();
  const feedback=String(body.feedback||'').slice(0,950).trim();
  const variation=Number(body.variation)||0;
  const distance=String(body.distance||'reimagined');
  if(!prompt||prompt.length<10)throw Object.assign(Error('Please add a generation brief of at least 10 characters.'),{status:400});
  if(!distances[distance])throw Object.assign(Error('Unknown reference relationship.'),{status:400});
  if(!KEY)throw Object.assign(Error('Add OPENAI_API_KEY to .env and restart DRIFT. Demo mode is free.'),{status:503});
  if(requests>=LIMIT)throw Object.assign(Error('Local AI generation limit reached. Restart only after checking your API spend.'),{status:429});
  if(busy)throw Object.assign(Error('Another image is generating. Try again when it finishes.'),{status:429});
  const ref=dataImage(body.reference,'Reference');
  const revision=body.revision?dataImage(body.revision,'Selected study'):null;
  requests++;
  busy=true;
  try{
    let endpoint,bodyData,headers;
    if(distance==='experimental'){
      // Do not send the reference to the image generator. Instead, independently
      // describe its artistic qualities to produce a genuinely new composition.
      const dna=await visualDNA(ref);
      const revisionDNA=revision?await visualDNA(revision):'';
      const generationPrompt=makePrompt({prompt,direction,feedback,variation,distance,revision:!!revision})
        +'\n\nVISUAL DNA FROM ART DIRECTION ANALYSIS: '+dna
        +(revisionDNA?'\n\nTHE REVIEWED STUDY HAD THESE QUALITIES (revise per feedback without copying it): '+revisionDNA:'');
      endpoint='https://api.openai.com/v1/images/generations';
      headers={'Content-Type':'application/json',Authorization:`Bearer ${KEY}`};
      bodyData=JSON.stringify({model:MODEL,prompt:generationPrompt,size:'1024x1024',quality:QUALITY,complexity:'medium',output_format:'webp',output_compression:88,n:1});
    }else{
      const form=new FormData();
      form.append('model',MODEL);
      form.append('prompt',makePrompt({prompt,direction,feedback,variation,distance,revision:!!revision}));
      form.append('size','1024x1024');
      form.append('quality',QUALITY);
      form.append('complexity','medium');
      form.append('output_format','webp');
      form.append('output_compression','88');
      form.append('image',new Blob([ref.buffer],{type:ref.type}),`reference.${ref.ext}`);
      if(revision)form.append('image',new Blob([revision.buffer],{type:revision.type}),`current-study.${revision.ext}`);
      endpoint='https://api.openai.com/v1/images/edits';
      headers={Authorization:`Bearer ${KEY}`};
      bodyData=form;
    }
    const response=await fetch(endpoint,{
      method:'POST',headers,body:bodyData,signal:AbortSignal.timeout(180000)
    });
    let result;
    try{result=await response.json()}catch{throw Object.assign(Error('Image API did not return JSON.'),{status:502})}
    if(!response.ok)throw Object.assign(Error(result.error?.message||`Image service returned ${response.status}`),{status:502});
    const image=result.data?.[0];
    if(!image?.b64_json)throw Object.assign(Error('Image API returned no usable image.'),{status:502});
    return {image:`data:image/webp;base64,${image.b64_json}`,model:MODEL,quality:QUALITY,method:distance==='experimental'?'visual-DNA-to-original':'reference-edit',remaining:Math.max(0,LIMIT-requests)};
  }finally{busy=false}
}
const server=http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=new URL(req.url,'http://localhost').pathname}catch{return respond(res,400,{error:'Bad URL'})}
  if(pathname==='/api/status'&&req.method==='GET')return respond(res,200,{enabled:!!KEY,model:KEY?MODEL:null,quality:QUALITY,remaining:Math.max(0,LIMIT-requests)});
  if(pathname==='/api/generate'&&req.method==='POST'){
    // This check helps prevent accidental browser cross-origin requests. It is not authentication.
    const origin=req.headers.origin;
    if(origin&&!['http://localhost:'+PORT,'http://127.0.0.1:'+PORT].includes(origin))return respond(res,403,{error:'AI generation is restricted to this local studio.'});
    let raw='';
    try{
      for await(const chunk of req){raw+=chunk;if(raw.length>18_000_000)throw Object.assign(Error('Request too large.'),{status:413})}
      return respond(res,200,await generate(JSON.parse(raw)));
    }catch(e){console.error('[DRIFT AI]',e.message);return respond(res,e.status||500,{error:e instanceof SyntaxError?'Invalid request JSON.':e.message})}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,{error:'Method not allowed'});
  let rel;
  try{rel=decodeURIComponent(pathname==='/'?'/index.html':pathname)}catch{return respond(res,400,{error:'Malformed path'})}
  const file=path.resolve(ROOT,'.'+rel);
  if(!file.startsWith(ROOT+path.sep)||path.basename(file).startsWith('.')||['.env','.mjs','.command'].includes(path.extname(file))||file===path.join(ROOT,'README.md'))return respond(res,403,{error:'Forbidden'});
  try{const st=fs.statSync(file);if(!st.isFile())throw Error('Not file');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res)}catch{return respond(res,404,{error:'Not found'})}
});
server.listen(PORT,'127.0.0.1',()=>console.log(`MISRULE / DRIFT → http://localhost:${PORT}\nAI: ${KEY?MODEL+' / '+QUALITY:'DEMO MODE — no API key'}\nSession cap: ${LIMIT} image generations.`));
