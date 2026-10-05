const hoy12=()=>{const d=new Date();d.setHours(12,0,0,0);return d};
const zonaNombre=k=>cameras.find(c=>c.id===k)?.name||k;
const CATS=["Verduras y frutas","Proteínas vegetales","Lácteos vegetales","Congelados","Granos y legumbres","Aceites y condimentos"];
const CZ={"Verduras y frutas":"B","Proteínas vegetales":"B","Lácteos vegetales":"B","Congelados":"B","Granos y legumbres":"C","Aceites y condimentos":"C"};
const items=[];
const MOTIVOS=["Merma de cocina","Caducado","Error de porción","Cadena de frío","Otro"];
const MOTIVOS_ADD=["Recepción de proveedor","Compra directa","Devolución","Sobrante de conteo","Otro"];
const QDEST=[{k:"desayuno",l:"Desayuno",h:"Armar la comida"},{k:"almuerzo",l:"Almuerzo",h:"Armar la comida"},{k:"cena",l:"Cena",h:"Armar la comida"},{k:"otros",l:"Vencimiento/Otros",h:"Vencidos, mermas u otros"}];
const logData=[];let movSku=null;
let zona="*",vista="todos",sec=0,gp="d",gi="*",sync=0,chartType="bars";const mov=[],comidas=[];let disT={},gone=[],DKEY="",datosAl=false;let qMode="desayuno",plate=[],qFindTxt="",alOpen=false;
let fTipo="*",fOrden="",fSub="",fOpen=false,gm="a";
let qZona="*",qTipo="*",qOrden="",qSub2="",qFOpen=false,aq="";
const hitA=i=>{const k=norm(aq);return !k||norm(i.n+" "+i.k+" "+i.sku).includes(k)};
let invLayout=(()=>{try{return localStorage.getItem("cocina-central-lay")==="list"?"list":"grid"}catch(_){return"grid"}})();
let cameras=[
  {id:"B",name:"Congelador",temp:"",max:"",bad:false},
  {id:"C",name:"Despensa seca",temp:"",max:"",bad:false}
];
let users=[];
let currentUser=null;
const $=id=>document.getElementById(id),msg=$("msg");
function bdClose(el,fn){let d=false;el.addEventListener("pointerdown",e=>{d=e.target===el});el.addEventListener("click",e=>{if(d&&e.target===el)fn();d=false})}
const ANIMALES=[["🐮","Vaca"],["🐆","Jaguar"],["🐻","Oso de anteojos"],["🐬","Delfín rosado"],["🦜","Guacamaya"],["🐱","Gato"],["🦫","Chigüiro"],["🐸","Rana dorada"],["🐒","Mono tití"],["🦩","Flamenco"],["🦋","Mariposa"],["🐊","Caimán"],["🐢","Tortuga"],["🦌","Venado"],["🦦","Nutria gigante"]];
const animalPicker=sel=>`<fieldset class="apick"><legend>Elige tu animal</legend>`+[...ANIMALES].sort((a,b)=>a[1].localeCompare(b[1],"es",{sensitivity:"base"})).map(([e,n])=>`<label class="ap" title="${n}"><input type="radio" name="animal" value="${e}"${sel===e?" checked":""} required><span>${e}<small>${n}</small></span></label>`).join("")+`</fieldset>`;
const num=s=>parseFloat(String(s).replace(/\u2212/,"-").replace(",",".")),r2=x=>Math.round(x*100)/100,esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dias=e=>e?Math.round((new Date(e+"T12:00:00")-hoy12())/864e5):null;
const vence=dv=>dv<0?"Venció hace "+(-dv)+(dv===-1?" día":" días"):dv===0?"Vence hoy":dv===1?"Vence mañana":"Vence en "+dv+" días";
const estado=i=>({d:i.c===null?null:r2(i.c-i.sys),pend:i.c===null,sin:i.sys<=0,low:i.sys<i.min,venc:dias(i.exp)!==null&&dias(i.exp)<=3});
const hayMov=k=>(movSku||(movSku=new Set(mov.map(m=>m.s)))).has(k),sinRojo=i=>i.sys<=0&&(i.min>0||hayMov(i.sku)),falta=i=>r2(i.min-i.sys),quien=()=>currentUser?.apodo||"sin nombre";
const sinNombre=()=>!!currentUser;
const hora=()=>new Date().toTimeString().slice(0,5);
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fecha=t=>{const d=new Date(t);return String(d.getDate()).padStart(2,"0")+"/"+MES[d.getMonth()]+"/"+d.getFullYear()};
const fechaExp=e=>e?fecha(e+"T12:00:00"):"";
const fechaHora=t=>fecha(t)+" "+new Date(t).toTimeString().slice(0,5);
const norm=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const addLog=(k,x)=>{logData.unshift({t:hora(),ts:Date.now(),k,n:true,x});if(logData.length>300)logData.length=300};
const opts=(a,sel)=>a.map(m=>`<option${m===sel?" selected":""}>${esc(m)}</option>`).join("");
function alertas(){const a=[];
  items.forEach(i=>{const s=estado(i),dv=dias(i.exp);
  lotsOf(i).filter(l=>l.exp&&dias(l.exp)<=3).forEach(l=>{const d=dias(l.exp);a.push({id:"v"+i.sku+"|"+l.exp,u:d<=1,tag:d<=1?"Hoy":"Esta semana",t:`${esc(i.n)}: ${fm(l.q)} ${i.u} ${vence(d).toLowerCase()}`,x:`Del total de ${fm(i.sys)} ${i.u}, este lote vence el ${fechaExp(l.exp)}. Úsalo primero. Si se desecha, retíralo en Comidas: Quitar, Vencimiento/Otros.`,sku:i.sku})});
  if(s.low)a.push({id:"l"+i.sku,u:1,tag:"Hoy",t:`${esc(i.n)} ${i.sys<=0?"sin stock":"bajo el mínimo"}`,x:`${i.sys<=0?"No queda stock":"Quedan "+fm(i.sys)+" "+i.u} y el mínimo es ${fm(i.min)}. Pide ${fm(falta(i))} ${i.u} para completar el mínimo.`,sku:i.sku});
  else if(i.sys<i.min*1.3)a.push({id:"n"+i.sku,u:0,tag:"Esta semana",t:`${esc(i.n)} cerca del mínimo`,x:`Quedan ${fm(i.sys)} ${i.u} y el mínimo es ${fm(i.min)}. Programa el pedido antes del fin de semana.`,sku:i.sku});
  });
 return a.sort((x,y)=>y.u-x.u)}
function pintarAl(){$("alertPanel").hidden=!alOpen;$("alertBack").hidden=!alOpen;$("bell").setAttribute("aria-expanded",String(alOpen))}
const MS24=864e5;
function loadDis(uid){DKEY="kokoa-alertas:"+uid;disT={};gone=[];
 try{const g=JSON.parse(localStorage.getItem(DKEY)||"{}");
  if(g&&g.d&&typeof g.d==="object"&&!Array.isArray(g.d))for(const[k,v]of Object.entries(g.d))if(Number.isFinite(+v))disT[k]=+v;
  if(g&&Array.isArray(g.g))gone=g.g.filter(x=>typeof x==="string")}catch(_){}}
function saveDis(){if(!DKEY)return;try{localStorage.setItem(DKEY,JSON.stringify({d:disT,g:gone}))}catch(_){}}
function purgaDis(){const n=Date.now();let ch=false;
 for(const[k,t]of Object.entries(disT))if(n-t>=MS24){delete disT[k];if(!gone.includes(k))gone.push(k);ch=true}return ch}
function renderAlertas(){pintarAl();let ch=purgaDis();const all=alertas(),ids=all.map(e=>e.id);
 if(datosAl){for(const k of Object.keys(disT))if(!ids.includes(k)){delete disT[k];ch=true}
  const g2=gone.filter(x=>ids.includes(x));if(g2.length!==gone.length){gone=g2;ch=true}}
 if(ch)saveDis();
 const oculta=id=>id in disT||gone.includes(id),a=all.filter(e=>!oculta(e.id)),nd=Object.keys(disT).length;
 $("aT").textContent=`Alertas próximas (${a.length})`;
 $("bellN").textContent=a.length;const ur=a.some(e=>e.u);$("bell").classList.toggle("urg",ur);$("bell").setAttribute("aria-label",`Alertas: ${a.length}${ur?", hay urgentes":""}`);
 $("aL").innerHTML=a.length?a.map(e=>`<li class="${e.u?"u":""}"><div><b><span class="tag">${e.tag}:</span> ${e.t}</b><span>${e.x}</span></div><div class="ab">${e.sku?`<button class="ghost" data-go="${esc(e.sku)}">Ver</button>`:""}<button class="ghost" data-del="${e.id}" aria-label="Borrar alerta">Borrar</button></div></li>`).join(""):`<li><div><b>Sin alertas</b><span>${nd?"Borraste "+nd+(nd>1?" alertas.":" alerta."):"Todo está en rango y sobre el mínimo."}</span></div></li>`;
 let nota="";if(nd){const rest=Math.min(...Object.values(disT).map(t=>MS24-(Date.now()-t))),h=Math.max(1,Math.ceil(rest/36e5));nota=`<p class="small-note">Las borradas se eliminan por completo 24 h después. La más antigua se elimina en ${h} h.</p>`}
 $("aM").innerHTML=(a.length>1?`<button class="more" data-delall="1">Borrar todas</button>`:"")+(nd?`<button class="more" data-rest="1">Restaurar ${nd} borrada${nd>1?"s":""}</button>`+nota:"")}
setInterval(()=>{if(currentUser&&!document.hidden)renderAlertas()},60000);
function renderTipos(){
 if(fTipo!=="*"&&!CATS.includes(fTipo))fTipo="*";
 $("ztipos").innerHTML=`<button class="zone" data-tp="*" aria-pressed="${fTipo==="*"}">Todos los tipos<small>${items.length} alimentos</small></button>`+CATS.map(c=>{const ti=items.filter(i=>i.k===c),lo=ti.filter(i=>i.sys<i.min).length;return`<button class="zone" data-tp="${esc(c)}" aria-pressed="${fTipo===c}">${esc(c)}<small>${ti.length} alimento${ti.length===1?"":"s"}</small>${lo?`<small class="low">${lo} bajo el mínimo</small>`:""}</button>`}).join("")}
function renderZsel(){const e=$("zsel");if(!e)return;
 const lo=l=>l.some(i=>i.sys<i.min)?" ⚠":"";
 const zo=`<option value="*">Toda la cocina (${items.length})</option>`+cameras.map(c=>{const l=items.filter(i=>i.z===c.id);return`<option value="${esc(c.id)}"${zona===c.id?" selected":""}>${esc(c.name)} (${l.length})${lo(l)}</option>`}).join("");
 const to=`<option value="*">Todos (${items.length})</option>`+CATS.map(c=>{const l=items.filter(i=>i.k===c);return`<option value="${esc(c)}"${fTipo===c?" selected":""}>${esc(c)} (${l.length})${lo(l)}</option>`}).join("");
 e.innerHTML=`<label>Zona<select data-zsel="z" aria-label="Filtrar por zona">${zo}</select></label><label>Tipo<select data-zsel="t" aria-label="Filtrar por tipo de alimento">${to}</select></label>`;
 e.querySelector('[data-zsel="z"]').value=zona;e.querySelector('[data-zsel="t"]').value=fTipo}
document.addEventListener("change",e=>{const t=e.target.closest&&e.target.closest("[data-zsel]");if(!t)return;
 if(t.dataset.zsel==="z")zona=t.value;else fTipo=t.value;renderAll()});
function renderZones(){renderTipos();renderZsel();
 $("zones").innerHTML=`<button class="zone" data-z="*" aria-pressed="${zona==="*"}">Toda la cocina<small>${items.length} alimentos</small></button>`+cameras.map(c=>{const zi=items.filter(i=>i.z===c.id),lo=zi.filter(i=>i.sys<i.min).length;return`<button class="zone" data-z="${esc(c.id)}" aria-pressed="${zona===c.id}">${esc(c.name)}<small>${zi.length} alimento${zi.length===1?"":"s"}</small>${lo?`<small class="low">${lo} bajo el mínimo</small>`:""}</button>`}).join("")}
function lotsOf(i){return Array.isArray(i.lots)?i.lots:(i.sys>0?[{q:i.sys,exp:i.exp||null}]:[])}
function sincLotes(i){i.lots.sort((a,b)=>(a.exp||"9")<(b.exp||"9")?-1:(a.exp||"9")>(b.exp||"9")?1:0);
 i.sys=r2(i.lots.reduce((t,l)=>t+l.q,0));const f=i.lots.find(l=>l.exp);i.exp=f?f.exp:null}
function asegurarLotes(i){if(!Array.isArray(i.lots))i.lots=i.sys>0?[{q:i.sys,exp:i.exp||null}]:[];
 i.lots=i.lots.filter(l=>l.q>1e-7);sincLotes(i)}
function sumarLote(i,q,exp){expLote[i.sku]=exp||null;q=r2(q);if(!(q>0))return;asegurarLotes(i);const l=i.lots.find(a=>(a.exp||null)===(exp||null));
 if(l)l.q=r2(l.q+q);else i.lots.push({q,exp:exp||null});sincLotes(i)}
function quitarFEFO(i,q){asegurarLotes(i);let r=r2(q);const tom=[];
 for(const l of i.lots){if(r<=0)break;const t=Math.min(l.q,r);l.q=r2(l.q-t);r=r2(r-t);tom.push({q:t,exp:l.exp})}
 i.lots=i.lots.filter(l=>l.q>1e-7);sincLotes(i);return tom}
function loteTxt(i,q){let r=q;const p=[];for(const l of lotsOf(i)){if(r<=0)break;const t=Math.min(l.q,r);p.push(`${fm(t)} ${i.u}, ${l.exp?"vence "+fechaExp(l.exp):"sin fecha"}`);r=r2(r-t)}return p.join(" · ")}
function lotesHtml(i){const L=lotsOf(i);if(!L.length)return'<div class="lots"><span class="sku">Sin stock</span></div>';
 return`<ul class="lots" aria-label="Lotes por vencimiento">`+L.map(l=>{const d=l.exp?dias(l.exp):null,rel=d===null||d>3?"":d<0?" · vencido":d===0?" · hoy":d===1?" · mañana":" · en "+d+" días";
  return`<li class="${d!==null&&d<=1?"u":d!==null&&d<=3?"w":""}"><b>${fm(l.q)} ${esc(i.u)}</b><span>${l.exp?"vence "+fechaExp(l.exp)+rel:"sin vencimiento"}</span></li>`}).join("")+`</ul>`}
const zoneOpts=sel=>cameras.map(c=>`<option value="${esc(c.id)}"${c.id===sel?" selected":""}>${esc(c.name)}</option>`).join("");
const pasaF=i=>(zona==="*"||i.z===zona)&&(fTipo==="*"||i.k===fTipo);
const okVista=i=>{const e=estado(i);return vista==="todos"||(vista==="sin"&&e.sin)||(vista==="bajo"&&e.low)||(vista==="venc"&&e.venc)};
const ordQ=(a,b)=>(fOrden==="may"?b.sys-a.sys:a.sys-b.sys)||a.n.localeCompare(b.n,"es",{sensitivity:"base"});
const ESTA={todos:"Todos",sin:"Sin stock",bajo:"Bajo el mínimo",venc:"Vencen en 3 días"};
function renderFiltro(){const n=(vista!=="todos")+(zona!=="*")+(fTipo!=="*")+(fOrden?1:0);
 $("fBtn").innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>Filtrar por'+(n?` <span class="fn">${n}</span>`:"");
 $("fBtn").setAttribute("aria-expanded",String(fOpen));$("fMenu").hidden=!fOpen;if(!fOpen)return;
 const so=(k,l,on)=>`<button type="button" class="fo${on?" on":""}" data-fo="${k}" aria-pressed="${on}">${l}</button>`;
 const ve=items.filter(pasaF),vc={todos:ve.length,sin:ve.filter(i=>estado(i).sin).length,bajo:ve.filter(i=>estado(i).low).length,venc:ve.filter(i=>estado(i).venc).length};
 $("fMenu").innerHTML=so("est","Estado"+(vista!=="todos"?": "+ESTA[vista]:""),fSub==="est"||vista!=="todos")
  +(fSub==="est"?`<select data-fsel="est" aria-label="Elegir estado">${Object.keys(ESTA).map(k=>`<option value="${k}"${k===vista?" selected":""}>${ESTA[k]} (${vc[k]})</option>`).join("")}</select>`:"")
  +so("zona","Zona"+(zona!=="*"?": "+esc(zonaNombre(zona)):""),fSub==="zona"||zona!=="*")
  +(fSub==="zona"?`<select data-fsel="zona" aria-label="Elegir zona"><option value="*">Todas las zonas</option>${zoneOpts(zona)}</select>`:"")
  +so("tipo","Tipo de alimento"+(fTipo!=="*"?": "+esc(fTipo):""),fSub==="tipo"||fTipo!=="*")
  +(fSub==="tipo"?`<select data-fsel="tipo" aria-label="Elegir tipo de alimento"><option value="*">Todos los tipos</option>${CATS.map(c=>`<option value="${esc(c)}"${c===fTipo?" selected":""}>${esc(c)}</option>`).join("")}</select>`:"")
  +so("may","Mayor cantidad",fOrden==="may")+so("men","Menor cantidad",fOrden==="men")
  +(n?`<button type="button" class="fo clr" data-fo="clr">Quitar filtros</button>`:"")}
