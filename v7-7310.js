/* ANTELMO V7.3.10 — seguridad, autoguardado y mejoras móviles. */

const antelmoV7310TrackedKeys=[
  'colonies','feedings','events','growthRecords','journalEntries','environmentLogs',
  'tasks','inventory','fauna','faunaLogs','observations','collections','scanReports',
  'genealogy'
];

function antelmoV7310Clone(value){
  return JSON.parse(JSON.stringify(value));
}

function antelmoV7310TrackedData(source=db){
  return Object.fromEntries(antelmoV7310TrackedKeys.map(key=>[
    key,
    source?.[key]??(Array.isArray(db?.[key])?[]:{})
  ]));
}

function antelmoV7310ChangeLabel(previous,current){
  let difference=0;
  for(const key of antelmoV7310TrackedKeys){
    const before=Array.isArray(previous?.[key])?previous[key].length:0;
    const after=Array.isArray(current?.[key])?current[key].length:0;
    difference+=after-before;
  }
  if(difference>1)return `${difference} registros guardados`;
  if(difference===1)return 'Registro guardado';
  if(difference<0)return 'Elemento eliminado';
  return 'Cambio guardado';
}

let antelmoV7310UndoTimer=0;

function antelmoV7310HideUndo(){
  clearTimeout(antelmoV7310UndoTimer);
  document.querySelector('#antelmoUndo')?.remove();
}

function antelmoV7310OfferUndo(message,action){
  antelmoV7310HideUndo();
  const bar=document.createElement('div');
  bar.id='antelmoUndo';
  bar.className='antelmo-undo';
  bar.setAttribute('role','status');
  bar.innerHTML=`<span>${esc(message)}</span><button type="button">Deshacer</button><button type="button" class="antelmo-undo-close" aria-label="Cerrar">×</button>`;
  bar.querySelector('button').onclick=async()=>{
    const callback=action;
    antelmoV7310HideUndo();
    await callback();
  };
  bar.querySelector('.antelmo-undo-close').onclick=antelmoV7310HideUndo;
  document.body.appendChild(bar);
  requestAnimationFrame(()=>bar.classList.add('show'));
  antelmoV7310UndoTimer=setTimeout(antelmoV7310HideUndo,9000);
}

let antelmoV7310Restoring=false;
const antelmoV7310BaseSave=save;

save=function(){
  let previous=null;
  try{
    const stored=localStorage.getItem('antelmo.v4');
    if(stored)previous=JSON.parse(stored);
  }catch{}
  const previousTracked=previous?antelmoV7310TrackedData(previous):null;
  const currentTracked=antelmoV7310TrackedData(db);
  antelmoV7310BaseSave();
  if(antelmoV7310Restoring||!previousTracked)return;
  if(JSON.stringify(previousTracked)===JSON.stringify(currentTracked))return;
  const snapshot=antelmoV7310Clone(previousTracked);
  const label=antelmoV7310ChangeLabel(previousTracked,currentTracked);
  antelmoV7310OfferUndo(label,async()=>{
    antelmoV7310Restoring=true;
    for(const key of antelmoV7310TrackedKeys){
      if(Object.prototype.hasOwnProperty.call(snapshot,key))db[key]=antelmoV7310Clone(snapshot[key]);
    }
    antelmoV7310BaseSave();
    antelmoV7310Restoring=false;
    selected=db.colonies.some(colony=>String(colony.id)===String(selected))?selected:null;
    render();
    toast('Cambio deshecho');
  });
};

function antelmoV7310DraftKey(kind,id=''){
  return `antelmo.draft.v7310.${kind}${id?`:${id}`:''}`;
}

function antelmoV7310ReadDraft(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}
}

function antelmoV7310DraftFields(form){
  const values={};
  [...form.elements].forEach(field=>{
    if(!field.name||field.disabled||['file','submit','button'].includes(field.type))return;
    if(field.type==='checkbox'||field.type==='radio'){
      values[field.name]={kind:'checked',value:field.checked};
    }else if(field instanceof HTMLSelectElement&&field.multiple){
      values[field.name]={kind:'multiple',value:[...field.selectedOptions].map(option=>option.value)};
    }else{
      values[field.name]={kind:'value',value:field.value};
    }
  });
  return values;
}

