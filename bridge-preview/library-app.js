'use strict';
(()=>{
const db=window.RAE_SOURCE_DATA;
if(!db || !Array.isArray(db.sources)) { document.body.insertAdjacentHTML('afterbegin','<p role="alert">The source database did not load. Check that data/sources.js is next to index.html.</p>'); return; }
const sources=db.sources, byId=Object.fromEntries(sources.map(s=>[s.id,s]));
const paths=[...new Set(sources.filter(s=>s.featured).map(s=>s.path))].sort();
const $=id=>document.getElementById(id), text=s=>String(s??''), esc=s=>text(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const allowedURL=s=>/^https:\/\//i.test(s||'') ? s : '';
const state={featured:true,ebook:false,path:'',query:'',limit:12,trail:[],note:{},question:'',connection:'',changed:''};
let pending=null; const STORAGE='raec.connections.trail.bridge.v1';
function announce(s){$('announcement').textContent=s;}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({format:'eng112-research-connections-trail-v0.3',trail:state.trail,note:state.note,question:state.question,connection:state.connection,changed:state.changed}));}catch(e){announce('Local auto-save is unavailable in this browser. Download a backup before closing.');}}
function normalize(s){return text(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,' ').trim()}
const synonyms={grandma:['grandmother','family','intergenerational','memory'],grandmother:['family','intergenerational','care'],gardening:['garden','plants','soil','care'],gender:['gender','women','care','power'],animals:['animal','dogs','birds','wildlife'],bird:['birds','birdsong'],water:['water','rivers','sound'],autistic:['autism','neurodiversity'],people:['human','community'],tree:['trees','forest'],belonging:['attachment','home','place'],sounds:['sound','noise','birds']};
function hay(s){return normalize([s.title,s.author,s.kind,s.collection,s.topics,s.path,s.description,s.question,s.complication,s.follow,s.caution].join(' '))}
function matchesPart(h,part,expand=true){let token=normalize(part);if(!token)return true;let variants=expand?[token,...(synonyms[token]||[])]:[token];return variants.some(t=>h.includes(t));}
function parsed(q){q=q.trim();if(!q)return ()=>true;let splitOr=q.split(/\s+OR\s+/i);return h=>splitOr.some(part=>{let excludes=part.split(/\s+NOT\s+/i);let pos=excludes.shift();let positives=pos.split(/\s+AND\s+/i);let positiveOK=positives.every(piece=>{let p=piece.trim();if(/\s/.test(p)&&!q.match(/\sAND\s|\sOR\s|\sNOT\s/i))return p.split(/\s+/).some(word=>matchesPart(h,word));return matchesPart(h,p,false)});return positiveOK&&excludes.every(x=>!matchesPart(h,x,false));});}
function score(s,q){const h=hay(s),parts=normalize(q).split(' ').filter(x=>x.length>2&&!['and','or','not','the','with','for','from','this','that'].includes(x));return parts.reduce((n,part)=>n+(matchesPart(h,part)?1:0),0)}
function typeLabel(s){if(s.access.startsWith('PCC Library e-book'))return 'PCC E-BOOK';if(s.access.includes('reserve'))return 'COURSE RESERVE';if(s.collection.includes('PCC General'))return 'PCC GENERAL';if(s.kind.toLowerCase().includes('first-person'))return 'FIRST-PERSON VOICE';return s.kind.toUpperCase()}
function accessLink(s){
  const direct=allowedURL(s.url);
  if(s.collection.includes("PCC Reserve")){
    const lookup=allowedURL(s.catalogSearchUrl);
    return direct
      ? {url:direct,label:"View book record at PCC Library",aria:`View the PCC Library record for ${s.title}`}
      : lookup
        ? {url:lookup,label:"Find this title in PCC catalog",aria:`Search PCC Library catalog for the title ${s.title}`}
        : null;
  }
  if(s.collection.includes("PCC E-book")){
    return direct?{url:direct,label:"Open e-book through PCC Library",aria:`Open ${s.title} through PCC Library`}:null;
  }
  return direct?{url:direct,label:"Open source",aria:`Open source page for ${s.title}`}:null;
}
function sourceAccessAction(s){
  const info=accessLink(s);
  if(info)return `<a href="${esc(info.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(info.aria)} (opens in a new tab)">${esc(info.label)} ↗</a>`;
  return `<span class="dim">${s.collection.includes("PCC Reserve")?"On reserve at PCC Library":"Source link not yet available"}</span>`;
}
function titleMarkup(s){
  const info=accessLink(s);
  if(info && (s.collection.includes("PCC Reserve")||s.collection.includes("PCC E-book"))){
    return `<a href="${esc(info.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(info.aria)} (opens in a new tab)">${esc(s.title)}</a>`;
  }
  return esc(s.title);
}