$("fBtn").addEventListener("click",()=>{fOpen=!fOpen;fSub="";renderFiltro()});
$("fMenu").addEventListener("click",e=>{const b=e.target.closest("[data-fo]");if(!b)return;const k=b.dataset.fo;
 if(k==="est"||k==="zona"||k==="tipo"){fSub=fSub===k?"":k;renderFiltro();return}
 if(k==="may"||k==="men")fOrden=fOrden===k?"":k;
 if(k==="clr"){vista="todos";zona="*";fTipo="*";fOrden=""}
 fOpen=false;fSub="";renderAll()});
$("fMenu").addEventListener("change",e=>{const x=e.target.closest("[data-fsel]");if(!x)return;if(x.dataset.fsel==="est")vista=x.value;else if(x.dataset.fsel==="zona")zona=x.value;else fTipo=x.value;fOpen=false;fSub="";renderAll()});
document.addEventListener("click",e=>{if(fOpen&&e.target.isConnected&&!e.target.closest(".fwrap")){fOpen=false;fSub="";renderFiltro()}});
addEventListener("keydown",e=>{if(e.key==="Escape"&&fOpen){fOpen=false;renderFiltro();$("fBtn").focus()}});
function renderTools(){
 const v=items.filter(pasaF),cnt={todos:v.length,sin:v.filter(i=>estado(i).sin).length,bajo:v.filter(i=>estado(i).low).length,venc:v.filter(i=>estado(i).venc).length};
 $("tabs").innerHTML=Object.keys(ESTA).map(k=>`<button type="button" class="tab ${(k==="sin"||k==="bajo"||k==="venc")&&cnt[k]?"warn":""}" data-v="${k}" aria-pressed="${vista===k}"><b>${cnt[k]}</b>${ESTA[k]}</button>`).join("");
 renderFiltro();
 const g=invLayout==="grid";$("vtog").classList.toggle("grid",g);$("vtog").setAttribute("aria-checked",String(g))}
function renderCats(){
 const vis=i=>pasaF(i)&&hitA(i),ok=okVista;
 const alfa=(a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"});
 if(invLayout==="list"){const f=items.filter(i=>vis(i)&&ok(i)).sort(fOrden?ordQ:alfa);
  $("cats").innerHTML=f.length?`<div class="tbl"><table class="inv"><thead><tr><th>Alimento</th><th>Lotes y vencimiento</th><th>Ubicación</th><th>Cantidad</th><th>Motivo del cambio</th><th>Vence lo agregado</th><th>Mínimo</th><th></th></tr></thead><tbody>`+
  f.map(i=>{const s=estado(i),dv=dias(i.exp);
   return`<tr data-e="${esc(i.sku)}" class="${sinRojo(i)?"ns u":s.low||(s.venc&&dv<=1)?"u":s.venc?"w":""}"><td class="nm"><b>${esc(i.n)}</b><div class="sku"><select data-cat aria-label="Tipo de alimento">${opts(CATS,i.k)}</select></div>${sinRojo(i)?'<div class="low">Sin stock</div>':s.low?'<div class="low">Bajo el mínimo</div>':""}</td>
   <td data-label="Lotes y vencimiento">${lotesHtml(i)}</td>
   <td class="loc" data-label="Ubicación"><select data-zone aria-label="Zona">${zoneOpts(i.z)}</select></td>
   <td class="ed" data-label="Cantidad (${esc(i.u)})"><input type="number" min="${i.sys}" step="any" data-q value="${i.sys}" aria-label="Cantidad ${esc(i.n)}"></td><td class="ed" data-label="Motivo del cambio"><select data-em aria-label="Motivo" disabled><option value="">Elegir motivo</option>${opts(MOTIVOS_ADD)}</select></td><td class="ed" data-label="Vence lo agregado"><input type="date" data-ev aria-label="Vencimiento de lo agregado" disabled></td>
   <td class="ed" data-label="Mínimo"><input type="number" min="0" step="any" data-mn value="${i.min}" aria-label="Mínimo ${esc(i.n)}"></td>
   <td class="act" data-label=""><button data-save="${esc(i.sku)}">Guardar</button></td></tr>`}).join("")+`</tbody></table></div>`:`<p class="sub">${aq.trim()?"Ningún alimento coincide con el filtro.":"No hay alimentos en esta vista."}</p>`}
 else
 $("cats").innerHTML=(fOrden?[[fOrden==="may"?"De mayor a menor cantidad":"De menor a mayor cantidad",items.filter(i=>vis(i)&&ok(i)).sort(ordQ)]]:CATS.map(c=>[c,items.filter(i=>i.k===c&&vis(i)&&ok(i)).sort(alfa)])).map(([c,l])=>{if(!l.length)return"";
  return`<div class="cat"><h2>${esc(c)}<small>${l.length} alimento${l.length>1?"s":""}</small></h2><div class="cgrid">`+
  l.map(i=>`<div class="icard${sinRojo(i)?" ns":""}" data-e="${esc(i.sku)}"><div class="ihw"><div class="ihead"><div class="in"><b>${esc(i.n)}</b><div class="sku">${i.u} · ${esc(zonaNombre(i.z))}</div></div></div>${lotesHtml(i)}</div>
  <label class="fld">Tipo de alimento<select data-cat aria-label="Tipo de alimento">${opts(CATS,i.k)}</select></label>
  <label class="fld">Zona<select data-zone aria-label="Zona">${zoneOpts(i.z)}</select></label>
  <div class="frow"><label class="fld">Cantidad (${i.u})<input type="number" min="${i.sys}" step="any" data-q value="${i.sys}" aria-label="Cantidad ${esc(i.n)}"></label>
  <label class="fld">Mínimo<input type="number" min="0" step="any" data-mn value="${i.min}" aria-label="Mínimo ${esc(i.n)}"></label></div>
  <div class="emw" data-emw><label class="fld">Motivo<select data-em aria-label="Motivo" disabled><option value="">Elegir motivo</option>${opts(MOTIVOS_ADD)}</select></label><label class="fld">Vence lo agregado<input type="date" data-ev aria-label="Vencimiento de lo agregado" disabled></label></div>
  <button data-save="${esc(i.sku)}">Guardar</button></div>`).join("")+`</div></div>`}).join("")||`<p class="sub">${aq.trim()?"Ningún alimento coincide con el filtro.":"No hay alimentos en esta vista."}</p>`;
 {const v=$("aC").value;$("aC").innerHTML=opts(CATS);if(CATS.includes(v))$("aC").value=v}}
const ICON_TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6M14 10v6"/></svg>';
const mvLi=o=>`<li class="${o.nw?"new":""}"><div class="pev-t"><b>${o.t}</b><span class="pev-r"><span class="pchip ${o.c}">${o.chip}</span>${o.h||""}</span></div>${o.s?`<div class="pev-s">${o.s}</div>`:""}<time class="pev-d">${o.d}</time></li>`;
const hBtn=(t,id)=>esAdmin()&&id?`<button type="button" class="hdel" data-hdel="${t}" data-hid="${id}" aria-label="Borrar este registro del historial" title="Borrar este registro">${ICON_TRASH}</button>`:"";
function renderInvMov(){const R=mov.filter(m=>m.d>0).sort((a,b)=>b.t-a.t).slice(0,10);
 const h=R.length?R.map(m=>mvLi({t:esc(m.n),c:"up",chip:"Se puso +"+fm(Math.abs(m.d))+" "+esc(m.u),s:esc(m.w||"")+(m.p?(m.w?" · ":"")+"Por "+esc(m.p):""),d:fechaHora(m.t),h:hBtn("movimientos",m.id)})).join(""):"<li>Aún no hay entradas registradas. Aparecen cuando agregas stock.</li>";
 $("imv").innerHTML=h;$("imv2").innerHTML=h}
const stepU=i=>i.u==="unid."?1:0.5,enPlato=sku=>(plate.find(x=>x.sku===sku)||{q:0}).q;
const qSub=i=>{const dv=dias(i.exp);return`${fm(r2(i.sys-enPlato(i.sku)))} ${i.u}${i.exp&&dv<=3?" · "+vence(dv):""}`};
function renderQFilt(){const n=(qZona!=="*")+(qTipo!=="*")+(qOrden?1:0);
 const so=(k,l,on)=>`<button type="button" class="fo${on?" on":""}" data-qfo="${k}" aria-pressed="${on}">${l}</button>`;
 $("qFilt").innerHTML=`<div class="qfwrap"><button type="button" class="ghost fbtn" id="qfBtn" data-qfo="toggle" aria-haspopup="true" aria-expanded="${qFOpen}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>Filtrar por${n?` <span class="fn">${n}</span>`:""}</button>`+
 (qFOpen?`<div class="fmenu" id="qfMenu">`
  +so("zona","Zona"+(qZona!=="*"?": "+esc(zonaNombre(qZona)):""),qSub2==="zona"||qZona!=="*")
  +(qSub2==="zona"?`<select data-qfsel="zona" aria-label="Elegir zona"><option value="*">Todas las zonas</option>${zoneOpts(qZona)}</select>`:"")
  +so("tipo","Tipo de alimento"+(qTipo!=="*"?": "+esc(qTipo):""),qSub2==="tipo"||qTipo!=="*")
  +(qSub2==="tipo"?`<select data-qfsel="tipo" aria-label="Elegir tipo de alimento"><option value="*">Todos los tipos</option>${CATS.map(c=>`<option value="${esc(c)}"${c===qTipo?" selected":""}>${esc(c)}</option>`).join("")}</select>`:"")
  +so("may","Mayor cantidad",qOrden==="may")+so("men","Menor cantidad",qOrden==="men")
  +(n?`<button type="button" class="fo clr" data-qfo="clr">Quitar filtros</button>`:"")+`</div>`:"")+`</div>`}
$("qFilt").addEventListener("click",e=>{const b=e.target.closest("[data-qfo]");if(!b)return;const k=b.dataset.qfo;
 if(k==="toggle"){qFOpen=!qFOpen;qSub2="";renderQFilt();return}
 if(k==="zona"||k==="tipo"){qSub2=qSub2===k?"":k;renderQFilt();return}
 if(k==="may"||k==="men")qOrden=qOrden===k?"":k;
 if(k==="clr"){qZona="*";qTipo="*";qOrden=""}
 qFOpen=false;qSub2="";renderQuitar()});
$("qFilt").addEventListener("change",e=>{const x=e.target.closest("[data-qfsel]");if(!x)return;if(x.dataset.qfsel==="zona")qZona=x.value;else qTipo=x.value;qFOpen=false;qSub2="";renderQuitar()});
document.addEventListener("click",e=>{if(qFOpen&&e.target.isConnected&&!e.target.closest(".qfwrap")){qFOpen=false;qSub2="";renderQFilt()}});
addEventListener("keydown",e=>{if(e.key==="Escape"&&qFOpen){qFOpen=false;renderQFilt();const b=$("qfBtn");if(b)b.focus()}});
const ordenQuitar=(a,b)=>qOrden?((qOrden==="may"?b.sys-a.sys:a.sys-b.sys)||a.n.localeCompare(b.n,"es",{sensitivity:"base"})):((a.exp||"9")<(b.exp||"9")?-1:(a.exp||"9")>(b.exp||"9")?1:0);
function renderQuitar(){
 plate=plate.filter(x=>items.some(i=>i.sku===x.sku&&i.sys>0));
 plate.forEach(x=>{const i=items.find(a=>a.sku===x.sku);if(x.q>i.sys)x.q=i.sys});
 const l=items.filter(i=>i.sys>0&&(qZona==="*"||i.z===qZona)&&(qTipo==="*"||i.k===qTipo)&&hitA(i)).sort(ordenQuitar);
 renderQFilt();
 $("qList").innerHTML='<h3>Alimentos</h3><div class="qscroll">'+(l.length?l.map(i=>`<div class="qrow" data-qd="${esc(i.sku)}"><span class="dgrip" title="Arrastra al plato" aria-hidden="true">${ICON_MOVE}</span><button type="button" class="zone qsel" data-qs="${esc(i.sku)}"><b>${esc(i.n)}</b><small data-qa="${esc(i.sku)}">${qSub(i)}</small></button></div>`).join(""):`<p class="sub">${(qZona!=="*"||qTipo!=="*"||aq.trim())?"Ningún alimento coincide con los filtros.":"No hay alimentos disponibles."}</p>`)+"</div>";
 $("qDest").innerHTML=QDEST.map(d=>`<button type="button" class="qdest" data-qm="${d.k}" aria-pressed="${qMode===d.k}">${d.l}<small>${d.h}</small></button>`).join("");
 const M=QDEST.find(x=>x.k===qMode),otros=qMode==="otros";
 const venc=`<button type="button" class="ghost" data-qv="1">Agregar lo que vence en 3 días</button>`;
 let h=`<div class="plate" id="qPlate"><div class="plate-h"><h3>${otros?"Retiro por vencimiento u otros":"Armando: "+M.l}</h3><div class="plate-find"><input id="qFind" maxlength="40" autocomplete="off" placeholder="Buscar alimento para agregar" aria-label="Buscar alimento para agregar" value="${esc(qFindTxt)}"></div></div><div class="asug" id="qFindSug" aria-live="polite" hidden></div>`;
 if(!plate.length)h+=`<div class="pempty"><p><b>${otros?"Suelta aquí los alimentos vencidos o perdidos":"Suelta aquí los alimentos de la comida"}</b></p><p class="sub">Arrástralo desde la lista con el ícono de mover, o tócalo para agregarlo.</p>${otros?venc:""}</div>`;
 else h+=plate.map(x=>{const i=items.find(a=>a.sku===x.sku);
  return`<div class="prow"><div class="pn"><b>${esc(i.n)}</b><small>Quedan <span data-qr="${esc(i.sku)}"></span></small><small data-ql="${esc(i.sku)}"></small></div><div class="pq"><button type="button" data-qn="${esc(i.sku)}" aria-label="Menos ${esc(i.n)}">−</button><input type="number" min="0" step="any" inputmode="decimal" data-qi="${esc(i.sku)}" value="${x.q}" aria-label="Cantidad de ${esc(i.n)}"><span>${i.u}</span><button type="button" data-qp="${esc(i.sku)}" aria-label="Más ${esc(i.n)}">+</button></div>${otros?`<select data-qmo="${esc(i.sku)}" aria-label="Motivo ${esc(i.n)}">${opts(MOTIVOS,x.m)}</select>`:""}<button type="button" class="ghost" data-qx="${esc(i.sku)}" aria-label="Sacar ${esc(i.n)} del plato">✕</button></div>`}).join("")+(otros?`<div>${venc}</div>`:"");
 h+=`</div><div class="qfoot"><div class="qsum" id="qSum"></div><div class="qbtns"><button type="button" class="ghost" data-qc="1">Vaciar</button><button type="button" id="qOk" data-qok="1">Quitar del stock</button></div></div>`;
 $("qMain").innerHTML=h;refrescarQ()}
function matchAlimentos(q){const k=norm(q);if(!k)return[];const rank=i=>{const n=norm(i.n);return n===k?0:n.startsWith(k)?1:n.includes(k)?2:3};
 return items.filter(i=>{const n=norm(i.n);return i.sys>0&&(n.includes(k)||k.includes(n))}).sort((a,b)=>rank(a)-rank(b)||a.n.localeCompare(b.n,"es")).slice(0,6)}
function actualizarQFind(){const b=$("qFindSug");if(!b)return;const q=norm(qFindTxt);b.hidden=!q;if(!q){b.innerHTML="";return}
 const l=matchAlimentos(qFindTxt);
 b.innerHTML=l.length?`<span class="chips">Sugerencias:${l.map(i=>{const r=r2(i.sys-enPlato(i.sku));return`<button type="button" class="sg" data-qfs="${esc(i.sku)}"${r<=0?" disabled":""}>${esc(i.n)} <small>${fm(r)} ${esc(i.u)}</small></button>`}).join("")}</span>`:`<span>No hay alimentos con stock que coincidan con «${esc(qFindTxt.trim())}».</span>`}
function agregarBusq(sku){qFindTxt="";addPlate(sku);renderQuitar();const f=$("qFind");if(f)f.focus()}
function refrescarQ(){
 document.querySelectorAll("[data-ql]").forEach(e=>{const i=items.find(a=>a.sku===e.dataset.ql),x=plate.find(a=>a.sku===e.dataset.ql);e.textContent=i&&x&&x.q>0?"Sale primero: "+loteTxt(i,Math.min(x.q,i.sys)):""});
 document.querySelectorAll("[data-qa]").forEach(e=>{const i=items.find(a=>a.sku===e.dataset.qa);if(!i)return;e.textContent=qSub(i);e.closest("button").disabled=r2(i.sys-enPlato(i.sku))<=0});
 document.querySelectorAll("[data-qr]").forEach(e=>{const i=items.find(a=>a.sku===e.dataset.qr),x=plate.find(a=>a.sku===e.dataset.qr);if(!i||!x)return;const r=r2(i.sys-x.q);e.textContent=r<0?"más de lo disponible":fm(r)+" "+i.u;e.style.color=r<0?"var(--alert-t)":""});
 const M=QDEST.find(x=>x.k===qMode),n=plate.length;
 if($("qSum"))$("qSum").textContent=n?`${n} alimento${n>1?"s":""} para ${qMode==="otros"?"retiro por vencimiento/otros":M.l.toLowerCase()}`:"Aún no hay alimentos en el plato.";
 actualizarQFind();
 if($("qOk"))$("qOk").disabled=!n}
function addPlate(sku){const i=items.find(a=>a.sku===sku);if(!i||i.sys<=0)return;const x=plate.find(a=>a.sku===sku),st=stepU(i);
 if(x){if(x.q+st>i.sys+1e-9){msg.textContent=`No queda más ${i.n} disponible.`;return}x.q=r2(x.q+st)}
 else plate.push({sku,q:Math.min(st,i.sys),m:"Caducado"});
 renderQuitar();msg.textContent=""}
function bump(sku,dir){const i=items.find(a=>a.sku===sku),x=plate.find(a=>a.sku===sku);if(!i||!x)return;x.q=r2(Math.min(i.sys,Math.max(0,x.q+dir*stepU(i))));
 const inp=document.querySelector(`[data-qi="${esc(sku)}"]`);if(inp)inp.value=x.q;refrescarQ()}
function addVence(){const por=i=>r2(lotsOf(i).filter(a=>a.exp&&dias(a.exp)<=3).reduce((t,a)=>t+a.q,0)),l=items.filter(i=>i.sys>0&&por(i)>0);
 if(!l.length){msg.textContent="No hay alimentos que venzan en los próximos 3 días.";return}
 l.forEach(i=>{const q=por(i),x=plate.find(a=>a.sku===i.sku);if(x){x.q=q;x.m="Caducado"}else plate.push({sku:i.sku,q,m:"Caducado"})});
 renderQuitar();msg.textContent=""}
function confirmarQuitar(){if(!sinNombre())return;if(!plate.length){msg.textContent="Agrega al menos un alimento al plato.";return}
 const M=QDEST.find(x=>x.k===qMode),otros=qMode==="otros";
 for(const x of plate){const i=items.find(a=>a.sku===x.sku);
  if(!(x.q>0)){msg.textContent=`Escribe una cantidad para ${i.n}.`;return}
  if(x.q>i.sys){msg.textContent=`Solo hay ${fm(i.sys)} ${i.u} de ${i.n}.`;return}
  if(otros&&!x.m){msg.textContent=`Elige el motivo de ${i.n}.`;return}}
 const nom="",partes=[],rec=[];
 plate.forEach(x=>{const i=items.find(a=>a.sku===x.sku),q=r2(x.q),quedan=r2(i.sys-q);
  rec.push({n:i.n,q,u:i.u,m:otros?x.m:""});
  mv(i,-q,otros?"Salida: "+x.m.toLowerCase():"Consumo: "+M.l.toLowerCase()+(nom?" ("+nom+")":""));
  if(otros)addLog("adj",`Salida por vencimiento/otros: ${q} ${i.u} de ${i.n.toLowerCase()} (${x.m.toLowerCase()}): de ${i.sys} a ${quedan}. Por ${quien()}.`);
  else partes.push(`${q} ${i.u} de ${i.n.toLowerCase()}`);
  const tom=quitarFEFO(i,q);rec[rec.length-1].v=tom.map(t=>t.exp?fechaExp(t.exp):"sin fecha").join(", ");i.c=null});
 if(!otros)addLog("adj",`${M.l}${nom?" «"+nom+"»":""}: se descontaron ${partes.join(", ")}. Por ${quien()}.`);
 comidas.unshift({t:Date.now(),k:qMode,nom,it:rec,por:quien(),n:true});if(comidas.length>200)comidas.length=200;
 plate=[];msg.textContent="";renderAll();
 const f=document.querySelector("#cml li");if(f)f.scrollIntoView({block:"nearest",behavior:"smooth"})}
function renderComidas(){const L=comidas.slice(0,10);
 $("cml").innerHTML=L.length?L.map(c=>{const D=QDEST.find(x=>x.k===(c.k==="alimento"?"almuerzo":c.k))||{l:c.k},nn=c.it.length;
  return mvLi({nw:c.n,t:D.l+(c.nom?" «"+esc(c.nom)+"»":""),c:"dn",chip:"Se quitó "+nn+" alimento"+(nn>1?"s":""),s:c.it.map(x=>esc(x.n)+" "+fm(x.q)+" "+esc(x.u)+(x.m?" ("+esc(x.m.toLowerCase())+")":"")+(x.v?" · vence "+esc(x.v):"")).join(", ")+" · Por "+esc(c.por),d:fechaHora(c.t),h:hBtn("comidas",c.id)})}).join(""):"<li>Aún no hay comidas registradas. Arma una en el plato y presiona «Quitar del stock».</li>";
 comidas.forEach(c=>c.n=false)}
function renderLog(){$("log").innerHTML=logData.map(e=>`<li class="${e.k} ${e.n?"new":""}"><time>${e.ts?fechaHora(e.ts):e.t}</time>${esc(e.x)}${hBtn("bitacora",e.id)}</li>`).join("");$("histAll").hidden=!esAdmin();logData.forEach(e=>e.n=false)}
const tabsHtml=ks=>VISTAS.filter(v=>ks.includes(v[0])).map(([k,l,t])=>`<button class="tab" data-s="${k}" aria-pressed="false"><span class="l-lg">${l}</span><span class="l-sm">${t}</span></button>`).join("");
function montarTabs(){if(!$("vtabs").firstChild){$("vtabs").innerHTML=tabsHtml([0,1]);$("vtabs2").innerHTML=tabsHtml([3,4,5])}}
const VISTAS=[[0,"Comidas: Quitar","Quitar"],[1,"Inventario: Agregar","Agregar"],[3,"Pedido sugerido","Pedido"],[4,"Gráficos","Gráficos"],[5,"Movimientos","Historial"]];
function limpiarPantalla(){alOpen=false;aq="";plate=[];qFindTxt="";sec=0;
 ["vtabs","vtabs2","zones","zsel","ztipos","imv","imv2","qFilt","qList","qMain","qDest","cml","fMenu","cats","ped","gmode","gper","gtype","gsum","gc","mvl","log","aL","aM","aSug"].forEach(id=>{const e=$(id);if(e)e.innerHTML=""});
 msg.textContent="";$("bellN").textContent="0";$("addForm").reset();$("scan").value="";pintarAl()}
function renderAll(){
 if(!currentUser){limpiarPantalla();return}
 if(window.CNT&&CNT.on()){if(window.PRM)PRM.hide();renderAlertas();renderScanList();CNT.render();return}if(window.CNT)CNT.hide();
 if(window.PRM){if(PRM.on()){renderAlertas();renderScanList();PRM.render();return}PRM.hide()}
 montarTabs();
 document.querySelectorAll("#views .tab[data-s]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.s===sec)));
 $("v0").hidden=sec!==0;$("v1").hidden=sec!==1;$("v3").hidden=sec!==3;$("v4").hidden=sec!==4;$("v5").hidden=sec!==5;
 const zv=sec===1;document.querySelector(".zones").hidden=!zv;$("wrap").classList.toggle("solo",!zv);
 renderAlertas();renderPurga();
 if(sec===0){renderQuitar();renderComidas()}
 else if(sec===1){renderZones();renderTools();renderCats();renderInvMov();actualizarAdd()}
 else if(sec===3)renderPedido();
 else if(sec===4){selMov();renderGraf()}
 else if(sec===5)renderLog();
 renderScanList();guardar()}
function ir(sku){if(window.CNT&&CNT.on())CNT.off();if(window.PRM&&PRM.on())PRM.off();aq="";$("scan").value="";sec=1;zona="*";fTipo="*";vista="todos";alOpen=false;msg.textContent="";renderAll();const r=document.querySelector(`[data-e="${esc(sku)}"]`);if(r){r.classList.add("hit");r.scrollIntoView({block:"center"});const qf=r.querySelector("[data-q]");if(qf)qf.focus()}}
document.addEventListener("click",e=>{const b=e.target.closest("button"),D=b&&b.dataset;if(!b)return;
 if(D.asug){const i=items.find(a=>a.sku===D.asug);if(i){$("aN").value=i.n;actualizarAdd();$("aQ").focus()}}
 else if(D.qfs){agregarBusq(D.qfs)}
 else if(D.qs){addPlate(D.qs)}
 else if(D.qm){qMode=D.qm;renderQuitar()}
 else if(D.qn){bump(D.qn,-1)}
 else if(D.qp){bump(D.qp,1)}
 else if(D.qx){plate=plate.filter(x=>x.sku!==D.qx);renderQuitar()}
 else if(D.qv){addVence()}
 else if(D.qc){plate=[];renderQuitar();msg.textContent=""}
 else if(D.qok){confirmarQuitar()}
 else if(D.gp){gp=D.gp;renderGraf()}
 else if(D.gt){chartType=D.gt;renderGraf()}
 else if(D.gm){gm=D.gm;selMov();$("gsel").value="*";renderGraf()}
 else if(D.del){disT[D.del]=Date.now();saveDis();msg.textContent="";renderAll()}
 else if(D.delall){const n=Date.now();alertas().forEach(e=>{if(!(e.id in disT)&&!gone.includes(e.id))disT[e.id]=n});saveDis();msg.textContent="";renderAll()}
 else if(D.rest){disT={};saveDis();msg.textContent="";renderAll()}
 else if(D.v){vista=D.v;renderAll()}
 else if(D.lay){invLayout=invLayout==="grid"?"list":"grid";try{localStorage.setItem("cocina-central-lay",invLayout)}catch(_){}renderAll()}
 else if(D.z){zona=D.z;renderAll()}
 else if(D.tp){fTipo=D.tp;renderAll()}
 else if(D.s){sec=+D.s;msg.textContent="";renderAll()}
 else if(D.go){ir(D.go)}
 else if(D.save){if(!sinNombre())return;const i=items.find(a=>a.sku===D.save),r=b.closest("[data-e]"),q=r2(+r.querySelector("[data-q]").value),mn=r2(+r.querySelector("[data-mn]").value),ce=r.querySelector("[data-cat]"),cat=ce?ce.value:i.k,ze=r.querySelector("[data-zone]"),zn=ze?ze.value:i.z,mot=r.querySelector("[data-em]").value;
  const rq=r.querySelector("[data-q]").value,rm=r.querySelector("[data-mn]").value;
  if(rq===""||rm===""||!(q>=0)||!(mn>=0)){msg.textContent="Cantidad y mínimo deben ser números de 0 o más.";return}
  if(q<i.sys){msg.textContent=`Aquí solo se puede agregar. Para quitar ${i.n} usa Comidas: Quitar.`;r.querySelector("[data-q]").value=i.sys;emHab(r,false);return}
  if(q!==i.sys&&!mot){msg.textContent=`Cambiaste la cantidad de ${i.n}. Elige el motivo antes de guardar.`;r.querySelector("[data-em]").focus();return}
  const h=[];
  if(q!==i.sys){addLog("cnt",`Entrada de ${r2(q-i.sys)} ${i.u} de ${i.n.toLowerCase()} en ${zonaNombre(i.z).toLowerCase()}: de ${i.sys} a ${q}. Motivo: ${mot.toLowerCase()}. Por ${quien()}.`);mv(i,q-i.sys,"Entrada: "+mot.toLowerCase());sumarLote(i,q-i.sys,r.querySelector("[data-ev]").value||null);i.c=null;h.push("cantidad")}
  if(mn!==i.min){addLog("cnt",`Mínimo de ${i.n.toLowerCase()}: de ${i.min} a ${mn} ${i.u}. Por ${quien()}.`);i.min=mn;h.push("mínimo")}
  if(cat!==i.k){addLog("cnt",`${i.n} pasa de ${i.k.toLowerCase()} a ${cat.toLowerCase()}. Por ${quien()}.`);i.k=cat;h.push("categoría")}
  if(zn!==i.z){addLog("cnt",`${i.n} pasa de ${zonaNombre(i.z).toLowerCase()} a ${zonaNombre(zn).toLowerCase()}. Por ${quien()}.`);i.z=zn;h.push("zona")}
  msg.textContent=h.length?"":`No hay cambios que guardar en ${i.n}.`;renderAll()}});
/*tipo inmediato*/
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-cat]");if(!s)return;
 const r=s.closest("[data-e]"),i=r&&items.find(a=>a.sku===r.dataset.e);if(!i||!sinNombre()||s.value===i.k)return;
 const antes=i.k;i.k=s.value;if(fTipo!=="*"&&fTipo!==i.k)fTipo="*";
 addLog("cnt",`${i.n} pasa de ${antes.toLowerCase()} a ${i.k.toLowerCase()}. Por ${quien()}.`);
 renderAll();
 const n=document.querySelector(`[data-e="${esc(i.sku)}"]`);if(n){n.classList.add("hit");n.scrollIntoView({block:"center",behavior:"smooth"})}});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.target.id!=="qFind")return;e.preventDefault();
 const l=matchAlimentos(qFindTxt).filter(i=>r2(i.sys-enPlato(i.sku))>0);
 if(l.length)agregarBusq(l[0].sku);else if(qFindTxt.trim())msg.textContent=`No hay alimentos con stock que coincidan con «${qFindTxt.trim()}».`});
