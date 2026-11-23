/* Simplified Discovery Bridge v0.2. Student-authored local-only work. */
(function(){
"use strict";
const DATA=(window.RAE_SOURCE_DATA&&Array.isArray(window.RAE_SOURCE_DATA.sources))?window.RAE_SOURCE_DATA.sources:[];
const byId=Object.fromEntries(DATA.map(s=>[s.id,s]));
const KEY="eng112.discovery.simple.v02";
const HANDOFF="eng112.discovery.bridge.v1.library-to-thesis";
const $=id=>document.getElementById(id);
const defaults={version:2,question:"",step:1,saved:[],notes:{},story1:"",story2:"",story3:"",draft:"",changed:"",manual:"",includeAll:false,ebookOnly:false,path:"",limit:6};
const STOP=new Set(["i","me","my","mine","you","your","the","a","an","is","are","was","were","be","been","being","what","why","how","who","when","where","which","that","this","those","these","can","could","would","should","will","do","does","did","of","on","to","at","in","for","from","by","with","as","and","or","not","if","it","its","they","them","their","we","our","there","have","has","had","about","seem","seems","some","more","than","into","through","upon","because","often","really","feel","feels","things","something","different"]);
const EXPAND={
 dog:["dogs","animal","animals","companion","behavior","communication","perception","emotion"],
 dogs:["dog","animal","animals","companion","behavior","communication","perception","emotion"],
 pet:["pets","animal","animals","companion","relationship"],pets:["animal","animals","dog","companion","relationship"],
 bird:["birds","animal","animals","sound","communication"],birds:["bird","animal","animals","sound","communication"],
 grandmother:["grandma","family","memory","kinship","care","garden"],grandma:["grandmother","family","memory","kinship","care","garden"],
 garden:["gardening","plants","land","reciprocity","care","family"],gardening:["garden","plants","land","reciprocity","care","family"],
 river:["rivers","water","memory","ecology","land","relationship"],creek:["water","river","place","ecology"],
 water:["river","rivers","creek","ecology","memory"],tree:["trees","forest","forests","plants","memory"],
 trees:["tree","forest","forests","plants","memory"],forest:["forests","trees","fungi","ecology"],
 nature:["ecology","animals","plants","land","more-than-human"],sad:["emotion","emotionally","feeling","animal","perception"],
 upset:["emotion","feeling","communication","behavior"],autism:["autistic","neurodiversity","neurodivergent","perception"],
 autistic:["autism","neurodiversity","perception"],sound:["listening","communication","birds","perception"],
 listen:["listening","sound","communication","perception"],talking:["language","communication","voice"],
 memory:["memories","remembering","relationship","place","time"],memories:["memory","remembering","place"],
 climate:["environment","environmental","ecology","change"],indigenous:["indigenous","reciprocity","knowledge","plants"],
 gender:["feminism","feminist","care","power"],farm:["garden","gardening","land","labor","plants"],
 teach:["learning","knowledge","education"]
};
const make=(tag,cls,text)=>{let e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const trim=(s,max=10000)=>String(s||"").slice(0,max);
const norm=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const tokens=s=>[...new Set(norm(s).split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)))].slice(0,32);
function sanitize(raw){
 const o={...defaults};
 for(const k of ["question","story1","story2","story3","draft","changed","manual","path"])o[k]=trim(raw[k],k==="draft"?18000:10000);
 o.step=[1,2,3].includes(raw.step)?raw.step:1;
 o.saved=Array.isArray(raw.saved)?[...new Set(raw.saved.filter(id=>byId[id]))].slice(0,128):[];
 o.notes=raw.notes&&typeof raw.notes==="object"&&!Array.isArray(raw.notes)?Object.fromEntries(Object.entries(raw.notes).filter(([id,n])=>byId[id]&&typeof n==="string").map(([id,n])=>[id,trim(n,5000)])):{};
 o.includeAll=!!raw.includeAll;o.ebookOnly=!!raw.ebookOnly;o.limit=Math.max(6,Math.min(128,Number(raw.limit)||6));return o;
}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s&&s.version===2&&typeof s.question==="string")return sanitize(s);}catch(e){}return {...defaults};}
let state=load();
function announce(msg){$("saveStatus").textContent=msg}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));announce("Saved in this browser. Download a backup before changing devices.");}catch(e){announce("Automatic saving is unavailable. Download your journal and keep a copy.");}}
function pathNames(){return [...new Set(DATA.filter(s=>s.path&&s.path!=="To curate").map(s=>s.path))].sort((a,b)=>a.localeCompare(b));}
function fields(){
 $("openingQuestion").value=state.question;
 for(const [id,key] of [["story1","story1"],["story2","story2"],["story3","story3"],["thesisDraft","draft"],["changeNote","changed"],["manualSearch","manual"]])$(id).value=state[key];
 $("includeAll").checked=state.includeAll;$("ebookOnly").checked=state.ebookOnly;
 const p=$("pathFilter");p.replaceChildren();const base=make("option",null,"All pathways");base.value="";p.append(base);
 for(const path of pathNames()){const o=make("option",null,path);o.value=path;p.append(o);}p.value=state.path;
}
function setStep(n,focus=true){
 state.step=n;save();
 for(let i=1;i<=3;i++)$("stage"+i).hidden=(i!==n);
 for(let e of document.querySelectorAll("[data-indicator]"))e.classList.toggle("active",Number(e.dataset.indicator)===n);
 $("progressText").textContent=({1:"Your question · 1 of 3",2:"Your discoveries · 2 of 3",3:"Your living thesis · 3 of 3"})[n];
 if(n===2)renderSources();
 if(n===3)renderThesis();
 if(focus){const heading=$("stage"+n+"Title");heading.focus({preventScroll:true});heading.scrollIntoView({block:"start",behavior:"instant"});}
}
function queryProfile(){
 const t=tokens(state.question),x=new Set(t);for(const tok of t){for(const word of EXPAND[tok]||[])x.add(norm(word));}
 return {primary:t,expanded:[...x]};
}
function hay(s){return norm([s.title,s.author,s.topics,s.path,s.description,s.question,s.complication,s.kind].join(" "));}
function rank(s,q){
 const title=norm(s.title),topics=norm(s.topics),description=norm(s.description),rest=norm([s.path,s.question,s.complication,s.author].join(" "));
 let score=0;
 for(const term of q.primary){score+=title.includes(term)?8:topics.includes(term)?6:description.includes(term)?3:rest.includes(term)?2:0;}
 for(const term of q.expanded){if(q.primary.includes(term))continue;score+=title.includes(term)?2:topics.includes(term)?2:description.includes(term)?1:0;}
 if(score>0&&s.featured)score+=4;
 return score;
}
function booleanMatch(s,query){
 const h=hay(s),q=query.trim();if(!q)return true;
 return q.split(/\s+OR\s+/i).some(group=>{
  const chunks=group.split(/\s+(?:AND\s+)?NOT\s+/i);
  const positives=chunks[0].split(/\s+AND\s+/i).flatMap(part=>part.trim().split(/\s+/).filter(Boolean));
  if(!positives.length)return false;
  return positives.every(term=>h.includes(norm(term)))&&!chunks.slice(1).some(chunk=>chunk.trim().split(/\s+/).filter(Boolean).some(term=>h.includes(norm(term))));
 });
}
function matches(){
 const pool=DATA.filter(s=>(state.includeAll||s.featured)&&(!state.ebookOnly||s.collection.includes("PCC E-book"))&&(!state.path||s.path===state.path));
 const q=queryProfile();let arr=[];
 for(const s of pool){if(state.manual.trim()&&!booleanMatch(s,state.manual))continue;arr.push({s,score:rank(s,q)});}
 arr.sort((a,b)=>b.score-a.score||Number(b.s.featured)-Number(a.s.featured)||(a.s.n||0)-(b.s.n||0));
 const relevant=arr.filter(x=>x.score>0);
 if(state.manual.trim())return {items:arr,type:"manual"};
 if(relevant.length)return {items:[...relevant,...arr.filter(x=>x.score===0)],type:"related"};
 return {items:arr,type:"broad"};
}
function access(s){
 const raw=s.collection.includes("PCC Reserve")?(s.url||s.catalogSearchUrl):(s.url||"");
 const url=/^https:\/\//i.test(raw)?raw:"";
 let label="Open source";
 if(s.collection.includes("PCC E-book"))label="Open PCC e-book";
 else if(s.collection.includes("PCC Reserve"))label=s.url?"View PCC book record":"Find title in PCC catalog";
 return {url,label};
}
function sourceCard(s){
 const saved=state.saved.includes(s.id),article=make("article","source"+(saved?" saved":""));
 article.append(make("div","meta",s.collection.includes("PCC E-book")?"PCC Library e-book":s.collection.includes("PCC Reserve")?"PCC course reserve":s.kind||"Research source"));
 article.append(make("h3",null,s.title));
 article.append(make("p","author",s.author+(s.year?" · "+s.year:"")));
 if(saved)article.append(make("span","saved-mark","Saved to my discoveries"));
 article.append(make("p","description",s.description||"A research lead to investigate. Check the original work before drawing conclusions."));
 if(s.question)article.append(make("p","thought","A question to explore: "+s.question));
 if(s.collection.includes("PCC Reserve"))article.append(make("p","book-access","On reserve at PCC Library"+(s.callNumber?" · "+s.callNumber:"")));
 if(s.collection.includes("PCC E-book"))article.append(make("p","book-access","Available through PCC Library; sign-in may be required."));
 const row=make("div","source-buttons"),select=make("button","outline small",saved?"Remove from discoveries":"Save this source");
 select.type="button";select.addEventListener("click",()=>{if(saved)state.saved=state.saved.filter(id=>id!==s.id);else state.saved.push(s.id);save();renderSources();});row.append(select);
 const a=access(s);
 if(a.url){const link=make("a","source-link",a.label+" ↗");link.href=a.url;link.target="_blank";link.rel="noopener noreferrer";link.setAttribute("aria-label",a.label+" for "+s.title+" (opens in a new tab)");row.append(link);}
 article.append(row);
 if(saved){
  const label=make("label",null,"What does this source make you wonder?");label.htmlFor="note-"+s.id;
  const note=make("textarea");note.id="note-"+s.id;note.rows=3;note.maxLength=5000;note.placeholder="An idea, disagreement, or question in your own words...";note.value=state.notes[s.id]||"";
  note.addEventListener("input",()=>{state.notes[s.id]=trim(note.value,5000);save();});article.append(label,note);
 }
 return article;
}
function renderSources(){
 $("questionEcho").textContent=state.question||"Return to My Question and write a starting question.";
 const host=$("results");host.replaceChildren();
 if(!DATA.length){host.append(make("p",null,"Source data unavailable. Reload or open the full Library."));return;}
 const info=matches();const shown=info.items.slice(0,state.limit);
 $("matchNote").textContent=info.type==="related"
  ?"Suggested starting points based on words and themes in your question. These are search leads, not interpretations of your experience."
  :info.type==="broad"
  ?"No clear keyword overlap yet. Here are broader starting points. You can refine your question or use optional search."
  :info.items.length+" catalog result(s) match your optional search. Check original publications before citing.";
 for(const x of shown)host.append(sourceCard(x.s));
 if(!info.items.length)host.append(make("p",null,"No matching sources. Try another search or reset the optional filters."));
 $("moreSources").hidden=info.items.length<=state.limit;
 $("savedCount").textContent=state.saved.length
  ?state.saved.length+" saved source"+(state.saved.length===1?"":"s")+". Your ideas can travel into your thesis."
  :"No sources saved yet. Save one that interests you, or move forward with your encounter.";
}
function renderThesis(){
 $("thesisQuestionEcho").textContent=state.question;
 const host=$("sourceSummary");host.replaceChildren();
 const title=make("h3",null,state.saved.length?"Sources I am carrying forward":"My sources and next steps");host.append(title);
 if(!state.saved.length){host.append(make("p",null,"You can develop your initial thinking now and return to research when you're ready."));return;}
 for(const id of state.saved){const s=byId[id];if(!s)continue;const div=make("div","summary-item");div.append(make("strong",null,s.title+" · "+s.author));if(state.notes[id])div.append(make("p",null,"My response: "+state.notes[id]));else div.append(make("p",null,"A source I intend to examine more closely."));host.append(div);}
}
function download(filename,textValue,type){
 const blob=new Blob([textValue],{type});const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function backup(){save();download("ENG112_Discovery_Bridge_Work.json",JSON.stringify(state,null,2),"application/json;charset=utf-8");announce("Editable backup downloaded. Keep a copy of your work.");}
function journal(){
 const lines=["MY DISCOVERY JOURNAL · ENG 112","", "Starting question:",state.question||"[not written]","","SOURCES AND MY RESPONSES"];
 state.saved.forEach((id,i)=>{const s=byId[id];if(s){lines.push("",""+(i+1)+". "+s.title,"Author: "+s.author,"Source: "+(s.url||s.catalogSearchUrl||s.access||"Search the PCC Library"),"My response: "+(state.notes[id]||"[not written]"));}});
 lines.push("","STORY ONE · OBSERVATION",state.story1||"[not written]","","STORY TWO · INTERPRETATION",state.story2||"[not written]","","STORY THREE · SIGNIFICANCE",state.story3||"[not written]","","MY WORKING THESIS",state.draft||"[not written]","","WHAT CHANGED",state.changed||"[not written]");
 download("ENG112_My_Discovery_Journal.txt",lines.join("\n"),"text/plain;charset=utf-8");
 announce("Discovery journal downloaded. Your thesis remains editable in this browser.");
}
async function restore(e){
 const file=e.target.files&&e.target.files[0];e.target.value="";if(!file)return;
 if(file.size>1024*1024){announce("Backup is too large to restore.");return;}
 try{
  const raw=JSON.parse(await file.text());
  if(!raw||raw.version!==2||typeof raw.question!=="string"||!Array.isArray(raw.saved))throw Error("wrong format");
  if(!confirm("Replace the work in this simplified pilot with this backup? Download your current backup first if you want to keep it."))return;
  state=sanitize(raw);fields();setStep(state.step);announce("Backup restored in this pilot.");
 }catch(err){announce("This backup could not be read. Choose a Discovery Bridge v0.2 JSON backup.");}
}
function transferToFullThesis(){
 const sources=state.saved.map(id=>{const s=byId[id];return s?{id:s.id,title:trim(s.title,500),author:trim(s.author,250),url:trim(s.url,1600),access:trim(s.access,300),note:trim(state.notes[id],5000)}:null;}).filter(Boolean);
 const pieces=[];
 if(state.story1.trim())pieces.push("My observation: "+state.story1.trim());
 if(state.story2.trim())pieces.push("My interpretation: "+state.story2.trim());
 if(state.story3.trim())pieces.push("Why it matters: "+state.story3.trim());
 if(state.draft.trim())pieces.push("My working thesis (do not overwrite): "+state.draft.trim());
 if(state.changed.trim())pieces.push("What changed: "+state.changed.trim());
 const packet={version:1,type:"sources",createdAt:new Date().toISOString(),source:"Simplified Discovery Bridge v0.2",question:trim(state.question,4000),connection:pieces.join("\n\n").slice(0,6000),changed:trim(state.changed,6000),sources};
 try{localStorage.setItem(HANDOFF,JSON.stringify(packet));location.assign("./thesis.html#bridge-import");}
 catch(e){announce("Browser storage is unavailable. Download your journal and copy relevant notes into the full Thesis Studio.");}
}
function ready(){
 fields();setStep(state.step,false);
 for(const [id,key,max] of [["openingQuestion","question",4000],["story1","story1",10000],["story2","story2",10000],["story3","story3",10000],["thesisDraft","draft",18000],["changeNote","changed",7000]]){
  $(id).addEventListener("input",e=>{state[key]=trim(e.target.value,max);save();if(key==="question"&&state.step===2)renderSources();});
 }
 $("startDiscover").addEventListener("click",()=>{if(!state.question.trim()){$("questionWarning").textContent="Write a question or choose an example to begin.";$("openingQuestion").focus();return;}$("questionWarning").textContent="";state.limit=6;setStep(2);});
 document.querySelectorAll("[data-example]").forEach(b=>b.addEventListener("click",()=>{state.question=b.dataset.example;$("openingQuestion").value=state.question;save();$("openingQuestion").focus();}));
 $("editQuestion").addEventListener("click",()=>setStep(1));
 $("backQuestion").addEventListener("click",()=>setStep(1));
 $("goThesis").addEventListener("click",()=>setStep(3));
 $("returnResearch").addEventListener("click",()=>setStep(2));
 $("moreSources").addEventListener("click",()=>{state.limit=Math.min(128,state.limit+6);save();renderSources();});
 $("assembleThesis").addEventListener("click",()=>{const parts=[state.story1,state.story2,state.story3].map(s=>s.trim()).filter(Boolean);
  if(!parts.length){announce("Write at least one of your three stories first.");$("story1").focus();return;}
  if(state.draft.trim()&&!confirm("Replace your current working thesis with your three story notes joined together? Save a backup first if you want to preserve the draft."))return;
  state.draft=parts.map(p=>/[.!?]["'”’]?$/.test(p)?p:p+".").join(" ");$("thesisDraft").value=state.draft;save();$("thesisDraft").focus();
 });
 $("openFullThesis").addEventListener("click",transferToFullThesis);
 $("saveBackupTop").addEventListener("click",backup);
 $("downloadBackup").addEventListener("click",backup);
 $("downloadJournal").addEventListener("click",journal);
 $("restoreBackupButton").addEventListener("click",()=>$("restoreBackupFile").click());
 $("restoreBackupFile").addEventListener("change",restore);
 for(const id of ["manualSearch","pathFilter","includeAll","ebookOnly"]){
  $(id).addEventListener(id==="manualSearch"?"input":"change",e=>{const key={manualSearch:"manual",pathFilter:"path",includeAll:"includeAll",ebookOnly:"ebookOnly"}[id];
   state[key]=e.target.type==="checkbox"?e.target.checked:e.target.value;state.limit=6;save();renderSources();
  });
 }
 $("resetFilters").addEventListener("click",()=>{Object.assign(state,{manual:"",path:"",ebookOnly:false,includeAll:false,limit:6});fields();save();renderSources();});
 if(!DATA.length)announce("The source collection could not be loaded. Reload this page or open the full Research Connections Library.");
}
ready();
})();