window.PRM=(()=>{
const KM="kokoa-modo",E={disponible:"Disponible",prestado:"Por devolver",por_limpiar:"Por limpiar"};
const LB={0:["Prestar: Quitar","Prestar"],1:["Devolver: Agregar","Devolver"],3:["Préstamos en curso","En curso"],4:["Gráficos","Gráficos"],5:["Movimientos","Historial"]};
let on=false,ok=true,tipX=[],tipRows=[],tipTbl=false,estX=[],sysOrd={},offB=new Set(),estTbl=false,imp=[],pre=[],its=[],evs=[],sel=new Set(),built=false,dvf="todos",dvc="*",dq="",dord="",fo=false,fsub="",pqTxt="",pqTipo="*",pqOrd="",pqFO=false,pqSub="",pFind="",pgm="i",pgp="d",pgi="*",pct="bars";const dsel=new Map();
try{on=localStorage.getItem(KM)==="1"}catch(_){}
const nq=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const f=d=>d?new Date(d).toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"}):"-";
const late=i=>!i.devuelto&&Date.parse(i.vence)<Date.now();
const busy=e=>e.contains(document.activeElement)&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
const set=(id,h,force)=>{const e=$(id);if(e&&(force||!busy(e)))e.innerHTML=h};
const money=v=>"$"+Number(v||0).toLocaleString("es-CO");
const err=x=>aviso(x.message||String(x),"err");
async function load(){
 const q=(n,o,l)=>SB.from(n).select("*").order(o,{ascending:false}).limit(l);
 const r=await Promise.all([q("implementos","codigo",1000),q("prestamos","id",500),q("prestamo_items","id",3000),q("prestamo_eventos","id",1000)]);
 ok=!r.some(x=>x.error);
 try{let t=await SB.from("tipos_implemento").select("*").order("orden");if(t.error)t=await SB.from("tipos_implemento").select("*");
  if(t.error){tipRows=[];tipTbl=false}else{tipRows=t.data.slice().sort((a,b)=>(a.orden||0)-(b.orden||0)||String(a.nombre).localeCompare(String(b.nombre),"es"));tipTbl=true}}catch(_){tipRows=[];tipTbl=false}
 tipX=tipRows.map(r=>r.nombre);
 try{const t=await SB.from("estados_implemento").select("*").order("orden");if(t.error){estX=EDEF.map(x=>({...x}));sysOrd={};offB=new Set();estTbl=false}else{const cl=r=>String(r.clave);estX=t.data.filter(r=>!/^(sys|off):/.test(cl(r)));sysOrd={};offB=new Set();t.data.forEach(r=>{if(cl(r).startsWith("sys:"))sysOrd[cl(r).slice(4)]=r.orden||0;else if(cl(r).startsWith("off:"))offB.add(cl(r).slice(4))});estTbl=true}}catch(_){estX=EDEF.map(x=>({...x}));sysOrd={};offB=new Set();estTbl=false}
 estSync();
 if(ok){imp=r[0].data.sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),"es")||((a.condicion||"bueno")==="bueno"?0:1)-((b.condicion||"bueno")==="bueno"?0:1)||a.id-b.id);pre=r[1].data;its=r[2].data;evs=r[3].data}
}
function lab(p){document.querySelectorAll("#views .tab[data-s]").forEach(b=>{const k=+b.dataset.s,v=VISTAS.find(x=>x[0]===k),t=p?LB[k]:v.slice(1);b.querySelector(".l-lg").textContent=t[0];b.querySelector(".l-sm").textContent=t[1]})}
function pintar(){const b=$("modo");b.classList.toggle("grid",on);b.setAttribute("aria-checked",String(on));b.title=on?"Modo préstamos (clic para volver a alimentos)":"Modo alimentos (clic para ir a préstamos)"}
const plazoDe=(p,rows)=>{const t=Date.parse(p.salida),v=Math.max(0,...rows.map(i=>Date.parse(i.vence)||0));return t&&v?Math.max(1,Math.round((v-t)/864e5)):0};
const condPdf=c=>({bueno:"Buena",danado:"Mala",perdido:"Perdido"})[c]||(c?String(c).charAt(0).toUpperCase()+String(c).slice(1):"-");
function pdfDoc(p,rows){
 const d=new window.jspdf.jsPDF({unit:"mm",format:"a5"}),W=148;let y=14;
 d.setFont("helvetica","bold");d.setFontSize(14);d.text("Kokoa Virtual · Ticket de préstamo",10,y);d.setFontSize(11);d.text(p.numero,W-10,y,{align:"right"});
 y+=7;d.setFont("helvetica","normal");d.setFontSize(9);d.text("Salida: "+f(p.salida)+"    Entregó: "+(p.entregado_por||"-"),10,y);
 y+=8;d.setFont("helvetica","bold");d.text("PRESTATARIO",10,y);d.setFont("helvetica","normal");y+=5;
 const cap=t=>{t=String(t||"");return t?t.charAt(0).toUpperCase()+t.slice(1):""},nmL=d.splitTextToSize("Nombre: "+p.nombre,W-20);
 d.text(nmL,10,y);y+=(nmL.length-1)*4.5+5;
 d.text("Documento: "+p.documento,10,y);d.text("Teléfono: "+(p.telefono||"-"),58,y);
 d.text(`Plazo: ${plazoDe(p,rows)||"-"} día${plazoDe(p,rows)===1?"":"s"}`,104,y);
 y+=12;
 d.setFont("helvetica","bold");const cxr=88-d.getTextWidth("Condición al salir")/2;d.text("IMPLEMENTOS",10,y);y+=5;d.text("Implemento",10,y);d.text("Cantidad",56,y);d.text("Condición al salir",cxr,y);d.text("Devolver antes de",106,y);d.setFont("helvetica","normal");y+=5;
 const grp=[],gm=new Map();
 rows.forEach(i=>{const k=[String(i.nombre||"").trim().toLowerCase(),i.cond_salida||"",Math.floor((Date.parse(i.vence)||0)/6e4),i.devuelto?"d|"+(i.cond_regreso||"")+"|"+(i.limpio?1:0)+"|"+(i.novedad||""):"p"].join("¦");
  if(!gm.has(k)){const g={i,n:0};gm.set(k,g);grp.push(g)}gm.get(k).n++});
 grp.forEach(({i,n})=>{if(y>175){d.addPage();y=14}const nl=d.splitTextToSize(String(i.nombre||""),42);
  d.text(nl,10,y);d.text(String(n),56,y);d.text(condPdf(i.cond_salida),cxr,y);d.text(f(i.vence),106,y);y+=(nl.length-1)*4.2;
  if(i.devuelto){y+=4;d.setFontSize(8);d.text(`Devuelto ${f(i.devuelto)} · Condición ${condPdf(i.cond_regreso)}${i.limpio?"":" · sin limpiar"}${i.novedad?" · "+i.novedad:""}`,10,y);d.setFontSize(9)}y+=6});
 if(p.notas){if(y>175){d.addPage();y=14}const nl=d.splitTextToSize("Notas: "+p.notas,W-20);d.setFontSize(9);d.text(nl,10,y);y+=nl.length*4.5+2}
 y=Math.max(y+6,150);if(y>190){d.addPage();y=20}
 d.setFontSize(8);d.text(d.splitTextToSize("Me comprometo a devolver los implementos completos, limpios y en la fecha indicada, y a responder por su daño o pérdida. El préstamo es gratuito. Autorizo el tratamiento de mis datos personales (Ley 1581 de 2012) para gestionar este préstamo.",W-20),10,y);
 y+=22;d.line(10,y,60,y);d.line(W-60,y,W-10,y);d.text("Firma prestatario",10,y+4);d.text("Recibe devolución",W-60,y+4);
 return d;
}
/* ---- Ventanilla del ticket: compartir, descargar, imprimir ---- */
let tkSt=null;
function tkClose(){const m=$("tkModal");if(m)m.hidden=true;if(tkSt&&tkSt.url)URL.revokeObjectURL(tkSt.url);tkSt=null;const f=$("tkFrame");if(f)f.remove()}
let pdfP=null;const cargarPdf=()=>window.jspdf?Promise.resolve():(pdfP||(pdfP=new Promise((ok,ko)=>{const e=document.createElement("script");e.src="vendor/jspdf.min.js";e.onload=ok;e.onerror=()=>{pdfP=null;ko(new Error("No se pudo cargar el generador de PDF. Revisa tu conexión."))};document.head.appendChild(e)})));
async function ticketDlg(p,rows){
 let doc;try{await cargarPdf();doc=pdfDoc(p,rows)}catch(x){err(x);return}
 const blob=doc.output("blob"),name="ticket-"+p.numero+".pdf",file=new File([blob],name,{type:"application/pdf"});
 if(tkSt)tkClose();tkSt={blob,name,file,url:URL.createObjectURL(blob),p};
 let m=$("tkModal");
 if(!m){m=document.createElement("div");m.id="tkModal";m.className="modal-backdrop";m.hidden=true;
  m.innerHTML='<section class="modal tkm" role="dialog" aria-modal="true" aria-labelledby="tkT"><h2 id="tkT"></h2><p class="small-note" id="tkS"></p><div class="tkb"><button type="button" id="tkShare">Compartir</button><button type="button" id="tkDown">Descargar</button><button type="button" id="tkPrint">Imprimir</button></div><p class="small-note" id="tkMsg" aria-live="polite"></p><div class="abtns"><button type="button" class="ghost" id="tkClose">Cerrar</button></div></section>';
  document.body.appendChild(m);
  m.addEventListener("click",e=>{if(e.target===m)tkClose()});
  $("tkClose").onclick=tkClose;
  $("tkDown").onclick=()=>{if(!tkSt)return;const a=document.createElement("a");a.href=tkSt.url;a.download=tkSt.name;document.body.appendChild(a);a.click();a.remove();$("tkMsg").textContent="Descargando "+tkSt.name+"…"};
  $("tkPrint").onclick=()=>{if(!tkSt)return;const old=$("tkFrame");if(old)old.remove();const f=document.createElement("iframe");f.id="tkFrame";f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";f.src=tkSt.url;
   f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(_){window.open(tkSt.url,"_blank")}};document.body.appendChild(f);$("tkMsg").textContent="Abriendo la impresión…"};
  $("tkShare").onclick=async()=>{if(!tkSt)return;try{await navigator.share({files:[tkSt.file],title:"Ticket "+tkSt.p.numero,text:"Ticket de préstamo "+tkSt.p.numero})}catch(x){if(x&&x.name!=="AbortError")$("tkMsg").textContent="No se pudo compartir. Usa Descargar."}};
  addEventListener("keydown",e=>{if(e.key==="Escape"&&$("tkModal")&&!$("tkModal").hidden)tkClose()})}
 $("tkT").textContent="Ticket "+p.numero;$("tkS").textContent=p.nombre+" · "+rows.length+" implemento"+(rows.length===1?"":"s")+". ¿Qué quieres hacer con el ticket?";$("tkMsg").textContent="";
 const can=!!(navigator.canShare&&navigator.canShare({files:[file]}));$("tkShare").hidden=!can;
 m.hidden=false;$("tkDown").focus()}
const pdf=ticketDlg;
const SVGF='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>';
const ESTL={todos:"Toda la cocina",disp:"Disponibles",pend:"Por devolver",lim:"Por limpiar"};
const EDEF=[];
const lbl=k=>E[k]||(estX.find(x=>x.clave===k)||{}).nombre||k;
const BASEL=[["todos","Toda la cocina"],["disp","Disponibles"],["pend","Por devolver"],["lim","Por limpiar"]];
function stateList(){const L=[];BASEL.forEach(([k,l],i)=>{if(!offB.has(k))L.push({base:true,k,label:l,o:sysOrd[k]!==undefined?sysOrd[k]:-1000+i})});
 estX.forEach((x,i)=>L.push({base:false,k:"e:"+x.clave,clave:x.clave,label:x.nombre,o:x.orden!=null?x.orden:1000+i}));
 return L.sort((a,b)=>a.o-b.o)}
function estSync(){Object.keys(ESTL).forEach(k=>delete ESTL[k]);stateList().forEach(e=>{ESTL[e.k]=e.label});if(!(dvf in ESTL))dvf=Object.keys(ESTL)[0]||"todos"}
const tipoDe=m=>(m&&m.categoria)||"";
const tipos=()=>{const have=new Set(imp.map(tipoDe)),extra=[...have].filter(t=>t&&!tipX.includes(t)).sort((a,b)=>a.localeCompare(b,"es"));return[...tipX,...extra]};
const sinTipoN=()=>imp.filter(m=>!m.categoria).length,catsT=()=>[...tipos(),...(sinTipoN()?[""]:[])],tTit=t=>t||"Por asignar tipo";

