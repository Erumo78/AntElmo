/* ANTELMO V7.3.29 — módulos compactos y ficha de colonia coherente. */

const ANTELMO_V7329_VERSION='7.3.29';

/* Seguridad reúne exclusivamente copia, traslado y nube. Analítica y
   comparación siguen accesibles desde DATOS y sus pantallas habituales. */
const antelmoV7329DataGroup=ANTELMO_V7327_GROUPS.find(group=>group.key==='data');
if(antelmoV7329DataGroup){
  antelmoV7329DataGroup.copy='Copias, traslado y nube reunidos sin mezclarlos con analítica.';
  antelmoV7329DataGroup.modules=antelmoV7329DataGroup.modules.filter(
    ([destination])=>!['stats','compare','ai'].includes(destination)
  );
}

/* El Escudo solo se muestra en Módulos > Datos > Seguridad y copia. */
antelmoV7328EnhanceData=function(){};

/* Sincronización y Nube ya están en la categoría superior, por lo que no se
   repiten dentro de Seguridad y copia. */
antelmoV7327SecurityView=function(){
  return `<div class="section-title"><div><span class="eyebrow">DATOS</span><h2>🛡️ Seguridad y copia</h2><p>La copia completa vive aquí, fuera de Terrarios, Habitantes y Analítica.</p></div></div>
  ${antelmoV7326SecurityCard()}
  ${antelmoV7323BackupPanel()}`;
};

function antelmoV7329ActionArea(primary,toggle){
  const actions=document.createElement('div');
  actions.className='v7329-colony-section-actions';
  if(primary){
    primary.classList.add('v7329-colony-primary-action');
    actions.appendChild(primary);
  }
  if(toggle)actions.appendChild(toggle);
  return actions;
}

function antelmoV7329NormalizeDocumentary(app){
  const documentary=app.querySelector('.documentary');
  if(!documentary)return;
  const cover=documentary.querySelector('.documentary-cover');
  const details=cover?.querySelector('div');
  const primary=documentary.querySelector('[data-open-v73-documentary]');
  const toggle=documentary.querySelector('[data-v7328-colony-toggle="documentary"]');
  if(!cover||!details||!toggle)return;

  const collapsed=antelmoV7328IsDetailCollapsed('documentary');
  const section=document.createElement('div');
  section.className=`section-title v7329-colony-section-title${collapsed?' v7329-is-collapsed':''}`;
  section.dataset.v7329ColonySection='documentary';
  section.innerHTML=`<div><h2>🎞️ Modo documental</h2><p>${esc(details.querySelector('p')?.textContent||'Historia visual de la colonia')}</p></div>`;
  if(primary){
    primary.textContent='Abrir';
    primary.hidden=collapsed;
    primary.style.display=collapsed?'none':'';
  }
  section.appendChild(antelmoV7329ActionArea(primary,toggle));
  documentary.replaceWith(section);
}

function antelmoV7329NormalizeCycle(app){
  const cycle=[...app.querySelectorAll('.legacy-action')].find(node=>
    /Ciclo de la colonia|Conservada en el Legado/i.test(node.textContent)
  );
  if(!cycle)return;
  const text=cycle.querySelector('div');
  const primary=cycle.querySelector('[data-archive-colony],[data-restore-colony]');
  const toggle=cycle.querySelector('[data-v7328-colony-toggle="cycle"]');
  if(!text||!toggle)return;

  const collapsed=antelmoV7328IsDetailCollapsed('cycle');
  const historical=/Conservada en el Legado/i.test(text.textContent);
  const section=document.createElement('div');
  section.className=`section-title v7329-colony-section-title${collapsed?' v7329-is-collapsed':''}`;
  section.dataset.v7329ColonySection='cycle';
  section.innerHTML=`<div><h2>${historical?'🏛️ Conservada en el Legado':'🌿 Ciclo de la colonia'}</h2><p>${esc(text.querySelector('p')?.textContent||'Gestiona el ciclo de esta colonia')}</p></div>`;
  if(primary){
    primary.hidden=collapsed;
    primary.style.display=collapsed?'none':'';
  }
  section.appendChild(antelmoV7329ActionArea(primary,toggle));
  cycle.replaceWith(section);
}

