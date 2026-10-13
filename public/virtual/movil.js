(() => {
  const mq = matchMedia("(max-width:760px)");
  const $ = id => document.getElementById(id);
  const orig = new Map();
  const MENU = ["exp", "adminBtn", "usersBtn", "logoutBtn"];
  const CABE = ["modo", "theme"];
  const TAB = {
    a: { 0: "quitar", 1: "agregar", 3: "pedido", 4: "graficos", 5: "historial" },
    p: { 0: "prestar", 1: "devolver", 3: "encurso", 4: "graficos", 5: "historial" }
  };
  let btn = null, menu = null, raf = 0;

  const guardar = el => { if (el && !orig.has(el)) orig.set(el, { p: el.parentNode, n: el.nextSibling }); };
  const restaurar = el => {
    const o = el && orig.get(el);
    if (!o || !o.p || el.parentNode === o.p) return;
    if (o.n && o.n.parentNode === o.p) o.p.insertBefore(el, o.n); else o.p.appendChild(el);
  };

  function crear() {
    if (btn) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "kMenuBtn";
    btn.className = "ghost";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "kMenu");
    btn.setAttribute("aria-label", "Más opciones");
    btn.title = "Más opciones";
    btn.innerHTML = window.KI ? KI.svg("mas", 22) : "⋯";
    menu = document.createElement("div");
    menu.id = "kMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    document.body.appendChild(menu);
    btn.addEventListener("click", e => { e.stopPropagation(); menu.hidden ? abrir() : cerrar(); });
    menu.addEventListener("click", e => { if (e.target.closest("button")) cerrar(); });
    document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) cerrar(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { cerrar(); btn.focus(); } });
  }
  function abrir() {
    const h = document.querySelector("header");
    menu.style.top = Math.round(h.getBoundingClientRect().bottom + 6) + "px";
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }
  function cerrar() {
    if (!menu) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function colocar() {
    const m = mq.matches;
    document.body.classList.toggle("kb", m);
    crear();
    const h = document.querySelector("header");
    if (!h) return;
    if (m) {
      MENU.forEach(id => { const e = $(id); if (e) { guardar(e); if (e.parentNode !== menu) menu.appendChild(e); } });
      const so = $("logoutBtn"); if (so && menu.lastElementChild !== so) menu.appendChild(so);
      CABE.forEach(id => { const e = $(id); if (e) { guardar(e); if (e.parentNode !== h) h.appendChild(e); } });
      if (btn.parentNode !== h) h.insertBefore(btn, h.querySelector(".htools"));
    } else {
      cerrar();
      [...CABE, ...MENU].forEach(id => restaurar($(id)));
      if (btn.parentNode) btn.remove();
    }
  }

  function modo() {
    if (document.body.classList.contains("cnt-on")) return "c";
    const m = $("modo");
    return m && (m.classList.contains("grid") || m.dataset.m === "p") ? "p" : "a";
  }
  function iconos() {
    if (!window.KI) return;
    const md = modo();
    document.querySelectorAll("#views .tab").forEach(t => {
      const k = t.dataset.c === "tab" ? t.dataset.t : (TAB[md === "p" ? "p" : "a"][t.dataset.s] || "");
      if (!k) return;
      let i = t.querySelector(":scope > .ti");
      if (!i) { i = document.createElement("span"); i.className = "ti"; i.setAttribute("aria-hidden", "true"); t.insertBefore(i, t.firstChild); }
      if (i.dataset.k !== k) { i.dataset.k = k; i.innerHTML = KI.svg(k, 22); }
    });
  }

  // ---------- Préstamos › Devolver: Estado y Tipo en listas desplegables ----------
  // Igual que Zona/Tipo en Alimentos: en móvil los botones de #pdf1/#pdf2 se
  // reemplazan por dos listas. Cada lista "hace clic" en el botón original, así
  // que el filtrado sigue siendo el de prestamos.js. Para deshacer: quitar este bloque.
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  function opciones(caja, attr, nombres) {
    const out = [];
    caja.querySelectorAll("button[" + attr + "]").forEach(b => {
      const v = b.getAttribute(attr);
      const peq = b.querySelector("small");
      const n = peq ? (peq.textContent.match(/\d+/) || [""])[0] : "";
      const nodo = b.firstChild && b.firstChild.nodeType === 3 ? b.firstChild.textContent : b.textContent;
      let t = nombres && nombres[v] ? nombres[v] : nodo.trim();
      if (n !== "") t += " (" + n + ")";
      out.push([v, t, b.getAttribute("aria-pressed") === "true"]);
    });
    return out;
  }
  const opcionesHtml = ops => ops.map(([v, t, on]) => '<option value="' + esc(v) + '"' + (on ? " selected" : "") + ">" + esc(t) + "</option>").join("");

  function listasDevolver() {
    const pnl = document.querySelector("#pv1 .pnl");
    if (!pnl) return;
    let caja = pnl.querySelector("#pdsel");
    const f1 = pnl.querySelector("#pdf1"), f2 = pnl.querySelector("#pdf2");
    if (!mq.matches || !f1 || !f2 || !f1.querySelector("button[data-pf]")) {
      if (caja) caja.remove();
      if (pnl.classList.contains("psel-on")) pnl.classList.remove("psel-on");
      return;
    }
    if (document.querySelector(".pk-back")) return; // con la lista abierta no se toca
    const o1 = opciones(f1, "data-pf", { todos: "Todos" });
    const o2 = opciones(f2, "data-pc");
    const firma = JSON.stringify([o1, o2]);
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "pdsel";
      caja.innerHTML =
        '<label>Estado<select data-pdsel="est" aria-label="Filtrar por estado"></select></label>' +
        '<label>Tipo<select data-pdsel="tipo" aria-label="Filtrar por tipo de implemento"></select></label>';
      pnl.insertBefore(caja, pnl.firstChild);
    }
    if (caja.dataset.firma !== firma) {
      caja.dataset.firma = firma;
      caja.querySelector('[data-pdsel="est"]').innerHTML = opcionesHtml(o1);
      caja.querySelector('[data-pdsel="tipo"]').innerHTML = opcionesHtml(o2);
    }
    if (!pnl.classList.contains("psel-on")) pnl.classList.add("psel-on");
  }
  document.addEventListener("change", e => {
    const s = e.target && e.target.closest && e.target.closest("[data-pdsel]");
    if (!s) return;
    const est = s.dataset.pdsel === "est";
    const caja = $(est ? "pdf1" : "pdf2");
    const attr = est ? "data-pf" : "data-pc";
    const btn = caja && [...caja.querySelectorAll("button[" + attr + "]")].find(b => b.getAttribute(attr) === s.value);
    if (btn) btn.click();
    setTimeout(pedir, 60);
  });

  // Botón "Últimas devoluciones" (en móvil la lista del panel queda oculta): misma ventana que "Últimos movimientos" en Alimentos.
  function botonUltimasDev() {
    const lista = $("pdf3"), principal = document.querySelector("#pv1 .pr-main");
    if (!lista || !principal || $("pdOpen") || typeof mWin !== "function") return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ghost m-only";
    b.id = "pdOpen";
    b.textContent = "Últimas devoluciones";
    principal.insertBefore(b, principal.querySelector(".itool"));
    mWin("Últimas devoluciones", "pdOpen", [lista]);
  }

  const barra = $("views");
  function medirBarra() {
    if (!barra) return;
    const fija = getComputedStyle(barra).position === "fixed";
    const h = fija ? Math.ceil(barra.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--barra-h", h + "px");
  }
  function pasada() { raf = 0; colocar(); iconos(); medirBarra(); listasDevolver(); botonUltimasDev(); }
  function pedir() { if (!raf) raf = requestAnimationFrame(pasada); }

  if (barra && typeof ResizeObserver !== "undefined") new ResizeObserver(medirBarra).observe(barra);
  addEventListener("resize", pedir);
  addEventListener("orientationchange", () => setTimeout(pedir, 200));
  if (mq.addEventListener) mq.addEventListener("change", pedir);
  new MutationObserver(pedir).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-m", "class"] });
  pasada();
})();