/* ---- Editar (modo préstamos): Tipos de implementos y Estados, igual que Zonas / Tipos de alimentos ---- */
let tpV="menu";
const TP_T={t:"Tipos de implementos",e:"Estados"};
const tpMsg=(t,bad)=>{const m=$("tpMsg");if(m){m.textContent=t||"";m.className="admin-msg"+(bad&&t?"":" okm")}};
const tpFalta=x=>/tipos_implemento|estados_implemento|42P01|PGRST204|PGRST205|schema cache|does not exist/i.test((x&&((x.code||"")+" "+(x.message||"")))||"");
const regEd=async t=>{try{await SB.rpc("registrar_edicion_prestamos",{p_detalle:t})}catch(_){}};
const tpBack='<button type="button" class="ghost aback" data-tpv="menu">← Volver</button>';
const FIJOS=["disponible","disponibles","prestado","por limpiar","por devolver","vencidos","toda la cocina","sin tipo"];
const slug=n=>nq(n).replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||"estado";
const cntEst=k=>imp.filter(m=>m.estado===k).length,cntSt=e=>e.base?({todos:imp.length,disp:imp.filter(m=>m.estado==="disponible").length,pend:its.filter(i=>!i.devuelto).length,venc:its.filter(i=>late(i)).length,lim:imp.filter(m=>m.estado==="por_limpiar").length})[e.k]:cntEst(e.clave),cntTipo=t=>imp.filter(m=>tipoDe(m)===t).length;
const unid=q=>q+" unidad"+(q===1?"":"es");
const tpTipos=()=>tipos();
function tpRender(){
 const B=$("tpBody");if(!B)return;
 const [g,a]=tpV.split("-"),T=g==="t";
 $("tpT").textContent=tpV==="menu"?"Editar":TP_T[g]+": "+(a==="new"?"crear":a==="ord"?"orden":"eliminar");
 if(tpV==="menu"){
  B.innerHTML='<p class="small-note">¿Qué quieres editar?</p><div class="pick-grid">'+
   [["e","Estados","Además de Disponible, Por devolver y Por limpiar."],["t","Tipos de implementos","Como ollas, cubiertos, bandejas, etc."]].map(([k,l,h])=>
    `<div class="editor-card"><h3>${l}</h3><p class="small-note" style="margin:0">${h}</p><div class="pick"><button type="button" data-tpv="${k}-new">Crear</button><button type="button" class="ghost danger" data-tpv="${k}-del">Eliminar</button><button type="button" class="ghost" data-tpv="${k}-ord">Editar orden</button></div></div>`).join("")+'</div>';return}
 const falta=T?!tipTbl:!estTbl,nota=falta?`<p class="small-note">Para guardar ${T?"tipos nuevos y su orden":"los estados"} falta ejecutar <b>${T?"tipos_implemento":"estados_implemento"}.sql</b> en Supabase.${T?"":" Mientras tanto se muestran los estados por defecto."}</p>`:"";
 const L=a==="ord"&&!T?stateList():(T?tpTipos():estX),nom=x=>T?x:(x.label||x.nombre),cnt=x=>T?cntTipo(x):(x.k?cntSt(x):cntEst(x.clave));
 if(a==="new"){
  B.innerHTML=tpBack+nota+(T?`<form class="aform" id="tpNew" autocomplete="off"><label>Nombre del tipo<input name="nombre" required maxlength="40" placeholder="Ej. Ollas"></label><div><button type="submit">Crear tipo</button></div></form>`
   :`<form class="aform" id="eNew" autocomplete="off"><label>Nombre del estado<input name="nombre" required maxlength="40" placeholder="Ej. En préstamo externo"></label><div><button type="submit">Crear estado</button></div></form><p class="small-note">Un implemento en un estado creado aquí no se puede prestar hasta que lo pases a «Disponible» (botón Pasar, en Toda la cocina).</p>`);
 }else if(a==="del"&&!T){
  const SL=stateList(),last=SL.length<=1,off=BASEL.filter(x=>offB.has(x[0]));
  const val=x=>x.base?(x.k==="disp"?"disponible":x.k==="lim"?"por_limpiar":null):x.clave;
  const dests=[["disponible","Disponible"],["por_limpiar","Por limpiar"],...estX.map(y=>[y.clave,y.nombre])];
  B.innerHTML=tpBack+nota+SL.map(x=>{const v=val(x),q=v?cntEst(v):cntSt(x),n=x.base?x.k:estX.findIndex(y=>y.clave===x.clave),at=x.base?"bdel":"edel",sd=x.base?"bdst":"edst";
   return`<div class="arow"><span class="dtx"><b>${esc(x.label)}</b><small>${unid(q)}</small></span>${v&&q?`<select data-${sd}="${n}" aria-label="Pasar los implementos a">${dests.filter(d=>d[0]!==v).map(d=>`<option value="${esc(d[0])}">Pasar a: ${esc(d[1])}</option>`).join("")}</select>`:""}<button type="button" class="ghost danger" data-${at}="${n}"${last?" disabled":""}>Eliminar</button></div>`}).join("")
   +(off.length?`<h3 class="ztit">Estados eliminados</h3>`+off.map(x=>`<div class="arow"><span class="dtx"><b>${esc(x[1])}</b><small>Oculto en la lista de estados</small></span><button type="button" data-brest="${x[0]}">Restaurar</button></div>`).join(""):"")
   +'<p class="small-note">Los implementos del estado eliminado pasan al estado que elijas. Los estados base (Toda la cocina, Por devolver) solo se quitan de la lista y se pueden restaurar. Debe quedar al menos un estado.</p>';
 }else if(a==="del"){
  B.innerHTML=tpBack+nota+(L.length?L.map((x,n)=>{const q=cnt(x),sinD=T&&q>0&&L.length<2;return`<div class="arow"><span class="dtx"><b>${esc(nom(x))}</b><small>${unid(q)}</small></span>${q&&!sinD?`<select data-${T?"t":"e"}dst="${n}" aria-label="Pasar los implementos a">${T?L.filter(y=>y!==x).map(y=>`<option value="${esc(y)}">Pasar a: ${esc(y)}</option>`).join(""):'<option value="disponible">Pasar a: Disponible</option>'+L.filter(y=>y!==x).map(y=>`<option value="${esc(y.clave)}">Pasar a: ${esc(y.nombre)}</option>`).join("")}</select>`:sinD?'<small class="low">Crea otro tipo para pasar sus implementos antes de eliminarlo.</small>':""}<button type="button" class="ghost danger" data-${T?"t":"e"}del="${n}"${sinD?" disabled":""}>Eliminar</button></div>`}).join("")+`<p class="small-note">Los implementos del ${T?"tipo":"estado"} eliminado pasan al ${T?"tipo":"estado"} que elijas${T?"":" (por defecto, Disponible)"}.</p>`:`<p class="sub">No hay ${T?"tipos":"estados"} para eliminar.</p>`);
 }else if(a==="ord"){
  const st=$("adminBody");if(st&&st.querySelector("#ordList"))st.innerHTML="";
  B.innerHTML=tpBack+nota+'<p class="small-note">Arrastra con el ícono de mover para cambiar el orden. También puedes enfocarlo y usar las flechas ↑ ↓. El orden se aplica en todas las listas y opciones.</p><div id="ordList">'+L.map((x,n)=>`<div class="qrow ordrow" data-od="${n}"><span class="dgrip" tabindex="0" role="button" aria-label="Mover ${esc(nom(x))}. Usa las flechas arriba y abajo." title="Arrastra para ordenar">${ICON_MOVE}</span><div class="zone qsel"><b>${esc(nom(x))}</b><small>${unid(cnt(x))}</small></div></div>`).join("")+'</div>';return}
 const f=B.querySelector("input");if(f)f.focus();
}
function tpListo(texto,vista){if(vista)tpV=vista;tpRender();tpMsg("");const m=document.createElement("p");m.className="small-note ok";m.setAttribute("role","status");m.textContent=texto;$("tpBody").prepend(m);aviso(texto)}
async function tpRecargar(){await load();rAll()}
async function tpMoverTipo(de,a){
 const ids=imp.filter(m=>tipoDe(m)===de).map(m=>m.id);
 if(ids.length){const q=await SB.from("implementos").update({categoria:a}).in("id",ids).select("id");if(q.error)throw q.error;if(!q.data||q.data.length<ids.length)throw new Error("No se pudo guardar: sin permiso sobre implementos.")}
 if(dvc===de)dvc="*";if(pqTipo===de)pqTipo="*"}
const tpErr=(x,T)=>tpMsg(tpFalta(x)?`Falta crear o actualizar la tabla ${T?"tipos_implemento":"estados_implemento"} en Supabase (ejecuta ${T?"tipos_implemento":"estados_implemento"}.sql).`:(x.message||String(x)),1);
const filasT=L=>L.map((n,i)=>({nombre:n,orden:i+1})),filasE=L=>L.map((e,i)=>({clave:e.clave,nombre:e.nombre,orden:i+1}));
const filasS=L=>L.map((e,i)=>({clave:e.base?"sys:"+e.k:e.clave,nombre:e.label,orden:i+1}));
function tpOrdMove(de,a){
 const T=tpV==="t-ord",L=T?tpTipos():stateList();
 if(de===a||de<0||a<0||de>=L.length||a>=L.length)return false;
 const [x]=L.splice(de,1);L.splice(a,0,x);
 if(T){tipX=L.slice();tipRows=filasT(L)}else{sysOrd={};L.forEach((e,i)=>{if(e.base)sysOrd[e.k]=i+1});estX=L.map((e,i)=>e.base?null:{clave:e.clave,nombre:e.label,orden:i+1}).filter(Boolean);estSync()}
 rAll();tpRender();
 Promise.resolve(T?SB.from("tipos_implemento").upsert(filasT(L)):SB.from("estados_implemento").upsert(filasS(L))).then(r=>{if(r.error)throw r.error;return regEd("Orden de "+(T?"tipos de implementos":"estados")+" actualizado: "+(T?x:x.label)+" pasa al puesto "+(a+1)+".")}).catch(async x=>{await tpRecargar();tpRender();tpErr(x,T)});
 return true}
function tpOpen(){
 let m=$("tpModal");
 if(!m){m=document.createElement("div");m.id="tpModal";m.className="modal-backdrop";m.hidden=true;
  m.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="tpT" style="width:min(760px,100%)"><div class="modal-head"><h2 id="tpT">Editar</h2><button type="button" class="ghost" id="tpClose">Cerrar</button></div><div id="tpBody"></div><p id="tpMsg" class="admin-msg" role="alert"></p></section>';
  document.body.appendChild(m);
  const cerrar=()=>{m.hidden=true};
  $("tpClose").onclick=cerrar;bdClose(m,cerrar);
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!m.hidden)cerrar()});
  m.addEventListener("submit",async e=>{const id=e.target.id;if(id!=="tpNew"&&id!=="eNew")return;e.preventDefault();if(!esAdmin())return;
   const nom=e.target.elements.nombre.value.trim();if(!nom)return;tpMsg("");
   if(id==="tpNew"){
    if(tipos().some(t=>nq(t)===nq(nom))||nq(nom)==="sin tipo"){tpMsg("Ya existe un tipo con ese nombre.",1);return}
    try{const r=await SB.from("tipos_implemento").insert({nombre:nom,orden:tpTipos().length+1});if(r.error)throw r.error;await regEd("Tipo de implemento creado: "+nom+".");await tpRecargar();tpListo("Tipo «"+nom+"» creado.")}catch(x){tpErr(x,1)}return}
   const clave=slug(nom);
   if(FIJOS.includes(nq(nom))||estX.some(x=>nq(x.nombre)===nq(nom)||x.clave===clave)||E[clave]){tpMsg("Ya existe un estado con ese nombre.",1);return}
   try{const r=await SB.from("estados_implemento").insert({clave,nombre:nom,orden:stateList().length+1});if(r.error)throw r.error;await regEd("Estado creado: "+nom+".");await tpRecargar();tpListo("Estado «"+nom+"» creado.")}catch(x){tpErr(x,0)}});
  m.addEventListener("click",async e=>{const b=e.target.closest("[data-tpv],[data-tdel],[data-edel],[data-bdel],[data-brest]");if(!b||!esAdmin())return;
   if(b.dataset.tpv){tpV=b.dataset.tpv;tpMsg("");tpRender();return}
   tpMsg("");const row=b.closest(".arow");
   try{
    if(b.dataset.bdel){const k=b.dataset.bdel,e0=BASEL.find(a=>a[0]===k);if(!e0)return;
     if(stateList().length<=1){tpMsg("Debe quedar al menos un estado.",1);return}
     const v=k==="disp"?"disponible":k==="lim"?"por_limpiar":null,q=v?cntEst(v):0,sel=row.querySelector("[data-bdst]"),dest=sel?sel.value:"";
     if(!confirm(`¿Eliminar el estado «${e0[1]}»?`+(q?`\n${unid(q)} pasar${q===1?"á":"án"} a ${lbl(dest)}.`:"")))return;
     if(q){const m=await SB.rpc("eliminar_estado_implemento",{p_clave:v,p_destino:dest});if(m.error)throw m.error}
     const u=await SB.from("estados_implemento").upsert({clave:"off:"+k,nombre:e0[1],orden:0});if(u.error)throw u.error;
     await regEd("Estado eliminado: "+e0[1]+(q?". "+unid(q)+" pasaron a "+lbl(dest):"")+".");await tpRecargar();tpListo("Estado «"+e0[1]+"» eliminado."+(q?" "+unid(q)+" pasaron a "+lbl(dest)+".":""));return}
    if(b.dataset.brest){const k=b.dataset.brest,e0=BASEL.find(a=>a[0]===k);if(!e0)return;
     const d=await SB.from("estados_implemento").delete().eq("clave","off:"+k);if(d.error)throw d.error;
     await regEd("Estado restaurado: "+e0[1]+".");await tpRecargar();tpListo("Estado «"+e0[1]+"» restaurado.");return}
    if(b.dataset.tdel!==undefined){
     const viejo=tpTipos()[+b.dataset.tdel];if(viejo===undefined)return;
     const sel=row.querySelector("[data-tdst]"),dest=sel?sel.value:"",q=cntTipo(viejo);
     if(q&&!dest){tpMsg("Elige a qué tipo pasan los implementos.",1);return}
     if(!confirm(`¿Eliminar el tipo «${viejo}»?`+(q?`\n${unid(q)} pasar${q===1?"á":"án"} a «${dest}».`:"")))return;
     {const d=await SB.rpc("eliminar_tipo_implemento",{p_nombre:viejo,p_destino:dest||""});if(d.error)throw d.error}if(dvc===viejo)dvc="*";if(pqTipo===viejo)pqTipo="*";
     await regEd("Tipo de implemento eliminado: "+viejo+(q?". "+unid(q)+" pasaron a "+dest:"")+".");
     await tpRecargar();tpListo("Tipo «"+viejo+"» eliminado."+(q?" "+unid(q)+" pasaron a «"+dest+"».":""));return}
    if(b.dataset.edel!==undefined){
     const x=estX[+b.dataset.edel];if(!x)return;
     const sel=row.querySelector("[data-edst]"),dest=sel?sel.value:"disponible",q=cntEst(x.clave);
     if(!confirm(`¿Eliminar el estado «${x.nombre}»?`+(q?`\n${unid(q)} pasar${q===1?"á":"án"} a ${lbl(dest)}.`:"")))return;
     const d=await SB.rpc("eliminar_estado_implemento",{p_clave:x.clave,p_destino:dest});if(d.error)throw d.error;await regEd("Estado eliminado: "+x.nombre+(q?". "+unid(q)+" pasaron a "+lbl(dest):"")+".");
     
     
     if(dvf==="e:"+x.clave)dvf="todos";
     await tpRecargar();tpListo("Estado «"+x.nombre+"» eliminado."+(q?" "+unid(q)+" pasaron a "+lbl(dest)+".":""))}
   }catch(x){tpErr(x,tpV.startsWith("t"))}})}
 tpV="menu";tpMsg("");tpRender();m.hidden=false}