function antelmoV7329EnhanceColony(){
  if(route!=='colonies'||!selected)return;
  const app=document.querySelector('#app');
  if(!app)return;
  antelmoV7329NormalizeDocumentary(app);
  antelmoV7329NormalizeCycle(app);
}

function antelmoV7329RefineCollectionCreator(){
  const creator=document.querySelector('[data-v7328-collection-create]');
  if(!creator)return;
  const input=creator.querySelector('[data-v7328-collection-name]');
  const button=creator.querySelector('[data-v7328-create-collection]');
  if(input)input.placeholder='Nueva colección';
  if(button){
    button.textContent='＋ Crear';
    button.setAttribute('aria-label','Crear y seleccionar colección');
  }
  creator.querySelector('small')?.remove();
}

const antelmoV7329BaseColonyForm=colonyForm;
colonyForm=function(id){
  antelmoV7329BaseColonyForm(id);
  antelmoV7329RefineCollectionCreator();
};

/* La copia sigue siendo compatible con la restauración de versiones previas. */
const antelmoV7329BaseBuildBackup=antelmoV7323BuildBackup;
antelmoV7323BuildBackup=async function(){
  const backup=await antelmoV7329BaseBuildBackup();
  backup.appVersion=ANTELMO_V7329_VERSION;
  return backup;
};

const antelmoV7329BaseBackupPanel=antelmoV7323BackupPanel;
antelmoV7323BackupPanel=function(){
  return antelmoV7329BaseBackupPanel().replace('<span class="chip">V7.3.28</span>','<span class="chip">V7.3.29</span>');
};

function antelmoV7329VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.29';
}

const antelmoV7329BaseRender=render;
render=function(){
  antelmoV7329BaseRender();
  antelmoV7329EnhanceColony();
  antelmoV7329VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7329-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7329-styles';
  style.textContent=`
  #app .v7327-module-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #app .v7327-module-grid>button{display:grid;grid-template-columns:29px minmax(0,1fr);grid-template-rows:auto auto;column-gap:7px;align-items:center;min-width:0;min-height:78px;padding:9px 10px;border-radius:15px}
  #app .v7327-module-grid>button>span{grid-row:1/3;font-size:21px}
  #app .v7327-module-grid>button>b{min-width:0;margin:0;font-size:12px;line-height:1.18}
  #app .v7327-module-grid>button>small{min-width:0;font-size:8.5px;line-height:1.25}

  .v7329-colony-section-title{align-items:center}
  .v7329-colony-section-title>div:first-child{min-width:0}
  .v7329-colony-section-title p{max-width:520px}
  .v7329-colony-section-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:none}
  .v7329-colony-primary-action{padding:8px 10px;border-radius:12px;font-size:10px}
  .v7329-colony-section-title>.v7329-colony-section-actions>.v7328-collapse-toggle{position:static;margin:0}
  .v7329-colony-section-title.v7329-is-collapsed p{display:none}
  .v7329-colony-section-title[data-v7329-colony-section="cycle"]{margin-bottom:84px}

  #app .colony-care-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #app .colony-care-actions button{min-width:0;min-height:59px;padding:8px 10px;border-radius:15px}
  #app .colony-care-actions button>span{font-size:20px}
  #app .colony-care-actions button>b{font-size:12px}
  #app .colony-care-actions button>small{font-size:8px}
  #app .dex-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}
  #app .dex-metrics .card{min-height:68px;padding:9px 11px;border-radius:15px}
  #app .dex-metrics .big-number{font-size:22px;line-height:1}
  #app .dex-metrics .sub{margin-top:4px;font-size:10px}

  .v7328-collection-create{grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important;margin-top:-6px!important;padding:6px!important;border-style:solid!important;border-radius:12px!important;background:transparent!important}
  .v7328-collection-create input{padding:9px!important;border-radius:10px!important}
  .v7328-collection-create button{min-height:40px;padding:8px 10px!important;border-radius:10px!important;font-size:11px!important}

  @media(max-width:390px){
    #app .v7327-module-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    #app .v7327-module-grid>button{min-height:75px;padding:8px}
    #app .v7327-module-grid>button>b{font-size:11px}
    #app .v7327-module-grid>button>small{font-size:8px}
    .v7329-colony-section-title p{max-width:210px}
  }
  `;
  document.head.appendChild(style);
})();