document.addEventListener("change",e=>{const t=e.target;
 if(t.dataset.qi){const i=items.find(a=>a.sku===t.dataset.qi),x=plate.find(a=>a.sku===t.dataset.qi);if(i&&x){x.q=r2(Math.min(i.sys,Math.max(0,x.q)));t.value=x.q;refrescarQ()}}});
function emHab(r,on){const m=r.querySelector("[data-em]"),v=r.querySelector("[data-ev]");[m,v].forEach(x=>{if(x){x.disabled=!on;if(!on)x.value=""}});if(m&&m._b)pintarSel(m);if(v&&v._b)pintarFecha(v)}
document.addEventListener("input",e=>{const t=e.target;
 if(t.id==="qFind"){qFindTxt=t.value;actualizarQFind()}
 if(t.dataset.qi){const x=plate.find(a=>a.sku===t.dataset.qi);if(x){const v=+t.value;x.q=Number.isFinite(v)?v:0;refrescarQ()}}
 if(t.dataset.qmo){const x=plate.find(a=>a.sku===t.dataset.qmo);if(x)x.m=t.value}
 if(t.dataset.q!==undefined){const r=t.closest("[data-e]"),i=items.find(a=>a.sku===r.dataset.e);emHab(r,r2(+t.value)!==i.sys)}});
const ICON_MOVE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>';
let drag=null,noClick=0;
const sobrePlato=(e,p)=>{const r=p.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
document.addEventListener("pointerdown",e=>{
 const row=e.target.closest(".qrow[data-qd]");if(!row||e.button>0)return;
 if(e.pointerType!=="mouse"&&!e.target.closest(".dgrip"))return;
 const b=row.querySelector("button");if(!b||b.disabled)return;
 drag={sku:row.dataset.qd,x:e.clientX,y:e.clientY,on:false,ghost:null,id:e.pointerId}});
addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;
 if(!drag.on){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  const i=items.find(a=>a.sku===drag.sku),g=document.createElement("div");
  g.className="dghost";g.innerHTML=ICON_MOVE+"<span>"+esc(i?i.n:"")+"</span>";
  document.body.appendChild(g);drag.ghost=g;drag.on=true;document.body.classList.add("dragging")}
 drag.ghost.style.transform=`translate(${e.clientX+14}px,${e.clientY+14}px)`;
 const p=$("qPlate");if(p)p.classList.toggle("over",sobrePlato(e,p));
 if(e.clientY<70)scrollBy(0,-14);else if(e.clientY>innerHeight-70)scrollBy(0,14)});
function finDrag(e,soltar){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;if(!d.on)return;
 d.ghost.remove();document.body.classList.remove("dragging");noClick=Date.now()+350;
 const p=$("qPlate");if(p){p.classList.remove("over");if(soltar&&sobrePlato(e,p))addPlate(d.sku)}}