document.addEventListener("click",e=>{if(!on||!e.target.closest("#adminBtn"))return;e.stopImmediatePropagation();e.preventDefault();if(esAdmin())tpOpen()},true);
const codeNew=q=>{const ns=imp.map(x=>/^IMP-(\d+)$/i.exec(x.codigo)).filter(Boolean).map(x=>+x[1]),n=(ns.length?Math.max(...ns):0)+1;return Array.from({length:q},(_,k)=>"IMP-"+String(n+k).padStart(4,"0"))};
const gkey=m=>nq(String(m.nombre).trim());
const delPrio={por_limpiar:0,disponible:1};
function nMatch(){const q=nq($("nm").value.trim()),exact=q?imp.find(i=>gkey(i)===q):null,sug=q?[...new Set(imp.filter(i=>{const n=gkey(i);return n.includes(q)||q.includes(n)}).map(i=>i.nombre))].slice(0,6):[];return{q,exact,sug}}
function nUpd(){const f=$("nf");if(!f)return;
 $("nCancel").hidden=![...f.elements].some(e=>e.tagName==="INPUT"&&e.value!==e.defaultValue);
 const{q,exact,sug}=nMatch(),b=$("nSug");
 f.querySelectorAll("[data-new]").forEach(e=>e.hidden=!!exact);
 {const tl=f.querySelector("[data-tl]");if(tl)tl.hidden=!!exact&&!!exact.categoria}
 $("nBtn").textContent=exact?"Agregar unidades":"Crear implemento";
 if(!q){b.hidden=true;b.innerHTML="";return}
 b.hidden=false;
 const us=exact?imp.filter(x=>gkey(x)===q):[],di=us.filter(x=>x.estado==="disponible").length;
 b.innerHTML=(exact?`<span class="ok">Ya existe: <b>${esc(exact.nombre)}</b>, ${us.length} unidad${us.length===1?"":"es"} (${di} disponible${di===1?"":"s"}). Se suman unidades con los mismos datos.</span>`:"<span>No existe: se creará como implemento nuevo.</span>")+(!exact&&sug.length?`<span class="chips">Sugerencias:${sug.map(n=>`<button type="button" class="sg" data-nsug="${esc(n)}">${esc(n)}</button>`).join("")}</span>`:"")}
function renderPF(){const n=(dvf!=="todos")+(dvc!=="*")+(dord?1:0);
 $("pfBtn").innerHTML=SVGF+"Filtrar por"+(n?` <span class="fn">${n}</span>`:"");
 $("pfBtn").setAttribute("aria-expanded",String(fo));$("pfMenu").hidden=!fo;if(!fo)return;
 const so=(k,l,on)=>`<button type="button" class="fo${on?" on":""}" data-pfo="${k}" aria-pressed="${on}">${l}</button>`;
 $("pfMenu").innerHTML=so("est","Estado"+(dvf!=="todos"?": "+ESTL[dvf]:""),fsub==="est"||dvf!=="todos")
  +(fsub==="est"?`<select data-pfsel="est" aria-label="Elegir estado">${Object.entries(ESTL).map(([k,l])=>`<option value="${k}"${k===dvf?" selected":""}>${l}</option>`).join("")}</select>`:"")
  +so("tipo","Tipo de implemento"+(dvc!=="*"?": "+esc(tTit(dvc)):""),fsub==="tipo"||dvc!=="*")
  +(fsub==="tipo"?`<select data-pfsel="tipo" aria-label="Elegir tipo de implemento"><option value="*">Todos los tipos</option>${catsT().map(c=>`<option value="${esc(c)}"${c===dvc?" selected":""}>${esc(tTit(c))}</option>`).join("")}</select>`:"")
  +so("may","Mayor cantidad",dord==="may")+so("men","Menor cantidad",dord==="men")
  +(n?`<button type="button" class="fo clr" data-pfo="clr">Quitar filtros</button>`:"")}
const estSel=i=>`<span class="pchip${i.estado==="prestado"?" on":""}">${E[i.estado]||esc(i.estado)}</span>`;
const quienTiene=i=>{if(i.estado!=="prestado")return"";const it=its.find(x=>x.implemento_id===i.id&&!x.devuelto);if(!it)return"";const p=pre.find(x=>x.id===it.prestamo_id)||{};return`Con ${esc(p.nombre||"—")} · vence ${f(it.vence)}`};
const gnH=g=>`<input type="number" min="1" max="${Math.max(1,g.libres)}" step="1" value="1" inputmode="numeric" data-gn aria-label="Cantidad de unidades a pasar"${g.libres<1?" disabled":""}>`,
 gstH=(g,kk)=>`<div class="gst">${gnH(g)}<select data-gstt="${kk}" aria-label="Pasar unidades a otro estado"><option value="">Pasar a…</option>${stateList().filter(e=>e.k==="disp"||e.k==="lim"||!e.base).map(e=>e.k==="disp"?"disponible":e.k==="lim"?"por_limpiar":e.clave).map(k=>`<option value="${esc(k)}">${esc(lbl(k))}</option>`).join("")}</select></div>`;
const gcH=(g,kk)=>`<div class="gst">${gnH(g)}<select data-gcnd="${kk}" aria-label="Cambiar la condición de unidades"><option value="">Pasar a…</option><option value="bueno">Buena condición</option><option value="danado">Mala condición</option></select></div>`,
 cndRes=g=>`<div class="sku">Buena: ${g.bue} · <span${g.mal?' class="low"':""}>Mala: ${g.mal}</span></div>`;
