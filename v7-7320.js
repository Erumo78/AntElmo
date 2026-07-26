/* ANTELMO V7.3.20 — entrada limpia a Terrarios + controles de fotos compactos. */

function antelmoV7320Cfg(){
  db.appConfig ||= {};
  db.appConfig.v7315 ||= {selectedFaunaId:'',selectedTerrarium:''};
  return db.appConfig.v7315;
}

function antelmoV7320NormalizeGallery(){
  if(route!=='more'||db.appConfig?.moreTab!=='fauna')return;
  document.querySelectorAll('.v7315-gallery').forEach(g=>{
    g.style.setProperty('display','grid','important');
    g.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    g.style.setProperty('gap','10px','important');
    g.style.setProperty('align-items','start','important');
  });
  document.querySelectorAll('.v7315-photo').forEach(card=>{
    card.style.setProperty('display','flex','important');
    card.style.setProperty('flex-direction','column','important');
    card.style.setProperty('justify-content','flex-start','important');
    card.style.setProperty('height','auto','important');
    card.style.setProperty('min-height','0','important');
    card.style.setProperty('padding','0','important');
  });
  document.querySelectorAll('.v7318-photo-actions').forEach(row=>{
    row.style.setProperty('display','flex','important');
    row.style.setProperty('flex-direction','row','important');
    row.style.setProperty('align-items','center','important');
    row.style.setProperty('justify-content','flex-start','important');
    row.style.setProperty('gap','6px','important');
    row.style.setProperty('height','32px','important');
    row.style.setProperty('min-height','32px','important');
    row.style.setProperty('margin','7px 0 0','important');
    row.style.setProperty('padding','0','important');
    row.style.setProperty('background','transparent','important');
    row.querySelectorAll('button').forEach(btn=>{
      btn.style.setProperty('display','inline-grid','important');
      btn.style.setProperty('place-items','center','important');
      btn.style.setProperty('flex','0 0 36px','important');
      btn.style.setProperty('width','36px','important');
      btn.style.setProperty('min-width','36px','important');
      btn.style.setProperty('max-width','36px','important');
      btn.style.setProperty('height','32px','important');
      btn.style.setProperty('min-height','32px','important');
      btn.style.setProperty('max-height','32px','important');
      btn.style.setProperty('padding','0','important');
      btn.style.setProperty('margin','0','important');
    });
  });
}

function antelmoV7320VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.20';
}

const antelmoV7320Render=render;
render=function(){
  antelmoV7320Render();
  antelmoV7320VersionBadge();
  requestAnimationFrame(()=>requestAnimationFrame(antelmoV7320NormalizeGallery));
};

/* Al pulsar cualquier acceso directo "Terrario(s)", entrar siempre en la lista de terrarios,
   nunca reabrir el último habitante ni un terrario previamente seleccionado. */
document.addEventListener('click',event=>{
  const direct=event.target.closest('[data-v7311-action="terrarium"]');
  if(!direct)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const cfg=antelmoV7320Cfg();
  cfg.selectedFaunaId='';
  cfg.selectedTerrarium='';
  route='more';
  selected=null;
  db.appConfig.moreTab='fauna';
  save();
  render();
},true);

(function(){
  if(document.querySelector('#antelmo-v7320-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7320-styles';
  style.textContent=`
  .v7315-gallery{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-items:start!important}
  .v7315-photo{display:flex!important;flex-direction:column!important;justify-content:flex-start!important;height:auto!important;min-height:0!important;padding:0!important}
  .v7318-photo-actions{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;height:32px!important;min-height:32px!important;padding:0!important;margin:7px 0 0!important;background:transparent!important}
  .v7318-photo-actions button{display:inline-grid!important;place-items:center!important;flex:0 0 36px!important;width:36px!important;min-width:36px!important;max-width:36px!important;height:32px!important;min-height:32px!important;max-height:32px!important;padding:0!important;margin:0!important}
  `;
  document.head.appendChild(style);
})();
