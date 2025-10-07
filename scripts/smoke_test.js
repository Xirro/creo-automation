const http = require('http');
function req(path){
  return new Promise((res,rej)=>{
    http.get({host:'localhost',port:3000,path:path,agent:false}, (r)=>{
      const chunks=[]; r.on('data',c=>chunks.push(c)); r.on('end',()=>res({status:r.statusCode, body:Buffer.concat(chunks).toString().slice(0,200)}));
    }).on('error',e=>rej(e));
  });
}
(async()=>{
  try{
    console.log('GET /login'); console.log(await req('/login'));
    console.log('GET /submittal'); console.log(await req('/submittal'));
  }catch(e){console.error('smoke test error',e)}
})();