async function gcndPasar(k,t,n){
 if(!esAdmin()||!t)return;
 const pri={por_limpiar:0,disponible:1},src=imp.filter(x=>gkey(x)===k&&x.estado!=="prestado"&&((t==="bueno")?x.condicion!=="bueno":(x.condicion||"bueno")==="bueno")).sort((a,b)=>(pri[a.estado]??3)-(pri[b.estado]??3)||a.id-b.id);
 if(!src.length){aviso(t==="bueno"?"No hay unidades en mala condición que pasar a buena (las prestadas no se pueden cambiar).":"No hay unidades en buena condición que pasar a mala (las prestadas no se pueden cambiar).","err");rAll();return}
 const ids=src.slice(0,Math.max(1,Math.floor(n)||1)).map(x=>x.id);
 try{const q=await SB.from("implementos").update({condicion:t}).in("id",ids).select("id");if(q.error)throw q.error;if(!q.data||!q.data.length)throw new Error("No se pudo actualizar: sin permiso.");await load();rAll();aviso(ids.length+" unidad"+(ids.length>1?"es":"")+" → "+(t==="bueno"?"buena":"mala")+" condición"+(n>ids.length?" (solo había "+ids.length+" para pasar)":"")+".")}catch(x){err(x);rAll()}
}
async function gstPasar(k,t,n){
 if(!esAdmin()||!t)return;
 const src=imp.filter(x=>gkey(x)===k&&x.estado!==t&&x.estado!=="prestado").sort((a,b)=>(a.estado==="disponible"?0:1)-(b.estado==="disponible"?0:1));
 if(!src.length){aviso("No hay unidades que pasar a ese estado (las prestadas no se pueden cambiar).","err");rAll();return}
 const ids=src.slice(0,Math.max(1,Math.floor(n)||1)).map(x=>x.id);
 try{const q=await SB.from("implementos").update({estado:t}).in("id",ids).select("id");if(q.error)throw q.error;if(!q.data||q.data.length<ids.length)throw new Error("No se pudo actualizar: sin permiso.");await load();rAll();aviso(ids.length+" unidad"+(ids.length>1?"es":"")+" → "+lbl(t)+(n>ids.length?" (solo había "+ids.length+" para pasar)":"")+".")}catch(x){err(x);rAll()}
}
const tipoSel=v=>`<select data-tipo aria-label="Tipo de implemento">${v?"":'<option value="" disabled selected>Elige un tipo</option>'}${tpTipos().map(t=>`<option${t===v?" selected":""}>${esc(t)}</option>`).join("")}</select>`;
function rInv(lista){
 const ed=esAdmin(),map=new Map();
 lista.forEach(({i})=>{const k=gkey(i);if(!map.has(k))map.set(k,[]);map.get(k).push(i)});
 const G=[...map.entries()].map(([k,u])=>{const all=imp.filter(x=>gkey(x)===k),c=e=>all.filter(x=>x.estado===e).length,m=all[0]||u[0],
  ven=all.filter(x=>x.estado==="prestado"&&its.some(t=>t.implemento_id===x.id&&late(t))).length,
  bue=all.filter(x=>(x.condicion||"bueno")==="bueno").length,mal=all.filter(x=>x.condicion==="danado").length,libres=all.filter(x=>x.estado!=="prestado").length;
  return{k,bue,mal,libres,n:m.nombre,t:tipoDe(m),acc:m.accesorios||"",val:m.valor||0,sh:u.length,tot:all.length,disp:c("disponible"),pres:c("prestado"),lim:c("por_limpiar"),oth:all.filter(x=>estX.some(s=>s.clave===x.estado)).length,ex:estX.map(s=>[s.nombre,c(s.clave)]).filter(a=>a[1]),ven}});
 const alfa=(a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"}),ordQ=(a,b)=>(dord==="may"?b.tot-a.tot:a.tot-b.tot)||alfa(a,b);
 if(!G.length)return`<p class="sub">${dq.trim()||dvc!=="*"?"Ningún implemento coincide con el filtro.":"Aún no hay implementos."+(ed?"":" Un admin puede crearlos.")}</p>`;
 const kk=g=>encodeURIComponent(g.k),
  res=g=>[g.disp?g.disp+" disponible"+(g.disp>1?"s":""):"",g.pres?g.pres+" por devolver":"",g.lim?g.lim+" por limpiar":"",...g.ex.map(a=>a[1]+" "+a[0].toLowerCase())].filter(Boolean).join(" · ")||"Sin unidades",
  al=g=>"",
  rb=g=>ed&&(g.oth)?`<button type="button" class="ghost" data-gdisp="${kk(g)}">Pasar ${g.oth} a disponible${g.oth>1?"s":""}</button>`:"";
 if(invLayout==="list")
  return`<div class="tbl"><table class="impt"><thead><tr><th>Implemento</th><th>Tipo de implemento</th><th>Estado</th><th>Condición</th><th>Detalles</th><th>Cantidad</th><th></th></tr></thead><tbody>`+
  G.sort(dord?ordQ:alfa).map(g=>`<tr data-g="${kk(g)}" class="${g.ven||g.per?"u":""}"><td class="nm"><b>${esc(g.n)}</b>${al(g)?`<div class="low">${al(g)}</div>`:""}</td>
   <td data-label="Tipo de implemento">${ed?tipoSel(g.t):esc(tTit(g.t))}</td>
   <td data-label="Estado">${ed?gstH(g,kk(g)):`<div class="sku">${res(g)}</div>`}</td>
   <td data-label="Condición">${cndRes(g)}${ed?gcH(g,kk(g)):""}</td>
   <td data-label="Detalles">${ed?`<input data-acc maxlength="200" value="${esc(g.acc)}" aria-label="Detalles" placeholder="Observaciones">`:esc(g.acc||"—")}</td>
   <td class="ed" data-label="Cantidad">${ed?`<input type="number" min="${g.tot}" step="1" data-cant value="${g.tot}" aria-label="Cantidad de ${esc(g.n)}">`:g.tot}</td>
   <td class="act" data-label="">${ed?`<button data-isave="${kk(g)}">Guardar</button>`:""}</td></tr>`).join("")+`</tbody></table></div>`;
 const grupos=dord?[[dord==="may"?"De mayor a menor cantidad":"De menor a mayor cantidad",G.slice().sort(ordQ)]]:catsT().map(c=>[tTit(c),G.filter(g=>g.t===c).sort(alfa)]);
 return grupos.map(([c,l])=>{if(!l.length)return"";
  return`<div class="cat"><h2>${esc(c)}<small>${l.length} implemento${l.length>1?"s":""}</small></h2><div class="cgrid">`+l.map(g=>
   `<div class="icard${g.per?" ns":""}" data-g="${kk(g)}"><div class="ihw"><div class="ihead"><div class="in"><b>${esc(g.n)}</b><div class="sku">${g.tot} unidad${g.tot===1?"":"es"}${al(g)?" · "+al(g):""}</div></div></div></div>
   ${ed?`<label class="fld">Tipo de implemento${tipoSel(g.t)}</label>
   <div class="fld">Estado${gstH(g,kk(g))}</div>
   <div class="fld">Condición${cndRes(g)}${gcH(g,kk(g))}</div>
   <label class="fld">Cantidad<input type="number" min="${g.tot}" step="1" data-cant value="${g.tot}"></label>
   <label class="fld">Detalles<input data-acc maxlength="200" value="${esc(g.acc)}" placeholder="Observaciones"></label>
   <button data-isave="${kk(g)}">Guardar</button>`:`<div class="sku">${res(g)}</div>${cndRes(g)}${g.acc?`<div class="sku">${esc(g.acc)}</div>`:""}`}</div>`).join("")+`</div></div>`}).join("")}
function build(){if(built)return;built=true;
 const mk=(id,h)=>{const s=document.createElement("section");s.id=id;s.hidden=true;s.innerHTML=h;$("v5").after(s)};
 mk("pv0",`<p class="sub" id="pwarn" hidden>Falta ejecutar supabase/prestamos.sql en Supabase.</p>
 <div class="qgrid pqgrid"><div class="qleft"><div class="qfilt" id="pqFilt"></div><div class="qside" id="pl"></div></div>
 <div class="pqmain"><div id="pMain"></div>
 <form class="pr-form" id="pf" autocomplete="off"><h3 class="pr-h">Datos de quien recibe</h3>
 <div class="pr-fields"><label class="f-full">Nombre completo<input id="pn" required maxlength="80"></label><div class="pr-row3 f-full"><label>Documento<input id="pd" required maxlength="20"></label><label>Teléfono<input id="pt" type="tel" maxlength="20"></label><label>Plazo (días)<input id="pz" type="number" min="1" max="60" step="1" value="1" required></label></div><label class="f-full">Notas<input id="po" maxlength="120" placeholder="Opcional"></label></div>
 <label class="pr-consent"><input id="pa" type="checkbox" required><span>La persona autoriza el tratamiento de sus datos (Ley 1581 de 2012) y acepta las condiciones del ticket.</span></label>
 <div class="pr-foot"><div id="psel" class="sub" aria-live="polite"></div><button type="submit">Prestar y generar ticket</button></div></form></div></div>
 <h2 class="qh2 m-h">Últimos préstamos</h2><button type="button" class="ghost m-only" id="pultOpen" style="width:100%">Últimos préstamos</button><ol class="mvl pev" id="pult"></ol>`);
 mk("pv1",`
 <div class="pr-pg"><aside class="pnl" aria-label="Filtros de devolución"><h2>Estado</h2><div id="pdf1"></div><h2 class="ztit">Tipos de implementos</h2><div id="pdf2"></div><h2 class="ztit">Últimas devoluciones</h2><ol class="mvl pev" id="pdf3"></ol></aside><div class="pr-main"><div id="nwrap" hidden><div class="sechead"><h2 class="m-h">Crear/Agregar implemento</h2><button type="button" class="m-only" id="pAddOpen">＋ Crear/Agregar implemento</button><button type="button" class="ghost danger" id="pDelBtn">Eliminar implementos</button></div><form class="add" id="nf" autocomplete="off"><label class="aname">Nombre<input id="nm" required maxlength="60" autocomplete="off"></label><label data-tl>Tipo de implemento<select id="ng" aria-label="Tipo de implemento"></select></label><label data-new>Detalles<input id="na" maxlength="200" placeholder="Observaciones"></label><label>Cantidad<input id="nq2" type="number" min="1" max="50" step="1" inputmode="numeric" value="1"></label><label>Condición<select id="nc" aria-label="Condición"><option value="bueno">Buena condición</option><option value="danado">Mala condición</option></select></label><div class="abtns"><button type="button" class="ghost" id="nCancel" hidden>Cancelar</button><button type="submit" id="nBtn">Crear implemento</button></div></form><div class="asug" id="nSug" aria-live="polite" hidden></div></div><div class="itool"><div class="tabs" id="ptabs"></div><span class="sub" id="pcount" hidden></span><div class="irt"><div class="fwrap"><button type="button" class="ghost fbtn" id="pfBtn" aria-haspopup="true" aria-expanded="false">Filtrar por</button><div class="fmenu" id="pfMenu" hidden></div></div><button type="button" class="vtog" id="pvtog" data-lay="1" role="switch" aria-checked="true" aria-label="Alternar vista del inventario entre lista y cuadrícula" title="Lista / Cuadrícula"><i class="knob"></i><svg class="ico il" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg><svg class="ico ig" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg></button></div></div><div id="pdev"></div></div></div>`);
 mk("pv3",`<h2>Préstamos en curso</h2><div id="pcur"></div>`);
 mk("pv4",`<h2>Movimientos de préstamos<span class="live" id="plive"></span></h2><div class="gctl"><div class="tabs" id="pgmode"></div><div class="tabs" id="pgper"></div><select id="pgsel" aria-label="Filtrar por implemento"></select></div><div class="chart-alt" id="pgtype"></div><div class="gsum" id="pgs"></div><div class="gbox" id="pgc"></div><h2>Más prestados</h2><div class="gbox" id="pgr"></div><h2 class="qh2">Últimos movimientos</h2><ol class="mvl pev" id="pgl"></ol>`);
 mk("pv5",`<div class="hhead"><h2>Movimientos de préstamos</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px"><button type="button" class="ghost danger" id="pHistG" hidden>Borrar movimientos generales</button><button type="button" class="ghost danger" id="pHistP" style="margin-left:auto" hidden>Borrar préstamos</button></div><div class="pr-grid"><div class="pr-col"><h3 class="pr-h">Movimientos generales</h3><ol class="mvl pev" id="pevg"></ol></div><div class="pr-col"><h3 class="pr-h">Préstamos</h3><ol class="mvl pev" id="pev"></ol></div></div>`);
 const enc=encodeURIComponent,dec=decodeURIComponent;
 const gpm=(e,d)=>{const k=dec(e),u=imp.filter(i=>i.estado==="disponible"&&gkey(i)===k);
  if(d>0){const x=u.find(i=>!sel.has(String(i.id)));if(x)sel.add(String(x.id))}else{const x=[...u].reverse().find(i=>sel.has(String(i.id)));if(x)sel.delete(String(x.id))}rPrestar(true)};
 const setQty=(e,n)=>{const u=imp.filter(i=>i.estado==="disponible"&&gkey(i)===dec(e));u.forEach(i=>sel.delete(String(i.id)));u.slice(0,Math.max(0,Math.min(u.length,n))).forEach(i=>sel.add(String(i.id)));rPrestar(true)};
const unitsC=(k,c)=>imp.filter(i=>i.estado==="disponible"&&gkey(i)===k&&((i.condicion==="danado")===(c==="danado")));
 const setQtyC=(e,c,n)=>{const u=unitsC(dec(e),c);u.forEach(i=>sel.delete(String(i.id)));u.slice(0,Math.max(0,Math.min(u.length,n))).forEach(i=>sel.add(String(i.id)));rPrestar(true)};
 const gpmC=(e,c,d)=>{const u=unitsC(dec(e),c);if(d>0){const x=u.find(i=>!sel.has(String(i.id)));if(x)sel.add(String(x.id))}else{const x=[...u].reverse().find(i=>sel.has(String(i.id)));if(x)sel.delete(String(x.id))}rPrestar(true)};
 $("pv0").addEventListener("click",e=>{
  if(e.target.closest("#pqfBtn")){pqFO=!pqFO;pqSub="";renderPQF();return}
  const fo2=e.target.closest("[data-pqfo]");if(fo2){const k=fo2.dataset.pqfo;if(k==="tipo"){pqSub=pqSub===k?"":k;renderPQF();return}if(k==="may"||k==="men")pqOrd=pqOrd===k?"":k;if(k==="clr"){pqTipo="*";pqOrd=""}pqFO=false;pqSub="";rPrestar(true);return}
  const m=e.target.closest("[data-pm]");if(m){gpm(m.dataset.pm,-1);return}
  const cm2=e.target.closest("[data-cm]");if(cm2){gpmC(cm2.dataset.cm,cm2.dataset.c,-1);return}const cp2=e.target.closest("[data-cp]");if(cp2){gpmC(cp2.dataset.cp,cp2.dataset.c,1);return}
  const pp=e.target.closest("[data-pp]");if(pp){gpm(pp.dataset.pp,1);return}
  const px=e.target.closest("[data-px]");if(px){setQty(px.dataset.px,0);return}
  if(e.target.closest("[data-pvac]")){sel.clear();rPrestar(true);return}
  const fs=e.target.closest("[data-pfs]");if(fs){pFind="";gpm(fs.dataset.pfs,1);const f2=$("pFind");if(f2)f2.focus();return}
  const g=e.target.closest("[data-pg]");if(g)gpm(g.dataset.pg,1)});
 $("pv0").addEventListener("change",e=>{const x=e.target.closest("[data-pqfsel]");if(x){pqTipo=x.value;pqFO=false;pqSub="";rPrestar(true);return}
  const cq=e.target.closest("[data-cqi]");if(cq){setQtyC(cq.dataset.cqi,cq.dataset.c,Math.floor(+cq.value)||0);return}const q=e.target.closest("[data-pqi]");if(q)setQty(q.dataset.pqi,Math.floor(+q.value)||0)});
 $("pv0").addEventListener("input",e=>{if(e.target.id==="pFind"){pFind=e.target.value;pFindUpd()}});
 $("pv0").addEventListener("keydown",e=>{
  if(e.target.id==="pFind"&&e.key==="Enter"){e.preventDefault();const l=pmatch(pFind).filter(g=>g.rem>0);if(l.length){pFind="";gpm(enc(l[0].k),1);const f2=$("pFind");if(f2)f2.focus()}else if(pFind.trim())aviso("No hay implementos disponibles que coincidan con «"+pFind.trim()+"».","err");return}
  if(e.key!=="Enter"&&e.key!==" ")return;const g=e.target.closest("[data-pg]");if(!g||e.target!==g)return;e.preventDefault();gpm(g.dataset.pg,1)});
 document.addEventListener("click",e=>{if(on&&pqFO&&e.target.isConnected&&!e.target.closest(".qfwrap")){pqFO=false;pqSub="";renderPQF()}});
 addEventListener("keydown",e=>{if(on&&e.key==="Escape"&&pqFO){pqFO=false;renderPQF();const b=$("pqfBtn");if(b)b.focus()}});
 let pd=null;
 document.addEventListener("pointerdown",e=>{if(!on||sec!==0)return;const row=e.target.closest(".qrow[data-pqd]");if(!row||e.button>0)return;
  if(e.pointerType!=="mouse"&&!e.target.closest(".dgrip"))return;const b=row.querySelector("button");if(!b||b.disabled)return;
  pd={k:row.dataset.pqd,x:e.clientX,y:e.clientY,on:false,ghost:null,id:e.pointerId}});
 addEventListener("pointermove",e=>{if(!pd||e.pointerId!==pd.id)return;
  if(!pd.on){if(Math.hypot(e.clientX-pd.x,e.clientY-pd.y)<6)return;const u=imp.find(i=>gkey(i)===dec(pd.k)),g=document.createElement("div");
   g.className="dghost";g.innerHTML=ICON_MOVE+"<span>"+esc(u?u.nombre:"")+"</span>";document.body.appendChild(g);pd.ghost=g;pd.on=true;document.body.classList.add("dragging")}
  pd.ghost.style.transform=`translate(${e.clientX+14}px,${e.clientY+14}px)`;
  const pl=$("pPlate");if(pl)pl.classList.toggle("over",sobrePlato(e,pl));
  if(e.clientY<70)scrollBy(0,-14);else if(e.clientY>innerHeight-70)scrollBy(0,14)});
 const finPd=(e,soltar)=>{if(!pd||e.pointerId!==pd.id)return;const d=pd;pd=null;if(!d.on)return;d.ghost.remove();document.body.classList.remove("dragging");noClick=Date.now()+350;
  const pl=$("pPlate");if(pl){pl.classList.remove("over");if(soltar&&sobrePlato(e,pl))gpm(d.k,1)}};
 addEventListener("pointerup",e=>finPd(e,true));addEventListener("pointercancel",e=>finPd(e,false));
 document.addEventListener("click",async e=>{const b=e.target.closest("[data-pdel],#pHistG,#pHistP");if(!b||!on||!esAdmin())return;
  try{let a;
   if(b.dataset.pdel){if(!confirm("¿Borrar este registro del historial?\nNo cambia el estado de los implementos."))return;a={p_id:+b.dataset.pdel,p_tipo:null}}
   else{const t=b.id==="pHistG"?"generales":b.id==="pHistP"?"prestamos":"todo",
     x={generales:"los movimientos generales (ediciones)",prestamos:"los préstamos y devoluciones del historial y los préstamos ya cerrados (también salen de los gráficos)",todo:"TODO el historial de préstamos (movimientos generales, préstamos y devoluciones) y los préstamos ya cerrados (también salen de los gráficos)"}[t];
    if(!confirm(`¿Borrar ${x}?\nSolo afecta a préstamos: no toca alimentos, el estado de los implementos ni los préstamos en curso. No se puede deshacer.`))return;a={p_id:null,p_tipo:t}}
   const r=await SB.rpc("borrar_historial_prestamos",a);if(r.error)throw r.error;
   await load();rAll();aviso("Historial actualizado.")}catch(x){err(x)}});
 $("pv4").addEventListener("click",e=>{const a=e.target.closest("[data-pgm]"),b=e.target.closest("[data-pgp]"),c=e.target.closest("[data-pgt]");
  if(a){pgm=a.dataset.pgm;pgi="*";rGraf()}else if(b){pgp=b.dataset.pgp;rGraf()}else if(c){pct=c.dataset.pgt;rGraf()}});
 $("pgsel").addEventListener("change",()=>{pgi=$("pgsel").value||"*";rGraf()});
 setInterval(()=>{if(on&&sec===4&&!document.hidden)rGraf()},15000);{let t=0;addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(()=>{if(on&&sec===4)rGraf()},150)})}
 $("pf").onsubmit=async e=>{e.preventDefault();const ids=[...sel].map(Number);if(!ids.length){aviso("Elige al menos un implemento.","err");return}
  const dias=Math.floor(+$("pz").value);if(!(dias>=1&&dias<=60)){aviso("El plazo debe ser de 1 a 60 días.","err");$("pz").focus();return}
  const base={p_nombre:$("pn").value,p_documento:$("pd").value,p_telefono:$("pt").value,p_ids:ids,p_notas:$("po").value};
  try{let r=await SB.rpc("crear_prestamo",{...base,p_dias:dias});
   if(r.error&&(r.error.code==="PGRST202"||/schema cache|could not find the function/i.test(r.error.message||""))){
    const u=await SB.from("implementos").update({dias_plazo:dias}).in("id",ids).select();if(u.error)throw u.error;if(!u.data||u.data.length<ids.length)throw new Error("No se pudo fijar el plazo: sin permiso sobre implementos.");
    r=await SB.rpc("crear_prestamo",base)}
   if(r.error)throw r.error;
   sel.clear();$("pf").reset();await load();rAll();pdf(r.data,its.filter(i=>i.prestamo_id===r.data.id));aviso("Préstamo "+r.data.numero+" registrado.")}catch(x){err(x)}};
 $("pv1").addEventListener("click",async e=>{
  if(e.target.closest("#pfBtn")){fo=!fo;fsub="";renderPF();return}
  if(e.target.closest("#pRecBtn")){rtOpen();return}
  const po=e.target.closest("[data-pfo]");if(po){const k=po.dataset.pfo;if(k==="est"||k==="tipo"){fsub=fsub===k?"":k;renderPF();return}if(k==="may"||k==="men")dord=dord===k?"":k;if(k==="clr"){dvf="todos";dvc="*";dord=""}fo=false;fsub="";rDevolver(true);return}
  const ns=e.target.closest("[data-nsug]");if(ns){$("nm").value=ns.dataset.nsug;nUpd();$("nq2").focus();return}
  const gd=e.target.closest("[data-gdisp]");if(gd){const k=decodeURIComponent(gd.dataset.gdisp),ids=imp.filter(x=>gkey(x)===k&&estX.some(s=>s.clave===x.estado)).map(x=>x.id);if(!ids.length)return;
   try{const q=await SB.from("implementos").update({estado:"disponible"}).in("id",ids).select();if(q.error)throw q.error;if(!q.data||!q.data.length)throw new Error("No se pudo actualizar: sin permiso.");await load();rAll();aviso(ids.length+" unidad"+(ids.length>1?"es":"")+" disponible"+(ids.length>1?"s":"")+".")}catch(x){err(x)}return}
  const sv=e.target.closest("[data-isave]");if(sv){const k=decodeURIComponent(sv.dataset.isave),r=sv.closest("[data-g]"),all=imp.filter(x=>gkey(x)===k);if(!all.length)return;
   const cant=Math.floor(+r.querySelector("[data-cant]").value);
   
   if(!(cant>=all.length)){aviso(`Aquí solo se puede agregar. Para quitar ${all[0].nombre} usa «Eliminar implementos».`);r.querySelector("[data-cant]").value=all.length;return}
   const tp=r.querySelector("[data-tipo]").value.trim();if(!tp){aviso("Elige un tipo para «"+all[0].nombre+"».","err");r.querySelector("[data-tipo]").focus();return}
   const o={categoria:tp,accesorios:r.querySelector("[data-acc]").value.trim()};
   try{const q=await SB.from("implementos").update(o).in("id",all.map(x=>x.id)).select();if(q.error)throw q.error;if(!q.data||!q.data.length)throw new Error("No se pudo guardar: sin permiso.");
    if(cant>all.length){const ex=codeNew(cant-all.length).map(c=>({codigo:c,nombre:all[0].nombre,...o,valor:all[0].valor||0,dias_plazo:1})),w=await SB.from("implementos").insert(ex);if(w.error)throw w.error}
    await load();rAll();aviso("Guardado: "+all[0].nombre+".")}catch(x){err(x)}return}
  const fl=e.target.closest("[data-pf]");if(fl){dvf=fl.dataset.pf;rDevolver(true);return}
  const ct=e.target.closest("[data-pc]");if(ct){dvc=ct.dataset.pc;rDevolver(true);return}
  const b=e.target.closest("[data-rec],[data-lim]");if(!b)return;
  try{const r=b.dataset.rec?await SB.rpc("registrar_devolucion",{p_item:+b.dataset.rec,p_condicion:b.closest("[data-row]").querySelector(".pc").value,p_limpio:b.closest("[data-row]").querySelector(".pl").checked,p_novedad:b.closest("[data-row]").querySelector(".pn2").value}):await SB.rpc("marcar_limpio",{p_id:+b.dataset.lim});
   if(r.error)throw r.error;await load();rAll()}catch(x){err(x)}});
 $("pv1").addEventListener("submit",async e=>{if(e.target.id!=="nf")return;e.preventDefault();if(!esAdmin())return;
  const n=$("nm").value.trim();if(!n)return;
  const{exact,sug}=nMatch(),q=Math.max(1,Math.min(50,Math.floor(+$("nq2").value||1)));let rows;
  const tp=exact&&exact.categoria?exact.categoria:$("ng").value.trim();
  if(!tp){aviso(tpTipos().length?"Elige el tipo del implemento.":"Primero crea un tipo en Editar → Tipos de implementos.","err");if(tpTipos().length){const bb=$("ng")._b;if(bb)bb.classList.add("falta");$("ng").focus()}return}
  if(exact){const cs=codeNew(q);rows=cs.map(c=>({codigo:c,nombre:exact.nombre,categoria:tp,accesorios:exact.accesorios||"",valor:exact.valor||0,dias_plazo:1,condicion:$("nc").value||"bueno"}))}
  else{if(sug.length&&!confirm(`«${n}» no existe. Hay implementos parecidos: ${sug.join(", ")}.\n¿Crear «${n}» como implemento nuevo?`))return;
   rows=codeNew(q).map(c=>({codigo:c,nombre:n,categoria:tp,accesorios:$("na").value.trim(),valor:0,dias_plazo:1,condicion:$("nc").value||"bueno"}))}
  try{const r=await SB.from("implementos").insert(rows);if(r.error)throw r.error;$("nf").reset();await load();rAll();nUpd();aviso(rows.length>1?rows.length+" unidades agregadas.":"Implemento "+(exact?"agregado":"creado")+": "+n+".")}catch(x){err(x)}});
 $("pv1").addEventListener("change",e=>{if(e.target.id==="ng"&&e.target._b)e.target._b.classList.remove("falta");const gc=e.target.closest("[data-gcnd]");if(gc){if(gc.value){const t=gc.value;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();gcndPasar(decodeURIComponent(gc.dataset.gcnd),t,+((gc.closest(".gst").querySelector("[data-gn]")||{}).value)||1)}return}const g=e.target.closest("[data-gstt]");if(g){if(g.value){const t=g.value;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();gstPasar(decodeURIComponent(g.dataset.gstt),t,+((g.closest(".gst").querySelector("[data-gn]")||{}).value)||1)}return}const x=e.target.closest("[data-pfsel]");if(!x)return;if(x.dataset.pfsel==="est")dvf=x.value;else dvc=x.value;fo=false;fsub="";rDevolver(true)});
 $("pv1").addEventListener("input",e=>{if(e.target.closest("#nf"))nUpd()});
 $("pv1").addEventListener("reset",e=>{if(e.target.id==="nf")setTimeout(nUpd)});
 const dm=document.createElement("div");dm.id="pdelModal";dm.className="modal-backdrop";dm.hidden=true;
 dm.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="pdelTitle" style="width:min(640px,100%)"><div class="modal-head"><h2 id="pdelTitle">Eliminar implementos</h2><button type="button" class="ghost" id="pcloseDel">Cerrar</button></div><p class="small-note">Indica cuántas unidades de cada implemento quieres borrar. No se puede deshacer. Las prestadas no se pueden eliminar.</p><input id="pdelFind" type="search" placeholder="Buscar implemento" aria-label="Buscar implemento" autocomplete="off" style="width:100%;margin:10px 0 12px"><div id="pdelList" class="dlist"></div><p id="pdelMsg" class="admin-msg" role="alert"></p><div class="editor-actions" style="justify-content:space-between;align-items:center"><span class="small-note" id="pdelCount"></span><button type="button" class="danger" id="pdelOk" disabled>Eliminar seleccionados</button></div></section>';
 document.body.appendChild(dm);
 const conHist=x=>its.some(t=>t.implemento_id===x.id),dGrp=()=>{const m=new Map();imp.forEach(i=>{const k=gkey(i);if(!m.has(k))m.set(k,{k,n:i.nombre,u:[]});m.get(k).u.push(i)});return[...m.values()].map(g=>({...g,ok:g.u.filter(x=>x.estado!=="prestado"&&true).length})).sort((a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"}))};
 const rDel=()=>{const k=nq($("pdelFind").value),l=dGrp().filter(g=>!k||nq(g.n).includes(k));
  $("pdelList").innerHTML=l.length?l.map(g=>`<div class="dli" style="cursor:default"><span class="dtx" style="flex:1 1 auto;min-width:0"><b>${esc(g.n)}</b><small>${g.u.length} unidad${g.u.length===1?"":"es"}${g.u.length-g.ok?" · "+(g.u.length-g.ok)+" prestada"+(g.u.length-g.ok>1?"s":""):""}</small></span><label class="fld" style="flex:none;gap:2px;align-items:flex-end">Eliminar<input type="number" min="0" max="${g.ok}" step="1" data-pdg="${encodeURIComponent(g.k)}" value="${dsel.get(g.k)||0}" ${g.ok?"":"disabled "}style="width:76px;height:auto;min-height:36px;padding:4px 8px" aria-label="Unidades de ${esc(g.n)} a eliminar"></label></div>`).join(""):'<p class="small-note">No hay implementos que coincidan.</p>';updDel()};
 const updDel=()=>{const n=[...dsel.values()].reduce((a,b)=>a+b,0);$("pdelCount").textContent=n?`${n} unidad${n>1?"es":""} a eliminar`:"Nada seleccionado";$("pdelOk").disabled=!n};
 const cDel=()=>{dm.hidden=true};
 $("pv1").addEventListener("click",e=>{if(!e.target.closest("#pDelBtn"))return;dsel.clear();$("pdelFind").value="";$("pdelMsg").textContent="";rDel();dm.hidden=false;$("pdelFind").focus()});
 $("pcloseDel").onclick=cDel;bdClose(dm,cDel);addEventListener("keydown",e=>{if(e.key==="Escape"&&!dm.hidden)cDel()});
 $("pdelFind").oninput=rDel;
 $("pdelList").addEventListener("input",e=>{const c=e.target.closest("[data-pdg]");if(!c)return;const k=decodeURIComponent(c.dataset.pdg),mx=+c.max||0,v=Math.max(0,Math.min(mx,Math.floor(+c.value)||0));v?dsel.set(k,v):dsel.delete(k);updDel()});
 $("pdelOk").onclick=async()=>{const G=dGrp(),pick=[];G.forEach(g=>{const n=dsel.get(g.k)||0;if(n)pick.push(...g.u.filter(x=>x.estado!=="prestado"&&true).sort((a,b)=>(delPrio[a.estado]??9)-(delPrio[b.estado]??9)||b.id-a.id).slice(0,n))});
  if(!pick.length)return;
  const res=G.filter(g=>dsel.get(g.k)).map(g=>dsel.get(g.k)+"× "+g.n).join(", ");
  const libres=pick;
  if(!confirm(`¿Eliminar ${pick.length} unidad${pick.length>1?"es":""}?\n${res}\n\nSe borran y no se puede deshacer.`))return;
  let borr=0;
  try{
   const r=await SB.from("implementos").delete().in("id",libres.map(i=>i.id)).select("id");
   if(r.error){if(/foreign|violates|referenc/i.test(r.error.message||""))throw new Error("Estas unidades tienen préstamos registrados. Ejecuta quitar_estados.sql en Supabase para poder eliminarlas.");throw r.error}
   borr=(r.data||[]).length;if(!borr)throw new Error("No se pudo eliminar: sin permiso.");
   dsel.clear();cDel();await load();rAll();nUpd();
   aviso(borr+" unidad"+(borr>1?"es":"")+" eliminada"+(borr>1?"s":"")+".")
  }catch(x){$("pdelMsg").textContent=x.message||String(x)}};
 document.addEventListener("click",e=>{const b=e.target.closest("[data-tkn]");if(!b)return;const p=pre.find(x=>x.numero===b.dataset.tkn);if(p)ticketDlg(p,its.filter(i=>i.prestamo_id===p.id))});
 $("pv3").addEventListener("click",e=>{const r=e.target.closest("[data-rcv]");if(r){rcOpen(r.dataset.rcv);return}const b=e.target.closest("[data-tk]");if(!b)return;const p=pre.find(x=>x.id==b.dataset.tk);if(p)pdf(p,its.filter(i=>i.prestamo_id===p.id))});
}
const tkb=e=>e&&e.numero&&pre.some(x=>x.numero===e.numero)?`<button type="button" class="ghost tkbtn" data-tkn="${esc(e.numero)}" title="Ver, imprimir o compartir el ticket">Ticket</button>`:"";
const hb=id=>esAdmin()&&id?`<button type="button" class="hdel" data-pdel="${id}" aria-label="Borrar este registro del historial" title="Borrar este registro">${ICON_TRASH}</button>`:"";
function pgroups(){const m=new Map();imp.filter(i=>i.estado==="disponible").forEach(i=>{const k=gkey(i);if(!m.has(k))m.set(k,[]);m.get(k).push(i)});
 return[...m.entries()].map(([k,u])=>{const c=u.filter(i=>sel.has(String(i.id))).length,um=u.filter(i=>i.condicion==="danado"),ub=u.length-um.length,cm=um.filter(i=>sel.has(String(i.id))).length;return{k,u,c,ub,um:um.length,cb:c-cm,cm,n:u[0].nombre,t:tipoDe(u[0]),acc:u[0].accesorios||"",rem:u.length-c,mal:u.filter(i=>i.condicion==="danado").length}})}
function pmatch(txt){const k=nq(txt.trim());if(!k)return[];const rank=g=>{const n=nq(g.n);return n===k?0:n.startsWith(k)?1:n.includes(k)?2:3};
 return pgroups().filter(g=>{const n=nq(g.n);return n.includes(k)||k.includes(n)}).sort((a,b)=>rank(a)-rank(b)||a.n.localeCompare(b.n,"es")).slice(0,6)}
function pFindUpd(){const b=$("pFindSug");if(!b)return;const q=nq(pFind.trim());b.hidden=!q;if(!q){b.innerHTML="";return}
 const l=pmatch(pFind);b.innerHTML=l.length?`<span class="chips">Sugerencias:${l.map(g=>`<button type="button" class="sg" data-pfs="${encodeURIComponent(g.k)}"${g.rem<=0?" disabled":""}>${esc(g.n)} <small>${g.rem} disp.</small></button>`).join("")}</span>`:`<span>No hay implementos disponibles que coincidan con «${esc(pFind.trim())}».</span>`}
function renderPQF(){const n=(pqTipo!=="*")+(pqOrd?1:0),b=$("pqFilt");if(!b)return;
 const so=(k,l,on2)=>`<button type="button" class="fo${on2?" on":""}" data-pqfo="${k}" aria-pressed="${on2}">${l}</button>`;
 b.innerHTML=`<div class="qfwrap"><button type="button" class="ghost fbtn" id="pqfBtn" aria-haspopup="true" aria-expanded="${pqFO}">${SVGF}Filtrar por${n?` <span class="fn">${n}</span>`:""}</button>`+
 (pqFO?`<div class="fmenu">`
  +so("tipo","Tipo de implemento"+(pqTipo!=="*"?": "+esc(pqTipo):""),pqSub==="tipo"||pqTipo!=="*")
  +(pqSub==="tipo"?`<select data-pqfsel="tipo" aria-label="Elegir tipo de implemento"><option value="*">Todos los tipos</option>${tipos().map(c=>`<option value="${esc(c)}"${c===pqTipo?" selected":""}>${esc(c)}</option>`).join("")}</select>`:"")
  +so("may","Mayor cantidad",pqOrd==="may")+so("men","Menor cantidad",pqOrd==="men")
  +(n?`<button type="button" class="fo clr" data-pqfo="clr">Quitar filtros</button>`:"")+`</div>`:"")+`</div>`}
const pqc=(e,g,c,l,mx,v)=>`<div class="pqg"><span>${l}</span><div class="pq"><button type="button" data-cm="${e}" data-c="${c}" aria-label="Menos ${l.toLowerCase()} de ${esc(g.n)}"${v<=0?" disabled":""}>−</button><input type="number" min="0" max="${mx}" step="1" inputmode="numeric" data-cqi="${e}" data-c="${c}" value="${v}" aria-label="Cantidad ${l.toLowerCase()} de ${esc(g.n)}"${mx<=0?" disabled":""}><button type="button" data-cp="${e}" data-c="${c}" aria-label="Más ${l.toLowerCase()} de ${esc(g.n)}"${v>=mx?" disabled":""}>+</button></div></div>`;
function rPrestar(force){$("pwarn").hidden=ok;
 const av=imp.filter(i=>i.estado==="disponible");sel.forEach(x=>{if(!av.some(i=>String(i.id)===x))sel.delete(x)});
 const all=pgroups(),q=nq(pqTxt.trim()),ab=(a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"});
 if(pqTipo!=="*"&&!all.some(g=>g.t===pqTipo))pqTipo="*";
 const oth={};imp.forEach(i=>{if(i.estado!=="disponible"){const k=gkey(i);(oth[k]=oth[k]||{})[i.estado]=((oth[k]||{})[i.estado]||0)+1}});
 const otx=k=>Object.entries(oth[k]||{}).map(([e,n])=>" · "+n+" "+String(E[e]||e).toLowerCase()).join("");
 const G=all.filter(g=>(pqTipo==="*"||g.t===pqTipo)&&(!q||nq(g.n+" "+g.t+" "+g.acc).includes(q))).sort(pqOrd?((a,b)=>(pqOrd==="may"?b.u.length-a.u.length:a.u.length-b.u.length)||ab(a,b)):ab);
 renderPQF();
 set("pl",'<h3>Implementos</h3><p class="sub pl-sum">'+av.length+' disponible'+(av.length===1?'':'s')+(sel.size?' · '+sel.size+' en el préstamo':'')+(imp.some(i=>i.estado==="prestado")?' · '+imp.filter(i=>i.estado==="prestado").length+' prestado'+(imp.filter(i=>i.estado==="prestado").length===1?'':'s'):'')+(imp.some(i=>i.estado!=="disponible"&&i.estado!=="prestado")?' · '+imp.filter(i=>i.estado!=="disponible"&&i.estado!=="prestado").length+' en otros estados':'')+'</p><div class="qscroll">'+(G.length?G.map(g=>{const e=encodeURIComponent(g.k);return`<div class="qrow" data-pqd="${e}"><span class="dgrip" title="Arrastra al préstamo" aria-hidden="true">${ICON_MOVE}</span><button type="button" class="zone qsel" data-pg="${e}"${g.rem<=0?" disabled":""}><b>${esc(g.n)}</b><small>${g.rem} disponible${g.rem===1?"":"s"}${otx(g.k)}${g.mal?" · "+g.mal+" en mala condición":""}${g.t?" · "+esc(g.t):""}</small></button></div>`}).join(""):`<p class="sub">${q||pqTipo!=="*"?"Ningún implemento coincide con los filtros.":"No hay implementos disponibles."}</p>`)+"</div>",true);
 const P=all.filter(g=>g.c>0).sort(ab),tot=P.reduce((a,g)=>a+g.c,0);
 let h=`<div class="plate" id="pPlate"><div class="plate-h"><h3>Implementos a prestar</h3><div class="plate-find"><input id="pFind" maxlength="40" autocomplete="off" placeholder="Buscar implemento" aria-label="Buscar implemento" value="${esc(pFind)}"></div></div><div class="asug" id="pFindSug" aria-live="polite" hidden></div>`;
 h+=P.length?P.map(g=>{const e=encodeURIComponent(g.k);return`<div class="prow"><div class="pn"><b>${esc(g.n)}</b><small>Quedan ${g.rem} disponible${g.rem===1?"":"s"}</small></div><div class="pqs">${pqc(e,g,"bueno","Buenas",g.ub,g.cb)}${pqc(e,g,"danado","Malas",g.um,g.cm)}</div><button type="button" class="ghost" data-px="${e}" aria-label="Sacar ${esc(g.n)} del préstamo">✕</button></div>`}).join(""):`<div class="pempty"><p><b>Suelta aquí los implementos del préstamo</b></p><p class="sub">Arrástralo desde la lista con el ícono de mover, o tócalo para agregarlo.</p></div>`;
 h+=`</div><div class="qfoot"><div class="qsum">${tot?`${tot} implemento${tot>1?"s":""} para prestar`:"Aún no hay implementos en el préstamo."}</div><div class="qbtns"><button type="button" class="ghost" data-pvac="1"${tot?"":" disabled"}>Vaciar</button></div></div>`;
 set("pMain",h,force);pFindUpd();
 $("psel").innerHTML=tot?`<b>${tot} seleccionado${tot===1?"":"s"}:</b> ${P.map(g=>g.c+"× "+esc(g.n)+(g.cm?` (${g.cb} buena${g.cb===1?"":"s"}, ${g.cm} mala${g.cm===1?"":"s"})`:"")).join(", ")}`:"Ningún implemento seleccionado";
 const L=evs.filter(e=>e.tipo==="prestamo").slice(0,8);
 set("pult",L.map(e=>mvLi({t:"Préstamo",c:"dn",chip:esc(e.numero||""),s:esc(e.detalle),d:f(e.t)+(e.apodo?" · "+esc(e.apodo):""),h:tkb(e)+hb(e.id)})).join("")||"<li>Sin préstamos todavía.</li>");
}
function rDevolver(force){
 const pend=its.filter(i=>!i.devuelto),venc=pend.filter(late),L=imp.filter(i=>i.estado==="por_limpiar"),D=imp.filter(i=>i.estado==="disponible");
 const cI=m=>(m&&m.categoria)||"",cIt=i=>cI(imp.find(x=>x.id===i.implemento_id));
 const bases={todos:imp.map(m=>({c:cI(m),i:m})),disp:D.map(m=>({c:cI(m),i:m})),pend:pend.map(i=>({c:cIt(i),i})),venc:venc.map(i=>({c:cIt(i),i})),lim:L.map(m=>({c:cI(m),i:m})),...Object.fromEntries(estX.map(x=>["e:"+x.clave,imp.filter(m=>m.estado===x.clave).map(m=>({c:cI(m),i:m}))]))},base=bases[dvf]||[];
 const cats=catsT();
 if(dvc!=="*"&&!cats.includes(dvc))dvc="*";
 const k=nq(dq.trim()),hit=x=>!k||nq(x.i.nombre+" "+(x.c||"")+" "+(x.i.accesorios||"")).includes(k);
 const lista=base.filter(x=>(dvc==="*"||x.c===dvc)&&hit(x)),pl=n=>n+" implemento"+(n===1?"":"s");
 set("ptabs",stateList().map(e=>{const n=(bases[e.k]||[]).filter(x=>dvc==="*"||x.c===dvc).length;return`<button type="button" class="tab ${e.k==="venc"&&n?"warn":""}" data-pf="${e.k}" aria-pressed="${dvf===e.k}"><b>${n}</b>${esc(e.label)}</button>`}).join(""),force);
 set("pdf1",stateList().map(e=>[e.k,e.label,e.base?({todos:imp.length,disp:D.length,pend:pend.length,venc:venc.length,lim:L.length})[e.k]:imp.filter(m=>m.estado===e.clave).length]).map(([k,t,n])=>`<button type="button" class="zone" data-pf="${k}" aria-pressed="${dvf===k}">${t}<small${k==="venc"&&n?' class="low"':""}>${pl(n)}</small></button>`).join(""),force);
 set("pdf2",[["*","Todos los tipos",base.length],...cats.map(c=>[c,tTit(c),base.filter(x=>x.c===c).length])].map(([k,t,n])=>`<button type="button" class="zone" data-pc="${esc(k)}" aria-pressed="${dvc===k}">${esc(t)}<small>${pl(n)}</small></button>`).join(""),force);
 set("pdf3",evs.filter(e=>e.tipo==="devolucion").slice(0,5).map(e=>mvLi({t:"Devolución",c:"up",chip:esc(e.numero||""),s:esc(e.detalle),d:f(e.t),h:tkb(e)+hb(e.id)})).join("")||"<li>Aún no hay devoluciones.</li>",force);
 const T=ESTL[dvf];
 let h=dvf==="pend"||dvf==="venc"?'<div class="sechead"><button type="button" class="secbtn" id="pRecBtn">Recibir todo de un ticket</button></div>':"";
 const nada=k||dvc!=="*";
 if(dvf==="pend"||dvf==="venc"||dvf==="lim"){
  const L2=lista.slice().sort((x,y)=>x.i.nombre.localeCompare(y.i.nombre,"es",{sensitivity:"base"})),lm=dvf==="lim",ly=invLayout==="list";
  const vacio=nada?"Ningún implemento coincide con el filtro.":lm?"Nada pendiente de limpieza.":"No hay implementos por devolver.";
  const quien=i=>{const r=pre.find(x=>x.id===i.prestamo_id)||{};return{r,v:late(i)}};
  const selC='<select class="pc" aria-label="Condición al recibir"><option value="bueno">Buena condición</option><option value="danado">Mala condición</option></select>';
  if(!L2.length)h+=`<p class="sub">${vacio}</p>`;
  else if(ly)h+=`<div class="tbl"><table class="impt"><thead><tr><th>Implemento</th><th>Tipo de implemento</th>`+(lm?`<th>Estado</th><th></th>`:`<th>Prestado a</th><th>Devolver antes de</th><th>Condición al recibir</th><th>Novedad</th><th>Limpio</th><th></th>`)+`</tr></thead><tbody>`+
   L2.map(({i,c})=>{const {r,v}=quien(i);
    return lm?`<tr class="u"><td class="nm"><b>${esc(i.nombre)}</b></td><td data-label="Tipo de implemento">${esc(c)}</td><td data-label="Estado"><span class="pchip">Por limpiar</span></td><td class="act" data-label=""><button type="button" data-lim="${i.id}">Marcar limpio</button></td></tr>`
    :`<tr data-row class="${v?"u":""}"><td class="nm"><b>${esc(i.nombre)}</b></td><td data-label="Tipo de implemento">${esc(c)}</td><td data-label="Prestado a"><b>${esc(r.nombre||"")}</b><div class="sku">${esc(r.numero||"")}${r.documento?" · "+esc(r.documento):""}${r.telefono?" · "+esc(r.telefono):""}</div></td><td data-label="Devolver antes de"><span class="rdue${v?" late":""}">${f(i.vence)}</span></td><td data-label="Condición al recibir">${selC}<div class="sku">Salió: ${esc(condTxt(i.cond_salida)||"—")}</div></td><td data-label="Novedad"><input class="pn2" maxlength="120" placeholder="Opcional" aria-label="Novedad"></td><td data-label="Limpio"><label class="pr-check"><input class="pl" type="checkbox" checked aria-label="Limpio"></label></td><td class="act" data-label=""><button type="button" data-rec="${i.id}">Recibir</button></td></tr>`}).join("")+`</tbody></table></div>`;
  else h+=catsT().map(t=>{const G=L2.filter(x=>x.c===t);if(!G.length)return"";
   return`<div class="cat"><h2>${esc(tTit(t))}<small>${pl(G.length)}</small></h2><div class="cgrid">`+G.map(({i})=>{const {r,v}=quien(i);
    return lm?`<div class="icard rcard"><div class="rtop"><b>${esc(i.nombre)}</b><span class="pchip">Por limpiar</span></div><button type="button" data-lim="${i.id}">Marcar limpio</button></div>`
    :`<div class="icard rcard${v?" ns":""}" data-row><div class="rtop"><b>${esc(i.nombre)}</b></div><span class="sku">${esc(r.numero||"")}</span><div class="rwho"><b>${esc(r.nombre||"")}</b>${r.documento?`<span class="sku">${esc(r.documento)}${r.telefono?" · "+esc(r.telefono):""}</span>`:""}</div><div class="rdue${v?" late":""}">Devolver antes de ${f(i.vence)}</div><label class="fld">Condición al recibir${selC}</label><div class="sku">Salió: ${esc(condTxt(i.cond_salida)||"—")}</div><label class="fld">Novedad<input class="pn2" maxlength="120" placeholder="Opcional"></label><label class="pr-check"><input class="pl" type="checkbox" checked><span>Limpio</span></label><button type="button" data-rec="${i.id}">Recibir</button></div>`}).join("")+`</div></div>`}).join("");
 }
 else h+=rInv(lista);
 set("pdev",h,force);
 $("nwrap").hidden=!esAdmin();
 {const sg=$("ng"),t=tpTipos(),k2=t.join("|");if(sg&&sg.dataset.k!==k2){const v=sg.value;sg.dataset.k=k2;sg.innerHTML='<option value="" disabled selected>'+(t.length?"Elige un tipo":"Primero crea un tipo (Editar)")+'</option>'+t.map(x=>`<option>${esc(x)}</option>`).join("");if(t.includes(v))sg.value=v}}
 $("pcount").textContent="";const g=invLayout==="grid";$("pvtog").classList.toggle("grid",g);$("pvtog").setAttribute("aria-checked",String(g));
 renderPF();nUpd()}
let rtQ="";
function rtClose(){const m=$("rtModal");if(m)m.hidden=true}
function rtList(){
 const k=nq(rtQ.trim()),
  a=pre.filter(p=>p.estado==="activo").map(p=>{const pe=its.filter(i=>i.prestamo_id===p.id&&!i.devuelto);return{p,n:pe.length,v:pe.some(late),m:pe.reduce((x,i)=>Math.min(x,Date.parse(i.vence)||1e15),1e15)}}).filter(o=>o.n&&(!k||nq(o.p.nombre+" "+o.p.numero+" "+(o.p.documento||"")).includes(k))).sort((x,y)=>x.m-y.m);
 $("rtL").innerHTML=a.length?a.map(({p,n,v})=>`<button type="button" class="zone" data-rtp="${p.id}"><b>${esc(p.nombre)}</b><small${v?' class="low"':""}>${esc(p.numero)} · ${n} por devolver</small></button>`).join(""):`<p class="small-note">${k?"Ningún préstamo coincide con la búsqueda.":"No hay préstamos con implementos por devolver."}</p>`}
function rtOpen(){
 let m=$("rtModal");
 if(!m){m=document.createElement("div");m.id="rtModal";m.className="modal-backdrop";m.hidden=true;
  m.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="rtT" style="width:min(520px,100%)"><div class="modal-head"><h2 id="rtT">¿Qué préstamo devuelven?</h2><button type="button" class="ghost" id="rtX">Cerrar</button></div><input id="rtF" type="search" placeholder="Buscar por nombre, ticket o documento" aria-label="Buscar préstamo" autocomplete="off" style="width:100%;margin:6px 0 12px"><div id="rtL" class="rtl"></div></section>';
  document.body.appendChild(m);bdClose(m,rtClose);$("rtX").onclick=rtClose;
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!m.hidden)rtClose()});
  $("rtF").addEventListener("input",()=>{rtQ=$("rtF").value;rtList()});
  $("rtL").addEventListener("click",e=>{const b=e.target.closest("[data-rtp]");if(!b)return;const id=b.dataset.rtp;rtClose();rcOpen(id)})}
 rtQ="";$("rtF").value="";rtList();m.hidden=false;$("rtF").focus()}
