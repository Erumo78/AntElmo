/* ANTELMO V7.3.2 — ampliaciones que funcionan íntegramente en el dispositivo. */
const v73BaseBind=bind;
const v73BaseRender=render;
const v73BaseSave=save;
const v73BaseStats=stats;
const v73BaseMore=more;
const v73BaseHubView=hubView;
const v73BaseAchievementDefinitions=achievementDefinitions;

function ensureLocalRoadmapData(){
  ensureRoadmapData();
  db.appConfig.v73 ||= {};
  const cfg=db.appConfig.v73;
  cfg.journal ||= {query:'',colony:'all',type:'all',importance:'all',from:'',to:'',media:'all',tags:''};
  cfg.compareIds=Array.isArray(cfg.compareIds)?cfg.compareIds.map(String):[];
  cfg.encyclopedia ||= {query:'',status:'all'};
  cfg.documentary ||= {colonyId:'',period:'all'};
  db.appConfig.dateFormat='DD/MM/YYYY';
  db.metadata={...(db.metadata||{}),schemaVersion:'7.3.2'};
}

function v73Date(value){
  const date=new Date(`${String(value||'').slice(0,10)}T12:00:00`);
  return Number.isNaN(date.getTime())?null:date;
}

function v73DaysBetween(a,b){
  const first=v73Date(a),last=v73Date(b);
  return first&&last?Math.max(0,Math.round((last-first)/86400000)):null;
}

function v73Average(values){
  const valid=values.map(Number).filter(Number.isFinite);
  return valid.length?valid.reduce((sum,value)=>sum+value,0)/valid.length:null;
}

function v73AverageInterval(rows){
  const dates=[...new Set(rows.map(row=>String(row.date||'').slice(0,10)).filter(Boolean))].sort();
  if(dates.length<2)return null;
  return v73Average(dates.slice(1).map((date,index)=>v73DaysBetween(dates[index],date)));
}

function v73Pearson(points){
  if(points.length<3)return null;
  const meanX=v73Average(points.map(point=>point.x)),meanY=v73Average(points.map(point=>point.y));
  const numerator=points.reduce((sum,point)=>sum+(point.x-meanX)*(point.y-meanY),0);
  const dx=Math.sqrt(points.reduce((sum,point)=>sum+(point.x-meanX)**2,0));
  const dy=Math.sqrt(points.reduce((sum,point)=>sum+(point.y-meanY)**2,0));
  return dx&&dy?numerator/(dx*dy):null;
}

function v73JournalHasMedia(item){
  return item.kind==='Fotografía'||item.source==='photo'||journalMediaIds(item).length>0;
}

function v73FilteredJournal(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.journal;
  const query=String(cfg.query||'').trim().toLowerCase();
  const tags=String(cfg.tags||'').split(',').map(tag=>tag.trim().toLowerCase()).filter(Boolean);
  return journalItems().filter(item=>{
    const haystack=`${item.title||''} ${item.text||''} ${item.kind||''} ${colonyName(item.colonyId)} ${(item.tags||[]).join(' ')}`.toLowerCase();
    const itemTags=(item.tags||[]).map(tag=>String(tag).toLowerCase());
    const hasMedia=v73JournalHasMedia(item);
    return (!query||haystack.includes(query))
      &&(cfg.colony==='all'||String(item.colonyId)===String(cfg.colony))
      &&(cfg.type==='all'||item.kind===cfg.type)
      &&(cfg.importance==='all'||String(item.importance||'Normal')===cfg.importance)
      &&(!cfg.from||String(item.date||'')>=cfg.from)
      &&(!cfg.to||String(item.date||'')<=cfg.to)
      &&(cfg.media==='all'||(cfg.media==='with'&&hasMedia)||(cfg.media==='without'&&!hasMedia))
      &&(!tags.length||tags.every(tag=>itemTags.includes(tag)||haystack.includes(tag)));
  });
}

