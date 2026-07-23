/* ANTELMO V4.2 — módulos avanzados offline */
const baseBoot = boot, baseBind = bind, baseHome = home, baseStats = stats;

function ensureProData(){
  db.environmentLogs ||= [];
  db.habitats ||= [];
  db.healthChecks ||= [];
  db.calendarNotes ||= [];
  db.appConfig ||= {};
  db.appConfig.feedingAlertDays ||= 4;
}

boot = async function(){ await baseBoot(); ensureProData(); save(); render(); };
save = function(){ ensureProData(); db.metadata={...(db.metadata||{}),schemaVersion:'4.2.0',updatedAt:new Date().toISOString()}; localStorage.setItem('antelmo.v4',JSON.stringify(db)); };

function dueAlerts(){
  const limit=+(db.appConfig.feedingAlertDays||4), out=[];
  db.colonies.forEach(c=>{const f=lastFeeding(c.id),d=daysSince(f?.date);if(d==null||d>=limit)out.push({level:d==null?'warn':'danger',icon:'🍯',title:c.name,text:d==null?'Sin alimentación registrada':`Última alimentación hace ${d} días`});});
  db.tasks.filter(t=>t.status!=='Completada'&&t.dueDate&&t.dueDate<=today()).forEach(t=>out.push({level:'danger',icon:'⏰',title:t.title,text:`Vence ${t.dueDate}`}));
  return out.slice(0,8);
}

home = function(){
  const alerts=dueAlerts(), env=db.environmentLogs.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  return baseHome()+`<div class="section-title"><div><h2>Centro de cuidados</h2><p>${alerts.length?alerts.length+' avisos que revisar':'Todo al día'}</p></div></div>
  <div class="cards">${alerts.map(a=>`<div class="card alert-card ${a.level}"><span class="alert-icon">${a.icon}</span><div><b>${esc(a.title)}</b><div class="sub">${esc(a.text)}</div></div></div>`).join('')||'<div class="card empty">Sin avisos urgentes 🌱</div>'}</div>
  ${env?`<div class="section-title"><div><h2>Última medición</h2><p>${esc(env.date)} · ${esc(colonyName(env.colonyId))}</p></div></div><div class="metric-grid"><div class="card"><b class="big-number">${esc(env.temperature||'—')}°</b><div class="sub">temperatura</div></div><div class="card"><b class="big-number">${esc(env.humidity||'—')}%</b><div class="sub">humedad</div></div></div>`:''}`;
};

function calendarView(){
  const month=(db.appConfig.calendarMonth||today().slice(0,7)), [y,m]=month.split('-').map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate(), offset=(first.getDay()+6)%7;
  const entries=[...db.events.map(x=>({...x,icon:'📅'})),...db.feedings.map(x=>({...x,title:x.food,icon:'🍯'})),...db.growthRecords.map(x=>({...x,title:`${x.workers||0} obreras`,icon:'📈'})),...db.tasks.filter(x=>x.dueDate).map(x=>({...x,date:x.dueDate,icon:'⏰'})),...db.environmentLogs.map(x=>({...x,title:`${x.temperature||'—'}° · ${x.humidity||'—'}%`,icon:'🌡️'}))];
  let cells='';for(let i=0;i<offset;i++)cells+='<div class="cal-day muted"></div>';for(let d=1;d<=days;d++){const date=`${month}-${String(d).padStart(2,'0')}`, items=entries.filter(x=>x.date===date);cells+=`<button class="cal-day ${items.length?'has-items':''}" data-cal-date="${date}"><b>${d}</b><span>${items.slice(0,3).map(x=>x.icon).join('')}</span></button>`;}
  return `<div class="section-title"><div><h2>Calendario</h2><p>Cuidados, eventos y mediciones</p></div></div><div class="card"><div class="calendar-head"><button class="icon-btn" data-month="-1">‹</button><input id="calendarMonth" type="month" value="${month}"><button class="icon-btn" data-month="1">›</button></div><div class="weekdays">${['L','M','X','J','V','S','D'].map(x=>`<b>${x}</b>`).join('')}</div><div class="calendar-grid">${cells}</div></div>`;
}

function faunaView(){
  return `<div class="section-title"><div><h2>Fauna y terrarios</h2><p>${db.fauna.length} animales registrados</p></div><button class="button" data-new-fauna>＋ Animal</button></div><div class="cards">${db.fauna.map(x=>`<div class="card fauna-card"><div class="fauna-emoji">${esc(x.emoji||'🪲')}</div><div><h3>${esc(x.name)}</h3><div class="latin">${esc(x.species||'Especie sin confirmar')}</div><div class="sub">${esc(x.habitat||'Sin hábitat')} · ${esc(x.status||'Activo')}</div><div class="sub">${esc(x.notes||'')}</div></div><button class="icon-btn" data-edit-fauna="${esc(x.id)}">✎</button></div>`).join('')||'<div class="empty">Añade a Blas, Sansón, Tuna, Chin u otros habitantes.</div>'}</div>`;
}