function antelmoV7310RestoreDraft(form,draft){
  if(!draft?.fields)return false;
  Object.entries(draft.fields).forEach(([name,state])=>{
    const field=form.elements.namedItem(name);
    if(!field||!field.tagName)return;
    if(state.kind==='checked')field.checked=Boolean(state.value);
    else if(state.kind==='multiple'&&field instanceof HTMLSelectElement){
      const selectedValues=new Set((state.value||[]).map(String));
      [...field.options].forEach(option=>option.selected=selectedValues.has(String(option.value)));
    }else if(state.kind==='value')field.value=state.value??'';
    field.dispatchEvent(new Event('change',{bubbles:true}));
  });
  return true;
}

function antelmoV7310InstallDraft(form,key){
  if(!form||form.dataset.antelmoDraftReady==='true')return;
  form.dataset.antelmoDraftReady='true';
  const draft=antelmoV7310ReadDraft(key);
  if(antelmoV7310RestoreDraft(form,draft)){
    const note=document.createElement('div');
    note.className='antelmo-draft-note';
    note.textContent='Borrador restaurado automáticamente';
    form.prepend(note);
  }
  let timer=0;
  const storeDraft=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      try{
        localStorage.setItem(key,JSON.stringify({
          savedAt:new Date().toISOString(),
          fields:antelmoV7310DraftFields(form)
        }));
      }catch{}
    },180);
  };
  form.addEventListener('input',storeDraft);
  form.addEventListener('change',storeDraft);
  form.addEventListener('submit',()=>{
    const modal=document.querySelector('#modal');
    if(!modal)return;
    const clearDraft=()=>localStorage.removeItem(key);
    if(!modal.classList.contains('open')){
      clearDraft();
      return;
    }
    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('open'))return;
      clearDraft();
      observer.disconnect();
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
    setTimeout(()=>observer.disconnect(),10000);
  });
}

const antelmoV7310ColonyForm=colonyForm;
colonyForm=function(id){
  antelmoV7310ColonyForm(id);
  antelmoV7310InstallDraft(document.querySelector('#v72ColonyForm'),antelmoV7310DraftKey('colony',id||'new'));
};

const antelmoV7310FeedingForm=feedingForm;
feedingForm=function(id=''){
  antelmoV7310FeedingForm(id);
  antelmoV7310InstallDraft(document.querySelector('#v72FeedForm'),antelmoV7310DraftKey('feeding'));
};

const antelmoV7310JournalForm=journalForm;
journalForm=function(id=''){
  antelmoV7310JournalForm(id);
  antelmoV7310InstallDraft(document.querySelector('#v72JournalForm'),antelmoV7310DraftKey('journal'));
};

function antelmoV7310SectionKey(text=''){
  return String(text).trim().replace(/^[^\p{L}\p{N}]+/u,'').trim();
}

function antelmoV7310EnhanceAntDex(){
  if(route!=='colonies'||!selected)return;
  const app=document.querySelector('#app');
  if(!app)return;
  const cfg=antelmoV738Config(),colonyKey=String(selected);
  cfg.detailCollapsed[colonyKey] ||= [];

  app.querySelectorAll('.antelmo-section-toggle').forEach(button=>button.remove());
  app.querySelectorAll('[data-antelmo-section-body]').forEach(node=>{
    node.hidden=false;
    delete node.dataset.antelmoSectionBody;
  });

  app.querySelectorAll(':scope > .section-title').forEach(title=>{
    const heading=title.querySelector('h2,h3');
    if(!heading)return;
    const key=antelmoV7310SectionKey(heading.textContent);
    if(!key)return;
    title.dataset.antelmoSectionKey=key;
    const collapsed=cfg.detailCollapsed[colonyKey].map(String).includes(key);
    const button=document.createElement('button');
    button.type='button';
    button.className='antelmo-section-toggle';
    button.dataset.toggleAntdexSection=key;
    button.textContent=collapsed?'＋':'−';
    button.setAttribute('aria-expanded',collapsed?'false':'true');
    button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);
    title.appendChild(button);
    let node=title.nextElementSibling;
    while(node&&!node.classList.contains('section-title')&&!node.classList.contains('dossier')&&!node.classList.contains('legacy-action')&&!node.classList.contains('colony-care-actions')){
      node.dataset.antelmoSectionBody=key;
      node.hidden=collapsed;
      node=node.nextElementSibling;
    }
  });

  app.querySelectorAll(':scope > .dossier').forEach(section=>{
    const head=section.querySelector(':scope > .dossier-head');
    if(!head)return;
    const key='Ficha de especie',collapsed=cfg.detailCollapsed[colonyKey].map(String).includes(key);
    section.classList.toggle('antelmo-dossier-collapsed',collapsed);
    const button=document.createElement('button');
    button.type='button';
    button.className='antelmo-section-toggle';
    button.dataset.toggleAntdexSection=key;
    button.textContent=collapsed?'＋':'−';
    button.setAttribute('aria-expanded',collapsed?'false':'true');
    button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);
    head.appendChild(button);
  });
}

