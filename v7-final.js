/* ANTELMO V7.3.8 — mejoras finales de interfaz y seguridad en acciones masivas. */

function antelmoV738Config(){
  db.appConfig ||= {};
  db.appConfig.v738 ||= {lifeCollapsed:[],summaryCollapsed:[],detailCollapsed:{}};
  db.appConfig.v738.lifeCollapsed ||= [];
  db.appConfig.v738.summaryCollapsed ||= [];
  db.appConfig.v738.detailCollapsed ||= {};
  return db.appConfig.v738;
}
function antelmoToggleListValue(list,value){const key=String(value),index=list.map(String).indexOf(key);index>=0?list.splice(index,1):list.push(key);}

const antelmoV738LifeOverview=typeof lifeOverview==='function'?lifeOverview:null;
if(antelmoV738LifeOverview){lifeOverview=function(){const cfg=antelmoV738Config(),html=antelmoV738LifeOverview();return html.replace(/<article class="card life-book" data-colony="([^"]+)">/g,(match,id)=>{const collapsed=cfg.lifeCollapsed.map(String).includes(String(id));return `<article class="card life-book antelmo-foldable ${collapsed?'is-collapsed':''}" data-colony="${id}" data-life-book="${id}"><button type="button" class="antelmo-fold-toggle" data-toggle-life-book="${id}" aria-expanded="${collapsed?'false':'true'}">${collapsed?'＋':'−'}</button>`;});};}

const antelmoV738Summaries=typeof summariesView==='function'?summariesView:null;
if(antelmoV738Summaries){summariesView=function(){const cfg=antelmoV738Config(),html=antelmoV738Summaries();return html.replace(/<article class="card period-summary"><span>([\s\S]*?)<\/span><div><b>([\s\S]*?)<\/b>/g,(match,icon,name)=>{const plain=name.replace(/<[^>]+>/g,''),colony=db.colonies.find(item=>String(item.name)===String(plain)),id=colony?.id||plain,collapsed=cfg.summaryCollapsed.map(String).includes(String(id));return `<article class="card period-summary antelmo-foldable ${collapsed?'is-collapsed':''}" data-summary-colony="${esc(id)}"><button type="button" class="antelmo-fold-toggle" data-toggle-summary="${esc(id)}" aria-expanded="${collapsed?'false':'true'}">${collapsed?'＋':'−'}</button><span>${icon}</span><div><b>${name}</b>`;});};}

const antelmoV738ColonyForm=colonyForm;
colonyForm=function(id){
  antelmoV738ColonyForm(id);const form=document.querySelector('#v72ColonyForm');if(!form)return;
  const colony=db.colonies.find(item=>String(item.id)===String(id))||{},standards=['Compra','Captura propia','Adopción o cesión','Vuelo nupcial'];
  let select=form.elements.origin;
  if(!select){const notes=form.elements.notes?.closest('label')||form.elements.notes?.parentElement,wrapper=document.createElement('label');wrapper.innerHTML='Origen<select name="origin"></select>';if(notes)notes.before(wrapper);else form.querySelector('.button')?.before(wrapper);select=form.elements.origin;}
  const existing=String(colony.origin||''),custom=existing&&!standards.includes(existing)&&existing!=='Otro';
  select.innerHTML=`<option value="">Sin indicar</option>${standards.map(value=>`<option value="${value}">${value}</option>`).join('')}<option value="__custom__">Otro</option>`;select.value=custom||existing==='Otro'?'__custom__':existing;
  let customInput=form.elements.originCustom;if(!customInput){customInput=document.createElement('input');customInput.name='originCustom';customInput.className='antelmo-origin-custom';customInput.placeholder='Escribe el origen personalizado';select.after(customInput);}customInput.value=custom?existing:'';
  const sync=()=>{const show=select.value==='__custom__';customInput.hidden=!show;customInput.required=show;};select.addEventListener('change',sync);sync();
  const original=form.onsubmit;form.onsubmit=event=>{if(select.value==='__custom__'){const value=customInput.value.trim();if(!value){event.preventDefault();customInput.reportValidity();return;}const option=document.createElement('option');option.value=value;option.textContent=value;option.selected=true;select.appendChild(option);select.value=value;}return original?.call(form,event);};
};

const antelmoV738FeedingForm=feedingForm;
feedingForm=function(id=''){antelmoV738FeedingForm(id);const form=document.querySelector('#v72FeedForm');if(!form)return;const original=form.onsubmit;form.onsubmit=async event=>{if(form.elements.colonyId?.value==='__all__'&&!confirm('¿Registrar esta alimentación en todas las colonias activas?')){event.preventDefault();return;}return original?.call(form,event);};};
const antelmoV738JournalForm=journalForm;
journalForm=function(id=''){antelmoV738JournalForm(id);const form=document.querySelector('#v72JournalForm');if(!form)return;const original=form.onsubmit;form.onsubmit=async event=>{if(form.elements.colonyId?.value==='__all__'&&!confirm('¿Añadir esta entrada al Diario de todas las colonias activas?')){event.preventDefault();return;}return original?.call(form,event);};};

function antelmoEnhanceDetailSections(){
  if(!selected||route!=='colonies')return;const cfg=antelmoV738Config(),colonyKey=String(selected);cfg.detailCollapsed[colonyKey] ||= [];
  const allowed=['Cuidados','Álbum de evolución','📖 Libro de Vida','Libro de Vida','Últimos capítulos'];
  document.querySelectorAll('#app .section-title').forEach(title=>{const heading=title.querySelector('h2,h3');if(!heading)return;const label=heading.textContent.trim();if(!allowed.includes(label)||title.dataset.antelmoFoldReady==='true')return;title.dataset.antelmoFoldReady='true';const key=label.replace(/^📖\s*/,''),collapsed=cfg.detailCollapsed[colonyKey].includes(key),button=document.createElement('button');button.type='button';button.className='antelmo-section-toggle';button.dataset.toggleDetailSection=key;button.textContent=collapsed?'＋':'−';button.setAttribute('aria-label',collapsed?`Expandir ${key}`:`Minimizar ${key}`);title.appendChild(button);let node=title.nextElementSibling;while(node&&!node.classList.contains('section-title')){node.dataset.antelmoSectionBody=key;if(collapsed)node.hidden=true;node=node.nextElementSibling;}});
}
const antelmoV738Render=render;render=function(){antelmoV738Render();antelmoEnhanceDetailSections();};

document.addEventListener('click',event=>{const life=event.target.closest('[data-toggle-life-book]');if(life){event.preventDefault();event.stopImmediatePropagation();antelmoToggleListValue(antelmoV738Config().lifeCollapsed,life.dataset.toggleLifeBook);save();render();return;}const summary=event.target.closest('[data-toggle-summary]');if(summary){event.preventDefault();event.stopImmediatePropagation();antelmoToggleListValue(antelmoV738Config().summaryCollapsed,summary.dataset.toggleSummary);save();render();return;}const detail=event.target.closest('[data-toggle-detail-section]');if(detail&&selected){event.preventDefault();event.stopImmediatePropagation();const cfg=antelmoV738Config(),key=String(selected);cfg.detailCollapsed[key] ||= [];antelmoToggleListValue(cfg.detailCollapsed[key],detail.dataset.toggleDetailSection);save();render();}},true);

(function installV738Styles(){if(document.querySelector('#antelmo-v738-styles'))return;const style=document.createElement('style');style.id='antelmo-v738-styles';style.textContent=`
body:not(.dark){--muted:#425d52;--line:#c7d2ca}body:not(.dark) .latin,body:not(.dark) .sub,body:not(.dark) small,body:not(.dark) .life-copy p,body:not(.dark) .life-book>p,body:not(.dark) .period-summary p{color:#425d52}
.antelmo-foldable{position:relative}.antelmo-fold-toggle,.antelmo-section-toggle{width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--line);border-radius:10px;background:var(--surface2);color:var(--green);font-size:18px;line-height:1;cursor:pointer}.antelmo-fold-toggle{position:absolute;top:10px;right:10px;z-index:3}.life-book{padding-right:52px}.period-summary{position:relative;padding-right:50px}.life-book.is-collapsed>p{display:none}.life-book.is-collapsed{min-height:0}.life-book.is-collapsed>small{margin-top:8px}.period-summary.is-collapsed p{display:none}.period-summary.is-collapsed{min-height:0}.period-summary.is-collapsed small{display:block;margin-top:5px}.section-title .antelmo-section-toggle{margin-left:auto;flex:none}.antelmo-origin-custom{margin-top:7px;width:100%}@media(max-width:430px){.antelmo-fold-toggle,.antelmo-section-toggle{width:30px;height:30px}.life-book{padding-right:46px}.period-summary{padding-right:45px}}`;document.head.appendChild(style);})();