function environmentView(){
 const arr=db.environmentLogs.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return `<div class="section-title"><div><h2>Ambiente</h2><p>Temperatura, humedad y revisiones</p></div><button class="button" data-new-env>＋ Medición</button></div><div class="cards">${arr.map(x=>`<div class="card env-row"><div><b>${esc(x.date)} · ${esc(colonyName(x.colonyId))}</b><div class="sub">${esc(x.notes||'Sin observaciones')}</div></div><div class="env-values"><b>${esc(x.temperature||'—')}°C</b><b>${esc(x.humidity||'—')}%</b></div></div>`).join('')||'<div class="empty">Todavía no hay mediciones.</div>'}</div>`;
}

function searchView(){return `<div class="section-title"><div><h2>Buscar</h2><p>Encuentra cualquier registro</p></div></div><input id="globalSearch" class="search-input" placeholder="Colonia, alimento, evento, nota…" autofocus><div id="searchResults" class="cards" style="margin-top:12px"><div class="empty">Escribe para buscar.</div></div>`;}

more = function(){
 const tab=db.appConfig.moreTab||'tools';
 return `<div class="section-title"><div><h2>Centro ANTELMO</h2><p>Herramientas avanzadas</p></div></div><div class="tabs pro-tabs">${[['tools','Herramientas'],['calendar','Calendario'],['fauna','Fauna'],['environment','Ambiente'],['search','Buscar']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>${tab==='calendar'?calendarView():tab==='fauna'?faunaView():tab==='environment'?environmentView():tab==='search'?searchView():`<div class="cards"><div class="card"><b>☁️ Copia de seguridad completa</b><div class="sub">Incluye datos, fotos, fauna, mediciones y configuración.</div><div class="actions"><button class="button" id="export">Exportar</button><label class="button secondary">Importar<input id="import" type="file" accept="application/json" hidden></label></div></div><div class="card"><b>⏰ Recordatorios</b><div class="sub">Alimentación, hidratación, limpieza o revisión.</div><div class="actions"><button class="button secondary" data-quick="task">Crear recordatorio</button></div></div><div class="card"><b>📦 Inventario</b><div class="sub">${db.inventory.length} elementos registrados.</div><div class="actions"><button class="button secondary" data-inventory>Gestionar</button></div></div><div class="card"><b>⚙️ Aviso de alimentación</b><div class="sub">Avisar tras <strong>${db.appConfig.feedingAlertDays} días</strong> sin registro.</div><input id="feedingDays" type="range" min="1" max="14" value="${db.appConfig.feedingAlertDays}"></div><div class="card"><b>ANTELMO V4.2</b><div class="sub">Aplicación local, privada, instalable y disponible sin conexión.</div></div></div>`}`;
};

stats = function(){
 const trends=db.colonies.map(c=>{const a=db.growthRecords.filter(x=>String(x.colonyId)===String(c.id)).sort((x,y)=>String(x.date).localeCompare(String(y.date)));const delta=a.length>1?(+a.at(-1).workers||0)-(+a[0].workers||0):null;return {c,delta};});
 return baseStats()+`<div class="section-title"><div><h2>Análisis automático</h2><p>Lectura local de tus registros</p></div></div><div class="cards">${trends.map(({c,delta})=>`<div class="card insight"><span>${delta==null?'➖':delta>0?'↗️':delta<0?'↘️':'➡️'}</span><div><b>${esc(c.name)}</b><div class="sub">${delta==null?'Faltan al menos dos recuentos para calcular tendencia':delta>0?`Crecimiento registrado: +${delta} obreras`:delta<0?`Descenso registrado: ${delta} obreras`:'Población estable entre recuentos'}</div></div></div>`).join('')}</div>`;
};