function rcClose(){const m=$("rcModal");if(m)m.hidden=true}
function rcOpen(pid){
 const p=pre.find(x=>x.id==pid);if(!p)return;
 const pe=its.filter(i=>i.prestamo_id===p.id&&!i.devuelto);if(!pe.length){aviso("Este préstamo no tiene implementos pendientes.");return}
 let m=$("rcModal");
 if(!m){m=document.createElement("div");m.id="rcModal";m.className="modal-backdrop";m.hidden=true;
  m.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="rcT" style="width:min(720px,100%)"><div class="modal-head"><h2 id="rcT"></h2><button type="button" class="ghost" id="rcX">Cerrar</button></div><div id="rcB"></div><p id="rcM" class="admin-msg" role="alert"></p><div class="editor-actions"><button type="button" id="rcOk">Recibir seleccionados</button></div></section>';
  document.body.appendChild(m);bdClose(m,rcClose);$("rcX").onclick=rcClose;
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!m.hidden)rcClose()});
  $("rcOk").onclick=async()=>{const rows=[...document.querySelectorAll("#rcB [data-ri]")].filter(r=>r.querySelector(".rk").checked);
   if(!rows.length){$("rcM").textContent="Marca al menos un implemento.";return}
   $("rcOk").disabled=true;let n=0;
   try{for(const r of rows){const q=await SB.rpc("registrar_devolucion",{p_item:+r.dataset.ri,p_condicion:r.querySelector(".rc").value,p_limpio:r.querySelector(".rl").checked,p_novedad:r.querySelector(".rn").value});if(q.error)throw q.error;n++}
    rcClose();await load();rAll();aviso(n+" implemento"+(n>1?"s":"")+" recibido"+(n>1?"s":"")+".")}
   catch(x){$("rcM").textContent=(n?n+" recibido(s) antes del error. ":"")+(x.message||String(x));await load();rAll()}
   finally{$("rcOk").disabled=false}}}
 $("rcT").textContent="Recibir devolución · "+p.numero;
 $("rcB").innerHTML=`<p class="small-note">${esc(p.nombre)}${p.documento?" · "+esc(p.documento):""}. Marca lo que devuelve ahora.</p>`+pe.map(i=>`<div class="arow" data-ri="${i.id}"><label class="pr-check" style="flex:1 1 180px"><input class="rk" type="checkbox" checked><span><b>${esc(i.nombre)}</b><br><small class="sku">Devolver antes de ${f(i.vence)}</small></span></label><select class="rc" aria-label="Condición al recibir"><option value="bueno">Buena condición</option><option value="danado">Mala condición</option></select><label class="pr-check"><input class="rl" type="checkbox" checked><span>Limpio</span></label><input class="rn" maxlength="120" placeholder="Novedad" aria-label="Novedad" style="flex:1 1 160px"></div>`).join("");
 $("rcM").textContent="";m.hidden=false}