records=function(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.journal,items=v73FilteredJournal(),all=journalItems();
  const types=[...new Set(all.map(item=>item.kind).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const activeFilters=[cfg.query,cfg.colony!=='all',cfg.type!=='all',cfg.importance!=='all',cfg.from,cfg.to,cfg.media!=='all',cfg.tags].filter(Boolean).length;
  return `<div class="section-title"><div><h2>📖 Diario científico</h2><p>Búsqueda combinada por contenido, fecha, importancia y material visual</p></div><button class="button" data-journal-for="">＋ Entrada</button></div>
  <form id="v73JournalFilters" class="card v73-filter-panel">
    <div class="v73-filter-primary"><input name="query" value="${esc(cfg.query||'')}" placeholder="Buscar palabras, colonia o contenido…"><select name="colony"><option value="all">Todas las colonias</option>${db.colonies.map(colony=>`<option value="${esc(colony.id)}" ${String(cfg.colony)===String(colony.id)?'selected':''}>${esc(colony.name)}</option>`).join('')}</select><select name="type"><option value="all">Todos los tipos</option>${types.map(type=>`<option value="${esc(type)}" ${cfg.type===type?'selected':''}>${esc(type)}</option>`).join('')}</select></div>
    <details ${activeFilters?'open':''}><summary>Filtros avanzados <span>${activeFilters||'ninguno'}</span></summary>
      <div class="v73-filter-grid">
        <label>Importancia<select name="importance">${['all','Normal','Importante','Hito'].map(value=>`<option value="${value}" ${cfg.importance===value?'selected':''}>${value==='all'?'Cualquier importancia':value}</option>`).join('')}</select></label>
        <label>Desde<input name="from" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.from||''))}"></label>
        <label>Hasta<input name="to" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.to||''))}"></label>
        <label>Material<select name="media"><option value="all" ${cfg.media==='all'?'selected':''}>Con o sin fotos</option><option value="with" ${cfg.media==='with'?'selected':''}>Solo con fotos/vídeos</option><option value="without" ${cfg.media==='without'?'selected':''}>Sin material visual</option></select></label>
        <label>Etiquetas<input name="tags" value="${esc(cfg.tags||'')}" placeholder="cría, mudanza"></label>
      </div>
    </details>
    <div class="v73-filter-actions"><button class="button">Aplicar filtros</button><button type="button" class="button secondary" data-clear-journal-filters>Limpiar</button></div>
  </form>
  <div class="v73-result-strip"><span><b>${items.length}</b> de ${all.length} registros</span><span>${items.filter(v73JournalHasMedia).length} con material visual</span><span>${items.filter(item=>item.importance==='Hito'||item.kind==='Hito').length} hitos</span></div>
  <div class="life-timeline">${items.map(item=>entryHtml(item)).join('')||'<div class="card empty">No hay entradas que coincidan con todos los filtros.</div>'}</div>`;
};

function v73GenerationDays(colony){
  const rows=db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  for(let index=0;index<rows.length;index++){
    const start=rows[index];
    if((+start.eggs||0)+(+start.larvae||0)+(+start.pupae||0)<=0)continue;
    const end=rows.slice(index+1).find(row=>(+row.workers||0)>(+start.workers||0));
    if(end)return v73DaysBetween(start.date,end.date);
  }
  const items=journalItems(colony.id).slice().reverse();
  const broodIndex=items.findIndex(item=>/primer(?:os|as)?\s+(huevo|larva|pupa)|puesta/i.test(`${item.title} ${item.text}`));
  if(broodIndex>=0){
    const birth=items.slice(broodIndex+1).find(item=>/primera\s+obrera|nacimiento|eclosi/i.test(`${item.title} ${item.text}`));
    if(birth)return v73DaysBetween(items[broodIndex].date,birth.date);
  }
  return null;
}

function v73TemperatureGrowthCorrelation(colony){
  const growth=db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)&&row.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const environment=(db.environmentLogs||[]).filter(row=>String(row.colonyId)===String(colony.id)&&row.temperature!=='');
  const points=[];
  for(let index=1;index<growth.length;index++){
    const previous=growth[index-1],current=growth[index],days=v73DaysBetween(previous.date,current.date)||1;
    const readings=environment.filter(row=>String(row.date)>=String(previous.date)&&String(row.date)<=String(current.date));
    const temperature=v73Average(readings.map(row=>row.temperature));
    if(temperature!=null)points.push({x:temperature,y:((+current.workers||0)-(+previous.workers||0))/days});
  }
  return {value:v73Pearson(points),points:points.length};
}

function v73ScientificMetrics(colony){
  const items=journalItems(colony.id),feedings=db.feedings.filter(row=>String(row.colonyId)===String(colony.id));
  const maintenance=items.filter(item=>/limpieza|mantenimiento|agua|depósito|deposito|mudanza|traslado|hormiguero|forrajeo/i.test(`${item.kind} ${item.title} ${item.text}`));
  const lastDate=items.map(item=>item.date).filter(Boolean).sort().at(-1)||colony.updatedAt||colony.founded;
  const generation=v73GenerationDays(colony),correlation=v73TemperatureGrowthCorrelation(colony);
  const growth=db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)&&row.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const latestEnvironment=(db.environmentLogs||[]).filter(row=>String(row.colonyId)===String(colony.id)).sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1);
  const anomalies=[];
  const quiet=lastDate?daysSince(lastDate):null,feedGap=lastFeeding(colony.id)?daysSince(lastFeeding(colony.id).date):null;
  if(quiet!=null&&quiet>30)anomalies.push(`${quiet} días sin novedades`);
  if(feedGap==null&&colony.founded&&daysSince(colony.founded)>7)anomalies.push('sin alimentación registrada');
  if(feedGap!=null&&feedGap>Math.max(7,(+db.appConfig.feedingAlertDays||4)*2))anomalies.push(`${feedGap} días sin alimentación`);
  if(growth.length>1&&+growth.at(-1).workers<+growth.at(-2).workers)anomalies.push('descenso en el último recuento');
  if(latestEnvironment?.humidity!==''&&latestEnvironment?.humidity!=null&&(+latestEnvironment.humidity<35||+latestEnvironment.humidity>90))anomalies.push(`humedad reciente ${latestEnvironment.humidity} %`);
  return {
    quiet,
    feedingEvery:v73AverageInterval(feedings),
    maintenanceEvery:v73AverageInterval(maintenance),
    generation,
    correlation:correlation.value,
    correlationPoints:correlation.points,
    incidents:items.filter(item=>item.kind==='Incidencia').length,
    moves:items.filter(item=>/muda|traslado|hormiguero/i.test(`${item.kind} ${item.title}`)).length,
    anomalies
  };
}