function faunaForm(id){const x=db.fauna.find(y=>String(y.id)===String(id))||{};openModal(`<h2>${id?'Editar':'Nuevo'} animal</h2><form id="faunaForm" class="form">${field('Nombre',`<input name="name" value="${esc(x.name||'')}" required>`)}<div class="row">${field('Emoji',`<input name="emoji" value="${esc(x.emoji||'🪲')}" maxlength="4">`)}${field('Estado',`<select name="status">${['Activo','En observación','Liberado','Fallecido'].map(v=>`<option ${x.status===v?'selected':''}>${v}</option>`).join('')}</select>`)}</div>${field('Especie',`<input name="species" value="${esc(x.species||'')}">`)}${field('Hábitat',`<input name="habitat" value="${esc(x.habitat||'Terrario principal')}">`)}${field('Notas',`<textarea name="notes">${esc(x.notes||'')}</textarea>`)}<button class="button">Guardar</button>${id?'<button type="button" id="deleteFauna" class="button danger">Eliminar</button>':''}</form>`);$('#faunaForm').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));if(id)Object.assign(x,o);else db.fauna.push({id:uid('fauna'),...o,createdAt:today()});save();closeModal();render()};if(id)$('#deleteFauna').onclick=()=>{if(confirm('¿Eliminar este animal?')){db.fauna=db.fauna.filter(y=>String(y.id)!==String(id));save();closeModal();render()}};}
function environmentForm(){openModal(`<h2>🌡️ Nueva medición</h2><form id="envForm" class="form">${field('Colonia o instalación',`<select name="colonyId"><option value="">General / terrario</option>${colonyOptions()}</select>`)}<div class="row">${field('Fecha',`<input name="date" type="date" value="${today()}" required>`)}${field('Hora',`<input name="time" type="time">`)}</div><div class="row">${field('Temperatura °C',`<input name="temperature" type="number" step="0.1">`)}${field('Humedad %',`<input name="humidity" type="number" min="0" max="100">`)}</div>${field('Notas',`<textarea name="notes" placeholder="Condensación, depósito, ventilación…"></textarea>`)}<button class="button">Guardar medición</button></form>`);$('#envForm').onsubmit=e=>{e.preventDefault();db.environmentLogs.push({id:uid('env'),...Object.fromEntries(new FormData(e.target))});save();closeModal();toast('Medición guardada');render()};}
function showCalendarDay(date){const items=[...db.events.map(x=>({...x,kind:'Evento'})),...db.feedings.map(x=>({...x,kind:'Alimentación',title:x.food})),...db.growthRecords.map(x=>({...x,kind:'Recuento',title:`${x.workers||0} obreras`})),...db.tasks.filter(x=>x.dueDate).map(x=>({...x,date:x.dueDate,kind:'Tarea'})),...db.environmentLogs.map(x=>({...x,kind:'Medición',title:`${x.temperature||'—'}° · ${x.humidity||'—'}%`}))].filter(x=>x.date===date);openModal(`<h2>${date}</h2><div class="cards">${items.map(x=>`<div class="card"><b>${esc(x.kind)} · ${esc(x.title||x.type||'Registro')}</b><div class="sub">${esc(colonyName(x.colonyId))} ${x.notes?'· '+esc(x.notes):''}</div></div>`).join('')||'<div class="empty">No hay registros este día.</div>'}</div>`);}
function doSearch(q){q=q.trim().toLowerCase();if(!q)return [];const rows=[];db.colonies.forEach(x=>rows.push({icon:'🐜',title:x.name,text:`${x.species||''} ${x.notes||''}`}));db.feedings.forEach(x=>rows.push({icon:'🍯',title:x.food,text:`${x.date} ${colonyName(x.colonyId)} ${x.notes||''}`}));db.events.forEach(x=>rows.push({icon:'📅',title:x.title||x.type,text:`${x.date} ${colonyName(x.colonyId)} ${x.notes||''}`}));db.fauna.forEach(x=>rows.push({icon:x.emoji||'🪲',title:x.name,text:`${x.species||''} ${x.notes||''}`}));return rows.filter(x=>(x.title+' '+x.text).toLowerCase().includes(q)).slice(0,50);}

bind = function(){
 baseBind();
 $$('[data-more-tab]').forEach(b=>b.onclick=()=>{db.appConfig.moreTab=b.dataset.moreTab;save();render()});
 $('[data-new-fauna]')&&($('[data-new-fauna]').onclick=()=>faunaForm());$$('[data-edit-fauna]').forEach(b=>b.onclick=()=>faunaForm(b.dataset.editFauna));
 $('[data-new-env]')&&($('[data-new-env]').onclick=environmentForm);
 $('#feedingDays')&&($('#feedingDays').oninput=e=>{db.appConfig.feedingAlertDays=+e.target.value;save();e.target.closest('.card').querySelector('strong').textContent=e.target.value+' días'});
 $('#calendarMonth')&&($('#calendarMonth').onchange=e=>{db.appConfig.calendarMonth=e.target.value;save();render()});
 $$('[data-month]').forEach(b=>b.onclick=()=>{const cur=new Date((db.appConfig.calendarMonth||today().slice(0,7))+'-01T12:00:00');cur.setMonth(cur.getMonth()+(+b.dataset.month));db.appConfig.calendarMonth=cur.toISOString().slice(0,7);save();render()});
 $$('[data-cal-date]').forEach(b=>b.onclick=()=>showCalendarDay(b.dataset.calDate));
 $('#globalSearch')&&($('#globalSearch').oninput=e=>{const rows=doSearch(e.target.value),el=$('#searchResults');el.innerHTML=rows.map(x=>`<div class="card search-row"><span>${x.icon}</span><div><b>${esc(x.title)}</b><div class="sub">${esc(x.text)}</div></div></div>`).join('')||'<div class="empty">Sin resultados.</div>'});
};