function antelmoV7310EnhanceDocumentary(){
  const chart=document.querySelector('#app .v73-documentary-chart');
  chart?.closest('.card')?.classList.add('antelmo-documentary-chart-card');
}

function antelmoV7310AddTableHints(){
  document.querySelectorAll('#app .v73-science-table,#app .v73-comparison-wrap').forEach(table=>{
    const temperatureHeading=table.querySelector('.v73-science-row.heading>*:nth-child(6)');
    if(temperatureHeading&&temperatureHeading.textContent.includes('/')){
      temperatureHeading.innerHTML='Temperatura/<wbr>crecimiento';
    }
    let hint=table.previousElementSibling?.classList.contains('antelmo-table-hint')?table.previousElementSibling:null;
    if(!hint){
      hint=document.createElement('div');
      hint.className='antelmo-table-hint';
      hint.textContent='↔ Desliza para ver más columnas';
      table.before(hint);
    }
    const sync=()=>{hint.hidden=table.scrollWidth<=table.clientWidth+1;};
    sync();
    requestAnimationFrame(sync);
  });
}

const antelmoV7310Render=render;
render=function(){
  antelmoV7310Render();
  antelmoV7310EnhanceAntDex();
  antelmoV7310EnhanceDocumentary();
  antelmoV7310AddTableHints();
};

document.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-toggle-antdex-section]');
  if(!toggle||!selected)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const cfg=antelmoV738Config(),colonyKey=String(selected);
  cfg.detailCollapsed[colonyKey] ||= [];
  antelmoToggleListValue(cfg.detailCollapsed[colonyKey],toggle.dataset.toggleAntdexSection);
  save();
  render();
},true);

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-del-photo]');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(!confirm('¿Eliminar esta fotografía?'))return;
  const photos=await photoAll(),photo=photos.find(item=>String(item.id)===String(button.dataset.delPhoto));
  await photoDelete(button.dataset.delPhoto);
  const colonyId=photo?.colonyId||selected;
  toast('Fotografía eliminada');
  await loadGallery(colonyId);
  loadCovers();
  if(photo)antelmoV7310OfferUndo('Fotografía eliminada',async()=>{
    await photoPut(photo);
    await loadGallery(photo.colonyId);
    loadCovers();
    toast('Fotografía recuperada');
  });
},true);

