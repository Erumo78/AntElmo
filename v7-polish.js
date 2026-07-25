/* ANTELMO V7.3.9 — pulido visual y navegación móvil. */

function antelmoV739Config(){
  db.appConfig ||= {};
  db.appConfig.v739 ||= {moduleTabsScrollLeft:0};
  const value=Number(db.appConfig.v739.moduleTabsScrollLeft);
  db.appConfig.v739.moduleTabsScrollLeft=Number.isFinite(value)&&value>0?value:0;
  return db.appConfig.v739;
}

let antelmoV739TabsSaveTimer=0;

function antelmoV739CaptureTabs(){
  if(typeof db==='undefined'||route!=='more')return;
  const tabs=document.querySelector('#app .v7-tabs');
  if(tabs)antelmoV739Config().moduleTabsScrollLeft=Math.max(0,tabs.scrollLeft||0);
}

function antelmoV739KeepActiveTabVisible(tabs){
  const active=tabs.querySelector('button.active');
  if(!active)return;
  const left=active.offsetLeft,right=left+active.offsetWidth;
  if(left<tabs.scrollLeft)tabs.scrollLeft=Math.max(0,left-8);
  else if(right>tabs.scrollLeft+tabs.clientWidth)tabs.scrollLeft=Math.max(0,right-tabs.clientWidth+8);
  antelmoV739Config().moduleTabsScrollLeft=tabs.scrollLeft;
}

function antelmoV739RestoreTabs(){
  const tabs=document.querySelector('#app .v7-tabs');
  if(!tabs)return;
  tabs.scrollLeft=antelmoV739Config().moduleTabsScrollLeft;
  antelmoV739KeepActiveTabVisible(tabs);
  tabs.addEventListener('scroll',()=>{
    antelmoV739Config().moduleTabsScrollLeft=Math.max(0,tabs.scrollLeft||0);
    clearTimeout(antelmoV739TabsSaveTimer);
    antelmoV739TabsSaveTimer=setTimeout(()=>save(),160);
  },{passive:true});
}

function antelmoV739TagView(){
  const app=document.querySelector('#app');
  if(!app)return;
  app.dataset.antelmoView=route==='more'?String(db.appConfig.moreTab||'hub'):String(route||'home');
}

const antelmoV739Render=render;
render=function(){
  antelmoV739CaptureTabs();
  antelmoV739Render();
  antelmoV739TagView();
  antelmoV739RestoreTabs();
  requestAnimationFrame(()=>{
    const tabs=document.querySelector('#app .v7-tabs');
    if(tabs){
      tabs.scrollLeft=antelmoV739Config().moduleTabsScrollLeft;
      antelmoV739KeepActiveTabVisible(tabs);
    }
  });
};

(function installV739Styles(){
  if(document.querySelector('#antelmo-v739-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v739-styles';
  style.textContent=`
  .workbench-tools{gap:6px}
  .workbench-tools button{min-height:50px;display:grid;grid-template-columns:25px minmax(0,1fr);grid-template-rows:auto auto;column-gap:7px;align-items:center;padding:7px 9px;border-radius:14px}
  .workbench-tools button>span{grid-row:1/3;display:grid;place-items:center;width:25px;font-size:18px}
  .workbench-tools button>b{margin:0;font-size:12px;line-height:1.2}
  .workbench-tools button>small{font-size:8.5px;line-height:1.2}

  #app[data-antelmo-view="life"]{--antelmo-life-secondary:#334f43}
  body.dark #app[data-antelmo-view="life"]{--antelmo-life-secondary:#c7d7d0}
  #app[data-antelmo-view="life"] .section-title p,
  #app[data-antelmo-view="life"] .life-book .latin,
  #app[data-antelmo-view="life"] .life-book>p,
  #app[data-antelmo-view="life"] .life-book>small,
  #app[data-antelmo-view="life"] .life-entry p,
  #app[data-antelmo-view="life"] .life-entry small,
  #app[data-antelmo-view="life"] .life-entry time,
  #app[data-antelmo-view="life"] .sub{color:var(--antelmo-life-secondary)!important;line-height:1.5}
  #app[data-antelmo-view="life"] .section-title p,
  #app[data-antelmo-view="life"] .life-book .latin,
  #app[data-antelmo-view="life"] .life-book>p{font-size:12px}
  #app[data-antelmo-view="life"] .life-book>small,
  #app[data-antelmo-view="life"] .life-entry small,
  #app[data-antelmo-view="life"] .life-entry time{font-size:11px}

  .v73-comparison-grid{grid-template-columns:minmax(105px,1.1fr) repeat(var(--compare-columns),minmax(92px,1fr));min-width:calc(105px + var(--compare-columns) * 92px)}
  .v73-comparison-grid>*{padding:7px 5px}
  .v73-comparison-grid .colony-heading{gap:2px;border-top-width:4px;overflow-wrap:anywhere}
  .v73-comparison-grid .colony-heading span{font-size:20px}
  .v73-comparison-grid .colony-heading b{font-size:10.5px;line-height:1.2}
  .v73-comparison-grid .colony-heading small{font-size:8.5px;line-height:1.2}
  .v73-comparison-grid .metric-label,.v73-comparison-grid .metric-value{font-size:10.5px;line-height:1.25;overflow-wrap:anywhere}
  .v73-compare-form label{min-width:98px;padding:8px}
  .v73-compare-form label span{width:36px;height:36px}

  #app[data-antelmo-view="stats"] .analytics-grid{gap:8px}
  #app[data-antelmo-view="stats"] .analytic-card{padding:11px 12px;border-radius:16px}
  #app[data-antelmo-view="stats"] .analytic-card>div:first-child{align-items:baseline;gap:8px}
  #app[data-antelmo-view="stats"] .analytic-card>div:first-child b{font-size:15px;line-height:1.2}
  #app[data-antelmo-view="stats"] .analytic-card span{font-size:13px;font-weight:800;color:var(--ink)}
  #app[data-antelmo-view="stats"] .analytic-card small{font-size:12px;line-height:1.35;color:var(--muted)}
  #app[data-antelmo-view="stats"] .sparkline{height:58px;margin:4px 0}

  .v7-tabs{scrollbar-width:none}
  .v7-tabs::-webkit-scrollbar{display:none}

  @media(max-width:620px){
    .workbench-v7-primary{gap:6px}
    .workbench-v7-primary button{min-height:46px;padding:7px 9px}
    .workbench-tools button{min-height:44px;display:flex;gap:7px;padding:7px 9px}
    .workbench-tools button>span{width:23px;font-size:18px;flex:none}
    .workbench-tools button>b{font-size:12px}
    .workbench-tools button>small{display:none}
    #app[data-antelmo-view="stats"] .analytic-card{padding:10px 11px}
    #app[data-antelmo-view="stats"] .sparkline{height:52px}
  }

  @media(max-width:430px){
    .v73-comparison-grid{grid-template-columns:96px repeat(var(--compare-columns),82px);min-width:calc(96px + var(--compare-columns) * 82px)}
    .v73-comparison-grid>*{padding:6px 4px}
    .v73-comparison-grid .colony-heading span{font-size:18px}
    .v73-comparison-grid .colony-heading b,.v73-comparison-grid .metric-label,.v73-comparison-grid .metric-value{font-size:10px}
    .v73-comparison-grid .colony-heading small{font-size:8px}
  }`;
  document.head.appendChild(style);
})();
