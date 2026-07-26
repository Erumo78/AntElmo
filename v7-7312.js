/* ANTELMO V7.3.12 — corrección de desplegables en la ficha de colonia. */

const ANTELMO_V7312_SECTIONS=new Set([
  'CUIDADOS',
  'ÁLBUM DE EVOLUCIÓN',
  'LOGROS RELACIONADOS',
  'ÚLTIMOS CAPÍTULOS'
]);

function antelmoV7312NormalizeHeading(text=''){
  return String(text).replace(/\s+/g,' ').trim().toLocaleUpperCase('es');
}

function antelmoV7312SectionNodes(title){
  const nodes=[];
  let node=title.nextElementSibling;
  while(node){
    if(node.classList.contains('section-title')||node.classList.contains('dossier')||node.classList.contains('legacy-action')||node.classList.contains('colony-care-actions'))break;
    nodes.push(node);
    node=node.nextElementSibling;
  }
  return nodes;
}

function antelmoV7312EnhanceDetailSections(){
  if(route!=='colonies'||!selected)return;
  const app=document.querySelector('#app');
  if(!app)return;
  const cfg=antelmoV738Config(),colonyKey=String(selected);
  cfg.detailCollapsed[colonyKey] ||= [];

  app.querySelectorAll(':scope > .section-title').forEach(title=>{
    const heading=title.querySelector('h2,h3');
    if(!heading)return;
    const normalized=antelmoV7312NormalizeHeading(heading.textContent);
    if(!ANTELMO_V7312_SECTIONS.has(normalized))return;

    const key=antelmoV7310SectionKey(heading.textContent);
    const nodes=antelmoV7312SectionNodes(title);
    const collapsed=cfg.detailCollapsed[colonyKey].map(String).includes(key);

    title.querySelectorAll('.antelmo-section-toggle,[data-v7312-toggle]').forEach(button=>button.remove());
    nodes.forEach(node=>{
      node.dataset.antelmoSectionBody=key;
      node.hidden=collapsed;
    });

    const button=document.createElement('button');
    button.type='button';
    button.className='antelmo-section-toggle antelmo-v7312-toggle';
    button.dataset.v7312Toggle=key;
    button.textContent=collapsed?'＋':'−';
    button.setAttribute('aria-expanded',collapsed?'false':'true');
    button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);
    title.appendChild(button);
  });
}

const antelmoV7312Render=render;
render=function(){
  antelmoV7312Render();
  antelmoV7312EnhanceDetailSections();
};

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-v7312-toggle]');
  if(!button||!selected)return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const cfg=antelmoV738Config(),colonyKey=String(selected),key=button.dataset.v7312Toggle;
  cfg.detailCollapsed[colonyKey] ||= [];
  antelmoToggleListValue(cfg.detailCollapsed[colonyKey],key);
  save();

  const title=button.closest('.section-title');
  const collapsed=cfg.detailCollapsed[colonyKey].map(String).includes(key);
  antelmoV7312SectionNodes(title).forEach(node=>{
    node.dataset.antelmoSectionBody=key;
    node.hidden=collapsed;
  });
  button.textContent=collapsed?'＋':'−';
  button.setAttribute('aria-expanded',collapsed?'false':'true');
  button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);
},true);
