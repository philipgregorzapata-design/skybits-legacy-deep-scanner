const RUNS='skybitsScannerRuns';
const SETTINGS='skybitsScannerSettings';
const DB_NAME='SkybitsLegacyDiscovery';
const DB_VERSION=1;
const MAX_RECORDS=10000;
const MAX_NETWORK=7000;
const MAX_PAGES=1500;
const MAX_BYTES=45*1024*1024;

const getRuns=()=>chrome.storage.local.get(RUNS).then(x=>x[RUNS]||[]);
const saveRuns=r=>chrome.storage.local.set({[RUNS]:r.slice(0,20)});
const getSettings=()=>chrome.storage.local.get(SETTINGS).then(x=>x[SETTINGS]||{autoRecord:true});
const setSettings=s=>chrome.storage.local.set({[SETTINGS]:s});
const active=()=>chrome.tabs.query({active:true,currentWindow:true}).then(x=>x[0]);
function send(tabId,msg){return new Promise((resolve,reject)=>chrome.tabs.sendMessage(tabId,msg,r=>{if(chrome.runtime.lastError)reject(new Error(chrome.runtime.lastError.message));else resolve(r)}))}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function waitTab(tabId,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){const t=await chrome.tabs.get(tabId);if(t.status==='complete')return t;await wait(250)}throw Error('Timed out waiting for tab')}

let dbPromise=null;
function db(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('records')){const s=d.createObjectStore('records',{keyPath:'id',autoIncrement:true});s.createIndex('kind','kind');s.createIndex('time','time');s.createIndex('url','url')}};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });return dbPromise;
}
async function putRecord(record){
 const d=await db();record.time=record.time||new Date().toISOString();
 return new Promise((resolve,reject)=>{const tx=d.transaction('records','readwrite');tx.objectStore('records').add(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}).then(trimDB);
}
async function countRecords(){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction('records','readonly'),r=tx.objectStore('records').count();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function trimDB(){
 const count=await countRecords();if(count<=MAX_RECORDS)return;
 const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('records','readwrite'),s=tx.objectStore('records'),cur=s.openCursor();let n=count-MAX_RECORDS;cur.onsuccess=()=>{const c=cur.result;if(!c||n<=0){resolve();return}c.delete();n--;c.continue()};cur.onerror=()=>reject(cur.error)});
}
async function allRecords(){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction('records','readonly'),r=tx.objectStore('records').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function clearDB(){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction('records','readwrite');tx.objectStore('records').clear();tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}

async function recordNetwork(payload){
 const settings=await getSettings();if(!settings.autoRecord)return;
 const p=payload||{};
 await putRecord({kind:'network',time:new Date(p.time||Date.now()).toISOString(),url:p.url||'',method:p.method||'',status:p.status??null,transport:p.transport||'',contentType:p.contentType||'',durationMs:p.durationMs??null,requestBody:p.requestBody||null,responseBody:p.responseBody||'',truncated:!!p.truncated,error:p.error||null});
}
async function recordPage(tabId){
 const settings=await getSettings();if(!settings.autoRecord)return null;
 try{const r=await send(tabId,{cmd:'scanPage'});if(r?.error)throw Error(r.error);const s=r.snapshot;if(!s?.skybits)return null;
  const slim={...s,html:String(s.html||'').slice(0,1000000),bodyText:String(s.bodyText||'').slice(0,500000)};
  await putRecord({kind:'page',time:s.time||new Date().toISOString(),url:s.url,title:s.title,hostname:s.hostname,snapshot:slim,networkCount:r.network?.length||0});
  return r;
 }catch(e){return {error:String(e)}}
}

chrome.tabs.onUpdated.addListener(async(tabId,changeInfo,tab)=>{
 if(changeInfo.status!=='complete'||!tab?.url||!/^https?:/i.test(tab.url))return;
 const settings=await getSettings();if(!settings.autoRecord)return;
 setTimeout(()=>recordPage(tabId).catch(()=>{}),500);
});

chrome.runtime.onMessage.addListener((m,s,reply)=>{
 (async()=>{
  if(m?.cmd==='recordNetwork'){await recordNetwork(m.payload);return{ok:true}}
  if(m?.cmd==='recordPage'){const r=await recordPage(s.tab?.id);return r||{ok:true}}
  if(m?.cmd==='getRecorderStatus'){const st=await getSettings(),count=await countRecords();return{autoRecord:st.autoRecord!==false,records:count}}
  if(m?.cmd==='setRecorder'){const st=await getSettings();st.autoRecord=!!m.value;await setSettings(st);return{autoRecord:st.autoRecord}}
  if(m?.cmd==='exportDB'){const records=await allRecords();return{kind:'skybits-discovery-database',version:1,exportedAt:new Date().toISOString(),recordCount:records.length,records}}
  if(m?.cmd==='clearDB'){await clearDB();return{ok:true}}

  const tab=await active();if(!tab?.id)throw Error('No active tab');
  if(m.cmd==='scanCurrent'){const r=await send(tab.id,{cmd:'scanPage'});if(r?.error)throw Error(r.error);await saveRuns([r,...await getRuns()]);return r}
  if(m.cmd==='scanAll'){const page=await send(tab.id,{cmd:'scanPage'});if(page?.error)throw Error(page.error);const inv=await send(tab.id,{cmd:'scanInventory'});if(inv?.error)throw Error(inv.error);const r={kind:'full-scan',time:new Date().toISOString(),page,inventory:inv};await saveRuns([r,...await getRuns()]);return r}
  if(m.cmd==='openAndScan'){
   const snap=await send(tab.id,{cmd:'scanPage'});if(snap?.error)throw Error(snap.error);
   const origin=new URL(tab.url).origin,candidates=[],seen=new Set();
   for(const x of snap.snapshot?.links||[]){try{if(!x.href||new URL(x.href).origin!==origin)continue;if(!/skybits|asset|load|tracking|landmark|fleet/i.test((x.href||'')+' '+(x.text||'')))continue;if(seen.has(x.href))continue;seen.add(x.href);candidates.push(x);if(candidates.length>=50)break}catch(e){}}
   const results=[];
   for(const c of candidates){let id=null;try{id=(await chrome.tabs.create({url:c.href,active:false})).id;await waitTab(id);const ok=await send(id,{cmd:'isSkybits'});if(!ok?.skybits){results.push({url:c.href,skipped:'not confirmed Skybits'});continue}results.push({url:c.href,scan:await send(id,{cmd:'scanPage'})})}catch(e){results.push({url:c.href,error:String(e)})}finally{if(id)try{await chrome.tabs.remove(id)}catch(e){}}}
   const r={kind:'opened-pages',time:new Date().toISOString(),count:results.length,results};await saveRuns([r,...await getRuns()]);return r;
  }
  throw Error('Unknown command');
 })().then(reply).catch(e=>reply({error:String(e)}));return true;
});