const condTxt=c=>({bueno:"Buena condición",danado:"Mala condición",perdido:"Perdido"})[c]||(c?String(c).charAt(0).toUpperCase()+String(c).slice(1):"");
function pendH(pe){const g=[],m=new Map();
 pe.forEach(i=>{const k=String(i.nombre||"").trim().toLowerCase()+"¦"+(i.cond_salida||"");if(!m.has(k)){const o={i,n:0};m.set(k,o);g.push(o)}m.get(k).n++});
 const rep=new Map();g.forEach(o=>{const k=String(o.i.nombre||"").trim().toLowerCase();rep.set(k,(rep.get(k)||0)+1)});
 return'<div class="pend">'+g.map(({i,n})=>{const k=String(i.nombre||"").trim().toLowerCase(),c=i.cond_salida||"";
  return`<div class="pendr"><span>${esc(i.nombre)}</span><b>× ${n}</b>${c&&(c!=="bueno"||rep.get(k)>1)?`<small class="pchip${c==="bueno"?"":" late"}">${esc(condTxt(c))}</small>`:""}</div>`}).join("")+"</div>"}
function rCurso(){
 const a=pre.filter(p=>p.estado==="activo").map(p=>{const pe=its.filter(i=>i.prestamo_id===p.id&&!i.devuelto);return{p,pe,m:pe.reduce((x,i)=>Math.min(x,Date.parse(i.vence)),1e15)}}).sort((x,y)=>x.m-y.m);
 set("pcur",'<div class="tbl"><table class="pcurt"><thead><tr><th>Préstamo</th><th>Prestatario</th><th>Documento</th><th>Teléfono</th><th>Pendiente</th><th>Devolver antes de</th><th>Estado</th><th></th></tr></thead><tbody>'+(a.length?a.map(({p,pe,m})=>{const v=pe.some(late);return`<tr class="${v?"ns u":""}"><td class="nm"><b>${esc(p.numero)}</b></td><td data-label="Prestatario">${esc(p.nombre)}</td><td data-label="Documento">${esc(p.documento)}</td><td data-label="Teléfono">${esc(p.telefono||"—")}</td><td data-label="Pendiente">${pendH(pe)}</td><td data-label="Devolver antes de"${v?' class="low"':""}>${f(m)}</td><td data-label="Estado"><span class="pchip on">Por devolver</span></td><td class="act" data-label=""><button type="button" data-rcv="${p.id}">Recibir</button> <button type="button" class="ghost" data-tk="${p.id}">Ticket</button></td></tr>`}).join(""):'<tr><td colspan="8">No hay préstamos en curso.</td></tr>')+'</tbody></table></div>')}
