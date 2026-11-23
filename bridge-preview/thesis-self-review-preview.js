/* Living Thesis Studio 3.5 preview: private self-review and reader conversation.
   Student authors all writing. No automated grading, AI calls, or analytics.
   This add-on is used by the isolated thesis-studio-preview.html page only. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const fields=['thesis-reader-objection','thesis-reader-evidence','thesis-reader-bridge'];
  const checkpoints=[
    {label:'Story One has a particular scene, pattern, relationship, or verifiable observation.',tip:'If you have only named a general topic, return to a precise encounter or finding.'},
    {label:'Story Two interprets what the observation may mean, rather than describing it again.',tip:'Ask: What surprising or debatable meaning am I proposing? What could someone question?'},
    {label:'My interpretation is open to investigation, challenge, or a different reading.',tip:'Name a thoughtful counterinterpretation, not a straw-man objection.'},
    {label:'Story Three offers a larger implication that follows from Story Two.',tip:'Make the connection visible; avoid a generic claim that the world needs to change.'},
    {label:'I can identify evidence or uncertainty that should shape my working thesis.',tip:'Return to a real text, interview, experience, or source locator. Do not invent support.'}
  ];
  const examples=[
    {label:'My dog came to sit beside me when I cried.',value:'first'},
    {label:'I may be interpreting my dog’s attention through human ideas of comfort, which complicates what I think I know about his experience.',value:'second'},
    {label:'Learning to admit the limits of my interpretation may help me approach animal relationships with greater care.',value:'third'}
  ];
  const read=id=>String($(id)?.value||'').trim();
  function checks(){const arr=Array.isArray(state.thesisSelfChecks)?state.thesisSelfChecks:[];return checkpoints.map((_,i)=>arr[i]===true);}
  function announce(msg){const el=$('thesis-review-status');if(el)el.textContent=msg;}
  function updateProgress(){
    const total=checks().filter(Boolean).length;
    $('thesis-self-progress').textContent=total+' of '+checkpoints.length+' questions considered. This is a reflection, not a score or a judgment of thesis quality.';
    const n=$('thesis-self-next');
    if(n)n.textContent=total===checkpoints.length
      ?'Now invite a peer to find Story Two in your actual thesis. Could they explain the meaning you are interpreting?'
      :'Check only statements you can currently support. An unchecked question is an invitation to revise.';
  }
  function savedReviews(){
    const raw=Array.isArray(state.thesisSelfReviews)?state.thesisSelfReviews:[];
    return raw.filter(x=>x&&typeof x==='object'&&typeof x.savedAt==='string').slice(-12);
  }
  function currentReview(){
    return {checked:checks(),objection:read('thesis-reader-objection').slice(0,5000),
      evidence:read('thesis-reader-evidence').slice(0,5000),
      bridge:read('thesis-reader-bridge').slice(0,5000)};
  }
  let lastSavedStamp=Array.isArray(state.thesisVersions)&&state.thesisVersions.length?state.thesisVersions[state.thesisVersions.length-1].savedAt:'';
  function linkReviewToVersion(){
    const versions=Array.isArray(state.thesisVersions)?state.thesisVersions:[];
    const latest=versions[versions.length-1];
    if(!latest||typeof latest.savedAt!=='string'||latest.savedAt===lastSavedStamp)return;
    lastSavedStamp=latest.savedAt;
    // A completed save is confirmed by a new timestamp; rejected empty saves have no new version.
    const reviews=savedReviews().filter(x=>x.savedAt!==latest.savedAt);
    reviews.push({savedAt:latest.savedAt,...currentReview()});
    const validStamps=new Set(versions.map(x=>x.savedAt));
    state.thesisSelfReviews=reviews.filter(x=>validStamps.has(x.savedAt)).slice(-12);
    persist();
    decorateHistory();
  }
  function loadReview(savedAt){
    const item=savedReviews().find(v=>v.savedAt===savedAt);
    if(!item)return;
    const hasCurrent=fields.some(id=>read(id))||checks().some(Boolean);
    if(hasCurrent&&!window.confirm('Replace the current self-review answers with those attached to this older thesis version? You can save your present thesis and self-review first.'))return;
    state.thesisSelfChecks=checkpoints.map((_,i)=>item.checked?.[i]===true);
    $('thesis-reader-objection').value=String(item.objection||'');
    $('thesis-reader-evidence').value=String(item.evidence||'');
    $('thesis-reader-bridge').value=String(item.bridge||'');
    persist();renderChecks();updateProgress();
    announce('Loaded the earlier self-review. These were your own answers at that stage of thinking.');
    $('thesis-reader-objection').focus();
  }
  function decorateHistory(){
    const versions=Array.isArray(state.thesisVersions)?state.thesisVersions:[];
    const cards=Array.from($('thesis-history')?.querySelectorAll('.thesis-version')||[]);
    const reviews=savedReviews();
    cards.forEach((card,i)=>{
      const version=versions[versions.length-1-i];
      if(!version)return;
      card.querySelector('.thesis-review-archive')?.remove();
      const associated=reviews.find(r=>r.savedAt===version.savedAt);
      if(!associated)return;
      const details=document.createElement('details');
      details.className='thesis-review-archive';
      const summary=document.createElement('summary');
      summary.textContent='See my self-review from this stage';
      details.append(summary);
      const answered=document.createElement('p');
      answered.textContent='Questions I considered: '+associated.checked.filter(Boolean).length+' of 5. This is not a score.';
      details.append(answered);
      for(const [label,value] of [['Alternative interpretation',associated.objection],['Evidence to verify',associated.evidence],['Bridge to significance',associated.bridge]]){
        if(!value)continue;
        const p=document.createElement('p');const strong=document.createElement('strong');
        strong.textContent=label+': ';
        p.append(strong,document.createTextNode(value));details.append(p);
      }
      const button=document.createElement('button');
      button.type='button';button.className='secondary';
      button.textContent='Load this self-review to reconsider';
      button.addEventListener('click',()=>loadReview(version.savedAt));
      details.append(button);card.append(details);
    });
  }
  function renderChecks(){
    const host=$('thesis-self-checks');
    host.replaceChildren();
    checkpoints.forEach((item,i)=>{
      const row=document.createElement('div');
      row.className='thesis-check-row';
      const label=document.createElement('label');
      const input=document.createElement('input');
      input.type='checkbox';input.checked=checks()[i];
      input.id='thesis-check-'+i;
      input.addEventListener('change',()=>{
        const next=checks();next[i]=input.checked;
        state.thesisSelfChecks=next;persist();updateProgress();
      });
      const text=document.createElement('span');
      text.textContent=item.label;
      label.append(input,text);row.append(label);
      const hint=document.createElement('p');
      hint.className='hint';hint.textContent=item.tip;
      row.append(hint);host.append(row);
    });
    updateProgress();
  }
  function practice(){
    const chosen=$('thesis-practice-choice').value;
    const result=$('thesis-practice-result');
    if(!chosen){result.textContent='Choose an answer before checking it.';return;}
    if(chosen==='second'){
      result.textContent='Yes. The second example offers a debatable interpretation: how a person reads a dog’s behavior. The first reports an observation; the third explores the wider implication.';
    }else{
      result.textContent='That example matters, but it is not the second-story turn. The first reports what happened; the third considers why an interpretation matters. Look for the statement that offers a debatable meaning and can be challenged.';
    }
  }
  function restoreFromState(){
    for(const id of fields){
      const saved=state.fields?.[id];
      $(id).value=typeof saved==='string'?saved:'';
    }
    renderChecks();decorateHistory();
  }
  for(const id of fields){
    if(!FIELDS.includes(id))FIELDS.push(id);
    if(typeof state.fields?.[id]==='string')$(id).value=state.fields[id];
    $(id).addEventListener('input',persist);
  }
  $('thesis-practice-check').addEventListener('click',practice);
  $('thesis-save-version').addEventListener('click',linkReviewToVersion);
  let knownVersionRef=state.thesisVersions;
  // The project importer can replace the state object. Refresh self-review UI when
  // returning to this section after a restore, without rewriting original work.
  const priorTab=tab;
  tab=function(name){
    priorTab(name);
    if(name==='return'){
      if(state.thesisVersions!==knownVersionRef){
        knownVersionRef=state.thesisVersions;restoreFromState();
      }
      decorateHistory();
    }
  };
  renderChecks();decorateHistory();
})();