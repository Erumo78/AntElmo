/* Utilidades de fecha de ANTELMO V7.
   La interfaz usa DD/MM/AAAA y los datos se conservan como AAAA-MM-DD. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AntelmoDate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function pad(value){return String(value).padStart(2,'0')}
  function parseDisplay(value){
    const match=String(value||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(!match)return null;
    const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
    const date=new Date(Date.UTC(year,month-1,day));
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return {day,month,year};
  }
  function toIso(value){
    const parsed=parseDisplay(value);
    return parsed?`${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`:'';
  }
  function toDisplay(value){
    if(!value)return '';
    const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match?`${match[3]}/${match[2]}/${match[1]}`:String(value);
  }
  function autoFormat(value){
    const digits=String(value||'').replace(/\D/g,'').slice(0,8);
    return [digits.slice(0,2),digits.slice(2,4),digits.slice(4,8)].filter(Boolean).join('/');
  }
  return {parseDisplay,toIso,toDisplay,autoFormat};
});
