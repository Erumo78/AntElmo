/* ANTELMO V7.3.14 — desplegables robustos de ficha de colonia. */

const ANTELMO_V7314_TARGETS=new Set([
  'CUIDADOS',
  'ÁLBUM DE EVOLUCIÓN',
  'LOGROS RELACIONADOS',
  'ÚLTIMOS CAPÍTULOS'
]);

function antelmoV7314Label(text=''){
  return String(text)
    .replace(/^[^\p{L}\p{N}]+/u,'')
    .replace(/\s+/g,' ')
    .trim()
    .toLocaleUpperCase('es');
}

function antelmoV7314Config(){
  db.appConfig ||= {};
  db.appConfig.v7314 ||= {detailCollapsed:{}};
  db.appConfig.v7314.detailCollapsed ||= {};
  return db.appConfig.v7314;
}

function antelmoV7314Nodes(title){
  const nodes=[];
  let node=title.nextElementSibling;
  while(node){
    if(node.classList?.contains('section-title'))break;
    if(node.classList?.contains('legacy-action'))break;
    nodes.push(node);
    node=node.nextElementSibling;
  }
  return nodes;
}

function antelmoV7314ApplySection(title,key,collapsed){
  antelmoV7314Nodes(title).forEach(node=>{
    node.dataset.v7314SectionBody=key;
    node.hidden=collapsed;
    node.style.display=collapsed?'none':'';
  });
  title.classList.toggle('antelmo-v7314-collapsed',collapsed);
  const button=title.querySelector('[data-v7314-toggle]');
  if(button){
    button.textContent=collapsed?'＋':'−';
    button.setAttribute('aria-expanded',collapsed?'false':'true');
    button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);
  }
}

function antelmoV7314Enhance(){
  if(route!=='colonies'||!selected)return;
  const app=document.querySelector('#app');
  if(!app)return;
  const colonyKey=String(selected),cfg=antelmoV7314Config();
  cfg.detailCollapsed[colonyKey] ||= [];

  app.querySelectorAll('.section-title').forEach(title=>{
    const heading=title.querySelector('h2,h3');
    if(!heading)return;
    const key=antelmoV7314Label(heading.textContent);
    if(!ANTELMO_V7314_TARGETS.has(key))return;

    title.querySelectorAll('.antelmo-section-toggle,[data-toggle-detail-section],[data-toggle-antdex-section],[data-v7312-toggle],[data-v7314-toggle]').forEach(button=>button.remove());

    const collapsed=cfg.detailCollapsed[colonyKey].includes(key);
    const button=document.createElement('button');
    button.type='button';
    button.className='antelmo-section-toggle antelmo-v7314-toggle';
    button.dataset.v7314Toggle=key;
    title.appendChild(button);
    antelmoV7314ApplySection(title,key,collapsed);
  });
}

const antelmoV7314Render=render;
render=function(){
  antelmoV7314Render();
  antelmoV7314Enhance();
};

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-v7314-toggle]');
  if(!button||route!=='colonies'||!selected)return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const key=button.dataset.v7314Toggle,colonyKey=String(selected),cfg=antelmoV7314Config();
  cfg.detailCollapsed[colonyKey] ||= [];
  const list=cfg.detailCollapsed[colonyKey],index=list.indexOf(key);
  if(index>=0)list.splice(index,1);else list.push(key);
  try{localStorage.setItem('antelmo.v4',JSON.stringify(db));}catch{}

  const title=button.closest('.section-title');
  antelmoV7314ApplySection(title,key,list.includes(key));
},true);
