/* ANTELMO V7.3.5 — Corrección de fechas, ayuda de escritura y módulos compactos.
   Las fechas se escriben como DD/MM/AAAA y continúan guardándose como AAAA-MM-DD. */

function antelmoDateDigits(value=''){
  return String(value).replace(/\D/g,'').slice(0,8);
}

function antelmoFormatDateInput(value=''){
  const digits=antelmoDateDigits(value);
  if(digits.length<=2)return digits;
  if(digits.length<=4)return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

function antelmoValidLocalDate(value=''){
  const match=String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match)return false;
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  if(year<1900||year>2100)return false;
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

function antelmoNormalizeLocalDate(value=''){
  const digits=antelmoDateDigits(value);
  if(digits.length!==8)return antelmoFormatDateInput(value);
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

prepareDateInputs=function(root=document){
  root?.querySelectorAll?.('input[type="date"], input[data-antelmo-date="true"]').forEach(input=>{
    if(input.dataset.antelmoPrepared==='true')return;
    const current=input.value;
    input.type='text';
    input.inputMode='numeric';
    input.autocomplete='off';
    input.placeholder='DD/MM/AAAA';
    input.maxLength=10;
    input.removeAttribute('pattern');
    input.dataset.antelmoDate='true';
    input.dataset.antelmoPrepared='true';
    delete input.dataset.localDate;
    input.value=toDisplayDate(current).replace(/ ·.*$/,'');

    const validate=()=>{
      const empty=!input.value.trim();
      const valid=empty&&!input.required||antelmoValidLocalDate(input.value);
      input.setCustomValidity(valid?'':'Introduce una fecha real con formato DD/MM/AAAA');
      return valid;
    };

    input.addEventListener('input',()=>{
      const caret=input.selectionStart||input.value.length;
      const before=input.value;
      input.value=antelmoFormatDateInput(input.value);
      if(input.value!==before&&caret>=before.length)input.setSelectionRange(input.value.length,input.value.length);
      input.setCustomValidity('');
    });
    input.addEventListener('blur',()=>{input.value=antelmoNormalizeLocalDate(input.value);validate()});
    input.addEventListener('change',validate);
  });
};

function prepareSpanishWriting(root=document){
  const excluded=new Set(['species','name','tags','query','url','token','icon','collectionId']);
  root?.querySelectorAll?.('input[type="text"], input:not([type]), textarea').forEach(field=>{
    if(field.dataset.antelmoDate==='true'||excluded.has(field.name)||field.closest('[role="search"]'))return;
    field.lang='es';
    field.spellcheck=true;
    field.setAttribute('autocorrect','on');
    field.setAttribute('autocapitalize','sentences');
  });
}

const antelmoHotfixOpenModal=openModal;
openModal=function(html){
  antelmoHotfixOpenModal(html);
  prepareSpanishWriting(document.querySelector('#modalBody'));
};

document.addEventListener('submit',event=>{
  const inputs=[...(event.target.querySelectorAll?.('[data-antelmo-date="true"]')||[])];
  const invalid=inputs.find(input=>{
    const empty=!input.value.trim();
    const valid=empty&&!input.required||antelmoValidLocalDate(input.value);
    input.setCustomValidity(valid?'':'Introduce una fecha real con formato DD/MM/AAAA');
    return !valid;
  });
  if(invalid){
    event.preventDefault();event.stopImmediatePropagation();invalid.reportValidity();invalid.focus();
  }
},true);

/* Hall of Fame: nunca muestra NaN y solo premia cálculos válidos. */
growthVelocity=function(colony){
  const rows=db.growthRecords
    .filter(item=>String(item.colonyId)===String(colony.id))
    .map(item=>({date:String(item.date||''),workers:Number(item.workers)}))
    .filter(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&Number.isFinite(item.workers))
    .sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length<2)return null;
  const firstDate=new Date(`${rows[0].date}T12:00:00`);
  const lastDate=new Date(`${rows.at(-1).date}T12:00:00`);
  const days=(lastDate-firstDate)/86400000;
  if(!Number.isFinite(days)||days<=0)return null;
  const value=(rows.at(-1).workers-rows[0].workers)/days*30;
  return Number.isFinite(value)?value:null;
};

hallView=function(){
  const colonies=db.colonies.slice();
  const favorite=db.colonies.find(c=>String(c.id)===String(db.appConfig.v72.favoriteColonyId));
  const longest=colonies.filter(c=>c.founded&&Number.isFinite(daysSince(c.founded))).sort((a,b)=>daysSince(b.founded)-daysSince(a.founded))[0];
  const largest=colonies.filter(c=>Number.isFinite(Number(c.workers))).sort((a,b)=>Number(b.workers)-Number(a.workers))[0];
  const fastest=colonies.map(c=>({c,value:growthVelocity(c)})).filter(x=>Number.isFinite(x.value)).sort((a,b)=>b.value-a.value)[0];
  const photographed=colonies.map(c=>({c,value:db.mediaIndex.filter(x=>String(x.colonyId)===String(c.id)).length})).sort((a,b)=>b.value-a.value)[0];
  const fed=colonies.map(c=>({c,value:db.feedings.filter(x=>String(x.colonyId)===String(c.id)).length})).sort((a,b)=>b.value-a.value)[0];
  const records=[
    ['👑','Más longeva',longest,longest?`${daysSince(longest.founded)} días documentados`:'Sin datos'],
    ['🐜','Más numerosa',largest,largest?`${Number(largest.workers)||0} obreras`:'Sin datos'],
    ['🌱','Crecimiento más rápido',fastest?.c,fastest?`${fastest.value.toFixed(1)} obreras/mes`:'Sin datos suficientes'],
    ['📸','Más fotografiada',photographed?.c,photographed?`${photographed.value} archivos`:'Sin fotos'],
    ['🍯','Más alimentaciones',fed?.c,fed?`${fed.value} registros`:'Sin datos'],
    ['❤️','Colonia favorita',favorite,favorite?'Elegida por ti':'Sin elegir']
  ];
  return `<div class="section-title"><div><h2>🏆 Hall of Fame</h2><p>Récords automáticos de toda tu historia</p></div></div>
  <form id="favoriteColonyForm" class="card favorite-picker">${field('Colonia favorita',`<select name="favorite"><option value="">Sin elegir</option>${db.colonies.map(c=>`<option value="${esc(c.id)}" ${String(favorite?.id)===String(c.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select>`)}<button class="button">Guardar favorita</button></form>
  <div class="hall-grid">${records.map(([icon,title,colony,value])=>`<article class="hall-card ${title==='Colonia favorita'?'favorite':''}" ${colony?`data-colony="${esc(colony.id)}"`:''}><span>${icon}</span><div class="hall-card-copy"><small>${esc(title)}</small><b>${esc(colony?.name||'Pendiente')}</b><p>${esc(value)}</p></div></article>`).join('')}</div>`;
};

/* Diseño compacto y alineado para los módulos y el Hall of Fame en móvil. */
(function installV735Styles(){
  if(document.querySelector('#antelmo-v735-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v735-styles';
  style.textContent=`
    .roadmap-modules{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .roadmap-modules button{min-height:76px;display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;align-items:center;padding:11px 12px;border-radius:17px}
    .roadmap-modules button>span{grid-row:1/3;display:grid;place-items:center;width:34px;height:34px;font-size:21px;background:var(--surface2);border-radius:11px}
    .roadmap-modules button>b{margin:0;align-self:end;font-size:13px}
    .roadmap-modules button>small{align-self:start;font-size:9px;line-height:1.25}
    .favorite-picker{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:9px;padding:11px 12px}
    .favorite-picker .button{min-height:42px;padding:8px 12px;white-space:nowrap}
    .hall-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .hall-card{min-height:104px;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:11px;padding:13px;border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--ink);text-align:left}
    .hall-card>span{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--surface2);font-size:23px}
    .hall-card-copy{min-width:0}.hall-card small,.hall-card b,.hall-card p{display:block;margin:0}
    .hall-card small{font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
    .hall-card b{margin-top:4px;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hall-card p{margin-top:5px;font-size:11px;color:var(--muted)}
    @media(max-width:460px){
      .roadmap-modules,.hall-grid{grid-template-columns:1fr}
      .roadmap-modules button{min-height:66px}
      .hall-card{min-height:82px;padding:10px 12px}
      .favorite-picker{grid-template-columns:1fr}.favorite-picker .button{width:100%}
    }
  `;
  document.head.appendChild(style);
})();