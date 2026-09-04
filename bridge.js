(()=>{
  const SOURCE='SKYBITS_LEGACY_DEEP_SCANNER';
  const MAX=2_000_000;
  const interesting=u=>/\/api\//i.test(String(u||''));
  const emit=payload=>{try{window.postMessage({source:SOURCE,payload},'*')}catch(e){}};
  const clip=s=>String(s??'').slice(0,MAX);
  const fetch0=window.fetch;
  if(fetch0){
    window.fetch=async function(...args){
      const started=Date.now(), req=args[0], init=args[1]||{};
      let url=''; try{url=typeof req==='string'?req:req?.url||''}catch(e){}
      const method=String(init.method||req?.method||'GET').toUpperCase();
      let requestBody=null; try{requestBody=typeof init.body==='string'?init.body:null}catch(e){}
      try{
        const res=await fetch0.apply(this,args);
        if(interesting(url)){
          let body=''; try{body=await res.clone().text()}catch(e){}
          emit({kind:'network',transport:'fetch',url,method,status:res.status,contentType:res.headers.get('content-type')||'',durationMs:Date.now()-started,requestBody:clip(requestBody),responseBody:clip(body),truncated:String(body).length>MAX,time:Date.now()});
        }
        return res;
      }catch(err){
        if(interesting(url)) emit({kind:'network_error',transport:'fetch',url,method,error:String(err),durationMs:Date.now()-started,time:Date.now()});
        throw err;
      }
    };
  }
  const open0=XMLHttpRequest.prototype.open, send0=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...rest){this.__skyScan={method:String(method||'GET').toUpperCase(),url:String(url||'')};return open0.call(this,method,url,...rest)};
  XMLHttpRequest.prototype.send=function(body){
    const meta=this.__skyScan||{}, started=Date.now();
    this.addEventListener('load',()=>{
      if(!interesting(meta.url))return;
      let text='';try{text=String(this.responseText||'')}catch(e){}
      emit({kind:'network',transport:'xhr',url:meta.url,method:meta.method,status:this.status,contentType:this.getResponseHeader('content-type')||'',durationMs:Date.now()-started,requestBody:clip(typeof body==='string'?body:null),responseBody:clip(text),truncated:text.length>MAX,time:Date.now()});
    },{once:true});
    return send0.call(this,body);
  };
})();