addEventListener("pointerup",e=>finDrag(e,true));
addEventListener("pointercancel",e=>finDrag(e,false));
addEventListener("click",e=>{if(Date.now()<noClick){e.stopPropagation();e.preventDefault()}},true);
const delSel=new Set();
function renderDel(){const q=norm($("delFind").value),l=items.filter(i=>!q||norm(i.n).includes(q)).sort((a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"}));
 $("delList").innerHTML=l.length?l.map(i=>`<label class="dli"><input type="checkbox" data-dl="${esc(i.sku)}"${delSel.has(i.sku)?" checked":""}><span class="dtx"><b>${esc(i.n)}</b><small>${esc(i.k)} · ${i.sys>0?fm(i.sys)+" "+esc(i.u)+" en stock":"sin stock"}</small></span></label>`).join(""):'<p class="small-note">No hay alimentos que coincidan.</p>';updDel()}
function updDel(){const n=delSel.size;$("delCount").textContent=n?`${n} seleccionado${n>1?"s":""}`:"Nada seleccionado";$("delOk").disabled=!n}
function closeDel(){$("delModal").hidden=true}
$("delBtn").addEventListener("click",()=>{delSel.clear();$("delFind").value="";$("delMsg").textContent="";renderDel();$("delModal").hidden=false;$("delFind").focus()});
$("closeDel").addEventListener("click",closeDel);
bdClose($("delModal"),closeDel);
addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("delModal").hidden)closeDel()});
$("delFind").addEventListener("input",renderDel);
$("delList").addEventListener("change",e=>{const c=e.target.closest("[data-dl]");if(!c)return;c.checked?delSel.add(c.dataset.dl):delSel.delete(c.dataset.dl);updDel()});
$("delOk").addEventListener("click",()=>{if(!sinNombre())return;const L=items.filter(i=>delSel.has(i.sku));if(!L.length)return;
 const con=L.filter(i=>i.sys>0);
 if(!confirm(`¿Eliminar ${L.length} alimento${L.length>1?"s":""}?${con.length?"\nTienen stock: "+con.map(i=>i.n).join(", ")+".":""}\nNo se puede deshacer.`))return;
 L.forEach(i=>{items.splice(items.indexOf(i),1);addLog("adj",`Alimento eliminado: ${i.n.toLowerCase()}${i.sys>0?" ("+fm(i.sys)+" "+i.u+" en stock)":""}. Por ${quien()}.`)});
 plate=plate.filter(x=>items.some(i=>i.sku===x.sku));delSel.clear();closeDel();
 msg.textContent=L.length>1?`${L.length} alimentos eliminados.`:"Alimento eliminado.";renderAll()});
let adminView="menu";
const adm=t=>{const e=$("adminMsg");e.textContent=t||"";if(t)e.scrollIntoView({block:"nearest"})};
const esFijo=u=>["kokoa","joa"].includes(String(u.apodo).toLowerCase());
const AD_T={u:"Usuarios",z:"Zonas",t:"Tipos de alimentos"};
const backBtn='<button type="button" class="ghost aback" data-ad="menu">← Volver</button>';
const otrosOpts=(arr,skip,val,lab)=>arr.filter(x=>x!==skip).map(x=>`<option value="${esc(val(x))}">${esc(lab(x))}</option>`).join("");
let uQ="";const uq=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),uOk=u=>!uQ||uq([u.apodo,u.nombre,u.apellido,u.correo,u.telefono,u.rol].join(" ")).includes(uq(uQ));
function renderAdmin(){
  const B=$("adminBody"),[g,a]=adminView.split("-");
  $("newUserBtn").hidden=adminView!=="u";
  $("adminTitle").textContent=adminView==="menu"?"Editar":adminView==="u"?"Usuarios":adminView==="u-new"?"Crear usuario":AD_T[g]+": "+(a==="new"?"crear":a==="ord"?"orden":"eliminar");
  if(adminView==="menu"){
    B.innerHTML=`<p class="small-note">¿Qué quieres editar?</p><div class="pick-grid">`+
     [["z","Zonas","Lugares donde se guarda alimentos"],["t","Tipos de alimentos","Como aceites, congelados, etc."]].map(([k,l,h])=>
      `<div class="editor-card"><h3>${l}</h3><p class="small-note" style="margin:0">${h}</p><div class="pick"><button type="button" data-ad="${k}-new">Crear</button><button type="button" class="ghost danger" data-ad="${k}-del">Eliminar</button><button type="button" class="ghost" data-ad="${k}-ord">Editar orden</button></div></div>`).join("")+`</div>`;
    return}
  if(adminView==="u-new"){
    B.innerHTML=backBtn.replace('data-ad="menu"','data-ad="u"')+`<form class="aform" id="adminForm" data-f="u" autocomplete="off">
      <div class="two"><label>Usuario / apodo<input name="apodo" required maxlength="40" autocapitalize="off"></label><label>Clave (número de documento, mín. 8)<input name="cedula" type="password" required minlength="8" maxlength="72" autocapitalize="off" autocomplete="new-password"></label></div>
      <div class="two"><label>Nombre<input name="nombre" required maxlength="60"></label><label>Apellido<input name="apellido" maxlength="60"></label></div>
      <div class="two"><label>Teléfono<input name="telefono" inputmode="tel" maxlength="30"></label><label>Correo<input name="correo" type="email" maxlength="100"></label></div>
      <label>Rol<select name="rol"><option value="estudiante">Estudiante</option>${esSuper()?'<option value="admin">Admin</option>':""}</select></label>
      ${animalPicker("")}<div><button type="submit">Crear usuario</button></div></form>`;
  }else if(g==="u"){
    B.innerHTML='<input id="uFind" type="search" placeholder="Buscar usuario" aria-label="Buscar usuario" autocomplete="off" value="'+esc(uQ)+'" style="width:100%;margin:0 0 12px">'+users.map((u,n)=>{if(!uOk(u))return"";const fijo=esFijo(u),yo=u===currentUser;
      return`<div class="arow"><span class="dtx"><b>${esc(u.animal||"👤")} ${esc(u.apodo||u.nombre)}</b><small>${esc([u.nombre,u.apellido].filter(Boolean).join(" "))}${yo?" · eres tú":""}${fijo?" · admin principal":""}</small></span><select data-urol="${n}" aria-label="Rol"${yo||fijo||(!esSuper()&&u.rol!=="admin")?" disabled":""}><option value="estudiante"${u.rol==="admin"?"":" selected"}>Estudiante</option><option value="admin"${u.rol==="admin"?" selected":""}>Admin</option></select><button type="button" class="ghost danger" data-udel="${n}"${yo||fijo?" disabled":""}>Eliminar</button></div>`}).join("")+
      (users.some(uOk)?"":'<p class="small-note">Ningún usuario coincide.</p>')+'<p class="small-note">No puedes eliminarte ni cambiarte el rol a ti mismo. Kokoa siempre es admin. Solo Kokoa y Joa pueden crear o ascender admins.</p>';
  }else if(adminView==="z-ord"||adminView==="t-ord"){
    const Z=adminView==="z-ord",L=Z?cameras:CATS;
    B.innerHTML=backBtn+'<p class="small-note">Arrastra con el ícono de mover para cambiar el orden. También puedes enfocarlo y usar las flechas ↑ ↓. El orden se aplica en todas las listas y opciones.</p><div id="ordList">'+L.map((c,n)=>{const nom=Z?c.name:c,q=items.filter(i=>Z?i.z===c.id:i.k===c).length;
      return`<div class="qrow ordrow" data-od="${n}"><span class="dgrip" tabindex="0" role="button" aria-label="Mover ${esc(nom)}. Usa las flechas arriba y abajo." title="Arrastra para ordenar">${ICON_MOVE}</span><div class="zone qsel"><b>${esc(nom)}</b><small>${q} alimento${q===1?"":"s"}</small></div></div>`}).join("")+'</div>';
    return;
  }else if(adminView==="z-new"){
    B.innerHTML=backBtn+`<form class="aform" id="adminForm" data-f="z" autocomplete="off"><label>Nombre de la zona<input name="nombre" required maxlength="40" placeholder="Ej. Bodega"></label><div><button type="submit">Crear zona</button></div></form>`;
  }else if(adminView==="z-del"){
    B.innerHTML=backBtn+cameras.map((c,n)=>{const q=items.filter(i=>i.z===c.id).length,solo=cameras.length<2;
      return`<div class="arow"><span class="dtx"><b>${esc(c.name)}</b><small>${q} alimento${q===1?"":"s"}</small></span>${q&&!solo?`<select data-zdest="${n}" aria-label="Pasar los alimentos a">${otrosOpts(cameras,c,x=>x.id,x=>"Pasar a: "+x.name)}</select>`:""}<button type="button" class="ghost danger" data-zdel="${n}"${solo?" disabled":""}>Eliminar</button></div>`}).join("")+
      '<p class="small-note">Los alimentos de la zona eliminada pasan a la zona que elijas. Debe quedar al menos una zona.</p>';
  }else if(adminView==="t-new"){
    B.innerHTML=backBtn+`<form class="aform" id="adminForm" data-f="t" autocomplete="off"><div class="two"><label>Nombre del tipo<input name="nombre" required maxlength="40" placeholder="Ej. Bebidas"></label><label>Zona donde suele guardarse<select name="zona">${zoneOpts(cameras[0].id)}</select></label></div><div><button type="submit">Crear tipo</button></div></form>`;
  }else if(adminView==="t-del"){
    B.innerHTML=backBtn+CATS.map((c,n)=>{const q=items.filter(i=>i.k===c).length,solo=CATS.length<2;
      return`<div class="arow"><span class="dtx"><b>${esc(c)}</b><small>${q} alimento${q===1?"":"s"}</small></span>${q&&!solo?`<select data-tdest="${n}" aria-label="Pasar los alimentos a">${otrosOpts(CATS,c,x=>x,x=>"Pasar a: "+x)}</select>`:""}<button type="button" class="ghost danger" data-tdel="${n}"${solo?" disabled":""}>Eliminar</button></div>`}).join("")+
      '<p class="small-note">Los alimentos del tipo eliminado pasan al tipo que elijas. Debe quedar al menos un tipo.</p>';
  }
  const f=B.querySelector("input,select");if(f&&!(adminView==="u"&&matchMedia("(max-width:760px)").matches))f.focus();
}
async function openAdmin(v){if(!esAdmin())return;await cargarUsuarios();adminView=typeof v==="string"?v:"menu";uQ="";adm("");renderAdmin();$("adminModal").hidden=false}
function closeAdmin(){$("adminModal").hidden=true}
addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("adminModal").hidden)closeAdmin()});
$("adminBtn").addEventListener("click",()=>openAdmin());
$("usersBtn").addEventListener("click",()=>openAdmin("u"));
$("newUserBtn").addEventListener("click",()=>{adminView="u-new";adm("");renderAdmin()});
$("closeAdmin").addEventListener("click",closeAdmin);
bdClose($("adminModal"),closeAdmin);
function admListo(texto,log,vista){addLog("cnt",log+" Por "+quien()+".");normalizar();renderAll();adminView=vista||adminView;renderAdmin();adm("");
  const m=document.createElement("p");m.className="small-note ok";m.setAttribute("role","status");m.textContent=texto;$("adminBody").prepend(m)}
$("adminBody").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const D=b.dataset;
  if(D.ad){adminView=D.ad;adm("");renderAdmin();return}
  if(D.udel!==undefined){const n=+D.udel,u=users[n];if(!u)return;
    if(u===currentUser){adm("No puedes eliminar tu propio usuario.");return}
        if(!confirm(`¿Eliminar al usuario «${u.apodo||u.nombre}»? Ya no podrá ingresar.`))return;
    delU(n,u,`Usuario «${u.apodo||u.nombre}» eliminado.`,`Usuario eliminado: ${u.apodo||u.nombre}.`);return}
  if(D.zdel!==undefined){const n=+D.zdel,c=cameras[n];if(!c)return;
    if(cameras.length<2){adm("Debe quedar al menos una zona.");return}
    const mios=items.filter(i=>i.z===c.id),sel=$("adminBody").querySelector(`[data-zdest="${n}"]`),dest=cameras.find(x=>x.id===(sel?sel.value:""))||cameras.find(x=>x!==c);
    if(!confirm(`¿Eliminar la zona «${c.name}»?${mios.length?`\n${mios.length} alimento${mios.length>1?"s":""} pasará${mios.length>1?"n":""} a «${dest.name}».`:""}`))return;
    cameras.splice(n,1);mios.forEach(i=>{i.z=dest.id});Object.keys(CZ).forEach(k=>{if(CZ[k]===c.id)CZ[k]=dest.id});
    admListo(`Zona «${c.name}» eliminada.`+(mios.length?` ${mios.length} alimento${mios.length>1?"s pasaron":" pasó"} a «${dest.name}».`:""),`Zona ${c.name} eliminada. ${mios.length} alimentos pasaron a ${dest.name}.`);return}
  if(D.tdel!==undefined){const n=+D.tdel,c=CATS[n];if(c===undefined)return;
    if(CATS.length<2){adm("Debe quedar al menos un tipo.");return}
    const mios=items.filter(i=>i.k===c),sel=$("adminBody").querySelector(`[data-tdest="${n}"]`),dest=sel?sel.value:CATS.find(x=>x!==c);
    if(!confirm(`¿Eliminar el tipo «${c}»?${mios.length?`\n${mios.length} alimento${mios.length>1?"s":""} pasará${mios.length>1?"n":""} a «${dest}».`:""}`))return;
    CATS.splice(n,1);delete CZ[c];mios.forEach(i=>{i.k=dest});
    admListo(`Tipo «${c}» eliminado.`+(mios.length?` ${mios.length} alimento${mios.length>1?"s pasaron":" pasó"} a «${dest}».`:""),`Tipo de alimento ${c} eliminado. ${mios.length} alimentos pasaron a ${dest}.`)}
});
function moverOrden(de,a){if(window.PRM&&PRM.ordOn&&PRM.ordOn())return PRM.ordMove(de,a);const Z=adminView==="z-ord",L=Z?cameras:CATS;if(de===a||de<0||a<0||de>=L.length||a>=L.length)return false;
 const [x]=L.splice(de,1);L.splice(a,0,x);
 addLog("cnt",`Orden de ${Z?"zonas":"tipos de alimentos"} actualizado: ${Z?x.name:x} pasa al puesto ${a+1}. Por ${quien()}.`);
 normalizar();renderAll();renderAdmin();return true}
let ordDrag=null;
const ordFilas=()=>[...document.querySelectorAll("#ordList .ordrow")];
function ordDestino(y){const F=ordFilas();let k=F.length;for(let n=0;n<F.length;n++){const r=F[n].getBoundingClientRect();if(y<r.top+r.height/2){k=n;break}}return k}
function ordMarca(k){ordFilas().forEach((f,n)=>{f.classList.toggle("ord-b",n===k);f.classList.toggle("ord-a",k===ordFilas().length&&n===ordFilas().length-1)})}
document.addEventListener("pointerdown",e=>{const g=e.target.closest("#ordList .dgrip");if(!g||e.button>0)return;
 const row=g.closest(".ordrow");ordDrag={de:+row.dataset.od,x:e.clientX,y:e.clientY,on:false,ghost:null,id:e.pointerId,k:null};e.preventDefault()});
addEventListener("pointermove",e=>{if(!ordDrag||e.pointerId!==ordDrag.id)return;const d=ordDrag;
 if(!d.on){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;
  const row=ordFilas()[d.de],gh=document.createElement("div");gh.className="dghost";gh.innerHTML=ICON_MOVE+"<span>"+esc(row.querySelector("b").textContent)+"</span>";
  document.body.appendChild(gh);d.ghost=gh;d.on=true;document.body.classList.add("dragging");row.classList.add("ord-src")}
 d.ghost.style.transform=`translate(${e.clientX+14}px,${e.clientY+14}px)`;
 d.k=ordDestino(e.clientY);ordMarca(d.k);
 const m=(document.getElementById("ordList")||$("adminBody")).closest(".modal");if(m){const r=m.getBoundingClientRect();if(e.clientY<r.top+50)m.scrollTop-=14;else if(e.clientY>r.bottom-50)m.scrollTop+=14}});
function ordFin(e,soltar){if(!ordDrag||e.pointerId!==ordDrag.id)return;const d=ordDrag;ordDrag=null;if(!d.on)return;
 d.ghost.remove();document.body.classList.remove("dragging");noClick=Date.now()+350;ordFilas().forEach(f=>f.classList.remove("ord-b","ord-a","ord-src"));
 if(!soltar||d.k===null)return;let a=d.k>d.de?d.k-1:d.k;if(moverOrden(d.de,a)){const g=document.querySelector(`#ordList .ordrow[data-od="${a}"] .dgrip`);if(g)g.focus()}}
addEventListener("pointerup",e=>ordFin(e,true));addEventListener("pointercancel",e=>ordFin(e,false));
document.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest("#ordList .dgrip");if(!g||(e.key!=="ArrowUp"&&e.key!=="ArrowDown"))return;
 e.preventDefault();const de=+g.closest(".ordrow").dataset.od,a=de+(e.key==="ArrowUp"?-1:1);
 if(moverOrden(de,a)){const n=document.querySelector(`#ordList .ordrow[data-od="${a}"] .dgrip`);if(n)n.focus()}});