function articleCard(s){let chosen=state.trail.includes(s.id),tags=(s.topics||'').split(';').map(t=>t.trim()).filter(Boolean).slice(0,5);return `<article class="source" data-id="${esc(s.id)}"><div class="top"><span class="id">${esc(s.id)} · ${s.featured?'CURATED READING':'RESEARCH LEAD'}</span><span class="smallpill ${s.collection.includes('PCC E-book')?'gold':''}">${esc(typeLabel(s))}</span></div><h3 class="title">${titleMarkup(s)}</h3><p class="dim">${esc(s.author)}${s.year?' · '+esc(s.year):''}</p>${s.collection.includes("PCC Reserve") ? `<p class="dim"><strong>On reserve at PCC Library</strong>${s.callNumber ? ` · Call no. ${esc(s.callNumber)}` : ""}</p>` : ""}${s.description?`<p>${esc(s.description)}</p>`:`<p class="dim">Bibliographic entry; fuller teaching notes are awaiting editorial review.</p>`}<div class="tags">${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><details><summary>${s.featured?'Explore this encounter':'View source details'}</summary>${s.featured?`<span class="minihead">A question to take into the reading</span><p>${esc(s.question)}</p><span class="minihead">What could complicate the idea?</span><p>${esc(s.complication)}</p><span class="minihead">Where could I go next?</span><p>${esc(s.follow)}</p><span class="minihead">What kind of evidence is this?</span><p>${esc(s.caution)}</p>`:''}<span class="minihead">Access and review status</span><p>${esc(s.access)}. ${esc(s.state)}.</p>${s.citation?`<span class="minihead">Citation as collected</span><p>${esc(s.citation)}</p>`:''}</details><div class="actions"><button type="button" class="button small ${chosen?'secondary':''}" data-action="trail" data-id="${esc(s.id)}" aria-pressed="${chosen}">${chosen?'Remove from trail':'Add to my trail'}</button>${sourceAccessAction(s)}</div></article>`;}
function renderResults(){let subset=sources.filter(s=>(!state.featured||s.featured)&&(!state.ebook||s.collection.includes('PCC E-book'))&&(!state.path||s.path===state.path));let qfn=parsed(state.query);let matching=subset.filter(s=>qfn(hay(s)));let partial=false;
 if(!matching.length&&state.query.trim()){matching=subset.filter(s=>score(s,state.query)>0).sort((a,b)=>score(b,state.query)-score(a,state.query));partial=matching.length>0;}
 else if(state.query.trim())matching.sort((a,b)=>score(b,state.query)-score(a,state.query));
 else if(state.featured)matching.sort((a,b)=>(a.n===33?-1:b.n===33?1:a.n-b.n));
 $('noResults').hidden=!partial&&matching.length>0; if(partial){$('noResults').hidden=false;$('noResults').innerHTML=`<strong>No exact match for “${esc(state.query)}.”</strong><p>Here are related starting points, <em>not</em> matches to every search term. Try OR to broaden your search, or separate a complex question into two searches.</p>`;}else if(matching.length===0){$('noResults').hidden=false;$('noResults').textContent='No sources match these filters. Choose a different pathway or reset your search.';}
 $('resultsCount').textContent=`${partial?'Related starting points: ':''}${matching.length} of ${subset.length} ${state.featured?'curated encounters':'catalog entries'} ${state.ebook?'(PCC e-books)':''}.`;
 $('results').innerHTML=matching.slice(0,state.limit).map(articleCard).join('');$('loadMore').hidden=matching.length<=state.limit;$('moreInfo').textContent=matching.length?`Showing ${Math.min(state.limit,matching.length)} results. Open a card for its questions, caveats, and source link.`:'';
 $('featuredBtn').setAttribute('aria-pressed',String(state.featured));$('allBtn').setAttribute('aria-pressed',String(!state.featured));$('ebooksBtn').setAttribute('aria-pressed',String(state.ebook));$('ebooksBtn').textContent=state.ebook?'Show all formats':'Only PCC e-books';}