function rMov(){
 const row=e=>mvLi({t:e.tipo==="prestamo"?"Préstamo":e.tipo==="edicion"?"Edición":"Devolución",c:e.tipo==="prestamo"?"dn":e.tipo==="edicion"?"":"up",chip:e.tipo==="edicion"?"Editar":esc(e.numero||""),s:esc(e.detalle),d:f(e.t)+(e.apodo?" · "+esc(e.apodo):""),h:tkb(e)+hb(e.id)});
 set("pevg",evs.filter(e=>e.tipo==="edicion").map(row).join("")||"<li>Sin movimientos generales todavía.</li>");
 set("pev",evs.filter(e=>e.tipo!=="edicion").map(row).join("")||"<li>Sin préstamos ni devoluciones todavía.</li>");
 $("pHistG").hidden=!(esAdmin()&&evs.some(e=>e.tipo==="edicion"));$("pHistP").hidden=!(esAdmin()&&(evs.some(e=>e.tipo!=="edicion")||its.some(i=>i.devuelto)))}
const pmov=()=>{const R=[],tk=i=>{const m=imp.find(x=>x.id===i.implemento_id);return m?tipoDe(m):""};
 its.forEach(i=>{const p=pre.find(x=>x.id===i.prestamo_id)||{},t=Date.parse(p.salida),b={n:i.nombre,k:tk(i),w:p.nombre||"",num:p.numero||""};
  if(t)R.push({...b,t,d:-1});const t2=i.devuelto?Date.parse(i.devuelto):0;if(t2)R.push({...b,t:t2,d:1})});return R};
function pbucks(){const s0=new Date();s0.setHours(0,0,0,0);const b=[];
 if(pgp==="d")for(let h=0;h<24;h++)b.push({a:+s0+h*36e5,e:+s0+(h+1)*36e5,l:h%3?"":String(h),n:fecha(s0)+" "+String(h).padStart(2,"0")+":00"});
 else{const n=pgp==="s"?7:30;for(let k=n-1;k>=0;k--){const a=new Date(s0);a.setDate(a.getDate()-k);const e=new Date(a);e.setDate(e.getDate()+1);
  b.push({a:+a,e:+e,l:pgp==="s"?a.toLocaleDateString("es",{weekday:"short"}).replace(".",""):(k%5?"":String(a.getDate())),n:fecha(a)})}}
 return b}