(function installV7310Styles(){
  if(document.querySelector('#antelmo-v7310-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7310-styles';
  style.textContent=`
  :root{--soft:var(--surface2)}
  #app[data-antelmo-view="hub"] .module-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #app[data-antelmo-view="hub"] .module-grid button{min-height:62px;display:grid;grid-template-columns:30px minmax(0,1fr);grid-template-rows:auto auto;column-gap:7px;align-items:center;padding:8px 9px;border-radius:15px}
  #app[data-antelmo-view="hub"] .module-grid button>span{grid-row:1/3;display:grid;place-items:center;width:30px;height:30px;margin:0;border-radius:10px;background:var(--surface2);font-size:19px}
  #app[data-antelmo-view="hub"] .module-grid button>b{align-self:end;margin:0;font-size:11.5px;line-height:1.15}
  #app[data-antelmo-view="hub"] .module-grid button>small{align-self:start;font-size:8.5px;line-height:1.15}

  body:not(.dark) #app[data-antelmo-view="life"]{--antelmo-life-secondary:#000}
  body:not(.dark) #app[data-antelmo-view="life"] .section-title p,
  body:not(.dark) #app[data-antelmo-view="life"] .life-book .latin,
  body:not(.dark) #app[data-antelmo-view="life"] .life-book>p,
  body:not(.dark) #app[data-antelmo-view="life"] .life-book>small,
  body:not(.dark) #app[data-antelmo-view="life"] .life-entry p,
  body:not(.dark) #app[data-antelmo-view="life"] .life-entry small,
  body:not(.dark) #app[data-antelmo-view="life"] .life-entry time,
  body:not(.dark) #app .life-story p,
  body:not(.dark) #app .life-timeline p,
  body:not(.dark) #app .life-timeline small,
  body:not(.dark) #app .life-timeline time{color:#000!important}

  .antelmo-documentary-chart-card{padding:10px 12px}
  .antelmo-documentary-chart-card .section-title{margin:0 0 2px}
  .antelmo-documentary-chart-card .section-title h3{font-size:16px}
  .antelmo-documentary-chart-card .section-title p{font-size:11px}
  .antelmo-documentary-chart-card .v73-documentary-chart{display:block;max-width:620px;margin:0 auto}
  .antelmo-documentary-chart-card .v73-documentary-chart text{font-size:15px}
  .antelmo-documentary-chart-card .v73-documentary-chart text.date{font-size:11.5px;font-weight:700}

  .section-title .antelmo-section-toggle,.dossier-head .antelmo-section-toggle{margin-left:auto;flex:none}
  .dossier-head .button+.antelmo-section-toggle{margin-left:0}
  .dossier.antelmo-dossier-collapsed>:not(.dossier-head){display:none}
  .dossier.antelmo-dossier-collapsed{padding-bottom:12px}

  .v73-science-row>*{min-width:0;overflow-wrap:anywhere;word-break:break-word}
  .v73-science-row.heading>*{line-height:1.25}
  .v73-science-row>b{position:sticky;left:0;z-index:2;background:var(--surface)}
  .v73-science-row.heading>*{position:sticky;top:0;z-index:3;background:var(--surface2)}
  .v73-science-row.heading>b{left:0;z-index:5}
  .v73-comparison-grid .metric-label{position:sticky;left:0;z-index:2}
  .v73-comparison-grid .metric-label.heading,.v73-comparison-grid .colony-heading{position:sticky;top:0;z-index:3;background:var(--surface)}
  .v73-comparison-grid .metric-label.heading{left:0;z-index:5;background:var(--surface2)}
  .antelmo-table-hint{display:none;margin:0 3px 6px;color:var(--muted);font-size:11px;font-weight:800;text-align:right}

  #app[data-antelmo-view="stats"] .analytic-card{padding:8px 10px}
  #app[data-antelmo-view="stats"] .analytic-card>div:first-child b{font-size:15.5px}
  #app[data-antelmo-view="stats"] .analytic-card span{font-size:14px}
  #app[data-antelmo-view="stats"] .analytic-card small{font-size:11.5px}
  #app[data-antelmo-view="stats"] .sparkline{height:36px;margin:2px 0}

  .antelmo-draft-note{margin-bottom:2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--green2) 30%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--green2) 8%,var(--surface));color:var(--green);font-size:12px;font-weight:800}
  .antelmo-undo{position:fixed;left:50%;bottom:calc(82px + env(safe-area-inset-bottom));z-index:1000;display:flex;align-items:center;gap:10px;min-width:min(360px,calc(100vw - 24px));padding:10px 10px 10px 14px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:#173f33;color:#fff;box-shadow:0 14px 38px rgba(0,0,0,.3);opacity:0;transform:translate(-50%,16px);transition:.2s ease}
  .antelmo-undo.show{opacity:1;transform:translate(-50%,0)}
  .antelmo-undo span{min-width:0;flex:1;font-size:13px;font-weight:750}
  .antelmo-undo button{border:0;border-radius:10px;padding:8px 10px;background:#fff;color:#173f33;font-weight:900;cursor:pointer}
  .antelmo-undo .antelmo-undo-close{padding:6px 8px;background:transparent;color:#fff;font-size:18px}

  @media(max-width:620px){
    .antelmo-table-hint{display:block}
    .v73-science-table,.v73-comparison-wrap{overscroll-behavior-inline:contain}
    .v73-science-row{grid-template-columns:100px repeat(4,90px) 110px 136px;min-width:706px}
    .v73-science-row>*{padding:10px 8px}
    .v73-science-row.heading{font-size:10px}
    .v73-science-row.heading>*:nth-child(6){overflow-wrap:normal;word-break:normal;font-size:9px}
    .v73-science-row:not(.heading)>b{font-size:12px;line-height:1.2}
    .v73-science-row span{font-size:11px}
    .v73-comparison-grid{grid-template-columns:92px repeat(var(--compare-columns),78px);min-width:calc(92px + var(--compare-columns) * 78px)}
    .v73-comparison-grid>*{padding:6px 4px}
  }
  @media(max-width:360px){
    #app[data-antelmo-view="hub"] .module-grid button{grid-template-columns:27px minmax(0,1fr);column-gap:6px;padding:7px}
    #app[data-antelmo-view="hub"] .module-grid button>span{width:27px;height:27px;font-size:17px}
    #app[data-antelmo-view="hub"] .module-grid button>b{font-size:10.5px}
    #app[data-antelmo-view="hub"] .module-grid button>small{font-size:8px}
  }`;
  document.head.appendChild(style);
})();
