const KEY='skybitsScannerRuns';
const getRuns=()=>chrome.storage.local.get(KEY).then(x=>x[KEY]||[]);
const saveRuns=r=>chrome.storage.local.set({[KEY]:r.slice(0,20)});
const active=()=>chrome.tabs.query({active:true,currentWindow:true}).then(x=>x[0]);
function send(tabId,msg){return new Promise((resolve,reject)=>chrome.tabs.sendMessage(tabId,msg,r=>{if(chrome.runtime.lastError)reject(new Error(chrome.runtime.lastError.message));else resolve(r)}))}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function waitTab(tabId,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){const t=await chrome.tabs.get(tabId);if(t.status==='complete')return t;await wait(250)}throw Error('Timed out waiting for tab')}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 (async()=>{
  const tab=await active();if(!tab?.id)throw Error('No active tab');
  if(m.cmd==='scanCurrent'){const r=await send(tab.id,{cmd:'scanPage'});if(r?.error)throw Error(r.error);await saveRuns([r,...await getRuns()]);return r}
  if(m.cmd==='scanAll'){const page=await send(tab.id,{cmd:'scanPage'});if(page?.error)throw Error(page.error);const inv=await send(tab.id,{cmd:'scanInventory'});if(inv?.error)throw Error(inv.error);const r={kind:'full-scan',time:new Date().toISOString(),page,inventory:inv};await saveRuns([r,...await getRuns()]);return r}
  if(m.cmd==='openAndScan'){
   const snap=await send(tab.id,{cmd:'scanPage'});if(snap?.error)throw Error(snap.error);
   const origin=new URL(tab.url).origin, candidates=[],seen=new Set();
   for(const x of snap.snapshot?.links||[]){try{if(!x.href||new URL(x.href).origin!==origin)continue;if(!/skybits|asset|load|tracking|landmark|fleet/i.test((x.href||'')+' '+(x.text||'')))continue;if(seen.has(x.href))continue;seen.add(x.href);candidates.push(x);if(candidates.length>=50)break}catch(e){}}
   const results=[];
   for(const c of candidates){let id=null;try{id=(await chrome.tabs.create({url:c.href,active:false})).id;await waitTab(id);const ok=await send(id,{cmd:'isSkybits'});if(!ok?.skybits){results.push({url:c.href,skipped:'not confirmed Skybits'});continue}results.push({url:c.href,scan:await send(id,{cmd:'scanPage'})})}catch(e){results.push({url:c.href,error:String(e)})}finally{if(id)try{await chrome.tabs.remove(id)}catch(e){}}}
   const r={kind:'opened-pages',time:new Date().toISOString(),count:results.length,results};await saveRuns([r,...await getRuns()]);return r;
  }
  throw Error('Unknown command');
 })().then(reply).catch(e=>reply({error:String(e)}));return true;
});
