/** Intercept paid OpenAI requests so generation integration tests cost $0. */
const oldFetch=globalThis.fetch;
const mockImage=Buffer.from('mock-output-image').toString('base64');
globalThis.fetch=async (url,options={})=>{
  if(!String(url).startsWith('https://api.openai.com/')) return oldFetch(url,options);
  if(String(url).endsWith('/responses')){
    const body=JSON.parse(options.body);
    if(body.model!=='gpt-6-luna'||body.input[0].content[1].type!=='input_image')throw Error('Vision request misconfigured');
    return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Muted fluorescent citrus yellow against near-black, with fine analog granulation, imperfect studio print texture, strong dark negative space and irregular tactile optical shapes. The visual rhythm is asymmetric and the lighting is concentrated, almost backlit.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(String(url).endsWith('/images/edits')){
    const form=options.body;
    if(!(form instanceof FormData))throw Error('Edits must use FormData');
    const prompt=form.get('prompt');
    if(!prompt.includes('new composition')&&!prompt.includes('NEW artwork'))throw Error('Prompt not asking for novel work');
    if(form.get('model')!=='gpt-image-2.6-sunburst')throw Error('Wrong model');
    if(form.get('quality')!=='medium')throw Error('Wrong quality');
    if(form.getAll('image').length<1||form.getAll('image').length>2)throw Error('Incorrect source image count');
    if(prompt.includes('IMAGE 2')&&form.getAll('image').length!==2)throw Error('Missing selected image for revision');
    return new Response(JSON.stringify({data:[{b64_json:mockImage}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(String(url).endsWith('/images/generations')){
    const body=JSON.parse(options.body);
    if(body.model!=='gpt-image-2.6-sunburst'||body.prompt.length<300||!body.prompt.includes('VISUAL DNA'))throw Error('Experimental generation missing visual DNA');
    return new Response(JSON.stringify({data:[{b64_json:mockImage}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  throw Error('Unexpected API call: '+url);
};
