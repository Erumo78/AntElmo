/* ANTELMO V7.3.21 — apertura robusta de fotos en Terrarios. */

function antelmoV7321VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.21';
}

/* Delegación global: no depende de que el render llegue a enlazar onclick después. */
document.addEventListener('click',async event=>{
  const open=event.target.closest('[data-v7318-open]');
  if(open){
    event.preventDefault();
    event.stopImmediatePropagation();
    await antelmoV7318Open(open.dataset.v7318Open);
    return;
  }

  const cover=event.target.closest('[data-v7318-cover]');
  if(cover){
    event.preventDefault();
    event.stopImmediatePropagation();
    await antelmoV7318SetCover(cover.dataset.v7318Cover);
    return;
  }

  const del=event.target.closest('[data-v7318-delete]');
  if(del){
    event.preventDefault();
    event.stopImmediatePropagation();
    await antelmoV7318Delete(del.dataset.v7318Delete);
  }
},true);

const antelmoV7321Render=render;
render=function(){
  antelmoV7321Render();
  antelmoV7321VersionBadge();
};