function v73Metric(value,suffix=' días'){
  if(value==null)return '—';
  const rounded=Math.round(value);
  return suffix===' días'?`${rounded} día${rounded===1?'':'s'}`:`${rounded}${suffix}`;
}

stats=function(){
  ensureLocalRoadmapData();
  const active=db.colonies.filter(colony=>colony.lifecycle!=='historical');
  const rows=active.map(colony=>({colony,metrics:v73ScientificMetrics(colony)}));
  const alerts=rows.reduce((sum,row)=>sum+row.metrics.anomalies.length,0);
  const documented=rows.filter(row=>row.metrics.generation!=null).length;
  const correlations=rows.filter(row=>row.metrics.correlation!=null).length;
  const advanced=`<div class="section-title"><div><h2>🔬 Estadísticas científicas</h2><p>Ritmos de cuidado, generaciones y señales obtenidas de tus propios registros</p></div></div>
  <div class="metric-grid v73-science-summary"><div class="card"><b class="big-number">${documented}</b><div class="sub">ciclos de cría medibles</div></div><div class="card"><b class="big-number">${correlations}</b><div class="sub">correlaciones calculables</div></div><div class="card"><b class="big-number">${alerts}</b><div class="sub">señales para revisar</div></div><div class="card"><b class="big-number">${journalItems().length}</b><div class="sub">registros analizados</div></div></div>
  <div class="v73-science-table"><div class="v73-science-row heading"><b>Colonia</b><span>Sin novedades</span><span>Alimentación</span><span>Mantenimiento</span><span>Cría → obrera</span><span>Temperatura/crecimiento</span><span>Señales</span></div>
  ${rows.map(({colony,metrics})=>`<article class="v73-science-row" data-colony="${esc(colony.id)}"><b><i style="background:${esc(colony.accentColor||speciesAccent(colony.species))}"></i>${esc(colony.name)}</b><span>${v73Metric(metrics.quiet)}</span><span>${metrics.feedingEvery==null?'—':`cada ${Math.round(metrics.feedingEvery)} d`}</span><span>${metrics.maintenanceEvery==null?'—':`cada ${Math.round(metrics.maintenanceEvery)} d`}</span><span>${v73Metric(metrics.generation)}</span><span>${metrics.correlation==null?`— <small>${metrics.correlationPoints}/3 tramos</small>`:`${metrics.correlation>0?'+':''}${metrics.correlation.toFixed(2)}`}</span><span class="${metrics.anomalies.length?'warning':'good'}">${metrics.anomalies.length?esc(metrics.anomalies.join(' · ')):'Sin señales'}</span></article>`).join('')}</div>
  <div class="card privacy-note"><b>Cómo se calcula</b><p>Los intervalos son medias de fechas registradas. “Cría → obrera” necesita un recuento con cría y otro posterior con más obreras. La correlación necesita al menos tres tramos con temperatura y crecimiento; no implica causalidad.</p></div>`;
  return v73BaseStats()+advanced;
};

function v73ComparisonMetrics(colony){
  const base=colonyComparisonMetrics(colony),science=v73ScientificMetrics(colony);
  return {...base,
    'Días sin novedades':science.quiet==null?'—':science.quiet,
    'Frecuencia de alimentación':science.feedingEvery==null?'—':`${Math.round(science.feedingEvery)} días`,
    'Frecuencia de mantenimiento':science.maintenanceEvery==null?'—':`${Math.round(science.maintenanceEvery)} días`,
    'Cría hasta nueva obrera':science.generation==null?'—':`${science.generation} días`,
    'Correlación temperatura/crecimiento':science.correlation==null?'—':science.correlation.toFixed(2),
    'Señales pendientes':science.anomalies.length
  };
}

compareView=function(){
  ensureLocalRoadmapData();
  const colonies=db.colonies.filter(colony=>colony.lifecycle!=='historical');
  let ids=db.appConfig.v73.compareIds.filter(id=>colonies.some(colony=>String(colony.id)===id));
  if(ids.length<2)ids=colonies.slice(0,Math.min(3,colonies.length)).map(colony=>String(colony.id));
  const selected=ids.map(id=>colonies.find(colony=>String(colony.id)===id)).filter(Boolean);
  const metrics=selected.map(v73ComparisonMetrics),keys=metrics[0]?Object.keys(metrics[0]):[];
  return `<div class="section-title"><div><h2>⚖️ Comparador múltiple</h2><p>Compara simultáneamente entre dos y seis colonias</p></div></div>
  <form id="v73CompareForm" class="card v73-compare-form"><div>${colonies.map(colony=>`<label class="${ids.includes(String(colony.id))?'selected':''}"><input type="checkbox" name="colony" value="${esc(colony.id)}" ${ids.includes(String(colony.id))?'checked':''}><span style="--colony-accent:${esc(colony.accentColor)}">${esc(colony.icon||'🐜')}</span><b>${esc(colony.name)}</b></label>`).join('')}</div><button class="button">Comparar selección</button></form>
  ${selected.length>=2?`<div class="v73-comparison-wrap"><div class="v73-comparison-grid" style="--compare-columns:${selected.length}">
    <div class="metric-label heading">Métrica</div>${selected.map(colony=>`<div class="colony-heading" style="--colony-accent:${esc(colony.accentColor)}"><span>${esc(colony.icon||'🐜')}</span><b>${esc(colony.name)}</b><small>${esc(colony.species||'')}</small></div>`).join('')}
    ${keys.map(key=>`<div class="metric-label">${esc(key)}</div>${metrics.map(metric=>`<div class="metric-value">${esc(metric[key])}</div>`).join('')}`).join('')}
  </div></div>`:'<div class="card empty">Necesitas al menos dos colonias activas para comparar.</div>'}`;
};

