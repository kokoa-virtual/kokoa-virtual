window.CNT=(()=>{
const KM="kokoa-modo",DB={A:1,G:1,C:1},
 TD={ingreso:"Comprobante de ingreso",egreso:"Comprobante de egreso",ajuste:"Ajuste",apertura:"Apertura"},
 SO={doc_soporte:"Documento soporte",factura:"Factura electrónica",pos:"Tiquete POS",nomina:"Nómina electrónica",otro:"Otro soporte"},
 TABS=[["reg","Caja","Caja"],["dia","Movimientos","Movim."],["pro","Productos","Product."],["inf","Informes","Informes"],["cie","Cierre","Cierre"]],
 PL={don:["Donación en dinero",v=>[["1110",v,0],["4105",0,v]],{don:1},"ingreso"],
  dcn:["Donación condicionada (fondo con destinación)",v=>[["1110",v,0],["3310",0,v]],{don:1,cd:1},"ingreso"],
  esp:["Donación en especie (alimentos)",v=>[["1435",v,0],["4106",0,v]],{don:1,es:1},"ingreso"],
  cuo:["Cuota de recuperación",v=>[["1105",v,0],["4210",0,v]],{},"ingreso"],
  inc:["Venta con impuesto al consumo 8%",v=>{const b=Math.round(v/1.08);return[["1105",v,0],["4215",0,b],["2408",0,v-b]]},{},"ingreso"],
  com:["Compra de alimentos en efectivo",v=>[["1435",v,0],["1105",0,v]],{},"egreso"],
  con:["Alimentos usados en raciones",v=>[["6105",v,0],["1435",0,v]],{},"ajuste"],
  gas:["Gasto pagado en efectivo",v=>[["5195",v,0],["1105",0,v]],{},"egreso"],
  nom:["Pago de nómina",v=>[["5110",v,0],["1110",0,v]],{},"egreso"]};
let on=false,tab="reg",cu=[],te=[],as=[],li=[],ci=new Set(),ok=true,loaded=false,built=false,q="",per="",d1="",d2="",rows=[{c:"",d:"",h:""},{c:"",d:"",h:""}];
try{on=localStorage.getItem(KM)==="2"}catch(_){}
const m=v=>(v<0?"−":"")+"$"+Math.round(Math.abs(v||0)).toLocaleString("es-CO"),n=v=>+v||0,hoy=()=>new Date().toLocaleDateString("sv-SE"),
 nq=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),
 cta=c=>cu.find(x=>x.codigo===c)||{codigo:c,nombre:"",tipo:"A"},ter=i=>te.find(x=>x.id===i)||{},act=()=>as.filter(a=>a.estado!=="anulado"),
 err=x=>aviso(x.message||String(x),"err"),
 opt=(L,v)=>L.map(([k,l])=>`<option value="${esc(k)}"${k===v?" selected":""}>${esc(l)}</option>`).join(""),
 sop=a=>a.soporte_tipo?SO[a.soporte_tipo]+(a.soporte_num?" "+a.soporte_num:""):"";

let inv=null,le="",pr=[],ex=[],cc=[],okN=true,pm=hoy().slice(0,7),bd={},bt="",cor=hoy(),bs=null;
const BK="1110",dd=(a,b)=>Math.abs(Date.parse(a)-Date.parse(b))/864e5,
 ym=p=>{const[y,k]=p.split("-");return[p+"-01",p+"-"+String(new Date(+y,+k,0).getDate()).padStart(2,"0")]},
 ejec=(a,z)=>{const o={};saldos(a,z).forEach(x=>o[x.codigo]=x.s);return o},
 pAv=(p,c)=>{const r=pr.find(x=>x.periodo===p&&x.cuenta===c);return r?n(r.monto):0},
 nota=()=>okN?"":'<p class="sub cn-bad">Falta ejecutar supabase/contabilidad-presupuesto-bancos.sql en Supabase.</p>',
 pf=s=>{const a=String(s||"").trim();let r=/^(\d{4})-(\d\d)-(\d\d)/.exec(a),y,mo,d;if(r){y=r[1];mo=r[2];d=r[3]}else if((r=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(a))){d=r[1];mo=r[2];y=r[3]}else return"";const t=new Date(+y,+mo-1,+d);return t.getMonth()===+mo-1&&t.getDate()===+d?y+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0"):""},
 num=s=>{s=String(s||"").replace(/[$\s]/g,"");if(!s)return 0;const neg=/^\(.*\)$/.test(s)||s[0]==="-"||s.endsWith("-");s=s.replace(/[()\-]/g,"");const lc=s.lastIndexOf(","),ld=s.lastIndexOf(".");let k=-1;if(lc>=0&&ld>=0)k=Math.max(lc,ld);else if(lc>=0&&/,\d{1,2}$/.test(s))k=lc;else if(ld>=0&&/\.\d{1,2}$/.test(s))k=ld;const v=parseFloat((k>=0?s.slice(0,k):s).replace(/[.,]/g,"")+(k>=0?"."+s.slice(k+1):""));return isFinite(v)?(neg?-v:v):NaN};
async function loadN(){try{const r=await Promise.all([SB.from("cnt_presupuesto").select("*"),traerTodo("cnt_extractos","id"),SB.from("cnt_conciliaciones").select("*")]);okN=!r[0].error&&!r[2].error;if(okN){pr=r[0].data;ex=r[1];cc=r[2].data}}catch(_){okN=false}}
function vPre(){const y=pm.slice(0,4),[a,z]=ym(pm),em=ejec(a,z),ea=ejec(y+"-01-01",y+"-12-31"),T={},
 pa=c=>pr.filter(x=>x.cuenta===c&&x.periodo.startsWith(y)).reduce((s,x)=>s+n(x.monto),0),
 fila=c=>{const p=bd[c.codigo]!==undefined?n(bd[c.codigo]):pAv(pm,c.codigo),e=em[c.codigo]||0,g=c.tipo==="I",df=g?e-p:p-e,t=T[c.tipo]||(T[c.tipo]=[0,0,0,0]);
  t[0]+=p;t[1]+=e;t[2]+=pa(c.codigo);t[3]+=ea[c.codigo]||0;
  return`<tr><td>${esc(c.codigo)} ${esc(c.nombre)}</td><td><input type="number" min="0" step="any" inputmode="decimal" data-bd="${c.codigo}" value="${bd[c.codigo]!==undefined?esc(bd[c.codigo]):p||""}" aria-label="Presupuesto de ${esc(c.nombre)}"></td><td class="r">${m(e)}</td><td class="r ${p&&df<0?"cn-bad":""}">${m(df)}</td><td class="r ${!g&&p&&e>p?"cn-bad":""}">${p?Math.round(e/p*100)+"%":"—"}</td><td class="r">${m(pa(c.codigo))}</td><td class="r">${m(ea[c.codigo]||0)}</td></tr>`},
 body=[["I","Ingresos"],["C","Costos"],["G","Gastos"]].map(([k,l])=>`<tr><th colspan="7">${l}</th></tr>`+cu.filter(c=>c.tipo===k).map(fila).join("")).join(""),
 ti=T.I||[0,0,0,0],tc=T.C||[0,0,0,0],tg=T.G||[0,0,0,0],P=i=>tc[i]+tg[i];
 return`<h2>Presupuesto</h2>${nota()}<div class="cn-f"><label>Mes<input id="pMes" type="month" data-req value="${pm}"></label><label>&nbsp;<button type="button" class="ghost" data-c="pcopia">Copiar el mes anterior</button></label><label>&nbsp;<button type="button" class="ghost" data-c="panio">Repetir en el resto del año</button></label></div>
<p class="sub">Escribe lo que esperas recibir o gastar en el mes. El ejecutado sale de los asientos. En ingresos, la diferencia es lo recaudado menos lo presupuestado. En costos y gastos es lo presupuestado menos lo gastado, y sale en rojo si te pasaste.</p>
<div class="tbl"><table style="min-width:760px"><thead><tr><th>Cuenta</th><th>Presupuesto del mes</th><th class="r">Ejecutado</th><th class="r">Diferencia</th><th class="r">Avance</th><th class="r">Presupuesto del año</th><th class="r">Ejecutado del año</th></tr></thead><tbody>${body}</tbody></table></div>
<div class="gsum"><span class="chip">Ingresos: ${m(ti[1])} de ${m(ti[0])}</span><span class="chip ${P(0)&&P(1)>P(0)?"bad":""}">Costos y gastos: ${m(P(1))} de ${m(P(0))}</span><span class="chip">Excedente presupuestado: ${m(ti[0]-P(0))}</span><span class="chip">Excedente real: ${m(ti[1]-P(1))}</span></div>
<button type="button" data-c="ppg">Guardar presupuesto de ${pm}</button>`}
async function pGuardar(meses){
 const F=cu.filter(c=>"IGC".includes(c.tipo)).map(c=>[c.codigo,bd[c.codigo]!==undefined?n(bd[c.codigo]):pAv(pm,c.codigo)]);
 for(const p of meses){const ins=F.filter(f=>f[1]>0).map(f=>({periodo:p,cuenta:f[0],monto:f[1]})),z=F.filter(f=>!(f[1]>0)).map(f=>f[0]);
  if(ins.length)ck(await SB.from("cnt_presupuesto").upsert(ins));
  if(z.length)ck(await SB.from("cnt_presupuesto").delete().eq("periodo",p).in("cuenta",z))}
 bd={};await loadN()}
function bnd(){const A=new Map(as.map(a=>[a.id,a])),us=new Set(ex.map(x=>x.linea_id).filter(Boolean)),
 C=li.filter(l=>l.cuenta===BK&&A.has(l.asiento_id)).map(l=>({l,a:A.get(l.asiento_id),v:n(l.debito)-n(l.credito),u:us.has(l.id)})),M=new Map(C.map(x=>[x.l.id,x])),
 vin=e=>{const x=e.linea_id&&M.get(e.linea_id);return!!x&&x.a.estado==="activo"},AC=C.filter(x=>x.a.estado==="activo");
 return{AC,vin,libres:AC.filter(x=>!x.u&&x.a.tipo!=="apertura"),pend:ex.filter(e=>!vin(e)),done:ex.filter(vin)}}
const cand=(L,e)=>L.filter(x=>Math.round(x.v*100)===Math.round(n(e.valor)*100)).sort((p,q)=>dd(p.a.fecha,e.fecha)-dd(q.a.fecha,e.fecha));
function vBan(){const B=bnd(),{AC,libres,pend,done}=B,sm=(L,f)=>L.filter(f).reduce((s,x)=>s+x.v,0),
 L=sm(AC,x=>x.a.fecha<=cor),UL=sm(libres,x=>x.a.fecha<=cor),UE=pend.filter(e=>e.fecha<=cor).reduce((s,e)=>s+n(e.valor),0),
 reg=cc.find(x=>x.corte===cor),E=bs!==null&&bs!==""?n(bs):reg?n(reg.saldo_extracto):null,esp=E===null?null:E+UL-UE,d=esp===null?null:Math.round((L-esp)*100)/100,
 co=cu.filter(c=>c.codigo!==BK).map(c=>[c.codigo,c.codigo+" · "+c.nombre]),r=(a,b,t)=>`<tr><td>${t?"<b>"+a+"</b>":a}</td><td class="r">${t?"<b>"+b+"</b>":b}</td></tr>`;
 return`<h2>Conciliación bancaria</h2>${nota()}
<div class="cn-card"><h3>Resumen al corte</h3><div class="cn-f"><label>Corte<input id="bCor" type="date" value="${cor}"></label><label>Saldo final del extracto<input id="bSl" type="number" step="any" inputmode="decimal" value="${E===null?"":E}"></label><label>&nbsp;<button type="button" class="ghost" data-c="bsal">Guardar saldo</button></label></div>
<div class="tbl"><table><tbody>${r("Saldo según extracto",E===null?"—":m(E))}${r("+ En libros y no en el extracto (neto)",m(UL))}${r("− En el extracto y no en libros (neto)",m(UE))}${r("Saldo esperado en libros",esp===null?"—":m(esp),1)}${r("Saldo en libros (cuenta 1110)",m(L),1)}</tbody></table></div>
${d===null?'<p class="sub">Escribe el saldo final del extracto para comprobar.</p>':d===0?"<p><b>Conciliado.</b> Libros y extracto coinciden.</p>":`<p class="cn-bad">Diferencia de ${m(d)}. Revisa las partidas sin conciliar y que el asiento de apertura coincida con el extracto.</p>`}</div>
<div class="cn-card"><h3>Importar extracto</h3><p class="sub">Una línea por movimiento: fecha, descripción y valor, con entradas positivas y salidas negativas. También sirve fecha, descripción, salidas y entradas. Fechas como 2026-10-04 o 04/10/2026. Los movimientos repetidos no se duplican.</p><div class="cn-f"><label>Archivo CSV<input id="bFl" type="file" accept=".csv,.txt,text/csv,text/plain"></label></div><textarea id="bTx" rows="5" style="width:100%" aria-label="Movimientos del extracto">${esc(bt)}</textarea><div class="cn-f"><button type="button" data-c="bimp">Importar</button><button type="button" class="ghost" data-c="bauto">Conciliar automáticamente</button></div></div>
<div class="cn-card"><h3>Extracto sin conciliar (${pend.length})</h3>${pend.length?`<div class="tbl"><table style="min-width:720px"><thead><tr><th>Fecha</th><th>Descripción</th><th class="r">Valor</th><th>Conciliar con un asiento</th><th>O registrar en libros</th></tr></thead><tbody>${pend.slice().sort((p,q)=>p.fecha.localeCompare(q.fecha)).map(e=>{const k=cand(libres,e);return`<tr><td>${esc(e.fecha)}</td><td>${esc(e.descripcion)}${e.linea_id?'<div class="cn-bad">Su asiento fue anulado</div>':""}</td><td class="r">${m(n(e.valor))}</td><td>${k.length?`<select id="bm${e.id}">${k.map(x=>`<option value="${x.l.id}">${esc(x.a.numero)} · ${esc(x.a.fecha)} · ${esc(String(x.a.concepto).slice(0,40))}</option>`).join("")}</select> <button type="button" class="ghost" data-c="bmatch" data-i="${e.id}">Conciliar</button>`:'<span class="sub">Sin asiento del mismo valor</span>'}</td><td><select id="bc${e.id}">${opt(co,n(e.valor)<0?"5140":"4250")}</select> <button type="button" class="ghost" data-c="bnew" data-i="${e.id}">Registrar</button></td></tr>`}).join("")}</tbody></table></div>`:'<p class="sub">Nada pendiente.</p>'}</div>
<div class="cn-card"><h3>En libros sin conciliar (${libres.length})</h3>${libres.length?`<div class="tbl"><table style="min-width:520px"><tbody>${libres.map(x=>`<tr><td>${esc(x.a.fecha)}</td><td>${esc(x.a.numero)}</td><td>${esc(x.a.concepto)}</td><td class="r">${m(x.v)}</td></tr>`).join("")}</tbody></table></div>`:'<p class="sub">Nada pendiente.</p>'}</div>
<div class="cn-card"><h3>Conciliadas (las últimas 30)</h3>${done.slice(0,30).map(e=>`<div class="cn-l" style="grid-template-columns:1fr auto auto"><span>${esc(e.fecha)} · ${esc(e.descripcion)}</span><b>${m(n(e.valor))}</b><button type="button" class="ghost" data-c="bundo" data-i="${e.id}">Deshacer</button></div>`).join("")||'<p class="sub">Aún no hay.</p>'}</div>`}
async function bImportar(){
 const R=[];let mal=0;
 bt.split(/\r?\n/).forEach(l=>{if(!l.trim())return;const c=l.split(l.includes("\t")?"\t":l.includes(";")?";":",").map(x=>x.trim().replace(/^"|"$/g,"")),f=pf(c[0]);
  if(!f||c.length<3){mal++;return}const v=c.length>=4?num(c[3])-num(c[2]):num(c[2]);if(!isFinite(v)||!v){mal++;return}R.push({fecha:f,descripcion:c[1].slice(0,160),valor:v})});
 const kk=x=>x.fecha+"|"+x.descripcion+"|"+Math.round(n(x.valor)*100),have={};ex.forEach(e=>{const k=kk(e);have[k]=(have[k]||0)+1});
 const ins=R.filter(x=>{const k=kk(x);if(have[k]>0){have[k]--;return false}return true});
 if(ins.length)ck(await SB.from("cnt_extractos").insert(ins));
 if(ins.length||!mal)bt="";await loadN();
 aviso(ins.length+" movimientos importados"+(R.length-ins.length?", "+(R.length-ins.length)+" repetidos omitidos":"")+(mal?", "+mal+" líneas no se pudieron leer (el encabezado cuenta como una)":"")+".",mal&&!ins.length?"err":undefined)}
async function bAuto(){
 const B=bnd(),usd=new Set();let k=0;
 try{for(const e of B.pend.slice().sort((p,q)=>p.fecha.localeCompare(q.fecha))){
  const c=cand(B.libres,e).filter(x=>!usd.has(x.l.id)&&dd(x.a.fecha,e.fecha)<=5)[0];if(!c)continue;
  ck(await SB.rpc("cnt_conciliar",{p_extracto:e.id,p_linea:c.l.id}));usd.add(c.l.id);k++}}
 finally{await loadN()}
 aviso(k?k+" movimientos conciliados.":"No encontré coincidencias de igual valor y fecha cercana (hasta 5 días).")}
function ctlN(){const p=hoy().slice(0,7),[a,z]=ym(p),e=ejec(a,z),B=bnd(),P=cu.filter(c=>"GC".includes(c.tipo)&&pAv(p,c.codigo)>0&&(e[c.codigo]||0)>pAv(p,c.codigo));
 return[[P.length?2:4,`<div class="cn-card"><h3>Presupuesto del mes</h3>${P.length?P.map(c=>`<div class="cn-bad">${esc(c.nombre)}: gastado ${m(e[c.codigo])} de ${m(pAv(p,c.codigo))}</div>`).join(""):'<p class="sub">Ninguna cuenta superó su presupuesto.</p>'}</div>`],[B.pend.length||B.libres.length?2:4,`<div class="cn-card"><h3>Bancos</h3><p class="${B.pend.length||B.libres.length?"cn-bad":"sub"}">${B.pend.length} movimientos del extracto y ${B.libres.length} del libro sin conciliar.</p></div>`],[inv&&Math.abs(inv.diferencia)>1?2:4,inv?`<div class="cn-card"><h3>Inventario vs. libros</h3><p class="sub">Libros (1435): ${m(inv.libros)} · Stock valorado al último precio: ${m(inv.stock)}</p><p class="${Math.abs(inv.diferencia)>1?"cn-bad":"sub"}">Diferencia: ${m(inv.diferencia)}</p></div>`:""]]}
async function load(){
 if(!esAdmin())return;
 const r=await Promise.all([SB.from("cnt_cuentas").select("*").order("codigo"),traerTodo("cnt_terceros","id"),traerTodo("cnt_asientos","id"),traerTodo("cnt_lineas","id"),SB.from("cnt_cierres").select("periodo")]).catch(x=>{le=x.message||String(x);return null});
 ok=!!r&&!r[0].error&&!r[4].error;if(r&&!ok)le=(r[0].error||r[4].error).message;if(ok){cu=r[0].data;te=r[1];as=r[2];li=r[3];ci=new Set(r[4].data.map(x=>x.periodo))}await loadN();await loadP();await loadI();loaded=true}
function saldos(a1,a2){const A=new Map(as.map(a=>[a.id,a])),S={};
 li.forEach(l=>{const a=A.get(l.asiento_id);if(!a||a.estado==="anulado"||(a1&&a.fecha<a1)||(a2&&a.fecha>a2))return;const s=S[l.cuenta]||(S[l.cuenta]={d:0,c:0});s.d+=n(l.debito);s.c+=n(l.credito)});
 return cu.filter(c=>S[c.codigo]).map(c=>{const s=S[c.codigo];return{...c,d:s.d,c:s.c,s:DB[c.tipo]?s.d-s.c:s.c-s.d}})}
function lin(){const co=cu.map(c=>[c.codigo,c.codigo+" · "+c.nombre]);
 return rows.map((r,i)=>`<div class="cn-l"><select data-r="${i}" data-k="c" aria-label="Cuenta"><option value="">Cuenta…</option>${opt(co,r.c)}</select><input data-r="${i}" data-k="d" type="number" min="0" step="any" inputmode="decimal" placeholder="Débito" aria-label="Débito" value="${esc(r.d)}"><input data-r="${i}" data-k="h" type="number" min="0" step="any" inputmode="decimal" placeholder="Crédito" aria-label="Crédito" value="${esc(r.h)}"><button type="button" class="ghost" data-c="quitar" data-i="${i}" aria-label="Quitar línea">✕</button></div>`).join("")}
function tot(){const e=$("cTot");if(!e)return;const d=rows.reduce((s,r)=>s+n(r.d),0),c=rows.reduce((s,r)=>s+n(r.h),0),x=Math.round(d-c);
 e.innerHTML=`<span>Débitos ${m(d)}</span><span>Créditos ${m(c)}</span><span class="${x?"cn-bad":""}">${x?"Diferencia "+m(d-c):"Cuadrado"}</span>`}
let sb={dia:"t",inf:"i",cie:"b"},cj={t:"i",k:"don",f:1,b:null,o:0},kv={},kp=[],avz=false,pp=[],okP=true;
const UM=10,KS={i:["don"],e:["com","gas"]},KL={don:"Donación en dinero",com:"Compra de alimentos",gas:"Gasto"},
 itm=()=>typeof items!=="undefined"&&Array.isArray(items)?items:[],f2=v=>(Math.round(v*100)/100).toLocaleString("es-CO"),
 sem=f=>{const d=new Date(f+"T12:00:00");d.setDate(d.getDate()-(d.getDay()+6)%7);return d.toLocaleDateString("sv-SE")},
 lim=w=>{const d=new Date(w+"T12:00:00");d.setDate(d.getDate()+4);return d.toLocaleDateString("sv-SE")},
 ch=(k,L)=>`<div class="tabs">${L.map(([v,l])=>`<button type="button" class="tab" data-c="sub" data-k="${k}" data-i="${v}" aria-pressed="${sb[k]===v}">${l}</button>`).join("")}</div>`,
 bt2=(c,i,l,on)=>`<button type="button" class="tab" data-c="${c}" data-i="${i}" aria-pressed="${on}">${l}</button>`;
async function loadI(){try{const r=await SB.rpc("cnt_inventario_control");inv=r.error?null:r.data}catch(_){inv=null}}
async function loadP(){try{pp=await traerTodo("cnt_precios","id");okP=true}catch(_){pp=[];okP=false}}
function vista(){const s=sb[tab];
 if(tab==="reg")return vCaja();
 if(tab==="pro")return vPro();
 if(tab==="dia")return`<div class="cn-mvs"><div>${vDia()}</div><div>${vDon()}</div></div>`;
 if(tab==="inf")return ch("inf",[["i","Informes"],["p","Presupuesto"]])+(s==="p"?vPre():vInf());
 return ch("cie",[["b","Bancos"],["c","Control"],["t","Terceros"]])+({b:vBan,c:vCtl,t:vTer})[s]()}
function vCaja(){
 if(avz)return`<div class="cn-f"><button type="button" class="ghost" data-c="avz">← Volver a Caja</button></div>`+vAvz();
 const k=cj.k,p=PL[k],ing=cj.t==="i",comp=k==="com",dona=!!p[2].don,L1=p[1](1),MD=L1.some(x=>x[0]==="1105"||x[0]==="1110"),b=cj.b||(L1.some(x=>x[0]==="1105")?"e":"b");
 if(comp&&!kp.length)kp.push({n:"",q:"",v:"",u:"",s:""});
 const na=[...new Set(itm().map(i=>i.n))].sort((a,c)=>a.localeCompare(c,"es")),
 tn=[...new Set(te.map(t=>t.nombre))].sort((a,c)=>String(a).localeCompare(c,"es")),tsel=kv.t==="__nuevo"||tn.includes(kv.t)?kv.t:"",
 sopt=(L,v,ph)=>`<option value="">${ph}</option><option value="__nuevo" data-fijo${v==="__nuevo"?" selected":""}>＋ Nuevo…</option>`+L.map(x=>`<option value="${esc(x)}"${x===v?" selected":""}>${esc(x)}</option>`).join(""),
 pSel=(x,i)=>{const ps=x.nuevo||(x.n&&!na.some(a=>nq(a)===nq(x.n)))?"__nuevo":(na.find(a=>nq(a)===nq(x.n))||"");
  return`<div style="grid-column:span 2;display:grid;gap:6px;min-width:0"><select data-p="${i}" data-f="n" aria-label="Producto">${sopt(na,ps,"Producto…")}</select>${ps==="__nuevo"?`<input data-p="${i}" data-f="n" maxlength="80" value="${esc(x.n)}" placeholder="Nombre del producto nuevo" aria-label="Producto nuevo">`:""}</div>`},
 hint=dona?"No se factura. El certificado sale en Movimientos › Donaciones.":comp&&!cj.f?"Sin factura: genera el documento soporte esta semana. Queda en Cierre › Control.":"";
 return`<h2>Caja</h2><div class="cn-caja"><form id="cK" autocomplete="off" class="cn-card"><div class="cn-cab"><div class="tabs">${KS[cj.t].length>1?KS[cj.t].map(x=>bt2("kk",x,KL[x],k===x)).join(""):`<b>${KL[k]}</b>`}</div><div class="cn-ie">${[["i","Ingreso"],["e","Egreso"]].map(([v,l])=>`<button type="button" class="kbig${cj.t===v?"":" ghost"}" data-c="kt" data-i="${v}">${l}</button>`).join("")}</div></div>
<div class="cn-f"><label>Valor<input id="kV" data-kv="v" type="number" min="0" step="any" inputmode="decimal" value="${esc(kv.v||"")}"></label>${`<label>${dona?"Donante":comp?"Proveedor":ing?"Quién paga":"A quién se paga"}<select id="kT" data-kv="t">${sopt(tn,tsel,"Elegir…")}</select></label>${kv.t==="__nuevo"?`<label>Nombre nuevo<input id="kTn" data-kv="tn" maxlength="80" value="${esc(kv.tn||"")}"></label>`:""}`}${comp&&cj.f?`<label>N.º de factura<input data-kv="n" maxlength="40" value="${esc(kv.n||"")}"></label>`:""}</div>
${comp?`<div class="tabs">${bt2("kf",1,"Sí factura",cj.f)}${bt2("kf",0,"No factura",!cj.f)}</div>`:""}
${MD?`<div class="tabs">${bt2("kb","e","Efectivo",b==="e")}${bt2("kb","b","Banco",b==="b")}</div>`:""}
${comp?`<div><b>Productos</b> <span class="sub">(opcional: sirve para seguir precios; también puedes escribir uno nuevo)</span>${kp.map((x,i)=>`<div class="kg">${pSel(x,i)}<input type="number" min="0" step="any" inputmode="decimal" data-p="${i}" data-f="q" value="${esc(x.q)}" placeholder="Cantidad"><input data-p="${i}" data-f="u" maxlength="12" value="${esc(x.u)}" placeholder="Unidad"><input type="number" min="0" step="any" inputmode="decimal" data-p="${i}" data-f="v" value="${esc(x.v)}" placeholder="Valor total"><button type="button" class="ghost" data-c="pq" data-i="${i}" aria-label="Quitar">✕</button></div>`).join("")}<button type="button" class="ghost" data-c="pa">＋ Producto</button></div>`:""}
<div class="cn-f"><label>Fecha<input type="date" data-kv="f" value="${esc(kv.f||hoy())}"></label><label>Nota<input data-kv="c" maxlength="120" value="${esc(kv.c||"")}"></label></div>
${hint?`<p class="sub">${hint}</p>`:""}${nota2()}<div class="cn-f"><button type="submit" class="kbig">Guardar</button><button type="button" class="ghost" data-c="avz">Asiento avanzado</button></div>
</form>${vHoy()}</div>`}
function vHoy(){const h=hoy(),L=act().filter(a=>a.fecha===h&&(a.tipo==="ingreso"||a.tipo==="egreso")).sort((x,y)=>y.id-x.id),T=t=>L.filter(a=>a.tipo===t).reduce((s,a)=>s+n(a.valor),0);
 return`<aside class="cn-card" aria-label="Movimientos de hoy"><h3>Hoy</h3><div class="cn-hs"><span>Ingresos ${m(T("ingreso"))}</span><span>Egresos ${m(T("egreso"))}</span></div>${L.length?`<div class="cn-sc" data-top="10">`:""}${L.length?L.map(a=>`<div class="cn-mv"><div><b>${m(a.valor)}</b> · ${a.tipo==="ingreso"?"Ingreso":"Egreso"}<div>${esc(a.concepto)}</div><div class="sub">${[a.numero,ter(a.tercero_id).nombre].filter(Boolean).map(esc).join(" · ")}</div></div><button type="button" class="cn-lk" data-c="anular" data-i="${a.id}">Anular</button></div>`).join("")+"</div>":'<p class="sub">Aún no hay movimientos de hoy.</p>'}</aside>`}
const nota2=()=>okP?"":'<p class="sub cn-bad">Falta ejecutar supabase/contabilidad-precios.sql para guardar los precios de los productos.</p>';
async function gCaja(){
 if(gCaja.b)return;const k=cj.k,p=PL[k],comp=k==="com",dona=!!p[2].don,nof=comp&&!cj.f,
 pr=comp?kp.filter(x=>x.n.trim()&&n(x.v)>0):[],sp=pr.reduce((a,x)=>a+n(x.v),0),v=n(kv.v)||sp,nm=((kv.t==="__nuevo"?kv.tn:kv.t)||"").trim(),fe=kv.f||hoy();
 if(!(v>0)){aviso("Escribe el valor.","err");return}
 if(comp&&!nm){aviso("Elige o escribe el proveedor.","err");return}
 if(sp>v){aviso("Los productos suman "+m(sp)+" y el total es "+m(v)+".","err");return}
 gCaja.b=1;
 try{let tid=null;
  if(nm&&k!=="cuo"){let t=te.find(x=>nq(x.nombre)===nq(nm));
   if(!t){t=ck(await SB.from("cnt_terceros").insert({nombre:nm.slice(0,80),tipo:dona?"donante":comp?"proveedor":"otro",relacionado:false,no_obligado:nof}).select().single()).data;te.push(t)}
   else if(nof&&!t.no_obligado){ck(await SB.rpc("cnt_tercero_no_obligado",{p_id:t.id}));t.no_obligado=true}
   tid=t.id}
  const L1=p[1](1),b=cj.b||(L1.some(x=>x[0]==="1105")?"e":"b"),
  L=p[1](v).map(([c,d,h])=>({cuenta:c==="1105"||c==="1110"?(b==="e"?"1105":"1110"):c,debito:d||0,credito:h||0})),
  num=(kv.n||"").trim(),st=k==="cuo"?"pos":comp&&cj.f?"factura":null,
  cab={fecha:fe,tipo:p[3],tercero_id:tid,concepto:((kv.c||"").trim()||KL[k]+(nm?" · "+nm:"")+(pr.length?": "+pr.map(x=>x.n.trim()).join(", "):"")).slice(0,160),soporte_tipo:st&&(num||comp)?st:null,soporte_num:st&&num?num:null,donacion:dona,condicionada:false,especie:!!p[2].es},
  pj=pr.map(x=>({sku:x.s?String(x.s):null,nombre:x.n.trim().slice(0,80),unidad:(x.u||"").trim().slice(0,12)||null,cantidad:n(x.q)||null,valor:n(x.v)})),
  r=ck(pr.length&&okP?await SB.rpc(comp?"cnt_registrar_compra":"cnt_crear_asiento_precios",{p_cab:cab,p_lineas:L,p_precios:pj}):await SB.rpc("cnt_crear_asiento",{p_cab:cab,p_lineas:L}));
  const R=r.data&&typeof r.data==="object"?r.data:{numero:r.data};r.data=R.numero;await load();if(R.entradas&&R.entradas.length)recargar(true);
  const iv={ok:(R.entradas||[]).map(x=>x.nombre),no:(R.omitidas||[]).map(x=>x.nombre+" ("+x.motivo+")")};
  kv={};kp=[];render(true);aviso("Guardado "+r.data+(pr.length&&!okP?". Los precios no se guardaron: falta el SQL de precios.":".")+(iv.ok.length?" Entró al inventario: "+iv.ok.join(", ")+".":"")+(iv.no.length?" No entró (otra unidad): "+iv.no.join(", ")+".":""))
 }catch(x){err(x)}finally{gCaja.b=0}}
let pF="con",pQ="",pCer=new Set(),pAb=new Set(),pG=[];
function pDatos(){
 const AN=new Set(as.filter(a=>a.estado==="anulado").map(a=>a.id)),M=new Map(),A=new Map(),mk=(nm,u,st,inv,k)=>({nm,u,st,inv,k,h:[]});
 itm().forEach(i=>{const g=mk(i.n,i.u||"",n(i.sys),1,i.k||"");M.set(String(i.sku),g);A.set(nq(i.n),g)});
 pp.filter(r=>!AN.has(r.asiento_id)).sort((x,c)=>String(x.fecha).localeCompare(c.fecha)||x.id-c.id).forEach(r=>{
  let g=(r.sku&&M.get(String(r.sku)))||A.get(nq(r.nombre));
  if(!g){g=mk(r.nombre,r.unidad||"",0,0,"");A.set(nq(r.nombre),g);M.set("n:"+nq(r.nombre),g)}g.h.push(r)});
 return[...new Set(M.values())].map(g=>{const H=g.h.filter(r=>n(r.cantidad)>0),pu=r=>n(r.valor)/n(r.cantidad),
  u=H.length?pu(H[H.length-1]):null,a=H.length>1?pu(H[H.length-2]):null,q=H.reduce((s,r)=>s+n(r.cantidad),0),
  v=a?(u-a)/a*100:null;return{...g,key:nq(g.nm),u2:u,a,v,pr:q?H.reduce((s,r)=>s+n(r.valor),0)/q:null}}).sort((x,y)=>x.nm.localeCompare(y.nm,"es"))}
const pHist=g=>(g.h.length?g.h.slice().reverse().slice(0,20).map(r=>`<div class="sub">${esc(r.fecha)} · ${esc(ter(r.tercero_id).nombre||"—")} · ${n(r.cantidad)?f2(n(r.cantidad))+" "+esc(r.unidad||g.u||"")+" · ":""}${m(r.valor)}${n(r.cantidad)?" · "+m(n(r.valor)/n(r.cantidad))+"/u":""}</div>`).join(""):'<p class="sub">Aún no hay compras.</p>')+(g.inv&&g.u2!==null?`<div class="sub">Valor en stock: ${m(g.st*g.u2)}</div>`:"");
const pFila=g=>{const ab=pAb.has(g.key),k=esc(g.key),u=esc(g.u||"u");
 return`<tr class="cn-pr" data-c="pro" data-i="${k}"><td><button type="button" class="cn-lk cn-nm" data-c="pro" data-i="${k}" aria-expanded="${ab}">${esc(g.nm)}</button></td><td class="r">${g.u2!==null?m(g.u2)+"/"+u:"—"}</td><td class="r ${g.v!==null&&g.v>UM?"cn-bad":""}">${g.v!==null?(g.v>0?"+":"")+f2(g.v)+" %":"—"}</td><td class="r">${g.pr!==null?m(g.pr):"—"}</td><td class="r">${g.inv?f2(g.st)+" "+esc(g.u):"—"}</td></tr>`+(ab?`<tr class="cn-hi"><td colspan="5">${pHist(g)}</td></tr>`:"")};
function pTabla(){const k=nq(pQ),F={con:g=>g.u2!==null,sin:g=>g.u2===null,sub:g=>g.v!==null&&g.v>UM}[pF],L=pG.filter(g=>F(g)&&(!k||nq(g.nm).includes(k)));
 if(!L.length){const o=k&&pF!=="sin"?pG.filter(g=>g.u2===null&&nq(g.nm).includes(k)).length:0;
  return`<p class="sub">${pG.length?"No hay productos con este filtro"+(k?" y esa búsqueda":"")+".":"Aún no hay productos."}</p>${o?`<button type="button" class="ghost" data-c="pf" data-i="sin">Hay ${o} sin precio que coinciden: verlos</button>`:""}`}
 const Gp=new Map();L.forEach(g=>{const t=g.k||"Sin tipo";(Gp.get(t)||Gp.set(t,[]).get(t)).push(g)});
 return[...Gp.keys()].sort((a,c)=>(a==="Sin tipo")-(c==="Sin tipo")||a.localeCompare(c,"es")).map(t=>{const R=Gp.get(t),cer=pCer.has(t)&&!k;
  return`<div class="cn-card"><button type="button" class="cn-gh" data-c="pgr" data-i="${esc(t)}" aria-expanded="${!cer}"><span>${esc(t)}</span><span class="sub">${R.length} ${cer?"▸":"▾"}</span></button>${cer?"":`<div class="tbl"><table class="cn-pt" style="min-width:440px"><thead><tr><th>Producto</th><th class="r">Último precio</th><th class="r">Var.</th><th class="r">Promedio</th><th class="r">Stock</th></tr></thead><tbody>${R.map(pFila).join("")}</tbody></table></div>`}</div>`}).join("")}
function vPro(){pG=pDatos();
 const up=pG.filter(g=>g.v!==null&&g.v>UM).length,con=pG.filter(g=>g.u2!==null).length,sin=pG.length-con;
 return`<h2>Productos y precios</h2>${nota2()}<div class="cn-pf"><input id="pQ" type="search" placeholder="Buscar producto" aria-label="Buscar producto" autocomplete="off" value="${esc(pQ)}">${[["con","Con precio ("+con+")"],["sin","Sin precio ("+sin+")"],["sub","Subieron más de "+UM+" % ("+up+")"]].map(([k,l])=>bt2("pf",k,l,pF===k)).join("")}</div>
<div id="pTb">${pTabla()}</div><p class="sub">Salen del inventario y de las compras que registras en Caja. Toca un producto para ver su historial.</p>`}
function vAvz(){return`<h2>Registrar movimiento</h2><form id="cF" autocomplete="off" class="cn-card"><div class="cn-f"><label>Plantilla<select id="cPl"><option value="">Asiento libre</option>${opt(Object.entries(PL).map(([k,v])=>[k,v[0]]),"")}</select></label><label>Valor total<input id="cVl" type="number" min="0" step="any" inputmode="decimal"></label><label>&nbsp;<button type="button" class="ghost" data-c="aplicar">Llenar líneas</button></label></div>
<div class="cn-f"><label>Fecha<input id="cFe" type="date" required value="${hoy()}"></label><label>Tipo<select id="cTp">${opt(Object.entries(TD),"ingreso")}</select></label><label>Tercero<select id="cTe"><option value="">Sin tercero</option>${te.map(t=>`<option value="${t.id}">${esc(t.nombre)}</option>`).join("")}</select></label><label>Soporte<select id="cSo"><option value="">Sin soporte</option>${opt(Object.entries(SO),"")}</select></label><label>N.º del soporte<input id="cSn" maxlength="40"></label></div>
<label>Concepto<input id="cCo" required maxlength="160"></label>
<div class="cn-f"><label class="cn-ck"><input type="checkbox" id="cDn">Es una donación</label><label class="cn-ck"><input type="checkbox" id="cCd">Condicionada por el donante</label><label class="cn-ck"><input type="checkbox" id="cEs">En especie</label></div>
<div id="cLin">${lin()}</div><div id="cTot" class="cn-t"></div><div class="cn-f"><button type="button" class="ghost" data-c="fila">＋ Agregar línea</button><button type="submit">Guardar asiento</button></div></form>`}
function vDia(){const k=nq(q),L=as.filter(a=>(!per||a.fecha.slice(0,7)===per)&&(!k||nq([a.numero,a.concepto,ter(a.tercero_id).nombre,a.soporte_num].join(" ")).includes(k))).sort((x,y)=>y.fecha.localeCompare(x.fecha)||y.id-x.id).slice(0,200);
 return`<h2>Libro diario</h2><div class="cn-f"><label>Período<input id="cPer" type="month" value="${per}"></label><label>Buscar<input id="cQ" value="${esc(q)}" placeholder="Número, concepto o tercero"></label></div>`+
 (L.length?'<div class="cn-sc" data-top="10">'+L.map(a=>{const ls=li.filter(l=>l.asiento_id===a.id);
  return`<div class="cn-card"><b>${esc(a.numero)}</b> · ${esc(a.fecha)} · ${TD[a.tipo]||esc(a.tipo)} · ${m(a.valor)} ${a.estado==="anulado"?'<span class="chip bad">Anulado</span>':""}<div>${esc(a.concepto)}</div><div class="sub">${[ter(a.tercero_id).nombre,sop(a),a.apodo].filter(Boolean).map(esc).join(" · ")}</div><div class="tbl"><table style="min-width:420px"><tbody>${ls.map(l=>`<tr><td>${esc(l.cuenta)} ${esc(cta(l.cuenta).nombre)}</td><td class="r">${n(l.debito)?m(l.debito):""}</td><td class="r">${n(l.credito)?m(l.credito):""}</td></tr>`).join("")}</tbody></table></div>${a.estado==="activo"?`<button type="button" class="ghost danger" data-c="anular" data-i="${a.id}">Anular</button>`:`<div class="sub">${esc(a.motivo_anulacion||"")}</div>`}</div>`}).join("")+"</div>":'<p class="sub">Aún no hay asientos.</p>')}
function vDon(){const D=act().filter(a=>a.donacion).sort((x,y)=>y.fecha.localeCompare(x.fecha)),y=String(new Date().getFullYear()),T=f=>D.filter(f).reduce((s,a)=>s+n(a.valor),0);
 return`<h2>Donaciones</h2><div class="gsum"><span class="chip">Total ${y}: ${m(T(a=>a.fecha.startsWith(y)))}</span><span class="chip">En especie: ${m(T(a=>a.especie))}</span><span class="chip">Condicionadas: ${m(T(a=>a.condicionada))}</span></div><p class="sub">Para que el donante tome el descuento, el certificado lo firma el representante legal, el contador o el revisor fiscal y se emite dentro del mes siguiente al cierre del año. Confírmalo con tu contador.</p>`+
 (D.length?`<div class="tbl cn-sc" data-top="10"><table><thead><tr><th>Fecha</th><th>Donante</th><th>Clase</th><th class="r">Valor</th><th></th></tr></thead><tbody>${D.map(a=>`<tr><td>${esc(a.fecha)}</td><td>${esc(ter(a.tercero_id).nombre||"—")}</td><td>${a.especie?"Especie":"Dinero"}${a.condicionada?" · condicionada":""}</td><td class="r">${m(a.valor)}</td><td><button type="button" class="ghost" data-c="cert" data-i="${a.id}">Certificado</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="sub">Aún no hay donaciones. Regístralas en Caja.</p>')}
function graf(){const mes=[];for(let k=5;k>=0;k--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-k);mes.push(d.toLocaleDateString("sv-SE").slice(0,7))}
 const A=new Map(as.map(a=>[a.id,a])),v=mes.map(()=>[0,0]);
 li.forEach(l=>{const a=A.get(l.asiento_id);if(!a||a.estado==="anulado")return;const i=mes.indexOf(a.fecha.slice(0,7));if(i<0)return;const t=cta(l.cuenta).tipo;if(t==="I")v[i][0]+=n(l.credito)-n(l.debito);else if(t==="G"||t==="C")v[i][1]+=n(l.debito)-n(l.credito)});
 const mx=Math.max(1,...v.flat()),W=520,H=70,bw=W/6;
 return`<svg viewBox="0 0 ${W} ${H+22}" role="img" aria-label="Ingresos y gastos por mes" style="width:100%;max-width:620px;height:auto">${v.map((x,i)=>`<g><title>${mes[i]}: ingresos ${m(x[0])}, gastos y costos ${m(x[1])}</title><rect x="${i*bw+8}" y="${H-Math.max(0,x[0])/mx*H}" width="${bw/2-10}" height="${Math.max(0,x[0])/mx*H}" rx="3" fill="var(--gchart)"/><rect x="${i*bw+bw/2}" y="${H-Math.max(0,x[1])/mx*H}" width="${bw/2-10}" height="${Math.max(0,x[1])/mx*H}" rx="3" fill="var(--alert-t)"/><text x="${i*bw+bw/2}" y="${H+16}" text-anchor="middle" font-size="12" fill="currentColor">${mes[i]}</text></g>`).join("")}</svg><div class="gsum"><span class="chip">Ingresos</span><span class="chip bad">Gastos y costos</span></div>`}
const rango=()=>{const h=hoy(),w=sem(h),e=new Date(w+"T12:00:00");e.setDate(e.getDate()+6);const[a,z]=ym(h.slice(0,7));return{h:[h,h],s:[w,e.toLocaleDateString("sv-SE")],m:[a,z]}};
function vInf(){const S=saldos(d1,d2),sm=t=>S.filter(x=>x.tipo===t).reduce((s,x)=>s+x.s,0),I=sm("I"),G=sm("G"),C=sm("C"),ex=I-G-C,A=sm("A"),P=sm("P"),T=sm("T"),
 tr=(l,v,b)=>`<tr><td>${b?"<b>"+l+"</b>":l}</td><td class="r">${b?"<b>"+m(v)+"</b>":m(v)}</td></tr>`;
 const RG=rango(),pr_=k=>RG[k][0]===d1&&RG[k][1]===d2;
 return`<h2>Informes</h2><div class="cn-f cn-rg"><label>Desde<input id="cD1" type="date" value="${d1}"></label><label>Hasta<input id="cD2" type="date" value="${d2}"></label><div class="cn-ie">${[["h","Hoy"],["s","Semana"],["m","Mes"]].map(([k,l])=>bt2("rng",k,l,pr_(k))).join("")}</div></div>
<div class="cn-f cn-inf" style="align-items:start"><div class="cn-card"><h3>Estado de actividades</h3><div class="tbl"><table><tbody>${tr("Ingresos",I)}${tr("Costos",C)}${tr("Gastos",G)}${tr(ex>=0?"Excedente":"Déficit",ex,1)}</tbody></table></div><p class="sub">El excedente no se reparte: se reinvierte en la actividad meritoria o se registra como asignación permanente.</p></div>
<div class="cn-card"><h3>Situación financiera</h3><div class="tbl"><table><tbody>${tr("Activos",A)}${tr("Pasivos",P)}${tr("Patrimonio",T)}${tr("Excedente del período",ex)}${tr("Pasivo + patrimonio + excedente",P+T+ex,1)}</tbody></table></div>${!d1&&Math.round(A)!==Math.round(P+T+ex)?'<p class="cn-bad">El balance no cuadra. Revisa que exista el asiento de apertura.</p>':""}</div></div>
<div class="cn-card"><h3>Ingresos y gastos por mes</h3>${graf()}</div>
<div class="cn-card"><h3>Balance de prueba</h3><div class="tbl"><table style="min-width:520px"><thead><tr><th>Cuenta</th><th class="r">Débitos</th><th class="r">Créditos</th><th class="r">Saldo</th></tr></thead><tbody>${S.map(x=>`<tr><td>${esc(x.codigo)} ${esc(x.nombre)}</td><td class="r">${m(x.d)}</td><td class="r">${m(x.c)}</td><td class="r">${m(x.s)}</td></tr>`).join("")||'<tr><td colspan="4">Sin movimientos.</td></tr>'}</tbody></table></div></div>`}
function vTer(){return`<h2>Terceros</h2><form id="cTf" class="cn-card" autocomplete="off"><div class="cn-f"><label>Nombre<input id="tN" required maxlength="80"></label><label>Documento o NIT<input id="tD" maxlength="20"></label><label>Tipo<select id="tT">${opt([["proveedor","Proveedor"],["donante","Donante"],["empleado","Empleado"],["otro","Otro"]],"proveedor")}</select></label></div><div class="cn-f"><label class="cn-ck"><input type="checkbox" id="tR">Relacionado (fundador, directivo, donante o familiar)</label><label class="cn-ck"><input type="checkbox" id="tO">No obligado a facturar (plaza de mercado)</label></div><button type="submit">Guardar tercero</button></form>`+
 (te.length?`<div class="tbl"><table style="min-width:520px"><thead><tr><th>Nombre</th><th>Documento</th><th>Tipo</th><th>Marcas</th></tr></thead><tbody>${te.map(t=>`<tr><td>${esc(t.nombre)}</td><td>${esc(t.documento||"")}</td><td>${esc(t.tipo)}</td><td>${[t.relacionado?"Relacionado":"",t.no_obligado?"No obligado a facturar":""].filter(Boolean).join(" · ")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="sub">Aún no hay terceros.</p>')}
function vCtl(){const P=act().filter(a=>a.tipo==="egreso"&&ter(a.tercero_id).no_obligado&&a.soporte_tipo!=="doc_soporte"&&a.soporte_tipo!=="factura"),G={};P.forEach(a=>{const w=sem(a.fecha),k=a.tercero_id+"|"+w,g=G[k]||(G[k]={t:ter(a.tercero_id).nombre,l:lim(w),v:0,c:0,ids:[]});g.v+=n(a.valor);g.c++;g.ids.push(a.id)});
 const CS=act().filter(a=>a.tipo==="ingreso"&&!a.soporte_num&&li.some(l=>l.asiento_id===a.id&&l.cuenta==="4210")),
 R=act().filter(a=>a.tipo!=="apertura"&&ter(a.tercero_id).relacionado),ms=[];
 for(let k=0;k<12;k++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-k);ms.push(d.toLocaleDateString("sv-SE").slice(0,7))}
 const DS=Object.values(G).sort((a,c)=>(hoy()>c.l)-(hoy()>a.l)||a.l.localeCompare(c.l)),venc=DS.filter(g=>hoy()>g.l).length,
 K=[[venc?0:DS.length?1:4,`<div class="cn-card"><h3>Documento soporte por generar${venc?` · <span class="cn-bad">${venc} vencido${venc===1?"":"s"}</span>`:""}</h3><p class="sub">Compras a quien no factura: un documento por proveedor y semana, a más tardar el viernes (o el último día hábil) de la semana de la compra. Confírmalo con tu contador.</p>${DS.length?DS.map(g=>`<div class="cn-l ${hoy()>g.l?"cn-bad":""}" style="grid-template-columns:1fr auto"><span>${esc(g.t)} · ${g.c} compra${g.c===1?"":"s"} · ${m(g.v)} · límite ${g.l}${hoy()>g.l?" (vencido)":""}</span><button type="button" class="ghost" data-c="dsg" data-i="${g.ids.join(",")}">Ya lo generé</button></div>`).join(""):'<p class="sub">Nada pendiente.</p>'}</div>`],
 [CS.length?1:4,`<div class="cn-card"><h3>Cuotas sin n.º de documento</h3>${CS.length?CS.slice(0,30).map(a=>`<div class="cn-bad">${esc(a.numero)} · ${esc(a.fecha)} · ${m(a.valor)}</div>`).join(""):'<p class="sub">Todas tienen número.</p>'}</div>`],
 ...ctlN(),
 [R.length?3:5,`<div class="cn-card"><h3>Operaciones con terceros relacionados</h3><p class="sub">Los contratos con fundadores, donantes, administradores o sus familiares se registran ante la DIAN.</p>${R.length?R.map(a=>`<div>${esc(a.numero)} · ${esc(a.fecha)} · ${esc(ter(a.tercero_id).nombre)} · ${m(a.valor)}</div>`).join(""):'<p class="sub">Ninguna.</p>'}</div>`],
 [5,`<div class="cn-card"><h3>Cierre de períodos</h3><p class="sub">Un período cerrado no admite asientos nuevos ni anulaciones.</p>${ms.map(p=>`<div class="cn-l" style="grid-template-columns:1fr auto"><span>${p}${ci.has(p)?" · cerrado":""}</span><button type="button" class="ghost" data-c="cierre" data-i="${p}">${ci.has(p)?"Reabrir":"Cerrar"}</button></div>`).join("")}</div>`]];
 return`<h2>Control</h2><div class="cn-2">${K.sort((a,c)=>a[0]-c[0]).map(x=>x[1]).join("")}</div>`}
function aplicar(){const k=$("cPl").value,v=n($("cVl").value);if(!k||!v){aviso("Elige una plantilla y escribe el valor.","err");return}
 const p=PL[k];rows=p[1](v).map(([c,d,h])=>({c,d:d||"",h:h||""}));$("cLin").innerHTML=lin();$("cTp").value=p[3];$("cDn").checked=!!p[2].don;$("cCd").checked=!!p[2].cd;$("cEs").checked=!!p[2].es;if(!$("cCo").value)$("cCo").value=p[0];tot()}
function cert(id){const a=as.find(x=>x.id===id),t=ter(a.tercero_id),
 x=["CERTIFICADO DE DONACIÓN","Fecha de la donación: "+a.fecha,"Donante: "+(t.nombre||"")+(t.documento?" ("+t.documento+")":""),"Tipo de entidad: Entidad sin ánimo de lucro","Clase de bien donado: "+(a.especie?"Alimentos (en especie)":"Dinero"),"Valor: "+m(a.valor),"Forma de la donación: "+(a.especie?"Entrega de bienes":"Dinero"),"Destinación: "+(a.condicionada?"Según condición del donante":"Actividad meritoria"),"","Firma: representante legal, contador o revisor fiscal"].join("\n");
 (navigator.clipboard?navigator.clipboard.writeText(x):Promise.reject()).then(()=>aviso("Certificado copiado.")).catch(()=>aviso("No se pudo copiar.","err"))}
async function guardar(){
 const L=rows.filter(r=>r.c&&(n(r.d)||n(r.h))).map(r=>({cuenta:r.c,debito:n(r.d),credito:n(r.h)})),
 cab={fecha:$("cFe").value,tipo:$("cTp").value,tercero_id:+$("cTe").value||null,concepto:$("cCo").value.trim(),soporte_tipo:$("cSo").value||null,soporte_num:$("cSn").value.trim()||null,donacion:$("cDn").checked,condicionada:$("cCd").checked,especie:$("cEs").checked};
 try{const r=ck(await SB.rpc("cnt_crear_asiento",{p_cab:cab,p_lineas:L}));rows=[{c:"",d:"",h:""},{c:"",d:"",h:""}];await load();render(true);aviso("Asiento "+r.data+" guardado.")}catch(x){err(x)}}
async function click(e){const b=e.target.closest("[data-c]");if(!b)return;const c=b.dataset.c,i=b.dataset.i;
 if(c==="tab"){tab=b.dataset.t;render(true);const a=document.querySelector("#cnt>.tabs .tab[aria-pressed=true]");if(a&&a.offsetParent&&a.scrollIntoView)a.scrollIntoView({inline:"center",block:"nearest"});return}
 if(c==="aplicar"){aplicar();return}
 if(c==="sub"){sb[b.dataset.k]=i;render(true);return}
 if(c==="kt"){cj.t=i;cj.k=KS[i][0];cj.b=null;cj.f=1;render(true);return}
 if(c==="kk"){cj.k=i;cj.b=null;render(true);return}
 if(c==="kf"){cj.f=+i;render(true);return}
 if(c==="kb"){cj.b=i;render(true);return}
 if(c==="rng"){const r=rango()[i];if(d1===r[0]&&d2===r[1]){d1="";d2=""}else{d1=r[0];d2=r[1]}render(true);return}
 if(c==="pf"){pF=i;render(true);return}
 if(c==="pgr"){if(pCer.has(i))pCer.delete(i);else pCer.add(i);const bx=$("pTb");if(bx)bx.innerHTML=pTabla();return}
 if(c==="pro"){if(pAb.has(i))pAb.delete(i);else pAb.add(i);const bx=$("pTb");if(bx)bx.innerHTML=pTabla();return}
 if(c==="pa"){kp.push({n:"",q:"",v:"",u:"",s:""});render(true);return}
 if(c==="pq"){kp.splice(+i,1);render(true);return}
 if(c==="avz"){avz=!avz;render(true);return}
 if(c==="fila"){rows.push({c:"",d:"",h:""});$("cLin").innerHTML=lin();tot();return}
 if(c==="quitar"){if(rows.length>2){rows.splice(+i,1);$("cLin").innerHTML=lin();tot()}return}
 if(c==="cert"){cert(+i);return}
 try{
  if(c==="anular"){const mo=prompt("Motivo de la anulación:");if(!mo||!mo.trim())return;const an=ck(await SB.rpc("cnt_anular",{p_id:+i,p_motivo:mo.trim()})).data||{},R=an.revertidas||[];await load();if(R.length)recargar(true);aviso("Asiento anulado."+(R.length?" Se descontó del inventario: "+R.map(x=>x.nombre).join(", ")+".":""))}
  if(c==="cierre"){if(ci.has(i))ck(await SB.from("cnt_cierres").delete().eq("periodo",i));else ck(await SB.from("cnt_cierres").insert({periodo:i}));await load()}
  if(c==="ppg"){await pGuardar([pm]);aviso("Presupuesto guardado.")}
  if(c==="panio"){const y=pm.slice(0,4),M=[];for(let k=+pm.slice(5);k<=12;k++)M.push(y+"-"+String(k).padStart(2,"0"));await pGuardar(M);aviso("Presupuesto repetido hasta diciembre.")}
  if(c==="pcopia"){const p0=new Date(+pm.slice(0,4),+pm.slice(5)-2,1).toLocaleDateString("sv-SE").slice(0,7);cu.filter(x=>"IGC".includes(x.tipo)).forEach(x=>bd[x.codigo]=String(pAv(p0,x.codigo)||""))}
  if(c==="bsal"){if($("bSl").value==="")throw new Error("Escribe el saldo del extracto.");ck(await SB.from("cnt_conciliaciones").upsert({corte:cor,saldo_extracto:n($("bSl").value)}));bs=null;await loadN();aviso("Saldo guardado.")}
  if(c==="bimp")await bImportar();
  if(c==="bauto")await bAuto();
  if(c==="bmatch"){ck(await SB.rpc("cnt_conciliar",{p_extracto:+i,p_linea:+$("bm"+i).value}));await loadN()}
  if(c==="bnew"){const e=ex.find(x=>x.id===+i);ck(await SB.rpc("cnt_conciliar_nuevo",{p_extracto:+i,p_contra:$("bc"+i).value,p_concepto:"Conciliación bancaria: "+(e.descripcion||"movimiento")}));await load()}
  if(c==="dsg"){const x=prompt("Número del documento soporte generado:");if(!x||!x.trim())return;ck(await SB.rpc("cnt_soporte_generado",{p_ids:i.split(",").map(Number),p_num:x.trim()}));await load();aviso("Marcado como generado.")}
  if(c==="bundo"){ck(await SB.from("cnt_extractos").update({linea_id:null}).eq("id",+i));await loadN()}
  render(true)}catch(x){err(x)}}
function chg(e){const t=e.target;
 if(t.id==="kT"){render(true);const z=kv.t==="__nuevo"&&$("kTn");if(z)z.focus();return}
 if(t.dataset.p!==undefined&&t.dataset.f==="n"){const x=kp[+t.dataset.p];
  if(t.tagName==="SELECT"){if(t.value==="__nuevo"){x.nuevo=true;x.n="";x.s="";render(true);const z=document.querySelector(`#cnt input[data-p="${t.dataset.p}"][data-f="n"]`);if(z)z.focus();return}x.nuevo=false}
  const it=itm().find(a=>nq(a.n)===nq(t.value));x.n=t.value;x.s=it?it.sku:"";if(it){x.u=it.u||"";const u=t.closest(".kg").querySelector("[data-f=u]");if(u)u.value=x.u}return}
 if(t.dataset.r!==undefined){rows[+t.dataset.r][t.dataset.k]=t.value;tot();return}
 if(t.id==="pMes"){pm=t.value||pm;bd={};render(true)}else if(t.id==="bCor"){cor=t.value||cor;bs=null;render(true)}else if(t.id==="bFl"){const f=t.files[0];if(f)f.text().then(x=>{bt=x;render(true)})}else if(t.id==="cPer"){per=t.value;render(true)}else if(t.id==="cQ"){q=t.value;render(true)}else if(t.id==="cD1"){d1=t.value;render(true)}else if(t.id==="cD2"){d2=t.value;render(true)}}
async function sub(e){e.preventDefault();
 if(e.target.id==="cF")return guardar();
 if(e.target.id==="cK")return gCaja();
 if(e.target.id==="cTf")try{ck(await SB.from("cnt_terceros").insert({nombre:$("tN").value.trim(),documento:$("tD").value.trim()||null,tipo:$("tT").value,relacionado:$("tR").checked,no_obligado:$("tO").checked}));await load();render(true);aviso("Tercero guardado.")}catch(x){err(x)}}
function build(){if(built)return;built=true;const s=document.createElement("section");s.id="cnt";s.hidden=true;$("v5").after(s);
 s.addEventListener("click",click);["cntL","cntR"].forEach(id=>$(id).addEventListener("click",click));s.addEventListener("change",chg);s.addEventListener("input",e=>{const t=e.target;if(t.dataset.kv!==undefined)kv[t.dataset.kv]=t.value;else if(t.dataset.p!==undefined){if(t.value!=="__nuevo")kp[+t.dataset.p][t.dataset.f]=t.value}else if(t.id==="pQ"){pQ=t.value;const bx=$("pTb");if(bx)bx.innerHTML=pTabla()}else if(t.dataset.r!==undefined){rows[+t.dataset.r][t.dataset.k]=t.value;tot()}else if(t.dataset.bd!==undefined)bd[t.dataset.bd]=t.value;else if(t.id==="bTx")bt=t.value;else if(t.id==="bSl")bs=t.value});s.addEventListener("submit",sub)}
const tb=([k,l,c])=>`<button type="button" class="tab" data-c="tab" data-t="${k}" aria-pressed="${tab===k}" title="${l}"><span class="cl">${l}</span><span class="cs">${c||l}</span></button>`;
function pintarNav(){$("cntL").innerHTML=TABS.slice(0,2).map(tb).join("");$("cntR").innerHTML=TABS.slice(2).map(tb).join("")}
function pintarModo(){const b=$("modo"),a=esAdmin(),mo=on&&a?"c":window.PRM&&PRM.on()?"p":"a";b.dataset.m=mo;b.querySelector(".sg-c").hidden=!a;b.setAttribute("aria-checked",String(mo!=="a"));
 b.setAttribute("aria-label","Cambiar entre alimentos, préstamos"+(a?" y contabilidad":""));b.title=({a:"Modo alimentos",p:"Modo préstamos",c:"Modo contabilidad"})[mo]+" (clic para cambiar)"}
function topes(){document.querySelectorAll("#cnt [data-top]").forEach(b=>{b.style.maxHeight="";if(!b.offsetParent)return;const k=+b.dataset.top,r=[...(b.querySelector("tbody")?b.querySelectorAll("tbody>tr"):b.children)];
 if(r.length>k)b.style.maxHeight=Math.ceil(r[k].getBoundingClientRect().top-b.getBoundingClientRect().top+b.scrollTop)+"px"})}
let tpT=0;addEventListener("resize",()=>{clearTimeout(tpT);tpT=setTimeout(topes,150)});
function render(force){build();
 [0,1,3,4,5].forEach(k=>{$("v"+k).hidden=true;const p=$("pv"+k);if(p)p.hidden=true});
 document.querySelector(".zones").hidden=true;$("wrap").classList.add("solo");document.body.classList.add("cnt-on");
 const s=$("cnt");s.hidden=false;pintarModo();pintarNav();
 if(!force&&s.contains(document.activeElement)&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
 if(!loaded){s.innerHTML='<p class="sub">Cargando contabilidad…</p>';load().then(()=>render(true)).catch(()=>{loaded=true;ok=false;render(true)});return}
 s.innerHTML=(ok?"":`<p class="sub cn-bad">No se pudo leer la contabilidad${le?": "+esc(le):""}. Revisa que supabase/contabilidad.sql se ejecutó y que las tablas tienen permisos.</p>`)+`<div class="tabs" role="tablist">${TABS.map(tb).join("")}</div>`+vista();topes();
 if(tab==="reg"){if(avz)tot();else{const e=$("kV");if(e&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))e.focus()}}}
function hide(){const s=$("cnt");if(s)s.hidden=true;document.body.classList.remove("cnt-on");$("cntL").innerHTML="";$("cntR").innerHTML="";pintarModo()}
function setOn(v){on=!!v;q="";try{localStorage.setItem(KM,on?"2":"0")}catch(_){}}
function off(){setOn(false);pintarModo()}
function buscar(v){q=v||"";tab="dia";render(true)}
function datosExport(){const H=(name,h,r)=>({name,h,r}),A=new Map(as.map(a=>[a.id,a])),B=bnd();
 return{slug:"contabilidad",hojas:[
  H("Libro diario",["Número","Fecha","Tipo","Tercero","Concepto","Soporte","Cuenta","Nombre de la cuenta","Débito","Crédito","Estado"],li.map(l=>{const a=A.get(l.asiento_id)||{};return[a.numero||"",a.fecha||"",TD[a.tipo]||"",ter(a.tercero_id).nombre||"",a.concepto||"",sop(a),l.cuenta,cta(l.cuenta).nombre,n(l.debito),n(l.credito),a.estado||""]}).sort((x,y)=>String(y[1]).localeCompare(String(x[1])))),
  H("Balance de prueba",["Cuenta","Nombre","Débitos","Créditos","Saldo"],saldos(d1,d2).map(x=>[x.codigo,x.nombre,x.d,x.c,x.s])),
  H("Presupuesto",["Período","Cuenta","Nombre","Presupuesto"],pr.map(x=>[x.periodo,x.cuenta,cta(x.cuenta).nombre,n(x.monto)])),
  H("Extracto bancario",["Fecha","Descripción","Valor","Estado"],ex.map(e=>[e.fecha,e.descripcion,n(e.valor),B.vin(e)?"Conciliado":"Pendiente"])),
  H("Terceros",["Nombre","Documento","Tipo","Relacionado","No obligado a facturar"],te.map(t=>[t.nombre,t.documento||"",t.tipo,t.relacionado?"Sí":"No",t.no_obligado?"Sí":"No"])),H("Precios",["Fecha","Producto","Unidad","Cantidad","Valor","Precio unitario"],pp.map(r=>[r.fecha,r.nombre,r.unidad||"",n(r.cantidad),n(r.valor),n(r.cantidad)?n(r.valor)/n(r.cantidad):""]))]}}
window.cambiarModo=e=>{const adm=esAdmin(),o=adm?["a","p","c"]:["a","p"],b=$("modo"),cur=b.dataset.m||"a";let t;
 if(adm&&e&&matchMedia("(min-width:761px)").matches){const i=[...b.querySelectorAll(".sg")].findIndex(x=>{const r=x.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right});t=i>=0?o[i]:o[(o.indexOf(cur)+1)%o.length]}
 else t=o[(o.indexOf(cur)+1)%o.length];
 PRM.setOn(t==="p");setOn(t==="c");$("scan").value="";sec=0;pintarModo();if(currentUser)renderAll()};
return{on:()=>on&&esAdmin()&&!!currentUser,off,setOn,buscar,render,hide,load,datosExport}
})();