$("adminBody").addEventListener("submit",e=>{const f=e.target.closest("form");if(!f)return;e.preventDefault();
  const v=n=>f.elements[n]?f.elements[n].value.trim():"";
  if(f.dataset.f==="u"){const u={apodo:v("apodo"),nombre:v("nombre"),apellido:v("apellido"),telefono:v("telefono"),correo:v("correo"),animal:v("animal")},ced=v("cedula");
    if(!u.apodo||!ced||!u.nombre||!u.animal){adm("Falta apodo, clave, nombre o animal.");return}
    if(users.some(x=>igual(x.apodo,u.apodo))){adm("Ese usuario ya existe.");return}
    u.rol=v("rol")==="admin"&&esSuper()?"admin":"estudiante";
    crearU(u,ced,()=>admListo(`Usuario «${u.apodo}» creado como ${u.rol}.`,`Usuario creado: ${u.apodo} (${u.rol}).`,"u"))}
  else if(f.dataset.f==="z"){const nom=v("nombre");if(!nom){adm("Escribe el nombre de la zona.");return}
    if(cameras.some(c=>norm(c.name)===norm(nom))){adm("Ya existe una zona con ese nombre.");return}
    let n=1;while(cameras.some(c=>c.id==="Z"+n))n++;
    cameras.push({id:"Z"+n,name:nom,temp:"",max:"",bad:false});admListo(`Zona «${nom}» creada.`,`Zona creada: ${nom}.`,"menu")}
  else if(f.dataset.f==="t"){const nom=v("nombre"),zn=v("zona");if(!nom){adm("Escribe el nombre del tipo.");return}
    if(CATS.some(c=>norm(c)===norm(nom))){adm("Ya existe un tipo con ese nombre.");return}
    CATS.push(nom);CZ[nom]=cameras.some(c=>c.id===zn)?zn:cameras[0].id;admListo(`Tipo «${nom}» creado.`,`Tipo de alimento creado: ${nom}.`,"menu")}
});
const CRC32=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^c>>>1:c>>>1;t[n]=c>>>0}
 return b=>{let c=-1;for(let i=0;i<b.length;i++)c=t[(c^b[i])&255]^c>>>8;return(c^-1)>>>0}})();
function zipTienda(arch){const E=new TextEncoder(),w16=(a,n)=>a.push(n&255,n>>8&255),w32=(a,n)=>a.push(n&255,n>>>8&255,n>>>16&255,n>>>24&255),loc=[],cen=[];let off=0;
 arch.forEach(f=>{const nm=E.encode(f.n),d=E.encode(f.d),crc=CRC32(d),h=[],c=[];
  w32(h,0x04034b50);w16(h,20);w16(h,0x0800);w16(h,0);w16(h,0);w16(h,33);w32(h,crc);w32(h,d.length);w32(h,d.length);w16(h,nm.length);w16(h,0);
  w32(c,0x02014b50);w16(c,20);w16(c,20);w16(c,0x0800);w16(c,0);w16(c,0);w16(c,33);w32(c,crc);w32(c,d.length);w32(c,d.length);w16(c,nm.length);w16(c,0);w16(c,0);w16(c,0);w16(c,0);w32(c,0);w32(c,off);
  loc.push(Uint8Array.from(h),nm,d);cen.push(Uint8Array.from(c),nm);off+=h.length+nm.length+d.length});
 const e=[];w32(e,0x06054b50);w16(e,0);w16(e,0);w16(e,arch.length);w16(e,arch.length);w32(e,cen.reduce((t,a)=>t+a.length,0));w32(e,off);w16(e,0);
 return new Blob([...loc,...cen,Uint8Array.from(e)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
const xe=t=>String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const colL=n=>{let t="";for(n++;n>0;n=Math.floor((n-1)/26))t=String.fromCharCode(65+(n-1)%26)+t;return t};
function xc(v,r,c,head){const ref=colL(c)+(r+1),st=head?' s="1"':"";
 if(typeof v==="number"&&Number.isFinite(v))return`<c r="${ref}"${st}><v>${v}</v></c>`;
 const t=String(v??"");return t===""?"":`<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${xe(t)}</t></is></c>`}
function xHoja(h,rows){const all=[h,...rows],W=h.map((_,c)=>Math.min(60,Math.max(10,...all.map(r=>String(r[c]??"").length+2))));
 return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${W.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${all.map((r,i)=>`<row r="${i+1}">${r.map((v,c)=>xc(v,i,c,i===0)).join("")}</row>`).join("")}</sheetData></worksheet>`}
const XH='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',NSR="http://schemas.openxmlformats.org/officeDocument/2006/relationships",NSP="http://schemas.openxmlformats.org/package/2006/relationships";
const XSTYLES=XH+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCFE6D6"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function xlsxBlob(hojas){const nm=hojas.map((x,i)=>xe(x.name.replace(/[\[\]:*?\/\\]/g," ").slice(0,31)||"Hoja"+(i+1)));
 return zipTienda([
  {n:"[Content_Types].xml",d:XH+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+hojas.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")+'</Types>'},
  {n:"_rels/.rels",d:XH+`<Relationships xmlns="${NSP}"><Relationship Id="rId1" Type="${NSR}/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
  {n:"xl/workbook.xml",d:XH+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${NSR}"><sheets>`+nm.map((n,i)=>`<sheet name="${n}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")+'</sheets></workbook>'},
  {n:"xl/_rels/workbook.xml.rels",d:XH+`<Relationships xmlns="${NSP}">`+hojas.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${NSR}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")+`<Relationship Id="rId${hojas.length+1}" Type="${NSR}/styles" Target="styles.xml"/></Relationships>`},
  {n:"xl/styles.xml",d:XSTYLES},
  ...hojas.map((x,i)=>({n:`xl/worksheets/sheet${i+1}.xml`,d:xHoja(x.h,x.r)}))])}
function datosExport(){
 const Hj=(name,h,r)=>({name,h,r}),lotesDe=L=>L.flatMap(i=>lotsOf(i).map(l=>[i.sku,i.n,l.q,i.u,fechaExp(l.exp)||"Sin vencimiento"])),
  D=c=>(QDEST.find(x=>x.k===c)||{l:c}).l;
 if(sec===0){const l=items.filter(i=>i.sys>0&&(qZona==="*"||i.z===qZona)&&(qTipo==="*"||i.k===qTipo)&&hitA(i)).sort(ordenQuitar),otros=qMode==="otros";
  return{slug:"comidas",hojas:[
   Hj("Alimentos disponibles",["Alimento","Tipo","Zona","Unidad","Disponible","En el plato","Vence más pronto"],l.map(i=>[i.n,i.k,zonaNombre(i.z),i.u,i.sys,enPlato(i.sku),fechaExp(i.exp)])),
   Hj("Plato",["Destino","Alimento","Cantidad","Unidad","Motivo"],plate.map(x=>{const i=items.find(a=>a.sku===x.sku);return[D(qMode),i?i.n:x.sku,x.q,i?i.u:"",otros?x.m:""]})),
   Hj("Últimas comidas",["Fecha y hora","Tipo","Alimento","Cantidad","Unidad","Motivo","Vence (lote)","Responsable"],comidas.slice(0,10).flatMap(c=>c.it.map(x=>[fechaHora(c.t),D(c.k),x.n,x.q,x.u,x.m||"",x.v||"",c.por])))]}}
 if(sec===1){let l=items.filter(i=>pasaF(i)&&okVista(i)&&hitA(i));
  l.sort(fOrden?ordQ:invLayout==="grid"?(a,b)=>CATS.indexOf(a.k)-CATS.indexOf(b.k)||a.n.localeCompare(b.n,"es",{sensitivity:"base"}):(a,b)=>a.n.localeCompare(b.n,"es",{sensitivity:"base"}));
  const est=i=>{const e=estado(i);return sinRojo(i)||e.sin?"Sin stock":e.low?"Bajo el mínimo":e.venc?"Vence en 3 días":"En rango"};
  return{slug:"inventario",hojas:[
   Hj("Inventario",["Código","Alimento","Tipo","Zona","Unidad","Cantidad","Mínimo","Estado","Vence más pronto"],l.map(i=>[i.sku,i.n,i.k,zonaNombre(i.z),i.u,i.sys,i.min,est(i),fechaExp(i.exp)])),
   Hj("Lotes",["Código","Alimento","Cantidad","Unidad","Vence"],lotesDe(l)),
   Hj("Últimas entradas",["Fecha y hora","Alimento","Cantidad","Unidad","Motivo","Por"],mov.filter(m=>m.d>0).sort((a,b)=>b.t-a.t).slice(0,10).map(m=>[fechaHora(m.t),m.n,m.d,m.u,m.w||"",m.p||""]))]}}
 if(sec===3)return{slug:"pedido",hojas:[Hj("Pedido sugerido",["Alimento","Zona","Sistema","Mínimo","Pedir","Unidad"],pedido().map(i=>[i.n,zonaNombre(i.z),i.sys,i.min,falta(i),i.u]))]};
 if(sec===4){const{B,M,ti,to}=datosGraf();let acc=0;
  const sel=gi==="*"?(gm==="t"?"Todos los tipos de alimento":"Todos los alimentos"):(gm==="t"?gi:(items.find(i=>i.sku===gi)||{n:gi}).n);
  return{slug:"graficos",hojas:[
   Hj("Resumen",["Dato","Valor"],[["Vista",gm==="t"?"Por tipo de alimento":"Por alimento"],["Selección",sel],["Período",{d:"Hoy",s:"7 días",m:"30 días"}[gp]],["Se puso",r2(ti)],["Se quitó",r2(to)],["Movimientos",M.length],...(gi==="*"?[["Nota","Con todos los alimentos se suman kg, L y unidades."]]:[])]),
   Hj("Gráfico",["Período","Se puso","Se quitó","Neto","Balance acumulado"],B.map(b=>{acc+=b.net;return[b.n,r2(b.i),r2(b.o),r2(b.net),r2(acc)]})),
   Hj("Últimos movimientos",["Fecha y hora","Alimento","Tipo","Cantidad","Unidad","Motivo"],M.slice().sort((a,b)=>b.t-a.t).slice(0,10).map(m=>[fechaHora(m.t),m.n,m.d>0?"Se puso":"Se quitó",Math.abs(m.d),m.u,m.w||""]))]}}
 return{slug:"movimientos",hojas:[Hj("Movimientos",["Fecha y hora","Tipo","Detalle"],logData.map(e=>[e.ts?fechaHora(e.ts):e.t,{cnt:"Entrada o cambio",adj:"Salida o ajuste"}[e.k]||e.k,e.x]))]}}
const dlP=(()=>{try{return window.claude&&typeof window.claude.use==="function"?Promise.resolve(window.claude.use("downloads")).catch(()=>null):Promise.resolve(null)}catch(_){return Promise.resolve(null)}})();
async function guardarArchivo(nombre,blob){
 const dl=await Promise.race([dlP,new Promise(r=>setTimeout(()=>r(null),2500))]);
 if(dl){try{await dl.save({filename:nombre,data:blob});return"ok"}catch(e){const c=e&&e.code;if(c==="declined")return"no";if(c==="rate_limited")return"espera"}}
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nombre;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return"ok"}
let exportando=false;
async function exportExcel(completo){if(!currentUser||exportando||!esAdmin())return;
 let X;try{X=completo===true?await histExport():window.CNT&&CNT.on()?CNT.datosExport():window.PRM&&PRM.on()?PRM.datosExport():datosExport()}catch(_){msg.textContent="No se pudo leer el historial completo. Intenta de nuevo.";return}
 const hojas=X.hojas.filter(h=>h.r.length);
 if(!hojas.length){msg.textContent="No hay datos para exportar en esta pantalla.";return}
 exportando=true;$("exp").disabled=true;
 try{const nombre=`kokoa-${X.slug}-${new Date().toLocaleDateString("sv-SE")}.xlsx`,r=await guardarArchivo(nombre,xlsxBlob(hojas));
  msg.textContent=r==="ok"?"Exportado: "+nombre:r==="no"?"Exportación cancelada.":"Espera un momento y vuelve a intentarlo."}
 catch(_){msg.textContent="No se pudo exportar. Intenta de nuevo."}
 finally{exportando=false;$("exp").disabled=false}}
$("exp").addEventListener("click",()=>exportExcel());
/* ---- Historial: borrar (solo admins), exportar completo y aviso anual ---- */
async function traerTodo(n,o){let a=[],d=0;for(;;){const r=ck(await SB.from(n).select("*").order(o,{ascending:false}).range(d,d+999));a=a.concat(r.data);if(r.data.length<1000)break;d+=1000}return a}
async function histExport(){
 const [m,c,b,pr,pi,pe]=await Promise.all([traerTodo("movimientos","t"),traerTodo("comidas","t"),traerTodo("bitacora","t"),traerTodo("prestamos","id"),traerTodo("prestamo_items","id"),traerTodo("prestamo_eventos","t")]),pn=new Map(pr.map(x=>[x.id,x.numero]));
 const H=(name,h,r)=>({name,h,r});
 return{slug:"historial-completo",hojas:[
  H("Movimientos",["Fecha y hora","Tipo","Detalle","Por"],b.map(e=>[fechaHora(Date.parse(e.t)),{cnt:"Entrada o cambio",adj:"Salida o ajuste"}[e.clase]||e.clase,e.texto,e.apodo||""])),
  H("Entradas y salidas",["Fecha y hora","Código","Alimento","Tipo","Cantidad","Unidad","Motivo","Por"],m.map(e=>[fechaHora(Date.parse(e.t)),e.sku,e.nombre,e.tipo,+e.delta,e.unidad,e.motivo||"",e.apodo||""])),
  H("Comidas",["Fecha y hora","Destino","Nombre","Alimentos","Por"],c.map(e=>[fechaHora(Date.parse(e.t)),e.tipo,e.nombre||"",(e.items||[]).map(x=>(x.n||x.sku)+" "+fm(+x.q||0)).join(", "),e.apodo||""])),
  H("Préstamos",["Número","Salida","Prestatario","Documento","Teléfono","Estado","Entregó","Notas"],pr.map(x=>[x.numero,fechaHora(Date.parse(x.salida)),x.nombre,x.documento,x.telefono||"",x.estado,x.entregado_por||"",x.notas||""])),
  H("Implementos prestados",["Préstamo","Implemento","Código","Condición al salir","Devolver antes de","Devuelto","Condición al regresar","Limpio","Novedad","Recibió"],pi.map(x=>[pn.get(x.prestamo_id)||"",x.nombre||"",x.codigo||"",x.cond_salida||"",fechaHora(Date.parse(x.vence)),x.devuelto?fechaHora(Date.parse(x.devuelto)):"",x.cond_regreso||"",x.devuelto?(x.limpio?"Sí":"No"):"",x.novedad||"",x.recibido_por||""])),
  H("Movimientos de préstamos",["Fecha y hora","Tipo","Número","Detalle","Por"],pe.map(x=>[fechaHora(Date.parse(x.t)),x.tipo,x.numero||"",x.detalle||"",x.apodo||""]))]}}
async function borrarHist(tabla,id){
 if(!esAdmin()||!listo)return;
 if(id){if(!confirm("¿Borrar este registro del historial?\nEl stock del inventario no cambia."))return}
 else{if(!confirm("¿Borrar TODO el historial de ALIMENTOS (movimientos, comidas y bitácora)?\n\nEl inventario y su stock no cambian. No afecta a préstamos. No se puede deshacer.\n\n¿Ya exportaste los datos?"))return;
  if(!confirm("Última confirmación: se borrará todo el historial de alimentos. ¿Continuar?"))return}
 try{ck(await SB.rpc("borrar_historial",{p_tabla:tabla,p_id:id?+id:null}));if(!id){if(tabla==="todo"||tabla==="movimientos")mov.length=0;if(tabla==="todo"||tabla==="comidas")comidas.length=0;if(tabla==="todo"||tabla==="bitacora")logData.length=0}await recargar();msg.textContent=id?"Registro borrado.":"Historial borrado."}
 catch(x){aviso("No se pudo borrar: "+(x.message||x))}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-hdel],#histAll");if(!b)return;
 if(b.id==="histAll")borrarHist("todo",null);else borrarHist(b.dataset.hdel,b.dataset.hid)});
const hoyClave=()=>new Date().toLocaleDateString("sv-SE");
function renderPurga(){const a=$("purgaAviso");if(!a)return;
 const n=new Date(),en=n.getMonth()===3&&n.getDate()>=24;let visto="";try{visto=localStorage.getItem("kokoa-purga-visto")||""}catch(_){}
 if(!en||!currentUser||!esAdmin()||visto===hoyClave()){a.hidden=true;return}
 const d=31-n.getDate();
 $("purgaTxt").innerHTML=`<b>Aviso:</b> el 1 de mayo se borrará automáticamente todo el historial de alimentos (movimientos, comidas y bitácora) y de préstamos (préstamos cerrados, devoluciones y movimientos). El inventario y los préstamos en curso no se tocan. ${d===1?"Es <b>mañana</b>.":"Faltan <b>"+d+" días</b>."} Exporta los datos antes: pulsa «Exportar ahora».`;
 a.hidden=false}
$("purgaOk").addEventListener("click",()=>{try{localStorage.setItem("kokoa-purga-visto",hoyClave())}catch(_){}renderPurga()});
$("purgaExp").addEventListener("click",()=>{if(!esAdmin())return;sec=5;renderAll();exportExcel(true)});

function renderScanList(){const inp=$("scan");if(!inp)return;
 if(window.CNT&&CNT.on()){inp.placeholder="Buscar asiento";inp.setAttribute("aria-label","Buscar asiento");return}
 if(window.PRM&&PRM.on()){inp.placeholder="Buscar implemento";inp.setAttribute("aria-label","Buscar implemento");return}
 inp.placeholder="Buscar alimento";inp.setAttribute("aria-label","Buscar alimento")}
/* Búsqueda de alimentos: igual que la de préstamos. Filtra en vivo la lista de la sección actual
   (Quitar o Inventario) y, desde otra sección, lleva al Inventario ya filtrado. */
function buscarA(v){aq=v||"";
 if(sec===0){renderQuitar();return}
 if(sec!==1){if(!aq.trim())return;sec=1;vista="todos";zona="*";fTipo="*";renderAll();return}
 renderCats()}
{let _bt=0;$("scan").addEventListener("input",()=>{clearTimeout(_bt);_bt=setTimeout(()=>{if(!(window.PRM&&PRM.on())&&!(window.CNT&&CNT.on()))buscarA($("scan").value)},130)})}
$("scanForm").addEventListener("submit",e=>{e.preventDefault();if(window.CNT&&CNT.on()){CNT.buscar($("scan").value);return}if(window.PRM&&PRM.on()){PRM.buscar($("scan").value);return}buscarA($("scan").value)});
$("bell").addEventListener("click",()=>{alOpen=!alOpen;pintarAl();if(alOpen)$("aClose").focus()});
const cerrarAl=()=>{alOpen=false;pintarAl();$("bell").focus()};
$("aClose").addEventListener("click",cerrarAl);$("alertBack").addEventListener("click",cerrarAl);
addEventListener("keydown",e=>{if(e.key==="Escape"&&alOpen)cerrarAl()});
function addMatch(){const q=norm($("aN").value);return{q,exact:q?items.find(i=>norm(i.n)===q):null,sug:q?items.filter(i=>{const n=norm(i.n);return n.includes(q)||q.includes(n)}).slice(0,6):[]}}
function hayAdd(){$("aCancel").hidden=![...$("addForm").elements].some(e=>e.tagName==="INPUT"?e.value!==e.defaultValue:e.tagName==="SELECT"?e.selectedIndex>0:false)}
function actualizarAdd(){hayAdd();const{q,exact,sug}=addMatch(),b=$("aSug");
 document.querySelectorAll("#addForm [data-new]").forEach(e=>e.hidden=!!exact);
 document.querySelector("#addForm [data-old]").hidden=!exact;
 if(!$("aMo").options.length)$("aMo").innerHTML=opts(MOTIVOS_ADD);
 $("aBtn").textContent=exact?"Agregar al stock":"Crear alimento";
 if(!q){b.hidden=true;b.innerHTML="";return}
 b.hidden=false;
 b.innerHTML=(exact?`<span class="ok">Ya existe: <b>${esc(exact.n)}</b>, ${fm(exact.sys)} ${exact.u} en ${esc(zonaNombre(exact.z))}. Se suma como lote nuevo con su propio vencimiento.</span>`:"<span>No existe: se creará como alimento nuevo.</span>")+(!exact&&sug.length?`<span class="chips">Sugerencias:${sug.map(i=>`<button type="button" class="sg" data-asug="${esc(i.sku)}">${esc(i.n)}</button>`).join("")}</span>`:"")}
$("aN").addEventListener("input",actualizarAdd);
["input","change"].forEach(t=>$("addForm").addEventListener(t,hayAdd));$("addForm").addEventListener("reset",()=>setTimeout(hayAdd));
$("aCancel").addEventListener("click",()=>{$("addForm").reset();actualizarAdd();msg.textContent="";$("aN").focus()});
$("addForm").addEventListener("submit",e=>{e.preventDefault();if(!sinNombre())return;
 const n=$("aN").value.trim();if(!n)return;
 const{exact,sug}=addMatch(),q=r2(+$("aQ").value||0),ex=$("aE").value||null;
 if(exact){const i=exact;
  if(!(q>0)){msg.textContent=`Escribe cuánto ${i.n} agregar al stock.`;$("aQ").focus();return}
  const mot=$("aMo").value||MOTIVOS_ADD[0],antes=i.sys;sumarLote(i,q,ex);i.c=null;
  mv(i,q,"Entrada: "+mot.toLowerCase());
  addLog("cnt",`Entrada de ${q} ${i.u} de ${i.n.toLowerCase()}: de ${antes} a ${i.sys}. Motivo: ${mot.toLowerCase()}.${ex?" Vence "+fechaExp(ex)+".":""} Por ${quien()}.`);
  msg.textContent=""}
 else{
  if(sug.length&&!confirm(`«${n}» no existe. Hay alimentos parecidos: ${sug.map(i=>i.n).join(", ")}.\n¿Crear «${n}» como alimento nuevo?`))return;
  const k=$("aC").value,u=$("aU").value,mn=r2(+$("aMn").value||0),sku=(()=>{const f=n=>"2199-"+String(n).padStart(4,"0");let n=items.length+1;while(items.some(a=>a.sku===f(n)))n++;return f(n)})();
  items.push({sku,n,k,u,exp:ex,z:cameras.some(c=>c.id===CZ[k])?CZ[k]:cameras[0].id,sys:q,min:mn,c:null,lots:q>0?[{q,exp:ex||null}]:[]});
  if(q)mv(items[items.length-1],q,"Alta de alimento");
  addLog("cnt",`Alta de ${n.toLowerCase()} en ${k.toLowerCase()}: ${q} ${u}, mínimo ${mn}. Por ${quien()}.`);
  msg.textContent=""}
 $("addForm").reset();renderAll()});
const bloquear=v=>["header","views","wrap"].forEach(id=>{const e=id==="header"?document.querySelector("header"):$(id);if(e)e.inert=v});
function showAuth(){if(saliendo)return;document.body.classList.add("locked");bloquear(true);$("authGate").hidden=false;$("loginUser").focus()}
function enterUser(u){currentUser=u;$("loggedUser").textContent=u.apodo||u.nombre;$("meEmoji").textContent=u.animal||"👤";$("authGate").hidden=true;document.body.classList.remove("locked");bloquear(false);$("loginKey").value="";$("adminBtn").hidden=u.rol!=="admin";$("usersBtn").hidden=u.rol!=="admin";$("exp").hidden=u.rol!=="admin";$("meDel").hidden=u.rol!=="admin";renderAll()}
/*salir-v2*/var salida=null,saliendo=false;
function logout(){
  listo=false;if(canal){SB.removeChannel(canal);canal=null}salida=quitarPushServidor().finally(()=>SB.auth.signOut());
  currentUser=null;$("exp").hidden=true;$("adminBtn").hidden=true;$("usersBtn").hidden=true;datosAl=false;disT={};gone=[];DKEY="";users=[];[items,mov,comidas,logData].forEach(a=>a.splice(0));known=new Set();fp={};
  $("loginUser").value="";$("loginKey").value="";$("loginError").textContent="";
  $("meModal").hidden=true;$("adminModal").hidden=true;$("delModal").hidden=true;["tpModal","pdelModal","tkModal","rcModal","rtModal"].forEach(id=>{const e=$(id);if(e)e.hidden=true});$("adminBody").innerHTML="";
  showAuth();renderAll()}
const igual=(a,b)=>String(a??"").trim().localeCompare(String(b??"").trim(),"es",{sensitivity:"accent"})===0;
function despedida(){
  if(!document.getElementById("adios-css")){const st=document.createElement("style");st.id="adios-css";st.textContent=
  "#adios{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;text-align:center;color:#fff;background:linear-gradient(135deg,#214d2c,#397247);opacity:0;visibility:hidden;transition:opacity .45s cubic-bezier(.2,.8,.2,1),visibility 0s .45s}"+
  "#adios.on{opacity:1;visibility:visible;transition-delay:0s}"+
  "#adios .adios-in{padding:24px;transform:translateY(14px) scale(.96);transition:transform .6s cubic-bezier(.2,.8,.2,1) .1s}"+
  "#adios.on .adios-in{transform:none}"+
  "#adios img{display:block;margin:0 auto;width:96px;height:96px;border-radius:22px;box-shadow:0 18px 40px -14px rgba(0,0,0,.5)}"+
  "#adios h2{margin:18px 0 6px;font-size:28px;line-height:1.15}#adios p{margin:0;opacity:.85}"+
  "@media (prefers-reduced-motion:reduce){#adios,#adios .adios-in{transition:none}}";document.head.appendChild(st)}
  const d=document.createElement("div");d.id="adios";d.setAttribute("role","status");d.setAttribute("aria-live","polite");
  d.innerHTML='<div class="adios-in"><img src="icons/icon-192.png" alt="" width="96" height="96"><h2>¡Hasta pronto!</h2><p>Cerrando sesión…</p></div>';
  document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add("on")));return d}