achievementDefinitions=function(){
  ensureLocalRoadmapData();
  const base=v73BaseAchievementDefinitions();
  const entries=journalItems(),search=entries.map(item=>`${item.kind} ${item.title} ${item.text}`).join(' ');
  const definitions=[
    ['first-worker','🌱','Primera obrera','Registra una colonia con al menos una obrera',db.colonies.some(colony=>+colony.workers>=1)],
    ['first-egg','🥚','Primera puesta','Registra huevos en un recuento',db.growthRecords.some(row=>+row.eggs>0)||db.colonies.some(colony=>+colony.brood?.eggs>0)],
    ['hundred-eggs','👑','Cien huevos','Registra una puesta de al menos 100 huevos',db.growthRecords.some(row=>+row.eggs>=100)],
    ['first-soldier','🛡️','Primera soldado','Documenta la primera soldado o major',/soldado|soldada|major/i.test(search)],
    ['first-milestone','❤️','Primer gran hito','Guarda una entrada marcada como Hito',entries.some(item=>item.kind==='Hito'||item.importance==='Hito')],
    ['first-incident','⚠️','Seguimiento responsable','Documenta una incidencia',entries.some(item=>item.kind==='Incidencia')],
    ['hundred-feed','🍯','Cien cuidados','Registra 100 alimentaciones',db.feedings.length>=100],
    ['one-year','📅','Un año de historia','Mantén al menos una colonia documentada durante un año',db.colonies.some(colony=>colony.founded&&daysSince(colony.founded)>=365)],
    ['hundred-journal','📖','Libro centenario','Alcanza 100 registros en el Diario',entries.length>=100],
    ['five-hundred-journal','📚','Archivo de vida','Alcanza 500 registros en el Diario',entries.length>=500],
    ['first-environment','🌡️','Clima documentado','Guarda una revisión ambiental',(db.environmentLogs||[]).length>=1],
    ['first-lineage','🌳','Nueva generación','Registra una relación genealógica',(db.genealogy||[]).length>=1]
  ];
  const seen=new Set(base.map(definition=>definition[0]));
  return base.concat(definitions.filter(definition=>!seen.has(definition[0])));
};