function renderTrail(){let ids=state.trail.filter(id=>byId[id]);$('trailCount').textContent=ids.length+' saved source'+(ids.length===1?'':'s');$('navTrail').textContent='('+ids.length+')';$('trailSources').innerHTML=ids.length?ids.map(id=>{let s=byId[id];return `<div class="trail-one"><h3>${esc(s.title)}</h3><p class="dim">${esc(s.author)} · ${esc(s.id)}</p><label for="note-${esc(s.id)}">What did this source make me notice or question?</label><textarea id="note-${esc(s.id)}" data-source-note="${esc(id)}" placeholder="Use your own words. You can disagree with the source.">${esc(state.note[id]||'')}</textarea><button type="button" data-action="trail" data-id="${esc(id)}" class="button ghost small">Remove source</button></div>`}).join(''):'<p class="dim">No sources yet. Choose “Add to my trail” on any source card.</p>';}
function updateLandmarks(){
const completed=[Boolean(state.question.trim()),Boolean(state.trail.length),Boolean(state.connection.trim()),Boolean(state.changed.trim())];
const labels=['a starting curiosity','a saved research source','a connection or tension','a changed interpretation'];
const count=completed.filter(Boolean).length;
$('waypointStatus').textContent=`${count} of 4 inquiry landmarks explored. ${count===0?'Start with a question or explore a source.':'You have explored '+completed.map((ok,i)=>ok?labels[i]:null).filter(Boolean).join(', ')+'.'} This is not a grade or a required sequence.`;
}
function toggleTrail(id){if(!byId[id])return;if(state.trail.includes(id))state.trail=state.trail.filter(x=>x!==id);else state.trail.push(id);save();renderResults();renderTrail();updateLandmarks();announce((state.trail.includes(id)?'Added':'Removed')+' “'+byId[id].title+'” '+(state.trail.includes(id)?'to':'from')+' your trail.');}
function renderPairs(){let visibles=db.connections.slice(0,state.showPairs||4);$('pairList').innerHTML=visibles.map(([a,b,title,desc])=>{let A=byId['ENG112-'+a.padStart(3,'0')],B=byId['ENG112-'+b.padStart(3,'0')];return `<article class="pair"><span class="quiet-label">A connection to explore</span><h3>${esc(title)}</h3><p>${esc(desc)}</p><p class="dim">${esc(A?.author||'')} · ${esc(B?.author||'')}</p><button type="button" class="button secondary small" data-action="pair" data-a="${esc(A?.id||'')}" data-b="${esc(B?.id||'')}">Carry this pair into my trail</button></article>`}).join('');$('pairInfo').textContent=`Showing ${visibles.length} of ${db.connections.length} suggested pairings.`;$('pairsMore').hidden=visibles.length===db.connections.length;}
function saveFile(name,content,mime){let blob=new Blob([content],{type:mime}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);}
function portfolio(){return {format:'eng112-research-connections-trail-v0.3',exportedAt:new Date().toISOString(),question:state.question,connection:state.connection,changed:state.changed,trail:state.trail.slice(),note:{...state.note},sources:state.trail.filter(id=>byId[id]).map(id=>{let s=byId[id];return {id,title:s.title,author:s.author,url:s.url,access:s.access,readerNote:state.note[id]||''}})};}
function textBundle(){let t=['MY RESEARCH CONNECTIONS · DISCOVERY JOURNAL','Research Connections Library v0.3 · '+new Date().toLocaleDateString(),'','MY STARTING QUESTION',state.question||'[not yet written]','','SOURCES I AM CARRYING FORWARD'];state.trail.forEach((id,i)=>{let s=byId[id];if(!s)return;t.push('',(i+1)+'. '+s.title,(s.author||'')+(s.year?' ('+s.year+')':''),s.url||s.access,s.citation?'Collected citation: '+s.citation:'Citation note: Check the original source for full APA details.','My response: '+(state.note[id]||'[not yet written]'));});t.push('','CONNECTIONS / TENSIONS',state.connection||'[not yet written]','','WHAT BECAME MORE COMPLICATED?',state.changed||'[not yet written]','','FOR MY THREE-STORY THESIS EXPLORER','Observation: What did I encounter?','Interpretation: What am I beginning to understand?','Significance: Why does this matter to me, and what remains open?','','This is a research journal, not an automatically generated thesis or finished References page.');return t.join('\n');}
function validated(data){if(!data||!['eng112-research-connections-trail-v0.2','eng112-research-connections-trail-v0.3'].includes(data.format)||!Array.isArray(data.trail))throw Error('That file is not a compatible Research Connections Library backup.');return {trail:[...new Set(data.trail.filter(id=>typeof id==='string'&&byId[id]))].slice(0,sources.length),note:Object.fromEntries(Object.entries(data.note||{}).filter(([id,v])=>byId[id]&&typeof v==='string').map(([id,v])=>[id,v.slice(0,20000)])),question:text(data.question).slice(0,20000),connection:text(data.connection).slice(0,20000),changed:text(data.changed).slice(0,20000)};}
function applyData(d){for(let k of ['trail','note','question','connection','changed'])state[k]=d[k];$('studentQuestion').value=state.question;$('connectionNote').value=state.connection;$('changedNote').value=state.changed;save();renderTrail();renderResults();updateLandmarks();}
try{let stored=localStorage.getItem(STORAGE);if(stored){let d=validated(JSON.parse(stored));applyData(d);}}catch(e){/* nonpersistent private browsers or stale saved data */}
for(const p of paths){let o=document.createElement('option');o.value=p;o.textContent=p;$('pathFilter').append(o);}
const starters=['water AND memory','autism AND animals','gardening OR gender','trees AND belonging','birdsong AND anxiety','noise AND learning','nature writing AND observation'];
$('starterChips').innerHTML=starters.map(x=>`<button type="button" class="chip" data-query="${esc(x)}">${esc(x)}</button>`).join('');
$('searchForm').addEventListener('submit',e=>{e.preventDefault();state.query=$('query').value;state.path=$('pathFilter').value;state.limit=12;renderResults();});
$('query').addEventListener('input',()=>{state.query=$('query').value;state.limit=12;renderResults()});
$('pathFilter').addEventListener('change',()=>{state.path=$('pathFilter').value;state.limit=12;renderResults()});
$('featuredBtn').addEventListener('click',()=>{state.featured=true;state.path='';$('pathFilter').value='';state.limit=12;renderResults()});
$('allBtn').addEventListener('click',()=>{state.featured=false;state.path='';$('pathFilter').value='';state.limit=12;renderResults()});
$('ebooksBtn').addEventListener('click',()=>{state.ebook=!state.ebook;state.limit=12;renderResults()});
$('loadMore').addEventListener('click',()=>{state.limit+=12;renderResults()});
$('pairsMore').addEventListener('click',()=>{state.showPairs=(state.showPairs||4)+4;renderPairs()});
document.addEventListener('click',e=>{let q=e.target.closest('[data-query]');if(q){state.query=q.dataset.query;$('query').value=state.query;state.limit=12;renderResults();$('searchSection').scrollIntoView({block:'start'});$('query').focus();return;}let b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='trail')toggleTrail(b.dataset.id);if(b.dataset.action==='pair'){let add=[b.dataset.a,b.dataset.b].filter(x=>byId[x]);for(let id of add)if(!state.trail.includes(id))state.trail.push(id);save();renderTrail();renderResults();updateLandmarks();$('myTrail').scrollIntoView({block:'start'});announce('Added two sources to your trail. Record the relationship you notice.');}});
for(const [id,key] of [['studentQuestion','question'],['connectionNote','connection'],['changedNote','changed']])$(id).addEventListener('input',e=>{state[key]=e.target.value;save();updateLandmarks()});
$('trailSources').addEventListener('input',e=>{if(e.target.dataset.sourceNote){state.note[e.target.dataset.sourceNote]=e.target.value;save()}});
$('saveTxt').addEventListener('click',()=>{saveFile('my-research-discovery-journal.txt',textBundle(),'text/plain;charset=utf-8');announce('Discovery journal downloaded as text.');});
$('saveJson').addEventListener('click',()=>{saveFile('my-research-connections-backup.json',JSON.stringify(portfolio(),null,2),'application/json');announce('Editable Research Connections Library backup downloaded.');});
$('copyTrail').addEventListener('click',async()=>{let val=textBundle();try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(val);announce('Journal copied. Paste relevant material into your Thesis Explorer.');$('copyFallback').hidden=true;}catch(e){$('copyText').value=val;$('copyFallback').hidden=false;$('copyText').focus();$('copyText').select();announce('Use the displayed text box to copy your journal. Clipboard access is restricted in this browser.');}});
$('restoreFile').addEventListener('change',async e=>{pending=null;$('replaceArea').hidden=true;$('approveReplace').checked=false;$('applyRestore').disabled=true;let file=e.target.files?.[0];if(!file){$('importPreview').textContent='No file selected.';return;}try{if(file.size>2000000)throw Error('File is too large for a trail backup.');pending=validated(JSON.parse(await file.text()));$('importPreview').textContent=`Ready to restore: ${pending.trail.length} saved sources and ${pending.question.length+pending.connection.length+pending.changed.length} characters of reflections. Your existing trail will not change until you confirm.`;$('replaceArea').hidden=false;}catch(err){$('importPreview').textContent='Cannot restore: '+err.message;pending=null;}});
$('approveReplace').addEventListener('change',e=>{$('applyRestore').disabled=!e.target.checked||!pending});
$('applyRestore').addEventListener('click',()=>{if(!pending||!$('approveReplace').checked)return;applyData(pending);$('importPreview').textContent='Restored successfully. Your saved sources and notes are now available.';pending=null;$('replaceArea').hidden=true;$('restoreFile').value='';announce('Your earlier discovery trail has been restored.');});
renderResults();renderPairs();renderTrail();updateLandmarks();$('allCount').textContent=sources.length;$('featuredCount').textContent=sources.filter(s=>s.featured).length;$('ebookCount').textContent=sources.filter(s=>s.collection.includes('PCC E-book')).length;$('allBtn').textContent='All '+sources.length+' sources';
})();
