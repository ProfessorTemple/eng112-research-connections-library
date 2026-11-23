/* Discovery Bridge v1 | isolated Library pilot. Work stays in this browser. */
(function(){
"use strict";
const mount=document.getElementById("bridge-library-ui");
if(!mount)return;
const LIB="raec.connections.trail.bridge.v1";
const LEGACY="raec.connections.trail.v03";
const IN="eng112.discovery.bridge.v1.library-to-thesis";
const BACK="eng112.discovery.bridge.v1.thesis-to-library";
const byId=Object.fromEntries(((window.RAE_SOURCE_DATA||{}).sources||[]).map(s=>[s.id,s]));
const $=id=>document.getElementById(id);
const clip=(x,max=5000)=>String(x||"").slice(0,max);
function read(k){try{let v=JSON.parse(localStorage.getItem(k)||"null");return v&&typeof v==="object"?v:null}catch(e){return null}}
function node(tag,txt,cls){let e=document.createElement(tag);if(txt!==undefined&&txt!==null)e.textContent=String(txt);if(cls)e.className=cls;return e;}
function appendText(parent,tag,text,cls){let e=node(tag,text,cls);parent.append(e);return e}
function button(label,act,secondary){let e=node("button",label,secondary?"bridge-secondary":"");e.type="button";e.addEventListener("click",act);return e}
function notify(text){let status=$("bridge-lib-status");if(status)status.textContent=text;}
function field(label,checked,key){let wrap=node("label",null,"bridge-option"),i=document.createElement("input");i.type="checkbox";i.checked=checked;i.dataset.key=key;let span=node("span",label);wrap.append(i,span);return wrap;}
function emitInput(el){el.dispatchEvent(new Event("input",{bubbles:true}));}
function render(){
mount.replaceChildren();
let returned=read(BACK);
if(returned&&returned.version===1&&returned.type==="question"&&returned.question){
  let wrap=node("div",null,"bridge-incoming");
  appendText(wrap,"strong","A question has returned from your Thesis Studio");
  appendText(wrap,"p",clip(returned.question,2500));
  appendText(wrap,"p","Choose whether to use it. If you do, your previous question is copied into your reflection rather than discarded.","bridge-mini");
  let controls=node("div",null,"bridge-controls");
  controls.append(button("Use as my next research question",()=>{
    let q=$("studentQuestion"),changed=$("changedNote");if(!q||!changed){notify("Please reload the Library before importing.");return}
    let old=q.value.trim(),next=clip(returned.question,2500).trim();
    if(old&&old!==next){changed.value=(changed.value.trim()+"\n\nEarlier question before returning from Thesis Studio: "+old).trim();emitInput(changed);}
    q.value=next;emitInput(q);localStorage.removeItem(BACK);render();
    q.scrollIntoView({block:"center"});q.focus();notify("New research question accepted. The earlier question was preserved in your reflection.");
  }));
  controls.append(button("Not now",()=>{localStorage.removeItem(BACK);render();notify("Returned question dismissed. Your existing question was not changed.");},true));
  wrap.append(controls);mount.append(wrap);
}
const saved=read(LIB)||{trail:[],note:{},question:"",connection:"",changed:""};
const ids=(Array.isArray(saved.trail)?saved.trail:[]).filter(id=>byId[id]).slice(0,128);
const legacy=read(LEGACY);
if(legacy&&(Array.isArray(legacy.trail)&&legacy.trail.length||legacy.question)){
 let info=node("div",null,"bridge-note");
 appendText(info,"strong","Already used the regular Library?");
 appendText(info,"p","You can copy your current Library notes into this separate pilot. Your original notes remain in the regular Library.","bridge-mini");
 info.append(button("Copy my regular Library notes into this pilot",()=>{
  const current=read(LIB)||{};
  if((current.trail||[]).length||current.question||current.connection||current.changed){
    if(!confirm("Replace the work in this pilot with a copy of your regular Library notes? Your regular Library remains unchanged. Download a backup of any pilot work you want to retain first."))return;
  }
  try{
   const data={trail:Array.isArray(legacy.trail)?legacy.trail.filter(id=>byId[id]):[],note:legacy.note&&typeof legacy.note==="object"?legacy.note:{},question:clip(legacy.question,5000),connection:clip(legacy.connection,5000),changed:clip(legacy.changed,5000)};
   localStorage.setItem(LIB,JSON.stringify(data));location.reload();
  }catch(e){notify("Local storage unavailable. Your regular Library notes were not changed.");}
 },true));mount.append(info);
}
appendText(mount,"h3","Choose what to carry forward");
appendText(mount,"p","Save sources using Add to my trail below, then return here. Select only the discoveries you wish to bring into the Thesis Studio.","bridge-small");
let list=node("div");list.id="bridge-source-list";
if(!ids.length)appendText(list,"p","No sources saved in this pilot yet. Explore the Library and select Add to my trail.","bridge-mini");
else ids.forEach(id=>{
 const s=byId[id],box=field(s.title+" · "+s.author,true,id);
 box.querySelector("input").dataset.source=id;
 list.append(box);
});
mount.append(list);
const opts=node("div",null,"bridge-section");
opts.append(field("Include my opening research question",true,"question"));
opts.append(field("Include my notes on the selected sources",true,"notes"));
opts.append(field("Include my connection and reflection notes",true,"reflections"));
mount.append(opts);
const controls=node("div",null,"bridge-controls");
controls.append(button("Refresh saved sources",render,true));
controls.append(button("Send selected discoveries to Thesis Studio",()=>{
 const current=read(LIB)||saved;
 const chosen=[...mount.querySelectorAll("input[data-source]:checked")].map(el=>el.dataset.source).filter(id=>byId[id]);
 const opt=key=>!!mount.querySelector('input[data-key="'+key+'"]:checked');
 const question=opt("question")?clip(current.question,4000):"";
 const connection=opt("reflections")?clip(current.connection,6000):"";
 const changed=opt("reflections")?clip(current.changed,6000):"";
 const sources=chosen.map(id=>{let s=byId[id];return {id:s.id,title:clip(s.title,500),author:clip(s.author,250),url:clip(s.url,1600),access:clip(s.access,300),note:opt("notes")?clip((current.note||{})[id],5000):""}});
 if(!sources.length&&!question.trim()&&!connection.trim()&&!changed.trim()){notify("Choose a saved source or enter a research question before sending.");return;}
 const packet={version:1,type:"sources",createdAt:new Date().toISOString(),source:"Research Connections Library Bridge Pilot",question,connection,changed,sources};
 try{localStorage.setItem(IN,JSON.stringify(packet));location.assign("./thesis.html#bridge-import");}
 catch(e){notify("Browser storage is blocked. Use your Library journal export and paste notes manually into the Thesis Studio.");}
 }));
mount.append(controls);
appendText(mount,"p","The transfer uses browser storage on this device. Nothing is uploaded to GitHub or sent to your instructor; make a backup before changing devices.","bridge-mini");
let status=appendText(mount,"p","","bridge-status");status.id="bridge-lib-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
}
document.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest('[data-action="trail"]'))requestAnimationFrame(render);});
render();
})();