$("logoutBtn").addEventListener("click",()=>{
  if(saliendo)return;saliendo=true;despedida();logout();
  const quieto=matchMedia("(prefers-reduced-motion:reduce)").matches;
  Promise.all([Promise.race([Promise.resolve(salida).catch(()=>{}),new Promise(r=>setTimeout(r,2500))]),new Promise(r=>setTimeout(r,quieto?300:1400))]).finally(()=>location.replace("../"))});
const meF=$("meForm"),meMsg=t=>{$("meMsg").textContent=t||""};
function closeMe(){$("meModal").hidden=true}
$("meBtn").addEventListener("click",()=>{const u=currentUser;if(!u)return;$("meAnimal").innerHTML=animalPicker(u.animal||"");
 ["apodo","nombre","apellido","telefono","correo"].forEach(k=>{meF.elements[k].value=u[k]||""});meF.elements.cedula.value="";meMsg("");$("meDel").hidden=esFijo(u);$("meModal").hidden=false});
$("closeMe").addEventListener("click",closeMe);bdClose($("meModal"),closeMe);
addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("meModal").hidden)closeMe()});
const pedido=()=>items.filter(i=>i.sys<i.min).sort((a,b)=>a.sys/a.min-b.sys/b.min);
function renderPedido(){const p=pedido();$("ped").innerHTML=p.length?p.map(i=>`<tr class="${i.sys<=0?"ns u":""}"><td class="nm"><b>${esc(i.n)}</b>${i.sys<=0?'<div class="low">Sin stock</div>':""}</td><td data-label="Zona">${esc(zonaNombre(i.z))}</td><td class="r" data-label="Sistema">${fm(i.sys)} ${i.u}</td><td class="r" data-label="Mínimo">${fm(i.min)}</td><td class="r num" data-label="Pedir">${fm(falta(i))} ${i.u}</td></tr>`).join(""):`<tr><td colspan="5">No hay nada que pedir. Todo está sobre el mínimo.</td></tr>`;$("cp").disabled=!p.length}
function normalizar(){items.forEach(asegurarLotes);items.forEach(i=>{if(i.k&&!CATS.includes(i.k))CATS.push(i.k)});if(!cameras.length)cameras.push({id:"A",name:"Zona",temp:"",max:"",bad:false});
  const ok=id=>cameras.some(c=>c.id===id);items.forEach(i=>{if(!ok(i.z))i.z=cameras[0].id});if(zona!=="*"&&!ok(zona))zona="*";if(fTipo!=="*"&&!CATS.includes(fTipo))fTipo="*";if(qZona!=="*"&&!ok(qZona))qZona="*";if(qTipo!=="*"&&!CATS.includes(qTipo))qTipo="*"}
normalizar();
const SB_URL="https://wqpwqiwkvwdfcvywatmc.supabase.co",SB_KEY="sb_publishable_16usfkk9hH5DyHxY7KGS_Q_YDqcmdXD";
const SB=supabase.createClient(SB_URL,SB_KEY),expLote={};
let known=new Set(),fp={},fpZ="",gen=0,cola=Promise.resolve(),recT=0,canal=null,listo=false;
const esAdmin=()=>!!currentUser&&currentUser.rol==="admin",esSuper=()=>esAdmin()&&["kokoa","joa"].includes(String(currentUser.apodo).toLowerCase()),ck=r=>{if(r.error)throw r.error;return r};
const perfilDe=r=>({id:r.id,apodo:r.apodo,nombre:r.nombre||"",apellido:r.apellido||"",telefono:r.telefono||"",correo:r.correo||"",animal:r.animal||"",rol:r.rol});
const itFp=i=>JSON.stringify([i.n,i.k,i.u,i.z,i.exp||null,i.min,i.c]),zFp=()=>JSON.stringify([cameras,CATS,CZ]);
const zDe=k=>cameras.some(c=>c.id===CZ[k])?CZ[k]:cameras[0].id;
const aviso=t=>{msg.textContent=t};
async function cargar(noP){
  const g0=gen,T=(n,o,l)=>{let q=SB.from(n).select("*").order(o,{ascending:o==="nombre"||o==="orden"});return l?q.limit(l):q};
  const [a,m,c,b,z,t]=(await Promise.all([T("alimentos","nombre"),T("movimientos","t",5000),T("comidas","t",200),T("bitacora","t",300),T("zonas","orden"),T("tipos","orden")])).map(ck);
  if(g0!==gen)return cargar(noP);
  items.splice(0,items.length,...a.data.map(r=>({sku:r.sku,n:r.nombre,k:r.tipo,u:r.unidad,exp:r.vence,z:r.zona,sys:+r.stock,min:+r.minimo,c:r.conteo==null?null:+r.conteo,lots:(r.lotes||[]).map(l=>({q:+l.q,exp:l.exp||null}))})));
  mov.splice(0,mov.length,...m.data.reverse().map(r=>({t:Date.parse(r.t),s:r.sku,n:r.nombre,k:r.tipo,u:r.unidad,d:+r.delta,w:r.motivo||"",p:r.apodo||"",id:r.id,_s:1})));movSku=null;
  comidas.splice(0,comidas.length,...c.data.map(r=>({t:Date.parse(r.t),k:r.tipo,nom:r.nombre||"",it:r.items||[],por:r.apodo||"",n:false,id:r.id,_s:1})));
  logData.splice(0,logData.length,...b.data.map(r=>({t:new Date(r.t).toTimeString().slice(0,5),ts:Date.parse(r.t),k:r.clase,n:false,x:r.texto,id:r.id,_s:1})));
  if(z.data.length)cameras=z.data.map(r=>({id:r.id,name:r.nombre,temp:r.temp||"",max:r.max||"",bad:!!r.mala}));
  if(t.data.length){CATS.splice(0,CATS.length,...t.data.map(r=>r.nombre));Object.keys(CZ).forEach(k=>delete CZ[k]);t.data.forEach(r=>{CZ[r.nombre]=r.zona})}
  normalizar();known=new Set(items.map(i=>i.sku));fp={};items.forEach(i=>fp[i.sku]=itFp(i));fpZ=zFp();
  if(window.PRM&&!noP)try{await PRM.load()}catch(_){}
  datosAl=true;sync=1;try{renderAll()}finally{sync=0}
}
async function recargar(noP){if(!currentUser||!listo)return;try{await cola;await cargar(noP===true)}catch(e){aviso("No se pudo actualizar: "+(e.message||e))}}
async function empujar(){
  const adm=esAdmin(),zmod=adm&&zFp()!==fpZ,ap=currentUser.apodo,fallos=[];let hizo=false;
  const w=()=>{if(!hizo){hizo=true;syncEstado("Guardando…","")}};
  const paso=async f=>{try{await f()}catch(e){fallos.push(e.message||String(e))}};
  if(zmod)await paso(async()=>{w();
    ck(await SB.from("zonas").upsert(cameras.map((c,n)=>({id:c.id,nombre:c.name,temp:c.temp,max:c.max,mala:c.bad,orden:n}))));
    ck(await SB.from("tipos").upsert(CATS.map((k,n)=>({nombre:k,zona:zDe(k),orden:n}))))});
  const nuevos=items.filter(i=>!known.has(i.sku));
  if(nuevos.length)await paso(async()=>{w();ck(await SB.from("alimentos").insert(nuevos.map(i=>({sku:i.sku,nombre:i.n,tipo:i.k,unidad:i.u,zona:i.z,vence:i.exp||null,minimo:i.min,conteo:i.c}))));nuevos.forEach(i=>{known.add(i.sku);fp[i.sku]=itFp(i)})});
  for(const m of mov){if(m._s)continue;
    await paso(async()=>{w();const it=items.find(i=>i.sku===m.s),ex=expLote[m.s]!==undefined?expLote[m.s]:(it&&it.exp)||null;
      ck(await SB.rpc("registrar_movimiento",{p_sku:m.s,p_delta:m.d,p_motivo:m.w||"",p_vence:m.d>0?ex:null}));m._s=1;delete expLote[m.s]})}
  const lg=logData.filter(e=>!e._s).reverse();
  if(lg.length)await paso(async()=>{w();ck(await SB.from("bitacora").insert(lg.map(e=>({clase:e.k,texto:e.x,apodo:ap}))));lg.forEach(e=>e._s=1)});
  const cm=comidas.filter(e=>!e._s).reverse();
  if(cm.length)await paso(async()=>{w();ck(await SB.from("comidas").insert(cm.map(e=>({tipo:e.k,nombre:e.nom,items:e.it,apodo:ap}))));cm.forEach(e=>e._s=1)});
  for(const i of items)if(known.has(i.sku)&&fp[i.sku]!==itFp(i))
    await paso(async()=>{w();ck(await SB.from("alimentos").update({nombre:i.n,tipo:i.k,unidad:i.u,zona:i.z,vence:i.exp||null,minimo:i.min,conteo:i.c}).eq("sku",i.sku));fp[i.sku]=itFp(i)});
  const vivos=new Set(items.map(i=>i.sku)),borrar=[...known].filter(s=>!vivos.has(s));
  if(borrar.length)await paso(async()=>{w();ck(await SB.from("alimentos").delete().in("sku",borrar));borrar.forEach(s=>{known.delete(s);delete fp[s]})});
  if(zmod)await paso(async()=>{
    const kt=ck(await SB.from("tipos").select("nombre")),kz=ck(await SB.from("zonas").select("id"));
    const dt=kt.data.map(r=>r.nombre).filter(n=>!CATS.includes(n)),dz=kz.data.map(r=>r.id).filter(n=>!cameras.some(c=>c.id===n));
    if(dt.length)ck(await SB.from("tipos").delete().in("nombre",dt));
    if(dz.length)ck(await SB.from("zonas").delete().in("id",dz));
    fpZ=zFp()});
  if(fallos.length)throw new Error(fallos[0]);
  if(hizo)syncEstado("Guardado ✓","ok")
}
function guardar(){
  if(sync||!listo||!currentUser)return;gen++;
  cola=cola.then(empujar).catch(e=>{syncEstado("No se pudo guardar: "+(e.message||e)+". Se recargó el inventario desde el servidor.","err");return cargar().catch(()=>{})})}