function v73SpeciesRows(){
  const map=new Map();
  db.colonies.filter(colony=>colony.species).forEach(colony=>{
    const key=speciesKey(colony.species),row=map.get(key)||{key,name:colony.species,colonies:[]};
    row.colonies.push(colony);map.set(key,row);
  });
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

encyclopediaView=function(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.encyclopedia,query=String(cfg.query||'').toLowerCase();
  const rows=v73SpeciesRows().filter(row=>{
    const profile=db.speciesProfiles[row.key]||{},complete=[profile.distribution,profile.size,profile.temperature,profile.humidity,profile.diet].filter(Boolean).length>=4;
    return (!query||`${row.name} ${profile.distribution||''} ${profile.diet||''} ${profile.curiosities||''}`.toLowerCase().includes(query))
      &&(cfg.status==='all'||(cfg.status==='complete'&&complete)||(cfg.status==='pending'&&!complete));
  });
  return `<div class="section-title"><div><h2>📚 AntDex local</h2><p>Enciclopedia construida con tus especies, fotografías y observaciones</p></div></div>
  <form id="v73EncyclopediaFilters" class="card v73-encyclopedia-filter"><input name="query" value="${esc(cfg.query||'')}" placeholder="Buscar especie o dato…"><select name="status"><option value="all" ${cfg.status==='all'?'selected':''}>Todas las fichas</option><option value="complete" ${cfg.status==='complete'?'selected':''}>Fichas completas</option><option value="pending" ${cfg.status==='pending'?'selected':''}>Pendientes de completar</option></select><button class="button">Buscar</button></form>
  <div class="v73-encyclopedia-grid">${rows.map(row=>{
    const profile=db.speciesProfiles[row.key]||{},colonies=row.colonies;
    const photos=(db.mediaIndex||[]).filter(media=>colonies.some(colony=>String(colony.id)===String(media.colonyId))&&String(media.type||'').startsWith('image/'));
    const fields=[profile.distribution,profile.size,profile.temperature,profile.humidity,profile.diet].filter(Boolean).length;
    const first=colonies[0],workers=colonies.reduce((sum,colony)=>sum+(+colony.workers||0),0);
    return `<article class="card v73-species-card"><div class="v73-species-cover" data-v73-species-cover="${esc(first.id)}"><span>🐜</span><small>${photos.length} fotos</small></div><div class="v73-species-copy"><span class="chip">${fields}/5 campos esenciales</span><h3><i>${esc(row.name)}</i></h3><p>${esc(profile.curiosities||'Añade distribución, cuidados y observaciones para completar esta ficha.')}</p><div class="v73-species-facts"><span><b>${colonies.length}</b> ${colonies.length===1?'colonia':'colonias'}</span><span><b>${workers}</b> obreras</span><span><b>${journalItems().filter(item=>colonies.some(colony=>String(colony.id)===String(item.colonyId))).length}</b> registros</span></div><dl><div><dt>Distribución</dt><dd>${esc(profile.distribution||'Pendiente')}</dd></div><div><dt>Cuidados</dt><dd>${esc([profile.temperature,profile.humidity].filter(Boolean).join(' · ')||'Pendiente')}</dd></div><div><dt>Alimentación</dt><dd>${esc(profile.diet||'Pendiente')}</dd></div></dl><div class="actions"><button class="button secondary" data-edit-species="${esc(first.id)}">Editar ficha</button><button class="link-btn" data-colony="${esc(first.id)}">Ver colonias →</button></div></div></article>`;
  }).join('')||'<div class="card empty">No hay especies que coincidan con la búsqueda.</div>'}</div>
  <div class="card privacy-note"><b>Enciclopedia personal verificable</b><p>ANTELMO no rellena datos biológicos por su cuenta: reúne lo que tú documentas y marca claramente lo que todavía está pendiente.</p></div>`;
};

async function v73HydrateSpeciesCovers(){
  for(const element of $$('[data-v73-species-cover]')){
    const colonyId=element.dataset.v73SpeciesCover;
    const meta=(db.mediaIndex||[]).find(item=>String(item.colonyId)===String(colonyId)&&String(item.type||'').startsWith('image/'));
    if(!meta)continue;
    const photo=await photoGet(meta.id);if(!photo?.blob)continue;
    const url=URL.createObjectURL(photo.blob);
    element.innerHTML=`<img src="${url}" alt="Fotografía de la especie"><small>${esc(colonyName(colonyId))}</small>`;
  }
}

function v73DocumentaryPeriodOptions(colonyId,current){
  const periods=[...new Set(journalItems(colonyId).map(item=>String(item.date||'').slice(0,7)).filter(value=>/^\d{4}-\d{2}$/.test(value)))].sort().reverse();
  const years=[...new Set(periods.map(period=>period.slice(0,4)))];
  return `<option value="all" ${current==='all'?'selected':''}>Historia completa</option>${years.map(year=>`<option value="${year}" ${current===year?'selected':''}>Año ${year}</option>`).join('')}${periods.map(period=>`<option value="${period}" ${current===period?'selected':''}>${period.slice(5,7)}/${period.slice(0,4)}</option>`).join('')}`;
}

function v73DocumentaryItems(colonyId,period){
  return journalItems(colonyId).filter(item=>period==='all'||String(item.date||'').startsWith(period));
}

function v73DocumentaryChart(colony,period){
  const rows=db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)&&row.workers!=null&&(period==='all'||String(row.date||'').startsWith(period))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(!rows.length)return '<div class="empty mini">Sin recuentos para este periodo</div>';
  const width=680,height=190,max=Math.max(...rows.map(row=>+row.workers||0),1),min=Math.min(...rows.map(row=>+row.workers||0),0);
  const point=(row,index)=>({x:30+(rows.length===1?width/2-30:index*(width-60)/(rows.length-1)),y:height-30-((+row.workers-min)/(max-min||1))*(height-60)});
  const points=rows.map(point);
  return `<svg class="v73-documentary-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución de obreras"><polyline points="${points.map(p=>`${p.x},${p.y}`).join(' ')}"></polyline>${points.map((p,index)=>`<circle cx="${p.x}" cy="${p.y}" r="5"></circle><text x="${p.x}" y="${p.y-12}">${esc(rows[index].workers)}</text><text class="date" x="${p.x}" y="${height-8}">${esc(toDisplayDate(rows[index].date))}</text>`).join('')}</svg>`;
}

documentaryHtml=function(colony){
  const count=journalItems(colony.id).length;
  return `<div class="documentary v73-documentary-teaser" style="--colony-accent:${esc(colony.accentColor||speciesAccent(colony.species))}"><div class="documentary-cover"><span>🎞️</span><div><small>MODO DOCUMENTAL</small><b>${esc(colony.name)}</b><p>${count} escenas, fotografías y datos de crecimiento</p></div></div><button class="button secondary" data-open-v73-documentary="${esc(colony.id)}">Abrir documental completo</button></div>`;
};

