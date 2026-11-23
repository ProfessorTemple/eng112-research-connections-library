/* Research as Encounter: the Living Three-Story Thesis Studio.
   All thesis writing is student-authored. No AI calls, external requests, or
   sharing of draft text with analytics. Local browser storage only. */
(function(){
  'use strict';
  const ids=['thesis-question','thesis-evidence','thesis-draft','thesis-change'];
  const get=id=>document.getElementById(id);
  const trim=v=>String(v||'').trim();
  const capped=v=>trim(v).slice(0,18000);
  const notice=message=>{const n=get('thesis-status');if(n)n.textContent=message;};

  // Preserve the older v3.4 project format and older JSON backups.
  for(const id of ids){
    if(!FIELDS.includes(id))FIELDS.push(id);
    const field=get(id);
    if(!field)throw Error('Missing thesis field: '+id);
    if(typeof state.fields?.[id]==='string')field.value=state.fields[id];
    field.addEventListener('input',()=>{
      persist();
      if(id==='thesis-question')updateContext();
    });
  }
  let lastVersionData=null;
  const sanitizeVersion=v=>{
    if(!v||typeof v!=='object')return null;
    return {
      savedAt:typeof v.savedAt==='string'?v.savedAt:'',
      question:capped(v.question),story1:capped(v.story1),story2:capped(v.story2),
      story3:capped(v.story3),evidence:capped(v.evidence),
      draft:capped(v.draft),change:capped(v.change)
    };
  };
  function history(){
    const versions=Array.isArray(state.thesisVersions)?state.thesisVersions:[];
    return versions.slice(-12).map(sanitizeVersion).filter(Boolean);
  }
  function updateContext(){
    const question=trim(get('thesis-question')?.value);
    const preview=get('thesis-question-preview');
    if(preview)preview.textContent=question||'No question written yet. You can begin with an observation, and return to this question later.';
    const noteCount=Array.isArray(state.readingNotes)?state.readingNotes.length:0;
    const words=Array.isArray(state.keywordBank)?state.keywordBank.filter(x=>typeof x==='string').slice(0,8):[];
    const hint=get('thesis-research-hint');
    if(hint)hint.textContent=(noteCount
      ?'You have '+noteCount+' reading note(s). Revisit the Reading Journal to check a passage or source locator before claiming what it demonstrates.'
      :'Your Reading Journal can help you identify sources that support or complicate this claim.')+
      (words.length?' Your selected research vocabulary includes: '+words.join(', ')+'. Use only the words that clarify your thinking.':' Your keyword bank can offer new vocabulary without dictating your thesis.');
  }
  function current(){
    const versions=Array.isArray(state.thesisVersions)?state.thesisVersions:[];
    const previous=versions.length?Date.parse(versions[versions.length-1].savedAt):NaN;
    const stamp=new Date(Math.max(Date.now(),Number.isFinite(previous)?previous+1:0)).toISOString();
    return {savedAt:stamp,question:capped(get('thesis-question').value),
      story1:capped(get('what').value),story2:capped(get('soWhat').value),
      story3:capped(get('nowWhat').value),evidence:capped(get('thesis-evidence').value),
      draft:capped(get('thesis-draft').value),change:capped(get('thesis-change').value)};
  }
  function asSentence(text){
    const value=trim(text);
    if(!value)return '';
    return /[.!?…]["”']?$/.test(value)?value:value+'.';
  }
  function assemble(){
    const parts=[get('what').value,get('soWhat').value,get('nowWhat').value].map(asSentence).filter(Boolean);
    if(!parts.length){notice('Start with an observation or one of the three stories. You can leave unfinished floors for later.');return;}
    const draft=parts.join(' ');
    const existing=trim(get('thesis-draft').value);
    if(existing&&existing!==draft&&!window.confirm('Replace your current thesis draft with a rough joining of your three story notes? Save a version first if you want to keep this draft.'))return;
    get('thesis-draft').value=draft;
    persist();notice('These are your own sentences, brought together as a rough starting draft. Now revise the connections, make Story Two interpretive, and keep Story Three grounded.');
    get('thesis-draft').focus();
  }
  function saveVersion(){
    const snapshot=current();
    if(!snapshot.draft&&!snapshot.story1&&!snapshot.story2&&!snapshot.story3){
      notice('Write a working thesis or begin one of the three stories before saving a version.');
      return;
    }
    const list=history();
    list.push(snapshot);
    state.thesisVersions=list.slice(-12);
    persist();renderHistory();
    notice('Saved this stage of your thinking. You can return to it after reading or interviewing.');
  }
  function restoreVersion(version){
    if(!window.confirm('Load this earlier version for revision? Current unsaved thesis edits will be replaced. Save your current version first if you want to compare both.'))return;
    const fields=[['thesis-question',version.question],['what',version.story1],['soWhat',version.story2],
      ['nowWhat',version.story3],['thesis-evidence',version.evidence],
      ['thesis-draft',version.draft],['thesis-change',version.change]];
    for(const [id,value] of fields)get(id).value=value||'';
    persist();updateContext();
    notice('Loaded the earlier thesis. Your saved history is still available.');
    get('thesis-draft').focus();
  }
  function renderHistory(){
    const host=get('thesis-history');
    if(!host)return;
    const versions=history();
    host.replaceChildren();
    if(!versions.length){
      const p=document.createElement('p');
      p.className='hint';
      p.textContent='No version saved yet. You can save an early question and interpretation now, then come back after encountering more sources.';
      host.append(p);
      return;
    }
    for(const [i,item] of versions.slice().reverse().entries()){
      const card=document.createElement('article');
      card.className='thesis-version';
      const label=document.createElement('strong');
      let dateLabel='Saved version';
      try {dateLabel=new Date(item.savedAt).toLocaleString();}catch(_ignored){}
      label.textContent='Version '+(versions.length-i)+' · '+dateLabel;
      card.append(label);
      const question=document.createElement('p');
      question.textContent='Question: '+(item.question||'[not recorded]');
      card.append(question);
      const text=document.createElement('p');
      text.textContent=item.draft||[item.story1,item.story2,item.story3].filter(Boolean).join(' ');
      card.append(text);
      if(item.change){
        const change=document.createElement('p');
        change.textContent='What changed: '+item.change;
        card.append(change);
      }
      const load=document.createElement('button');
      load.type='button';load.className='secondary';
      load.textContent='Load this version to revise';
      load.setAttribute('aria-label','Load saved thesis version '+(versions.length-i)+' for revision');
      load.addEventListener('click',()=>restoreVersion(item));
      card.append(load);
      host.append(card);
    }
  }
  function useQuestion(){
    const questions=Array.isArray(state.savedQuestions)?state.savedQuestions.filter(x=>typeof x==='string'&&trim(x)):[];
    if(!questions.length){notice('You have not saved a research question yet. Write one in the field above.');get('thesis-question').focus();return;}
    const selected=questions[questions.length-1];
    const field=get('thesis-question');
    if(trim(field.value)&&field.value!==selected&&!window.confirm('Replace the current research question with your most recently saved question?'))return;
    field.value=selected;persist();updateContext();
    field.focus();notice('Added your last saved research question. Edit it as your inquiry develops.');
  }
  async function copyDraft(){
    const text=trim(get('thesis-draft').value);
    if(!text){notice('Write your working thesis before copying it.');return;}
    try{
      await navigator.clipboard.writeText(text);
      notice('Copied your working thesis. Decide how it belongs in your Research Path Overview or essay.');
    }catch(_error){
      get('thesis-draft').focus();get('thesis-draft').select();
      notice('Select and copy the highlighted text manually.');
    }
  }
  function syncFromRestoredProject(){
    const versionData=state.thesisVersions;
    if(lastVersionData!==versionData){
      // The importer sets state.fields from the backup. The existing importer
      // restores FIELDS too; do this again only when data was replaced.
      for(const id of ids)if(typeof state.fields?.[id]==='string')get(id).value=state.fields[id];
      lastVersionData=versionData;
    }
    updateContext();renderHistory();
  }
  const originalTab=tab;
  tab=function(name){
    originalTab(name);
    if(name==='return'||name==='explore')syncFromRestoredProject();
  };
  const originalJournalText=journalText;
  journalText=function(){
    const versions=history();
    return originalJournalText()+'\n\nLIVING THREE-STORY THESIS\n'+
      'Research question: '+(get('thesis-question').value||'[not entered]')+'\n'+
      'Working thesis: '+(get('thesis-draft').value||'[not entered]')+'\n'+
      'Verified evidence or tension to investigate: '+(get('thesis-evidence').value||'[not entered]')+'\n'+
      'What changed: '+(get('thesis-change').value||'[not entered]')+'\n'+
      'Saved versions: '+versions.length;
  };

  get('thesis-assemble').addEventListener('click',assemble);
  get('thesis-save-version').addEventListener('click',saveVersion);
  get('thesis-copy').addEventListener('click',copyDraft);
  get('thesis-use-question').addEventListener('click',useQuestion);
  get('thesis-go-studio').addEventListener('click',()=>{tab('return');get('what').focus();});
  get('thesis-edit-question').addEventListener('click',()=>{tab('explore');get('thesis-question').focus();});
  get('thesis-back-from-bib').addEventListener('click',()=>{tab('return');get('thesis-draft').focus();});
  get('thesis-to-bib').addEventListener('click',()=>tab('biblio'));
  updateContext();renderHistory();
})();