const pendT=new Set(),TP=["implementos","prestamos","prestamo_items","prestamo_eventos","tipos_implemento","estados_implemento"],TA=["alimentos","movimientos","comidas","bitacora","zonas","tipos"];
/* Recarga solo lo que cambió: alimentos o préstamos (antes cada cambio recargaba todo) */
async function recargarSel(t){if(!currentUser||!listo)return;
  if(t.every(n=>TP.includes(n))){if(!window.PRM)return;try{await cola;await PRM.load();sync=1;try{renderAll()}finally{sync=0}}catch(e){aviso("No se pudo actualizar: "+(e.message||e))}return}
  await recargar(t.every(n=>TA.includes(n)))}
function enVivo(){
  if(canal)SB.removeChannel(canal);
  canal=SB.channel("kokoa").on("postgres_changes",{event:"*",schema:"public"},p=>{pendT.add(p&&p.table||"?");clearTimeout(recT);recT=setTimeout(()=>{const t=[...pendT];pendT.clear();recargarSel(t)},300)})
   .subscribe(s=>{if(s==="CHANNEL_ERROR"||s==="TIMED_OUT")aviso("Sin conexión en vivo. Reintentando…");if(s==="SUBSCRIBED")recargar()})}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)recargar()});
addEventListener("online",recargar);
async function entrar(user){
  listo=false;
  const r=await SB.from("perfiles").select("*").eq("id",user.id).single();
  if(r.error||!r.data)throw new Error("No existe tu perfil");
  const u=perfilDe(r.data);users=[u];
  datosAl=false;loadDis(u.id);
  enterUser(u);await cargar();listo=true;enVivo();reactivarPush()}
async function initAuth(){try{const{data}=await SB.auth.getSession();if(data.session){await entrar(data.session.user);return}}catch(_){}showAuth()}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const E=$("loginError");E.textContent="";
  const q=await SB.rpc("correo_de_usuario",{p_apodo:$("loginUser").value.trim()}),em=q.data||"x@x.invalid";
  const r=await SB.auth.signInWithPassword({email:em,password:$("loginKey").value});
  if(r.error){E.textContent="Usuario o clave incorrectos.";$("loginKey").value="";return}
  try{await entrar(r.data.user)}catch(x){E.textContent="No se pudo cargar tu perfil: "+x.message}});
if(!window.__mwin){window.__mwin=1;
const mq=matchMedia("(max-width:760px)");
function mWin(title,openId,list,foco){
 const nodes=list.filter(Boolean),ph=nodes.map(n=>{const c=document.createComment("");n.before(c);return c}),
  bd=document.createElement("div");bd.className="modal-backdrop";bd.hidden=true;
 bd.innerHTML='<section class="modal mwin" role="dialog" aria-modal="true" aria-label="'+title+'"><div class="modal-head"><h2>'+title+'</h2><button type="button" class="ghost">Cerrar</button></div><div class="mwb"></div></section>';
 document.body.appendChild(bd);
 const body=bd.querySelector(".mwb"),close=()=>{bd.hidden=true};
 bd.querySelector("button").addEventListener("click",close);bdClose(bd,close);
 addEventListener("keydown",e=>{if(e.key==="Escape"&&!bd.hidden)close()});
 const f=nodes.find(n=>n.tagName==="FORM");if(f)f.addEventListener("submit",()=>{if(f.checkValidity())setTimeout(close,0)});
 const sync=()=>{if(mq.matches)nodes.forEach(n=>body.appendChild(n));else{close();nodes.forEach((n,i)=>ph[i].after(n))}};
 mq.addEventListener("change",sync);sync();
 $(openId).addEventListener("click",()=>{bd.hidden=false;if(foco)setTimeout(()=>{const i=body.querySelector("input");if(i)i.focus()},60)})}
mWin("Crear/Agregar alimento","addOpen",[$("addForm"),$("aSug")],1);
mWin("Últimos movimientos","imvOpen",[$("imv2")]);
const setupP=()=>{mWin("Crear/Agregar implemento","pAddOpen",[$("nf"),$("nSug")],1);mWin("Últimos préstamos","pultOpen",[$("pult")])},ready=()=>$("nf")&&$("pult")&&$("pAddOpen")&&$("pultOpen");
if(ready())setupP();else{const o=new MutationObserver(()=>{if(ready()){o.disconnect();setupP()}});o.observe(document.body,{childList:true,subtree:true})}
$("adminBody").addEventListener("input",e=>{if(e.target.id!=="uFind")return;uQ=e.target.value;const p=e.target.selectionStart;renderAdmin();const f=$("uFind");if(f){f.focus();f.setSelectionRange(p,p)}});
}
async function cargarUsuarios(){const r=await SB.from("perfiles").select("*").order("apodo");if(r.error){adm(r.error.message);return}users=r.data.map(perfilDe).sort((a,b)=>esFijo(b)-esFijo(a)||a.apodo.localeCompare(b.apodo,"es"));currentUser=users.find(u=>u.id===currentUser.id)||currentUser}
async function delU(n,u,a,b){const r=await SB.rpc("eliminar_usuario",{p_id:u.id});if(r.error){adm(r.error.message);return}users.splice(n,1);admListo(a,b)}
async function crearU(u,pw,ok){
  const r=await SB.rpc("crear_usuario",{p_apodo:u.apodo,p_clave:pw,p_nombre:u.nombre,p_apellido:u.apellido,p_telefono:u.telefono,p_correo:u.correo,p_animal:u.animal,p_rol:u.rol});
  if(r.error){adm(r.error.message);return}
  await cargarUsuarios();ok()}
$("adminBody").addEventListener("change",async e=>{const s=e.target.closest("[data-urol]");if(!s)return;const u=users[+s.dataset.urol];if(!u)return;
  const r=await SB.from("perfiles").update({rol:s.value}).eq("id",u.id);
  if(r.error){adm(r.error.message);s.value=u.rol;return}u.rol=s.value;adm("Rol de «"+u.apodo+"» actualizado.")});

meF.addEventListener("submit",async e=>{e.preventDefault();const u=currentUser;if(!u)return;const v=k=>meF.elements[k].value.trim();
  const d={apodo:v("apodo"),nombre:v("nombre"),apellido:v("apellido"),telefono:v("telefono"),correo:v("correo"),animal:v("animal")},pw=meF.elements.cedula.value;
  if(!d.apodo||!d.nombre||!d.animal){meMsg("Faltan datos obligatorios.");return}
  if(pw&&pw.length<8){meMsg("La clave debe tener mínimo 8 caracteres.");return}
  let r=await SB.from("perfiles").update(d).eq("id",u.id);
  if(r.error){meMsg(/duplicate|unique/i.test(r.error.message)?"Ese apodo ya existe.":r.error.message);return}
  if(pw){r=await SB.auth.updateUser({password:pw});if(r.error){meMsg(r.error.message);return}}
  Object.assign(u,d);meF.elements.cedula.value="";addLog("cnt",`Datos del usuario ${u.apodo} actualizados. Por ${u.apodo}.`);
  $("loggedUser").textContent=u.apodo;$("meEmoji").textContent=u.animal;closeMe();msg.textContent="";renderAll()});
$("meDel").addEventListener("click",async()=>{const u=currentUser;if(!u||!esAdmin())return;
  if(!confirm(`¿Eliminar tu usuario «${u.apodo}»? Se cerrará la sesión y ya no podrás ingresar con él.`))return;
  const r=await SB.rpc("eliminar_usuario",{p_id:u.id});if(r.error){meMsg(r.error.message);return}closeMe();logout()});
initAuth();
$("cp").addEventListener("click",()=>{const t=pedido().map(i=>`${i.n}: ${fm(falta(i))} ${i.u}`).join("\n");
 try{navigator.clipboard.writeText(`Pedido Kokoa Virtual, ${fecha(Date.now())}\n${t}`).then(()=>msg.textContent="Pedido copiado.",()=>msg.textContent="No se pudo copiar el pedido.")}catch(_){msg.textContent="No se pudo copiar el pedido."}});
function fm(x){return String(r2(x)).replace(".",",")}
function mv(i,d,w){if(!d)return;if(mov.length>5000)mov.splice(0,mov.length-5000);mov.push({t:Date.now(),s:i.sku,n:i.n,k:i.k,u:i.u,d:r2(d),w,p:quien()});movSku=null}
function bucks(){const s=new Date();s.setHours(0,0,0,0);const b=[];
 if(gp==="d")for(let h=0;h<24;h++)b.push({a:+s+h*36e5,e:+s+(h+1)*36e5,l:h%3?"":String(h),n:fecha(s)+" "+String(h).padStart(2,"0")+":00"});
 else{const n=gp==="s"?7:30;for(let k=n-1;k>=0;k--){const a=new Date(s);a.setDate(a.getDate()-k);const e=new Date(a);e.setDate(e.getDate()+1);
  b.push({a:+a,e:+e,l:gp==="s"?a.toLocaleDateString("es",{weekday:"short"}).replace(".",""):(k%5?"":String(a.getDate())),n:fecha(a)})}}
 return b}
const catDe=m=>(items.find(i=>i.sku===m.s)||{}).k||m.k;
function selMov(){[["gsel",1]].forEach(([id,all])=>{const e=$(id),v=e.value;e.setAttribute("aria-label",gm==="t"?"Filtrar por tipo de alimento":"Filtrar por alimento");e.innerHTML=gm==="t"?'<option value="*">Todos los tipos de alimento</option>'+CATS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(""):(all?'<option value="*">Todos los alimentos</option>':"")+items.map(i=>`<option value="${i.sku}">${esc(i.n)}</option>`).join("");if([...e.options].some(o=>o.value===v))e.value=v})}
function datosGraf(){gi=$("gsel").value||"*";const B=bucks(),M=mov.filter(m=>(gi==="*"||(gm==="t"?catDe(m)===gi:m.s===gi))&&m.t>=B[0].a&&m.t<B[B.length-1].e);
  let ti=0,to=0;B.forEach(b=>{b.i=0;b.o=0;b.net=0});
  M.forEach(m=>{const b=B.find(b=>m.t>=b.a&&m.t<b.e);if(!b)return;if(m.d>0){b.i+=m.d;ti+=m.d}else{b.o-=m.d;to-=m.d}b.net+=m.d});
  return{B,M,ti,to}}
function renderGraf(){
  if(sec!==4||(window.PRM&&PRM.on()))return;
  gi=$("gsel").value||"*";
  $("gmode").innerHTML=[["a","Por alimento"],["t","Por tipo de alimento"]].map(([k,l])=>`<button class="tab" data-gm="${k}" aria-pressed="${gm===k}">${l}</button>`).join("");
  $("gper").innerHTML=[["d","Hoy"],["s","7 días"],["m","30 días"]].map(([k,l])=>`<button class="tab" data-gp="${k}" aria-pressed="${gp===k}">${l}</button>`).join("");
  $("gtype").innerHTML=[["bars","Barras"],["balance","Balance acumulado"]].map(([k,l])=>`<button class="tab" data-gt="${k}" aria-pressed="${chartType===k}">${l}</button>`).join("");
  const{B,M,ti,to}=datosGraf();
  const W=Math.max(280,$("gc").clientWidth-24),H=260,L=42,T=12,Bt=30,pw=W-L-8,ph=H-T-Bt;
  let max=Math.max(1,...B.map(b=>Math.max(b.i,b.o,Math.abs(b.net))));
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de movimientos de inventario">`;
  if(chartType==="bars"){
    const y0=T+ph/2,sc=(ph/2-4)/max,bw=pw/B.length;
    g+=`<line x1="${L}" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--rule)"/><text x="2" y="${T+10}">+${fm(max)}</text><text x="2" y="${y0+4}">0</text><text x="2" y="${H-Bt-2}">−${fm(max)}</text>`;
    B.forEach((b,k)=>{const x=L+k*bw,w=Math.max(2,bw-(B.length>20?2:6));
      g+=`<g><title>${b.n}: +${fm(b.i)} / −${fm(b.o)}</title>${b.i?`<rect x="${x+1}" y="${y0-b.i*sc}" width="${w}" height="${b.i*sc}" rx="3" fill="var(--gchart)"/>`:""}${b.o?`<rect x="${x+1}" y="${y0}" width="${w}" height="${b.o*sc}" rx="3" fill="var(--alert-t)"/>`:""}${b.l?`<text x="${x+bw/2}" y="${H-7}" text-anchor="middle">${b.l}</text>`:""}</g>`});
  }else{
    let acc=0; const vals=B.map(b=>{acc+=b.net;return acc}); max=Math.max(1,...vals.map(v=>Math.abs(v)));
    const xstep=B.length===1?0:pw/(B.length-1),y0=T+ph/2,sc=(ph/2-8)/max;
    g+=`<line x1="${L}" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--rule)"/><text x="2" y="${T+10}">+${fm(max)}</text><text x="2" y="${y0+4}">0</text><text x="2" y="${H-Bt-2}">−${fm(max)}</text>`;
    const pts=vals.map((v,k)=>`${L+k*xstep},${y0-v*sc}`).join(" ");
    g+=`<polyline points="${pts}" fill="none" stroke="var(--gchart)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    vals.forEach((v,k)=>g+=`<circle cx="${L+k*xstep}" cy="${y0-v*sc}" r="3.5" fill="var(--gchart)"><title>${B[k].n}: ${fm(v)}</title></circle>`);
    B.forEach((b,k)=>{if(b.l)g+=`<text x="${L+k*xstep}" y="${H-7}" text-anchor="middle">${b.l}</text>`});
  }
  $("gc").innerHTML=g+"</svg>";
  $("gsum").innerHTML=`<span class="chip">Se puso: +${fm(ti)}</span><span class="chip bad">Se quitó: −${fm(to)}</span><span class="chip">${M.length} movimientos</span>`+(gi==="*"?'<span class="sku">Con todos los alimentos se suman kg, L y unidades.</span>':"")+(gm==="t"&&gi==="*"?CATS.map(c=>{let a=0,o=0;M.forEach(m=>{if(catDe(m)===c){m.d>0?a+=m.d:o-=m.d}});return a||o?`<span class="chip">${esc(c)}: +${fm(a)} / −${fm(o)}</span>`:""}).join(""):"");
  $("live").textContent=`En vivo, actualizado ${hora()}`;
  const R=M.slice().sort((a,b)=>b.t-a.t).slice(0,10);
  $("mvl").innerHTML=R.length?R.map(m=>mvLi({t:esc(m.n),c:m.d>0?"up":"dn",chip:(m.d>0?"Se puso +":"Se quitó −")+fm(Math.abs(m.d))+" "+esc(m.u),s:esc(m.w||""),d:fechaHora(m.t),h:hBtn("movimientos",m.id)})).join(""):"<li>No hay movimientos en este período. Aparecen cuando agregas stock en Inventario: Agregar o quitas en Comidas: Quitar.</li>";
}
$("gsel").addEventListener("change",renderGraf);
setInterval(()=>{if(!document.hidden)renderGraf()},15000);{let t=0;addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(renderGraf,150)})}

renderAll();
const cab=document.querySelector("header");
function medirCab(){document.documentElement.style.setProperty("--hh",cab.offsetHeight+"px")}
addEventListener("resize",medirCab);
if(typeof ResizeObserver!=="undefined")new ResizeObserver(medirCab).observe(cab);medirCab();
const TKEY="cocina-central-tema",raiz=document.documentElement;
const esOscuro=()=>raiz.dataset.theme==="dark";
function pintarTema(){const d=esOscuro();["theme","themeAuth"].forEach(id=>{const b=$(id);if(!b)return;b.classList.toggle("grid",d);b.setAttribute("aria-checked",String(d));b.title=d?"Modo claro":"Modo oscuro"});
 let m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}
 m.content=d?"#143627":"#1E5B3E"}
["theme","themeAuth"].forEach(id=>$(id).addEventListener("click",()=>{const n=esOscuro()?"light":"dark";raiz.dataset.theme=n;try{localStorage.setItem(TKEY,n)}catch(_){}pintarTema()}));
pintarTema();

let syncT=0;
function syncEstado(t,tipo){const e=$("syncBar");if(!e)return;clearTimeout(syncT);if(tipo!=="err"){e.hidden=true;return}
 e.className=tipo==="err"?"err":"";e.hidden=false;e.textContent=t;
 if(tipo==="err"){const b=document.createElement("button");b.type="button";b.textContent="Entendido";b.onclick=()=>{e.hidden=true};e.appendChild(b)}
 else if(tipo==="ok")syncT=setTimeout(()=>{e.hidden=true},1600)}

const _txt=o=>o?o.text:"";
function pintarSel(s){const b=s._b;if(!b)return;const t=_txt(s.options[s.selectedIndex])||"Elegir…";
 const sp=b.firstChild;if(sp.textContent!==t)sp.textContent=t;if(b.disabled!==s.disabled)b.disabled=s.disabled;
 const al=s.getAttribute("aria-label");if(al&&b.getAttribute("aria-label")!==al)b.setAttribute("aria-label",al)}
function mejorarSel(s){if(s._b)return;s.classList.add("cs-src");s.tabIndex=-1;s.setAttribute("aria-hidden","true");
 const b=document.createElement("button");b.type="button";b.className="csel";b.setAttribute("aria-haspopup","listbox");b.innerHTML="<span></span>";
 s.after(b);s._b=b;b._s=s;s.focus=()=>b.focus();pintarSel(s)}
function cerrarPk(){const k=document.querySelector(".pk-back");if(k){const f=k._ret;k.remove();if(f&&f.isConnected)f.focus()}}
function abrirLista(s){if(s.disabled)return;cerrarPk();
 const lab=s.getAttribute("aria-label")||(s.closest("label")?[...s.closest("label").childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim():"")||"Elegir";
 const back=document.createElement("div");back.className="pk-back";back._ret=s._b;
 const many=s.options.length>12;
 back.innerHTML=`<div class="pk" role="dialog" aria-modal="true" aria-label="${lab.replace(/"/g,"")}"><div class="pk-h"></div>${many?'<input class="pk-q" type="search" placeholder="Buscar…" aria-label="Buscar en la lista" autocomplete="off">':""}<ul role="listbox"></ul></div>`;
 back.querySelector(".pk-h").textContent=lab;
 const ul=back.querySelector("ul");let act=s.selectedIndex;
 const filas=[...s.options].map((o,i)=>{const li=document.createElement("li");li.setAttribute("role","option");li.dataset.i=i;li.textContent=o.text;
  li.setAttribute("aria-selected",String(i===s.selectedIndex));if(o.disabled)li.setAttribute("aria-disabled","true");ul.appendChild(li);return li});
 const vis=()=>filas.filter(l=>!l.hidden&&l.getAttribute("aria-disabled")!=="true");
 const marca=()=>{filas.forEach(l=>l.classList.toggle("act",+l.dataset.i===act));const c=ul.querySelector(".act");if(c)c.scrollIntoView({block:"nearest"})};
 const elegir=i=>{if(i<0||s.options[i].disabled)return;if(s.selectedIndex!==i){s.selectedIndex=i;s.dispatchEvent(new Event("input",{bubbles:true}));s.dispatchEvent(new Event("change",{bubbles:true}))}pintarSel(s);cerrarPk()};
 back.addEventListener("click",e=>{e.stopPropagation();if(e.target===back){cerrarPk();return}const li=e.target.closest("li");if(li)elegir(+li.dataset.i)});
 back.addEventListener("keydown",e=>{const v=vis();
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();cerrarPk()}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const k=v.findIndex(l=>+l.dataset.i===act),n=v[Math.max(0,Math.min(v.length-1,k+(e.key==="ArrowDown"?1:-1)))];if(n){act=+n.dataset.i;marca()}}
  else if(e.key==="Enter"&&e.target.tagName!=="BUTTON"){e.preventDefault();elegir(act)}});
 const fj=l=>s.options[+l.dataset.i].hasAttribute("data-fijo"),q=back.querySelector(".pk-q");if(q)q.addEventListener("input",()=>{const k=norm(q.value);filas.forEach(l=>{l.hidden=!!k&&!fj(l)&&!norm(l.textContent).includes(k)});const v=vis(),p=v.filter(l=>!fj(l)),w=p.length?p:v;if(w.length&&!w.some(l=>+l.dataset.i===act))act=+w[0].dataset.i;marca()});
 document.body.appendChild(back);marca();(q||ul).setAttribute("tabindex","-1");(q||ul).focus({preventScroll:true})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button.csel");
 if(b&&b._s){e.preventDefault();abrirLista(b._s);return}
 const x=e.target;if(x&&x.matches&&x.matches("select.cs-src")){e.preventDefault();abrirLista(x)}},true);