function v73DocumentaryView(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.documentary,colonies=db.colonies.filter(colony=>colony.lifecycle!=='historical'||journalItems(colony.id).length);
  const colony=colonies.find(item=>String(item.id)===String(cfg.colonyId))||colonies[0];
  if(!colony)return '<div class="card empty">Añade una colonia para comenzar su documental.</div>';
  cfg.colonyId=String(colony.id);
  const items=v73DocumentaryItems(colony.id,cfg.period),chronological=items.slice().reverse();
  const photos=items.filter(v73JournalHasMedia).length,milestones=items.filter(item=>item.kind==='Hito'||item.importance==='Hito').length;
  return `<div class="section-title"><div><h2>🎞️ Documental de la colonia</h2><p>Historia, imágenes y crecimiento navegables por meses y años</p></div></div>
  <form id="v73DocumentaryControls" class="card v73-documentary-controls"><label>Colonia<select name="colonyId">${colonies.map(item=>`<option value="${esc(item.id)}" ${String(item.id)===String(colony.id)?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><label>Periodo<select name="period">${v73DocumentaryPeriodOptions(colony.id,cfg.period)}</select></label><button class="button">Mostrar</button><button type="button" class="button secondary" data-export-documentary>Exportar historia</button></form>
  <section class="v73-documentary-hero" style="--colony-accent:${esc(colony.accentColor)}"><span>${esc(colony.icon||'🐜')}</span><div><small>LIBRO DE VIDA · ${esc(cfg.period==='all'?'HISTORIA COMPLETA':toDisplayDate(cfg.period))}</small><h2>${esc(colony.name)}</h2><i>${esc(colony.species||'Especie sin confirmar')}</i><p>${esc(storyForColony(colony))}</p></div></section>
  <div class="v73-documentary-metrics"><span><b>${items.length}</b> escenas</span><span><b>${photos}</b> visuales</span><span><b>${milestones}</b> hitos</span><span><b>${db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)).length}</b> recuentos</span></div>
  <section class="card"><div class="section-title compact"><div><h3>Evolución registrada</h3><p>Obreras a lo largo del periodo seleccionado</p></div></div>${v73DocumentaryChart(colony,cfg.period)}</section>
  <div class="v73-documentary-reel">${chronological.map((item,index)=>`<article><div class="v73-scene-number">${String(index+1).padStart(2,'0')}</div>${entryHtml(item,false)}</article>`).join('')||'<div class="card empty">Este periodo todavía no tiene escenas.</div>'}</div>`;
}

function v73ExportDocumentary(){
  const cfg=db.appConfig.v73.documentary,colony=db.colonies.find(item=>String(item.id)===String(cfg.colonyId));
  if(!colony)return;
  const items=v73DocumentaryItems(colony.id,cfg.period).slice().reverse();
  const content=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(colony.name)} — Libro de Vida</title><style>body{font:16px system-ui;max-width:820px;margin:40px auto;padding:0 24px;color:#183329}h1{font-size:42px;margin-bottom:0}i{color:#557066}.intro{padding:24px;background:#eef5ef;border-radius:18px;margin:28px 0}.entry{border-left:4px solid #3d765c;padding:4px 0 22px 20px;margin-left:10px}.entry time{color:#677b72;font-size:13px}.entry h2{margin:6px 0}.tag{display:inline-block;background:#e4eee6;border-radius:99px;padding:3px 9px;margin:3px;font-size:12px}@media print{body{margin:0}.entry{break-inside:avoid}}</style></head><body><small>ANTELMO · LIBRO DE VIDA · ${esc(cfg.period==='all'?'HISTORIA COMPLETA':toDisplayDate(cfg.period))}</small><h1>${esc(colony.name)}</h1><i>${esc(colony.species||'Especie sin confirmar')}</i><p class="intro">${esc(storyForColony(colony))}</p>${items.map(item=>`<section class="entry"><time>${esc(toDisplayDate(item.date||'Sin fecha'))} · ${esc(item.kind||'Registro')}</time><h2>${esc(item.title||'Registro')}</h2><p>${esc(item.text||'')}</p>${(item.tags||[]).map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</section>`).join('')}</body></html>`;
  const blob=new Blob([content],{type:'text/html;charset=utf-8'}),link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download=`ANTELMO-${String(colony.name).replace(/[^\p{L}\p{N}]+/gu,'-')}-${cfg.period}.html`;link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Documental exportado');
}

