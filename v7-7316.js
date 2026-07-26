/* ANTELMO V7.3.16 — persistencia de fecha de llegada en habitantes nuevos. */
const antelmoV7316FaunaForm=faunaForm;
faunaForm=function(id){
  antelmoV7316FaunaForm(id);
  const form=$('#faunaForm');if(!form||id)return;
  const original=form.onsubmit;
  form.onsubmit=e=>{
    const arrived=toIsoDate(new FormData(form).get('arrivedAt'))||today();
    const before=db.fauna.length;
    const result=original?.call(form,e);
    if(db.fauna.length>before){db.fauna.at(-1).arrivedAt=arrived;save();}
    return result;
  };
};