function rGraf(){if(!on||sec!==4)return;
 $("pgmode").innerHTML=[["i","Por implemento"],["t","Por tipo de implemento"]].map(([k,l])=>`<button type="button" class="tab" data-pgm="${k}" aria-pressed="${pgm===k}">${l}</button>`).join("");
 $("pgper").innerHTML=[["d","Hoy"],["s","7 días"],["m","30 días"]].map(([k,l])=>`<button type="button" class="tab" data-pgp="${k}" aria-pressed="${pgp===k}">${l}</button>`).join("");
 $("pgtype").innerHTML=[["bars","Barras"],["balance","Balance acumulado"]].map(([k,l])=>`<button type="button" class="tab" data-pgt="${k}" aria-pressed="${pct===k}">${l}</button>`).join("");
 const se=$("pgsel"),ops=pgm==="t"?tipos():[...new Set([...imp.map(i=>i.nombre),...its.map(i=>i.nombre)])].sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"})),key=pgm+"|"+ops.join("|");
 if(se.dataset.k!==key){se.dataset.k=key;se.setAttribute("aria-label",pgm==="t"?"Filtrar por tipo de implemento":"Filtrar por implemento");
  se.innerHTML=`<option value="*">${pgm==="t"?"Todos los tipos de implemento":"Todos los implementos"}</option>`+ops.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("");
  se.value=ops.includes(pgi)?pgi:"*"}
 pgi=se.value||"*";if(se._b)pintarSel(se);
 const B=pbucks(),M=pmov().filter(m=>(pgi==="*"||(pgm==="t"?m.k===pgi:m.n===pgi))&&m.t>=B[0].a&&m.t<B[B.length-1].e);
 let ti=0,to=0;B.forEach(b=>{b.i=0;b.o=0;b.net=0});
 M.forEach(m=>{const b=B.find(b=>m.t>=b.a&&m.t<b.e);if(!b)return;if(m.d>0){b.i+=m.d;ti+=m.d}else{b.o-=m.d;to-=m.d}b.net+=m.d});
 const W=Math.max(280,$("pgc").clientWidth-24),H=260,L=42,T=12,Bt=30,pw=W-L-8,ph=H-T-Bt;
 let max=Math.max(1,...B.map(b=>Math.max(b.i,b.o,Math.abs(b.net))));
 let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de movimientos de préstamos">`;
 if(pct==="bars"){const y0=T+ph/2,sc=(ph/2-4)/max,bw=pw/B.length;
  g+=`<line x1="${L}" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--rule)"/><text x="2" y="${T+10}">+${fm(max)}</text><text x="2" y="${y0+4}">0</text><text x="2" y="${H-Bt-2}">−${fm(max)}</text>`;
  B.forEach((b,k)=>{const x=L+k*bw,w=Math.max(2,bw-(B.length>20?2:6));
   g+=`<g><title>${b.n}: +${fm(b.i)} / −${fm(b.o)}</title>${b.i?`<rect x="${x+1}" y="${y0-b.i*sc}" width="${w}" height="${b.i*sc}" rx="3" fill="var(--gchart)"/>`:""}${b.o?`<rect x="${x+1}" y="${y0}" width="${w}" height="${b.o*sc}" rx="3" fill="var(--alert-t)"/>`:""}${b.l?`<text x="${x+bw/2}" y="${H-7}" text-anchor="middle">${b.l}</text>`:""}</g>`})}
 else{let acc=0;const vals=B.map(b=>{acc+=b.net;return acc});max=Math.max(1,...vals.map(v=>Math.abs(v)));
  const xs=B.length===1?0:pw/(B.length-1),y0=T+ph/2,sc=(ph/2-8)/max;
  g+=`<line x1="${L}" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--rule)"/><text x="2" y="${T+10}">+${fm(max)}</text><text x="2" y="${y0+4}">0</text><text x="2" y="${H-Bt-2}">−${fm(max)}</text>`;
  g+=`<polyline points="${vals.map((v,k)=>`${L+k*xs},${y0-v*sc}`).join(" ")}" fill="none" stroke="var(--gchart)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  vals.forEach((v,k)=>g+=`<circle cx="${L+k*xs}" cy="${y0-v*sc}" r="3.5" fill="var(--gchart)"><title>${B[k].n}: ${fm(v)}</title></circle>`);
  B.forEach((b,k)=>{if(b.l)g+=`<text x="${L+k*xs}" y="${H-7}" text-anchor="middle">${b.l}</text>`})}
 $("pgc").innerHTML=g+"</svg>";
 const ac=its.filter(i=>!i.devuelto);
 $("pgs").innerHTML=`<span class="chip">Se devolvió: +${fm(ti)}</span><span class="chip bad">Se prestó: −${fm(to)}</span><span class="chip">${M.length} movimientos</span>`
  +`<span class="sku">Ahora: ${imp.filter(i=>i.estado==="disponible").length} disponibles · ${ac.length} prestados · ${imp.filter(i=>i.estado==="por_limpiar").length} por limpiar</span>`
  +(pgm==="t"&&pgi==="*"?tipos().map(c=>{let a=0,o=0;M.forEach(m=>{if(m.k===c){m.d>0?a+=m.d:o-=m.d}});return a||o?`<span class="chip">${esc(c)}: +${fm(a)} / −${fm(o)}</span>`:""}).join(""):"");
 $("plive").textContent=`En vivo, actualizado ${hora()}`;
 const R=M.slice().sort((a,b)=>b.t-a.t).slice(0,10);
 $("pgl").innerHTML=R.length?R.map(m=>mvLi({t:esc(m.n),c:m.d>0?"up":"dn",chip:m.d>0?"Se devolvió +1":"Se prestó −1",s:(m.w?esc(m.w)+(m.num?" · ":""):"")+esc(m.num),d:f(m.t)})).join(""):"<li>No hay movimientos en este período. Aparecen cuando prestas o recibes implementos.</li>";
 const c={};its.forEach(i=>c[i.nombre]=(c[i.nombre]||0)+1);const t=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10),mx=t.length?t[0][1]:1;
 $("pgr").innerHTML=t.length?t.map(([n,v])=>`<div style="display:flex;gap:10px;align-items:center;margin:6px 0"><span style="flex:0 0 150px;min-width:0;overflow-wrap:anywhere">${esc(n)}</span><i style="display:block;height:14px;border-radius:7px;background:var(--gchart);width:${Math.max(2,Math.round(v/mx*100))}%;max-width:calc(100% - 200px)"></i><b>${v}</b></div>`).join(""):'<p class="sub">Aún no hay préstamos.</p>'}

/* ---- Exportar a Excel (modo préstamos): mismas secciones que la pantalla ---- */
function datosExport(){
 const Hj=(name,h,r)=>({name,h,r}),ab=(a,b)=>String(a).localeCompare(String(b),"es",{sensitivity:"base"}),cI=m=>(m&&m.categoria)||"",k=nq(dq.trim());
 const impDe=i=>imp.find(x=>x.id===i.implemento_id)||{};
 const tpOk=c=>dvc==="*"||c===dvc;
 if(sec===0){const q=nq(pqTxt.trim()),all=pgroups();
  const G=all.filter(g=>(pqTipo==="*"||g.t===pqTipo)&&(!q||nq(g.n+" "+g.t+" "+g.acc).includes(q))).sort((a,b)=>pqOrd?((pqOrd==="may"?b.u.length-a.u.length:a.u.length-b.u.length)||ab(a.n,b.n)):ab(a.n,b.n));
  return{slug:"prestar",hojas:[
   Hj("Implementos disponibles",["Implemento","Tipo","Disponibles","Buenas","Malas","En el préstamo"],G.map(g=>[g.n,g.t,g.u.length,g.ub,g.um,g.c])),
   Hj("Préstamo en armado",["Implemento","Tipo","Buenas","Malas","Total"],all.filter(g=>g.c>0).sort((a,b)=>ab(a.n,b.n)).map(g=>[g.n,g.t,g.cb,g.cm,g.c])),
   Hj("Últimos préstamos",["Fecha y hora","Número","Detalle","Por"],evs.filter(e=>e.tipo==="prestamo").slice(0,10).map(e=>[f(e.t),e.numero||"",e.detalle||"",e.apodo||""]))]}}
 if(sec===1){let H1;
  if(dvf==="pend"||dvf==="venc"){
   const R=its.filter(i=>!i.devuelto&&(dvf==="pend"||late(i))).map(i=>({i,m:impDe(i)})).filter(({i,m})=>tpOk(cI(m))&&(!k||nq(i.nombre+" "+cI(m)+" "+(m.accesorios||"")).includes(k))).sort((x,y)=>ab(x.i.nombre,y.i.nombre));
   H1=Hj(ESTL[dvf]||"Por devolver",["Implemento","Tipo","Préstamo","Prestado a","Documento","Teléfono","Devolver antes de","Condición al salir","Estado"],R.map(({i,m})=>{const r=pre.find(x=>x.id===i.prestamo_id)||{};return[i.nombre,cI(m),r.numero||"",r.nombre||"",r.documento||"",r.telefono||"",f(i.vence),condTxt(i.cond_salida),late(i)?"Vencido":"Por devolver"]}))}
  else{const cl=dvf.startsWith("e:")?dvf.slice(2):"";
   const L=imp.filter(m=>dvf==="todos"||(dvf==="disp"&&m.estado==="disponible")||(dvf==="lim"&&m.estado==="por_limpiar")||(cl&&m.estado===cl)).filter(m=>tpOk(cI(m))&&(!k||nq(m.nombre+" "+cI(m)+" "+(m.accesorios||"")).includes(k))).sort((a,b)=>ab(a.nombre,b.nombre));
   H1=Hj(ESTL[dvf]||"Implementos",["Implemento","Tipo","Estado","Condición","Accesorios"],L.map(m=>[m.nombre,cI(m),lbl(m.estado),condTxt(m.condicion),m.accesorios||""]))}
  return{slug:"devolver",hojas:[H1,
   Hj("Últimas devoluciones",["Fecha y hora","Número","Detalle","Por"],evs.filter(e=>e.tipo==="devolucion").slice(0,10).map(e=>[f(e.t),e.numero||"",e.detalle||"",e.apodo||""]))]}}
 if(sec===3){
  const a=pre.filter(p=>p.estado==="activo").map(p=>{const pe=its.filter(i=>i.prestamo_id===p.id&&!i.devuelto);return{p,pe,m:pe.reduce((x,i)=>Math.min(x,Date.parse(i.vence)),1e15)}}).sort((x,y)=>x.m-y.m);
  const pt=pe=>{const g=new Map();pe.forEach(i=>{const c=i.cond_salida||"",key=String(i.nombre||"").trim().toLowerCase()+"¦"+c;if(!g.has(key))g.set(key,{n:i.nombre,c,q:0});g.get(key).q++});return[...g.values()].map(o=>o.n+" × "+o.q+(o.c&&o.c!=="bueno"?" ("+condTxt(o.c).toLowerCase()+")":"")).join("; ")};
  return{slug:"prestamos-en-curso",hojas:[Hj("Préstamos en curso",["Préstamo","Prestatario","Documento","Teléfono","Pendiente","Devolver antes de","Estado"],a.map(({p,pe,m})=>[p.numero||"",p.nombre||"",p.documento||"",p.telefono||"",pt(pe),pe.length?f(m):"",pe.some(late)?"Vencido":"Por devolver"]))]}}
 if(sec===4){
  const B=pbucks(),M=pmov().filter(m=>(pgi==="*"||(pgm==="t"?m.k===pgi:m.n===pgi))&&m.t>=B[0].a&&m.t<B[B.length-1].e);
  let ti=0,to=0,acc=0;B.forEach(b=>{b.i=0;b.o=0;b.net=0});
  M.forEach(m=>{const b=B.find(b=>m.t>=b.a&&m.t<b.e);if(!b)return;if(m.d>0){b.i+=m.d;ti+=m.d}else{b.o-=m.d;to-=m.d}b.net+=m.d});
  const sl=pgi==="*"?(pgm==="t"?"Todos los tipos de implemento":"Todos los implementos"):pgi,cnt={};its.forEach(i=>cnt[i.nombre]=(cnt[i.nombre]||0)+1);
  return{slug:"graficos-prestamos",hojas:[
   Hj("Resumen",["Dato","Valor"],[["Vista",pgm==="t"?"Por tipo de implemento":"Por implemento"],["Selección",sl],["Período",{d:"Hoy",s:"7 días",m:"30 días"}[pgp]],["Se devolvió",ti],["Se prestó",to],["Movimientos",M.length],["Disponibles ahora",imp.filter(i=>i.estado==="disponible").length],["Prestados ahora",imp.filter(i=>i.estado==="prestado").length],["Por limpiar ahora",imp.filter(i=>i.estado==="por_limpiar").length]]),
   Hj("Gráfico",["Período","Se devolvió","Se prestó","Neto","Balance acumulado"],B.map(b=>{acc+=b.net;return[b.n,b.i,b.o,b.net,acc]})),
   Hj("Últimos movimientos",["Fecha y hora","Implemento","Tipo de movimiento","Tipo de implemento","Prestatario","Préstamo"],M.slice().sort((a,b)=>b.t-a.t).slice(0,10).map(m=>[f(m.t),m.n,m.d>0?"Se devolvió":"Se prestó",m.k,m.w||"",m.num||""])),
   Hj("Más prestados",["Implemento","Veces prestado"],Object.entries(cnt).sort((a,b)=>b[1]-a[1]||ab(a[0],b[0])).slice(0,10))]}}
 return{slug:"movimientos-prestamos",hojas:[Hj("Movimientos de préstamos",["Fecha y hora","Tipo","Número","Detalle","Por"],evs.map(e=>[f(e.t),e.tipo==="prestamo"?"Préstamo":e.tipo==="edicion"?"Edición":"Devolución",e.numero||"",e.detalle||"",e.apodo||""]))]}}
function rAll(){if(on)render()}
function buscar(v){dq=v||"";if(!built)return;
 if(sec===0){pqTxt=dq;rPrestar(true);return}
 if(sec!==1){if(!dq.trim())return;sec=1;dvf="todos";dvc="*";render();return}
 rDevolver(true)}
function off(){on=false;try{localStorage.setItem(KM,"0")}catch(_){}dq="";pqTxt="";aq="";$("scan").value="";pintar()}

function render(){build();const s=sec;
 montarTabs();
 [0,1,3,4,5].forEach(k=>{$("v"+k).hidden=true;$("pv"+k).hidden=k!==s});
 document.querySelector(".zones").hidden=true;$("wrap").classList.add("solo");lab(true);
 document.querySelectorAll("#views .tab[data-s]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.s===s)));
 ({0:rPrestar,1:rDevolver,3:rCurso,4:rGraf,5:rMov})[s]();const tm=$("tpModal");if(tm&&!tm.hidden&&!(ordDrag&&ordDrag.on)&&!busy($("tpBody")))tpRender()}
function hide(){if(built)[0,1,3,4,5].forEach(k=>$("pv"+k).hidden=true);if($("vtabs").firstChild)lab(false)}
{let _bt=0;$("scan").addEventListener("input",()=>{clearTimeout(_bt);_bt=setTimeout(()=>{if(on)buscar($("scan").value)},130)})}
$("modo").addEventListener("click",e=>{if(window.cambiarModo){cambiarModo(e);return}on=!on;dq="";pqTxt="";aq="";$("scan").value="";try{localStorage.setItem(KM,on?"1":"0")}catch(_){}pintar();sec=0;msg.textContent="";if(currentUser)renderAll()});
pintar();
return{on:()=>on,off,setOn:v=>{on=!!v;dq="";pqTxt="";aq="";try{localStorage.setItem(KM,on?"1":"0")}catch(_){}pintar()},buscar,render,hide,load,datosExport,ordOn:()=>{const m=document.getElementById("tpModal");return !!m&&!m.hidden&&/-ord$/.test(tpV)},ordMove:(a,b)=>tpOrdMove(a,b)};
})();
