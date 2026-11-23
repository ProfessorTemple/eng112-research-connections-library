/* Discovery Bridge v1 | isolated Thesis Studio pilot. No server or analytics. */
(function(){
"use strict";
const mount=document.getElementById("bridge-thesis-ui");
if(!mount)return;
const IN="eng112.discovery.bridge.v1.library-to-thesis";
const BACK="eng112.discovery.bridge.v1.thesis-to-library";
const $=id=>document.getElementById(id);
const clip=(s,n=5000)=>String(s||"").slice(0,n);
function node(t,text,cls){const x=document.createElement(t);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x}
function text(parent,t,s,cls){let e=node(t,s,cls);parent.append(e);return e}
function button(name,fn,secondary){let x=node("button",name,secondary?"bridge-secondary":"");x.type="button";x.addEventListener("click",fn);return x}
function option(label,key,checked){let l=node("label",null,"bridge-option"),c=document.createElement("input");c.type="checkbox";c.dataset.bridgeOption=key;c.checked=checked;l.append(c,node("span",label));return l}
function read(k){try{let obj=JSON.parse(localStorage.getItem(k)||"null");return obj&&typeof obj==="object"?obj:null}catch(e){return null}}
function status(message){const s=$("bridge-thesis-status");if(s)s.textContent=message}
function edit(el,value){el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}));}
function render(){
mount.replaceChildren();
const packet=read(IN);
if(packet&&packet.version===1&&packet.type==="sources"&&Array.isArray(packet.sources)){
 let box=node("div",null,"bridge-incoming");
 text(box,"h3","Discoveries received from the Library");
 text(box,"p",packet.sources.length+" selected source(s). Review what will enter your evidence notes before choosing to use it.");
 if(packet.question)text(box,"p","Research question: "+clip(packet.question,2200),"bridge-mini");
 let list=node("div");packet.sources.slice(0,30).forEach(s=>{
   let wrap=node("div",null,"bridge-note");
   text(wrap,"strong",clip(s.title,500)+" · "+clip(s.author,250));
   if(s.note)text(wrap,"p","My note: "+clip(s.note,300),"bridge-mini");
   list.append(wrap);
 });box.append(list);
 const options=node("div",null,"bridge-section");
 options.append(option("Add these source titles and selected notes to my thesis evidence field","evidence",true));
 if(packet.question)options.append(option("Carry my research question into the thesis workspace","question",true));
 if(packet.connection||packet.changed)options.append(option("Carry my connections and changes in thinking into the evidence field","reflection",true));
 box.append(options);
 const controls=node("div",null,"bridge-controls");
 controls.append(button("Use these discoveries in my thesis",()=>{
  const selected=key=>!!box.querySelector('input[data-bridge-option="'+key+'"]:checked');
  const evidence=$("thesis-evidence"),question=$("thesis-question");
  if(!evidence||!question){status("The thesis fields are not ready. Please reload this preview.");return}
  let lines=[];
  if(selected("evidence")){
   lines.push("RESEARCH CONNECTIONS LIBRARY: SOURCES TO INVESTIGATE");
   for(const s of packet.sources.slice(0,30)){
    lines.push(clip(s.title,500)+" · "+clip(s.author,250)+" ["+clip(s.id,40)+"]");
    if(s.url)lines.push("Source link: "+clip(s.url,1600));
    else if(s.access)lines.push("Access: "+clip(s.access,250));
    if(s.note)lines.push("My research note: "+clip(s.note,5000));
    lines.push("");
   }
  }
  if(selected("question")&&packet.question){
   if(!question.value.trim())edit(question,clip(packet.question,4000));
   else if(question.value.trim()!==packet.question.trim())lines.push("Earlier Library research question (preserved for comparison): "+clip(packet.question,4000));
  }
  if(selected("reflection")){
   if(packet.connection)lines.push("Connections I noticed: "+clip(packet.connection,5000));
   if(packet.changed)lines.push("What changed in my inquiry: "+clip(packet.changed,5000));
  }
  let block=lines.join("\n").trim();
  if(block){
   let original=evidence.value||"";
   if(original.length+block.length+4>17900){status("Your evidence field is near its limit. Export or shorten older notes before importing this packet.");return}
   edit(evidence,original?(original.trimEnd()+"\n\n"+block):block);
  }
  if(!block&&!(selected("question")&&packet.question)){status("Select at least one kind of content to use.");return}
  try{localStorage.removeItem(IN)}catch(e){}
  render();
  const focus=$("thesis-evidence");if(focus){focus.scrollIntoView({block:"center"});focus.focus()}
  status("Research added without replacing your existing thesis. Now examine the sources and revise your interpretation.");
 }));
 controls.append(button("Dismiss this transfer",()=>{
  if(confirm("Discard this incoming transfer? Your saved work in the Library stays there.")){try{localStorage.removeItem(IN)}catch(e){}render();status("Incoming transfer dismissed; your thesis is unchanged.")}
 },true));
 box.append(controls);mount.append(box);
}
let go=node("div",null,"bridge-section");
text(go,"h3","Return with a new question");
text(go,"p","If your thesis raises a new uncertainty, write the question you want to investigate next. It will not replace the Library's current question unless you accept it there.");
let label=node("label");label.htmlFor="bridge-next-question";label.textContent="The research question I want to carry back";
go.append(label);
let input=node("textarea");input.id="bridge-next-question";input.rows=3;input.maxLength=4000;input.placeholder="My research has made me wonder whether...";go.append(input);
let controls=node("div",null,"bridge-controls");
controls.append(button("Use my current thesis question",()=>{let v=$("thesis-question")?.value||"";input.value=v;input.focus();status(v?"Question copied into the return field. Review it before sending.":"Your thesis question is empty. Write a question to investigate next.");},true));
controls.append(button("Send this question back to the Library",()=>{
 const question=input.value.trim();if(!question){status("Write a question to carry back before continuing.");input.focus();return}
 try{localStorage.setItem(BACK,JSON.stringify({version:1,type:"question",question:clip(question,4000),createdAt:new Date().toISOString()}));location.assign("./library.html#bridge-panel")}
 catch(e){status("Browser storage is unavailable. Copy your question into the Library manually.")}
}));
go.append(controls);mount.append(go);
text(mount,"p","Only the question you explicitly send travels back. Your thesis draft and saved versions remain here on this device.","bridge-mini");
let line=text(mount,"p","","bridge-status");line.id="bridge-thesis-status";line.setAttribute("role","status");line.setAttribute("aria-live","polite");
}
render();
})();