const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function pintarFecha(i){const b=i._b;if(!b)return;const v=/^\d{4}-\d\d-\d\d$/.test(i.value)?i.value:"",t=v?fechaExp(v):"Sin fecha";
 if(b.firstChild.textContent!==t)b.firstChild.textContent=t;b.classList.toggle("vacia",!v);if(b.disabled!==i.disabled)b.disabled=i.disabled}
function mejorarFecha(i){if(i._b)return;i.type="hidden";
 const b=document.createElement("button");b.type="button";b.className="dsel";b.innerHTML="<span></span>";b.setAttribute("aria-haspopup","dialog");
 const l=i.closest("label");if(l){const t=[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim();if(t)b.setAttribute("aria-label",t)}
 i.after(b);i._b=b;b._i=i;pintarFecha(i)}
function abrirFecha(inp){cerrarPk();const hoy=new Date(),hs=ymd(hoy);
 let sel=/^\d{4}-\d\d-\d\d$/.test(inp.value)?inp.value:"",ref=sel?new Date(sel+"T12:00:00"):hoy,vis=new Date(ref.getFullYear(),ref.getMonth(),1);
 const back=document.createElement("div");back.className="pk-back";back._ret=inp._b;
 back.innerHTML='<div class="pk cal" role="dialog" aria-modal="true" aria-label="Elegir fecha"></div>';const box=back.firstChild;
 function pintar(foco){const y=vis.getFullYear(),m=vis.getMonth(),off=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();let c="";
  for(let k=0;k<off;k++)c+="<i></i>";
  for(let d=1;d<=n;d++){const v=ymd(new Date(y,m,d));c+=`<button type="button" data-d="${v}" class="${v===hs?"hoy ":""}${v===sel?"sel":""}"${v===sel?' aria-pressed="true"':""}>${d}</button>`}
  box.innerHTML=`<div class="cal-h"><button type="button" data-n="-12" aria-label="Año anterior">«</button><button type="button" data-n="-1" aria-label="Mes anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-n="1" aria-label="Mes siguiente">›</button><button type="button" data-n="12" aria-label="Año siguiente">»</button></div><div class="cal-w">${"LMXJVSD".split("").map(x=>"<span>"+x+"</span>").join("")}</div><div class="cal-g">${c}</div><div class="cal-f"><button type="button" class="ghost" data-hoy="1">Hoy</button><button type="button" class="ghost" data-no="1">Sin fecha</button><button type="button" class="ghost" data-x="1">Cerrar</button></div>`;
  if(foco){const f=box.querySelector(".sel")||box.querySelector(".hoy")||box.querySelector("[data-d]");if(f)f.focus({preventScroll:true})}}
 const poner=v=>{if(inp.value!==v){inp.value=v;inp.dispatchEvent(new Event("input",{bubbles:true}));inp.dispatchEvent(new Event("change",{bubbles:true}))}pintarFecha(inp);cerrarPk()};
 back.addEventListener("click",e=>{e.stopPropagation();const t=e.target;if(t===back){cerrarPk();return}const b=t.closest("button");if(!b)return;
  if(b.dataset.d)poner(b.dataset.d);else if(b.dataset.hoy)poner(hs);else if(b.dataset.no)poner("");else if(b.dataset.x)cerrarPk();
  else if(b.dataset.n){vis=new Date(vis.getFullYear(),vis.getMonth()+ +b.dataset.n,1);pintar(false);const k=box.querySelector(`[data-n="${b.dataset.n}"]`);if(k)k.focus({preventScroll:true})}});
 back.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();cerrarPk()}});
 document.body.appendChild(back);pintar(true)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button.dsel");if(b&&b._i){e.preventDefault();(b._i._mes?abrirMes:abrirFecha)(b._i)}},true);

const MESES_TXT=v=>/^\d{4}-\d\d$/.test(v)?MESES[+v.slice(5)-1]+" "+v.slice(0,4):"";
function pintarMes(i){const b=i._b;if(!b)return;const v=/^\d{4}-\d\d$/.test(i.value)?i.value:"",t=v?MESES_TXT(v):"Todos";
 if(b.firstChild.textContent!==t)b.firstChild.textContent=t;b.classList.toggle("vacia",!v);if(b.disabled!==i.disabled)b.disabled=i.disabled}
function mejorarMes(i){if(i._b)return;i._mes=1;i.type="hidden";
 const b=document.createElement("button");b.type="button";b.className="dsel";b.innerHTML="<span></span>";b.setAttribute("aria-haspopup","dialog");
 const l=i.closest("label");if(l){const t=[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim();if(t)b.setAttribute("aria-label",t)}
 i.after(b);i._b=b;b._i=i;pintarMes(i)}
function abrirMes(inp){cerrarPk();const h=new Date(),hm=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0");
 let sel=/^\d{4}-\d\d$/.test(inp.value)?inp.value:"",y=+(sel||hm).slice(0,4);
 const back=document.createElement("div");back.className="pk-back";back._ret=inp._b;
 back.innerHTML='<div class="pk cal" role="dialog" aria-modal="true" aria-label="Elegir mes"></div>';const box=back.firstChild;
 function pintar(foco){let c="";for(let k=0;k<12;k++){const v=y+"-"+String(k+1).padStart(2,"0");c+=`<button type="button" data-m="${v}" class="${v===hm?"hoy ":""}${v===sel?"sel":""}"${v===sel?' aria-pressed="true"':""}>${MESES[k].slice(0,3)}</button>`}
  box.innerHTML=`<div class="cal-h"><button type="button" data-n="-1" aria-label="Año anterior">‹</button><b>${y}</b><button type="button" data-n="1" aria-label="Año siguiente">›</button></div><div class="cal-g cal-m">${c}</div><div class="cal-f"><button type="button" class="ghost" data-hoy="1">Este mes</button>${inp.hasAttribute("data-req")?"":'<button type="button" class="ghost" data-no="1">Todos</button>'}<button type="button" class="ghost" data-x="1">Cerrar</button></div>`;
  if(foco){const f=box.querySelector(".sel")||box.querySelector(".hoy")||box.querySelector("[data-m]");if(f)f.focus({preventScroll:true})}}
 const poner=v=>{if(inp.value!==v){inp.value=v;inp.dispatchEvent(new Event("input",{bubbles:true}));inp.dispatchEvent(new Event("change",{bubbles:true}))}pintarMes(inp);cerrarPk()};
 back.addEventListener("click",e=>{e.stopPropagation();const t=e.target;if(t===back){cerrarPk();return}const b=t.closest("button");if(!b)return;
  if(b.dataset.m)poner(b.dataset.m);else if(b.dataset.hoy)poner(hm);else if(b.dataset.no)poner("");else if(b.dataset.x)cerrarPk();
  else if(b.dataset.n){y+=+b.dataset.n;pintar(false);const k=box.querySelector(`[data-n="${b.dataset.n}"]`);if(k)k.focus({preventScroll:true})}});
 back.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();cerrarPk()}});
 document.body.appendChild(back);pintar(true)}

function mejorarUI(){document.querySelectorAll("select:not(.cs-src):not([data-native])").forEach(mejorarSel);
 document.querySelectorAll('input[type="date"]:not([data-native])').forEach(mejorarFecha);
 document.querySelectorAll('input[type="month"]:not([data-native])').forEach(mejorarMes);
 document.querySelectorAll("select.cs-src").forEach(pintarSel);document.querySelectorAll("input[data-fecha-ok],input[type=hidden]").forEach(i=>{if(i._b&&i._b.classList.contains("dsel"))(i._mes?pintarMes:pintarFecha)(i)})}
let uiRaf=0;new MutationObserver(()=>{if(uiRaf)return;uiRaf=requestAnimationFrame(()=>{uiRaf=0;mejorarUI()})}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["disabled","value"]});
document.addEventListener("reset",()=>setTimeout(mejorarUI,0),true);document.addEventListener("change",()=>setTimeout(mejorarUI,0),true);
setInterval(()=>{if(!document.hidden)mejorarUI()},3000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)mejorarUI()});mejorarUI();

const VAPID_PUBLIC="BBSAEq63e1c82MDE_NMN0TL0TO-qXe6qzVEnA3O1otUGJ0wKiVPHJy5U7NljUIqmxtQ56AagGGPZhFXziTbPbeA";
let swReg=null,instalarEv=null,vistas=null;
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>{swReg=r;pintarPush()}).catch(()=>{}));
addEventListener("beforeinstallprompt",e=>{e.preventDefault();instalarEv=e;pintarPush()});
addEventListener("appinstalled",()=>{instalarEv=null;pintarPush()});
const esIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const instalada=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const pushOk=()=>"serviceWorker" in navigator&&"Notification" in window&&"PushManager" in window;
const pushOn=()=>{try{return pushOk()&&Notification.permission==="granted"&&localStorage.getItem("kokoa-push")==="1"}catch(_){return false}};
const b64u=k=>{const p="=".repeat((4-k.length%4)%4),r=atob((k+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)))};
function pintarPush(){const b=$("pushBox");if(!b)return;let h="";
 if(instalarEv)h+='<button type="button" class="more" data-pinst="1">Instalar la app en este dispositivo</button>';
 if(esIOS&&!instalada())h+='<p class="small-note">iPhone: toca Compartir y luego «Añadir a pantalla de inicio». Abre Kokoa desde ese ícono para poder recibir avisos.</p>';
 else if(!pushOk())h+='<p class="small-note">Este navegador no permite avisos.</p>';
 else if(Notification.permission==="denied")h+='<p class="small-note">Los avisos están bloqueados. Actívalos en los permisos del sitio, en la configuración del navegador.</p>';
 else h+=pushOn()?'<p class="small-note">Avisos de stock bajo y vencimientos activados en este dispositivo.</p><button type="button" class="more" data-poff="1">Desactivar avisos</button>':'<button type="button" class="more" data-pon="1">Activar avisos en este dispositivo</button>';
 if(b.innerHTML!==h)b.innerHTML=h}
async function suscribirPush(){if(!VAPID_PUBLIC||!pushOk()||!currentUser)return;
 const reg=await navigator.serviceWorker.ready;let s=await reg.pushManager.getSubscription();
 if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUBLIC)});
 const j=s.toJSON();ck(await SB.from("push_subs").upsert({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,usuario:currentUser.id}))}
async function activarPush(){try{const p=await Notification.requestPermission();if(p==="granted"){try{localStorage.setItem("kokoa-push","1")}catch(_){}
  await suscribirPush();const r=await navigator.serviceWorker.ready;r.showNotification("Avisos activados",{body:"Te avisaremos de stock bajo y lotes por vencer.",icon:"icons/icon-192.png",tag:"kokoa-prueba"})}}
 catch(e){msg.textContent="No se pudieron activar los avisos: "+(e.message||e)}pintarPush()}
async function desactivarPush(){try{localStorage.removeItem("kokoa-push")}catch(_){}
 try{const r=await navigator.serviceWorker.ready,s=await r.pushManager.getSubscription();if(s){await SB.from("push_subs").delete().eq("endpoint",s.endpoint);await s.unsubscribe()}}catch(_){}pintarPush()}
async function quitarPushServidor(){try{if(!pushOk())return;const r=await navigator.serviceWorker.getRegistration(),s=r&&await r.pushManager.getSubscription();if(s)await SB.from("push_subs").delete().eq("endpoint",s.endpoint)}catch(_){}}
function reactivarPush(){if(pushOn())suscribirPush().catch(()=>{})}
$("pushBox").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.pon)activarPush();else if(b.dataset.poff)desactivarPush();
 else if(b.dataset.pinst&&instalarEv){instalarEv.prompt();await instalarEv.userChoice.catch(()=>{});instalarEv=null;pintarPush()}});
function avisarNuevas(){if(!datosAl||!currentUser)return;const u=alertas().filter(a=>a.u);
 if(vistas===null){vistas=new Set(u.map(a=>a.id));return}
 const n=u.filter(a=>!vistas.has(a.id));u.forEach(a=>vistas.add(a.id));
 if(!n.length||!pushOn()||!document.hidden||!swReg)return;
 const d=document.createElement("div");d.innerHTML=n[0].t;
 swReg.showNotification(n.length>1?n.length+" alertas nuevas":(n[0].tag==="Hoy"?"Atención":"Aviso"),{body:n.length>1?n.slice(0,3).map(a=>{d.innerHTML=a.t;return d.textContent}).join("\n"):d.textContent,icon:"icons/icon-192.png",tag:"kokoa-alertas",renotify:true})}
const _renderAlertas=renderAlertas;renderAlertas=function(){_renderAlertas();avisarNuevas();pintarPush()};
const _logout=logout;logout=function(){vistas=null;return _logout.apply(this,arguments)};
pintarPush();