function v73LocalAnalysis(){
  const insights=[];
  db.colonies.filter(colony=>colony.lifecycle!=='historical').forEach(colony=>{
    const science=v73ScientificMetrics(colony),feedings=db.feedings.filter(row=>String(row.colonyId)===String(colony.id));
    const foodCounts={};feedings.forEach(row=>{const food=row.food||row.type||'Sin especificar';foodCounts[food]=(foodCounts[food]||0)+1});
    const favorite=Object.entries(foodCounts).sort((a,b)=>b[1]-a[1])[0];
    if(favorite&&favorite[1]>=2)insights.push(['🍯',colony.name,`${favorite[0]} es el alimento más registrado (${favorite[1]} veces).`,'alimentación']);
    else if(feedings.length)insights.push(['🍽️',colony.name,`Hay ${feedings.length} alimentación${feedings.length===1?'':'es'} y ${Object.keys(foodCounts).length} alimento${Object.keys(foodCounts).length===1?'':'s'} distinto${Object.keys(foodCounts).length===1?'':'s'} documentado${Object.keys(foodCounts).length===1?'':'s'}.`,'alimentación']);
    if(science.correlation!=null)insights.push(['🌡️',colony.name,`La correlación local entre temperatura y crecimiento es ${science.correlation>0?'+':''}${science.correlation.toFixed(2)} en ${science.correlationPoints} tramos.`,'ambiente']);
    science.anomalies.forEach(anomaly=>insights.push(['⚠️',colony.name,`Señal para revisar: ${anomaly}.`,'señal']));
    const events=journalItems(colony.id),months={};
    events.forEach(item=>{const month=String(item.date||'').slice(5,7);if(month)months[month]=(months[month]||0)+1});
    const active=Object.entries(months).sort((a,b)=>b[1]-a[1])[0];
    if(active&&events.length>=8)insights.push(['🗓️',colony.name,`El mes ${active[0]} concentra más actividad registrada (${active[1]} entradas).`,'actividad']);
  });
  return insights;
}

aiInsightsView=function(){
  const insights=v73LocalAnalysis();
  return `<div class="section-title"><div><h2>🧠 Análisis local ampliado</h2><p>Preferencias, ritmos, ambiente y señales sin enviar ningún dato</p></div></div>
  <div class="card privacy-note"><b>🔒 Funciona sin conexión</b><p>Estos resultados se calculan en el dispositivo a partir de tus registros. Son tendencias descriptivas, no diagnósticos biológicos.</p></div>
  <div class="insight-grid">${insights.map(([icon,title,text,kind])=>`<article class="card v7-insight"><span>${icon}</span><div><small>${esc(kind.toUpperCase())}</small><b>${esc(title)}</b><p>${esc(text)}</p></div></article>`).join('')||'<div class="card empty">Añade más alimentaciones, mediciones y recuentos para encontrar patrones.</div>'}</div>
  <div class="section-title"><div><h2>Historias actuales</h2><p>Relatos automáticos creados localmente</p></div></div>${db.colonies.filter(colony=>colony.lifecycle!=='historical').map(colony=>`<article class="card narrative"><b>${esc(colony.name)}</b><p>${esc(storyForColony(colony))}</p><button class="link-btn" data-open-v73-documentary="${esc(colony.id)}">Abrir documental →</button></article>`).join('')}`;
};

