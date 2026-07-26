/* ANTELMO V7.3.11 — accesos directos a Terrarios y subida de fotos. */

function antelmoV7311DirectAccess(){
  const app=document.querySelector('#app');
  if(!app)return;

  if(route==='home'){
    const hero=app.querySelector('.workbench-v7-hero');
    if(hero&&!app.querySelector('.antelmo-v7311-direct')){
      const direct=document.createElement('div');
      direct.className='antelmo-v7311-direct';
      direct.innerHTML=`
        <button type="button" data-v7311-action="terrarium"><span>🪲</span><b>Terrario</b></button>
        <button type="button" data-v7311-action="upload-photo"><span>🖼️</span><b>Subir fotos</b></button>`;
      hero.insertAdjacentElement('afterend',direct);
    }
  }

  if(route==='more'&&db.appConfig?.moreTab==='hub'){
    const grid=app.querySelector('.module-grid');
    if(grid&&!grid.querySelector('[data-v7311-action="terrarium"]')){
      grid.insertAdjacentHTML('beforeend',`
        <button type="button" data-v7311-action="terrarium"><span>🪲</span><b>Terrarios</b><small>Fauna e instalaciones</small></button>
        <button type="button" data-v7311-action="upload-photo"><span>🖼️</span><b>Subir fotos</b><small>Fototeca o cámara</small></button>`);
    }
  }
}

const antelmoV7311Render=render;
render=function(){
  antelmoV7311Render();
  antelmoV7311DirectAccess();
};

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-v7311-action]');
  if(!button)return;
  const action=button.dataset.v7311Action;
  if(action==='terrarium'){
    event.preventDefault();
    route='more';
    selected=null;
    db.appConfig.moreTab='fauna';
    save();
    render();
  }
  if(action==='upload-photo'){
    event.preventDefault();
    photoForm('');
  }
});

(function installV7311Styles(){
  if(document.querySelector('#antelmo-v7311-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7311-styles';
  style.textContent=`
    .antelmo-v7311-direct{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 16px}
    .antelmo-v7311-direct button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--text);font:inherit;box-shadow:var(--shadow);cursor:pointer}
    .antelmo-v7311-direct button span{font-size:19px;line-height:1}
    .antelmo-v7311-direct button b{font-size:13px;line-height:1.1}
    @media(max-width:360px){.antelmo-v7311-direct{gap:6px}.antelmo-v7311-direct button{padding:8px}.antelmo-v7311-direct button b{font-size:12px}}
  `;
  document.head.appendChild(style);
})();