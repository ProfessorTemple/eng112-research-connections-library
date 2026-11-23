/* ENG 112 Research as Encounter: Keyword Discovery Studio.
   Student-chosen vocabulary stays in the existing browser-saved project.
   Curated cards are suggestions for investigation, not verified subject headings.
   This script does not contact an external service or inspect student text for analytics. */
(function(){
  'use strict';
  const MAX_WORDS=40;
  const LIMIT=100;
  let showAll=false;
  const get=id=>document.getElementById(id);

  function clean(raw){return String(raw||'').replace(/\s+/g,' ').trim().slice(0,LIMIT);}
  function selected(){
    const values=Array.isArray(state.keywordBank)?state.keywordBank:[];
    const seen=new Set(),out=[];
    for(const raw of values){
      if(typeof raw!=='string')continue;
      const w=clean(raw),key=norm(w);
      if(!key||seen.has(key))continue;
      seen.add(key);out.push(w);
      if(out.length===MAX_WORDS)break;
    }
    return out;
  }
  function notify(message){
    const node=get('keyword-message');
    if(node)node.textContent=message;
  }
  function add(word,silent){
    const w=clean(word),bank=selected();
    if(!w){if(!silent)notify('Choose or enter a useful keyword first.');return false;}
    if(bank.some(x=>norm(x)===norm(w))){
      if(!silent)notify('That keyword is already in your bank.');
      return false;
    }
    if(bank.length>=MAX_WORDS){
      if(!silent)notify('Your bank is full. Remove a word before adding another.');
      return false;
    }
    bank.push(w);state.keywordBank=bank;persist();
    if(!silent)notify('Added "'+w+'" to your keyword bank.');
    return true;
  }
  function remove(word){
    state.keywordBank=selected().filter(w=>norm(w)!==norm(word));
    persist();renderBank();notify('Removed "'+word+'" from your bank.');
  }
  function suggestions(){
    const matches=new Set(conceptMatches(true).map(c=>c.id));
    const featured=DATA.concept_index.filter(c=>matches.has(c.id));
    const other=DATA.concept_index.filter(c=>!matches.has(c.id));
    return {matches,featured,items:showAll?[...featured,...other]:(featured.length?featured:other.slice(0,5))};
  }
  function renderBank(){
    const bankNode=get('keyword-bank'),cards=get('keyword-choices');
    if(!bankNode||!cards)return;
    const bank=selected();
    state.keywordBank=bank;
    bankNode.replaceChildren();
    if(!bank.length){
      bankNode.append(elt('p','keyword-bank-help','No keywords selected yet. Start with your own language or a scholarly term you want to investigate.'));
    }
    for(const word of bank){
      const tag=elt('span','keyword-bank-pill');
      const text=elt('span','',word);
      const action=button('Remove',()=>remove(word));
      action.setAttribute('aria-label','Remove '+word+' from keyword bank');
      tag.append(text,action);bankNode.append(tag);
    }
    const result=suggestions();
    const toggle=get('keyword-browse');
    toggle.textContent=showAll?'Show closest directions':'Browse all '+DATA.concept_index.length+' research directions';
    toggle.setAttribute('aria-expanded',String(showAll));
    get('keyword-suggestions-message').textContent=result.featured.length
      ? 'These '+result.featured.length+' directions relate to words in your current inquiry. You can explore others, too.'
      : 'Nothing in the limited curated index closely matches yet. Browse, or use your own words without choosing a category.';
    cards.replaceChildren();
    for(const entry of result.items){
      const card=elt('section','keyword-direction');
      const note=elt('span','keyword-directory',result.matches.has(entry.id)?'POSSIBLE CONNECTION TO YOUR WORDS':'ANOTHER POSSIBLE DIRECTION');
      const title=elt('h4','',entry.title);
      const reason=elt('p','',entry.why||'Ask whether this perspective helps you see something more clearly.');
      const prompt=elt('p','keyword-bank-help','Choose a term only if it helps you ask a better question:');
      const chips=elt('div','keyword-chips');
      const vocabulary=unique([...(entry.research||[]),...(entry.concepts||[])].filter(w=>typeof w==='string')).slice(0,8);
      for(const word of vocabulary){
        const exists=bank.some(x=>norm(x)===norm(word));
        const chip=button(word,()=>{
          if(selected().some(x=>norm(x)===norm(word)))remove(word);
          else{
            if(add(word,true)){renderBank();notify('Added "'+word+'" to your keyword bank.');}
            else notify('Already saved, or the keyword bank is full.');
          }
        },'keyword-chip');
        chip.setAttribute('aria-pressed',String(exists));
        chip.setAttribute('aria-label',(exists?'Remove ':'Add ')+word+(exists?' from':' to')+' keyword bank');
        chips.append(chip);
      }
      card.append(note,title,reason,prompt,chips);cards.append(card);
    }
  }
  function seed(){
    const own=[...terms(),...(Array.isArray(state.followed)?state.followed:[]),
      ...(Array.isArray(state.studio?.selectedPhrases)?state.studio.selectedPhrases:[])];
    const list=unique(own.filter(x=>typeof x==='string'&&x.trim().length<=LIMIT)).slice(0,12);
    if(!list.length){notify('Enter an idea in Freewrite, follow a connection, or add a keyword of your own.');return;}
    let added=0;for(const word of list)if(add(word,true))added++;
    renderBank();
    notify(added?'Added '+added+' of your own ideas or connections. Keep what is useful.':'These words are already saved, or your bank is full.');
  }
  function fillBuilder(){
    const bank=selected();
    if(!bank.length){notify('Choose a keyword first. You can always add your own.');return;}
    const ids=['termA','termB','termC'];
    const occupied=ids.some((id,i)=>get(id).value.trim()&&get(id).value.trim()!==(bank[i]||''));
    if(occupied&&!window.confirm('Replace the current search concepts with the first three terms in your bank? Your saved keywords and research notes will remain unchanged.'))return;
    ids.forEach((id,i)=>{get(id).value=bank[i]||'';});
    persist();renderSearch();
    notify('Filled the search builder with '+Math.min(bank.length,3)+' keyword(s). The others remain in your bank.');
    get('termA').focus();
  }
  function sendToBiblio(){
    const bank=selected(),field=get('ws-keywords');
    if(!bank.length){notify('Choose keywords first. Your bibliography needs five to eight.');return;}
    if(!field){notify('The Annotated Bibliography editor is not available.');return;}
    const next=bank.slice(0,8).join(', ');
    if(field.value.trim()&&field.value.trim()!==next&&!window.confirm('Replace the keywords already entered in your Annotated Bibliography? Your keyword bank will not change.'))return;
    field.value=next;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    tab('biblio');
    notify('Carried your chosen keywords into the Annotated Bibliography. Review them for relevance and the five-to-eight requirement.');
  }

  // Distinct strategies, not just reordered copies of one Boolean string.
  function makeStrategies(){
    const v=id=>get(id)?.value.trim()||'';
    const a=v('termA'),b=v('termB'),c=v('termC');
    const A=group(a,v('altA')),B=group(b,v('altB')),C=quote(c);
    const op=v('joinOp')==='OR'?'OR':'AND';
    const exclude=quote(v('exclude'));
    const out=[],seen=new Set();
    function propose(label,reason,text){
      if(!text)return;
      const full=exclude?'('+text+') NOT '+exclude:text;
      if(seen.has(full))return;
      seen.add(full);
      out.push({label,reason,query:full});
    }
    const first=A||B||C;
    propose('Start broad','Try one main idea or a group of synonyms. Look at the language used in results.',first);
    if(A&&B){
      propose(op==='AND'?'Find the intersection':'Explore either conversation',
        op==='AND'?'AND looks for sources discussing both concepts.':'OR broadens the search to either concept.',
        A+' '+op+' '+B);
    }else if(B&&C){
      propose('Narrow the question','AND combines two distinct ideas.',B+' AND '+C);
    }
    if(A&&C){
      propose('Try a different angle','Keep your first concept but explore a different third idea.',A+' AND '+C);
    }
    if(A&&B&&C){
      propose('Make it more specific','Add a third concept to investigate a narrower question.',A+' '+op+' '+B+' AND '+C);
    }
    // Only terms the student explicitly selected enter this alternative search.
    if(A&&!C){
      const used=[a,b,v('altA'),v('altB')].map(norm);
      const extra=selected().find(x=>!used.includes(norm(x)));
      if(extra){
        propose('Another chosen direction','Try another term from your own keyword bank.',A+' AND '+quote(extra));
      }
    }
    return out.slice(0,4);
  }
  function improvedSearch(){
    const box=get('search-list');
    box.replaceChildren();
    const strategies=makeStrategies();
    if(!strategies.length){
      box.append(elt('p','notice','Select a keyword from your bank or enter a main research concept. Then build a search.'));
      return;
    }
    box.append(elt('h3','','Try, revise, and copy these searches'));
    box.append(elt('p','hint','Start with a broad search, read a few result titles and abstracts, then revise your vocabulary. No suggested combination is guaranteed to work in every database.'));
    strategies.forEach((item,i)=>{
      const card=elt('section','querycard');
      const label=elt('label','small',(i+1)+'. '+item.label+' (editable)');
      label.htmlFor='query-'+i;
      const reason=elt('p','query-purpose',item.reason);
      const area=elt('textarea','query');
      area.id='query-'+i;
      area.value=item.query;
      area.setAttribute('aria-label','Editable search '+(i+1)+': '+item.label);
      const buttons=elt('div','actions');
      buttons.append(button('Copy this search',()=>copy(area.value)));
      buttons.append(button('Save to my research journal',()=>{
        saveArray('savedSearches',area.value);
        message(card,'Saved this search. After trying it, note new vocabulary in the keyword bank above.');
      }));
      card.append(label,reason,area,buttons);
      box.append(card);
    });
  }

  // Keep the original search field values and backup format, while extending
  // the existing research workflow. A missing bank in an older backup is fine.
  genQueries=function(){return makeStrategies().map(item=>item.query);};
  renderSearch=improvedSearch;
  const earlierTab=tab;
  tab=function(name){earlierTab(name);if(name==='search')renderBank();};
  const earlierJournalText=journalText;
  journalText=function(){
    return earlierJournalText()+
      '\n\nMY KEYWORD BANK\n'+(selected().map(x=>'• '+x).join('\n')||'[none]')+
      '\n\nWHAT I DISCOVERED AFTER LIBRARY SEARCHING\n'+(get('search-reflection')?.value.trim()||'[not entered]');
  };

  if(!FIELDS.includes('search-reflection'))FIELDS.push('search-reflection');
  if(typeof state.fields?.['search-reflection']==='string')get('search-reflection').value=state.fields['search-reflection'];
  get('search-reflection').addEventListener('input',persist);
  get('keyword-seed').addEventListener('click',seed);
  get('keyword-browse').addEventListener('click',()=>{
    showAll=!showAll;renderBank();
  });
  get('keyword-add').addEventListener('click',()=>{
    if(add(get('keyword-new').value,false)){
      get('keyword-new').value='';renderBank();
    }
  });
  get('keyword-new').addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();get('keyword-add').click();}
  });
  get('keyword-fill').addEventListener('click',fillBuilder);
  get('keyword-bib').addEventListener('click',sendToBiblio);
  // Draw once now; subsequent visits and restores redraw with the current saved state.
  renderBank();
})();