function v73Regression(colony){
  const rows=db.growthRecords.filter(row=>String(row.colonyId)===String(colony.id)&&row.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(rows.length<2)return null;
  const origin=v73Date(rows[0].date),points=rows.map(row=>({x:(v73Date(row.date)-origin)/86400000,y:+row.workers||0}));
  const meanX=v73Average(points.map(point=>point.x)),meanY=v73Average(points.map(point=>point.y));
  const denominator=points.reduce((sum,point)=>sum+(point.x-meanX)**2,0);
  if(!denominator)return null;
  const slope=points.reduce((sum,point)=>sum+(point.x-meanX)*(point.y-meanY),0)/denominator;
  const intercept=meanY-slope*meanX,predicted=points.map(point=>intercept+slope*point.x);
  const residuals=points.map((point,index)=>point.y-predicted[index]),residual=Math.sqrt(v73Average(residuals.map(value=>value**2))||0);
  const total=points.reduce((sum,point)=>sum+(point.y-meanY)**2,0),error=residuals.reduce((sum,value)=>sum+value**2,0);
  const r2=total?Math.max(0,1-error/total):0,lastX=points.at(-1).x;
  const forecast=days=>{
    const value=Math.max(0,intercept+slope*(lastX+days)),spread=Math.max(1,residual*(1+days/90));
    return {value:Math.round(value),low:Math.max(0,Math.round(value-spread)),high:Math.max(0,Math.round(value+spread))};
  };
  return {slope,r2,residual,month:forecast(30),quarter:forecast(90),points:rows.length,span:v73DaysBetween(rows[0].date,rows.at(-1).date)};
}

predictionView=function(){
  const colonies=db.colonies.filter(colony=>colony.lifecycle!=='historical');
  return `<div class="section-title"><div><h2>🔮 Predicción local mejorada</h2><p>Regresión con intervalo orientativo y calidad de los datos</p></div></div>
  <div class="card privacy-note"><b>ℹ️ Planificación, no diagnóstico</b><p>La proyección usa todos los recuentos disponibles, calcula su ajuste y muestra un margen. No presupone que el crecimiento biológico sea lineal.</p></div>
  <div class="prediction-grid v73-predictions">${colonies.map(colony=>{const prediction=v73Regression(colony);if(!prediction)return `<article class="card prediction-card"><div><b>${esc(colony.name)}</b><span>${esc(colony.species||'')}</span></div><p class="sub">Necesita al menos dos recuentos en fechas distintas.</p></article>`;
    const quality=prediction.points>=6&&prediction.r2>=.7?'Alta':prediction.points>=3&&prediction.r2>=.4?'Media':'Baja';
    return `<article class="card prediction-card"><div><b>${esc(colony.name)}</b><span>${esc(colony.species||'')}</span></div><div class="prediction-numbers"><span><b>~${prediction.month.value}</b>en 30 días<small>${prediction.month.low}–${prediction.month.high}</small></span><span><b>~${prediction.quarter.value}</b>en 90 días<small>${prediction.quarter.low}–${prediction.quarter.high}</small></span></div><div class="v73-confidence"><span>Confianza descriptiva: <b>${quality}</b></span><span>${prediction.points} recuentos · ${prediction.span} días · R² ${prediction.r2.toFixed(2)}</span></div><small>Tendencia: ${prediction.slope>=0?'+':''}${prediction.slope.toFixed(2)} obreras/día</small></article>`}).join('')}</div>`;
};

roadmapTabs=function(){
  const tab=db.appConfig.moreTab||'hub';
  const tabs=[['hub','Centro'],['global','Cronología'],['life','Vida'],['documentary','Documental'],['summaries','Resúmenes'],['compare','Comparar'],['legacy','Legado'],['library','Biblioteca'],['hall','Récords'],['feeding','Alimentación'],['smart','Cuidados'],['media','Fotos'],['timelapse','Timelapse'],['environment','Ambiente'],['ai','Análisis'],['achievements','Logros'],['encyclopedia','Enciclopedia'],['genealogy','Genealogía'],['presentation','Presentar'],['notifications','Avisos'],['sync','Copias'],['cloud','Nube'],['prediction','Predicción'],['fauna','Terrarios'],['scanner','AntScan'],['search','Buscar']];
  return `<div class="tabs pro-tabs v7-tabs">${tabs.map(([key,label])=>`<button class="${tab===key?'active':''}" data-more-tab="${key}">${label}</button>`).join('')}</div>`;
};

hubView=function(){
  return v73BaseHubView()+`<div class="section-title"><div><h2>Laboratorio local V7.3</h2><p>Herramientas avanzadas que no necesitan cuenta ni conexión</p></div></div><div class="module-grid roadmap-modules"><button data-module="documentary"><span>🎬</span><b>Documental completo</b><small>Meses, años y exportación</small></button><button data-module="stats"><span>🔬</span><b>Ciencia local</b><small>Ritmos y correlaciones</small></button><button data-module="compare"><span>⚖️</span><b>Comparación múltiple</b><small>Hasta seis colonias</small></button><button data-module="encyclopedia"><span>📚</span><b>AntDex local</b><small>Especies y fotografías</small></button></div>`;
};

more=function(){
  ensureLocalRoadmapData();
  if(db.appConfig.moreTab==='documentary')return roadmapTabs()+v73DocumentaryView();
  return v73BaseMore();
};

bind=function(){
  v73BaseBind();ensureLocalRoadmapData();
  $('#v73JournalFilters')&&($('#v73JournalFilters').onsubmit=event=>{
    event.preventDefault();const data=Object.fromEntries(new FormData(event.target));
    db.appConfig.v73.journal={query:data.query||'',colony:data.colony||'all',type:data.type||'all',importance:data.importance||'all',from:toIsoDate(data.from||''),to:toIsoDate(data.to||''),media:data.media||'all',tags:data.tags||''};
    save();render();
  });
  $('[data-clear-journal-filters]')&&($('[data-clear-journal-filters]').onclick=()=>{db.appConfig.v73.journal={query:'',colony:'all',type:'all',importance:'all',from:'',to:'',media:'all',tags:''};save();render()});
  $('#v73CompareForm')&&($('#v73CompareForm').onsubmit=event=>{
    event.preventDefault();const ids=new FormData(event.target).getAll('colony').map(String);
    if(ids.length<2)return toast('Selecciona al menos dos colonias');
    if(ids.length>6)return toast('Selecciona un máximo de seis colonias');
    db.appConfig.v73.compareIds=ids;save();render();
  });
  $('#v73EncyclopediaFilters')&&($('#v73EncyclopediaFilters').onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.target));db.appConfig.v73.encyclopedia={query:data.query||'',status:data.status||'all'};save();render()});
  $('#v73DocumentaryControls')&&($('#v73DocumentaryControls').onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.target));db.appConfig.v73.documentary={colonyId:String(data.colonyId),period:data.period||'all'};save();render()});
  $('[data-export-documentary]')&&($('[data-export-documentary]').onclick=v73ExportDocumentary);
  $$('[data-open-v73-documentary]').forEach(button=>button.onclick=event=>{event.stopPropagation();db.appConfig.v73.documentary.colonyId=String(button.dataset.openV73Documentary);db.appConfig.v73.documentary.period='all';db.appConfig.moreTab='documentary';route='more';selected=null;save();render()});
};

save=function(){
  ensureLocalRoadmapData();v73BaseSave();
  db.metadata.schemaVersion='7.3.2';db.metadata.updatedAt=new Date().toISOString();
  localStorage.setItem('antelmo.v4',JSON.stringify(db));
};

render=function(){
  ensureLocalRoadmapData();v73BaseRender();
  formatVisibleDates(document);
  setTimeout(v73HydrateSpeciesCovers,0);
};
