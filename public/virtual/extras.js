/* extras.js — Kokoa Virtual
   · Tarjeta en el panel "Editar": Comidas semanales
     (desayuno, almuerzo y cena de lunes a sábado, tabla menu_semanal). Editar: admins.
     Historial de semanas: lo ve y lo puede borrar cualquier usuario.
   · Tarjeta "Auditoría contable" en "Editar": lista la tabla cnt_auditoria (solo lectura).
   Ambas tarjetas salen en el "Editar" de Alimentos, Préstamos y Contabilidad.
   Se carga después de movil.js. Para deshacer: quitar el <script> en index.html.
   Usa SB, esc, $ y currentUser, definidos por app.js. */
(() => {
  const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const admin = () => typeof esAdmin === "function" && esAdmin();

  // ---------- tarjetas dentro del panel "Editar" ----------
  const CARDS =
    '<div class="editor-card" data-extras="1"><h3>Comidas semanales</h3>' +
    '<p class="small-note" style="margin:0">Desayuno, almuerzo y cena de lunes a sábado. Es el menú que ve el público; cada semana queda en un historial.</p>' +
    '<div class="pick"><button type="button" data-ex="sem">Editar</button></div></div>' +
    '<div class="editor-card" data-extras="1"><h3>Auditoría contable</h3>' +
    '<p class="small-note" style="margin:0">Quién cambió qué y cuándo en la contabilidad.</p>' +
    '<div class="pick"><button type="button" class="ghost" data-ex="aud">Ver</button></div></div>';

  // Editar en Alimentos y Contabilidad usa #adminBody; en Préstamos usa #tpBody (se crea al primer clic).
  function inyectar(id) {
    const cuerpo = document.getElementById(id);
    if (!cuerpo || !admin()) return;
    const grid = cuerpo.querySelector(".pick-grid");
    if (grid && !grid.querySelector("[data-extras]")) grid.insertAdjacentHTML("beforeend", CARDS);
  }
  const vigilados = new Set();
  function vigilar(id) {
    const cuerpo = document.getElementById(id);
    if (!cuerpo || vigilados.has(cuerpo)) return;
    vigilados.add(cuerpo);
    new MutationObserver(() => inyectar(id)).observe(cuerpo, { childList: true });
    inyectar(id);
  }
  vigilar("adminBody");
  vigilar("tpBody");
  if (!document.getElementById("tpBody")) {
    const espera = new MutationObserver(() => {
      if (document.getElementById("tpBody")) { espera.disconnect(); vigilar("tpBody"); }
    });
    espera.observe(document.body, { childList: true });
  }

  // ---------- ventana propia ----------
  let fondo = null;
  function ventana(titulo) {
    if (!fondo) {
      fondo = document.createElement("div");
      fondo.className = "modal-backdrop";
      fondo.hidden = true;
      fondo.innerHTML =
        '<section class="modal mwin" role="dialog" aria-modal="true" aria-labelledby="exTit" style="max-width:760px">' +
        '<div class="modal-head"><h2 id="exTit"></h2><button type="button" class="ghost" data-ex-x="1">Cerrar</button></div>' +
        '<div class="mwb" id="exBody"></div></section>';
      document.body.appendChild(fondo);
      fondo.addEventListener("click", (e) => {
        if (e.target === fondo || e.target.closest("[data-ex-x]")) fondo.hidden = true;
      });
      addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !fondo.hidden) fondo.hidden = true;
      });
    }
    document.body.appendChild(fondo); // al final del body: queda por encima del modal Editar de cada modo
    fondo.querySelector("#exTit").textContent = titulo;
    fondo.hidden = false;
    return fondo.querySelector("#exBody");
  }
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";"));

  // ---------- comidas semanales (menú del sitio público + historial) ----------
  const COMIDAS = [["desayuno", "Desayuno"], ["almuerzo", "Almuerzo"], ["cena", "Cena"]];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const fecha = (s) => new Date(s + "T12:00:00");
  const hoyBogota = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  function lunesDe(s) {
    const d = s ? fecha(s) : hoyBogota();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return iso(d);
  }
  function rotulo(sem) {
    const a = fecha(sem), b = fecha(sem);
    b.setDate(a.getDate() + 5);
    const m = a.getMonth() === b.getMonth() ? "" : " de " + MESES[a.getMonth()];
    return "Semana del " + a.getDate() + m + " al " + b.getDate() + " de " + MESES[b.getMonth()] + " de " + b.getFullYear();
  }
  const logueado = () => typeof currentUser !== "undefined" && !!currentUser;

  async function semanas(semSel) {
    const cuerpo = ventana("Comidas semanales");
    cuerpo.innerHTML = '<p class="small-note">Cargando…</p>';
    const sem = semSel || lunesDe();
    const [h, a] = await Promise.all([
      SB.from("menu_semanal").select("semana,dia,comida,plato").neq("plato", "").order("semana", { ascending: false }).limit(1000),
      admin() ? SB.from("menu_semanal").select("dia,comida,plato").eq("semana", sem) : Promise.resolve({ data: [] }),
    ]);
    if (h.error || a.error) {
      cuerpo.innerHTML = '<p class="small-note">' + E((h.error || a.error).message) + "</p>";
      return;
    }
    // --- editor (solo admins) ---
    let editor = "";
    if (admin()) {
      const por = {};
      a.data.forEach((f) => (por[f.dia + "|" + f.comida] = f.plato));
      editor =
        '<h3 style="margin:0 0 6px">Editar semana</h3>' +
        '<label>Elige cualquier día de la semana<input type="date" id="exSemFecha" value="' + sem + '"></label>' +
        '<p class="small-note" style="margin:6px 0">' + E(rotulo(sem)) + ". Lo que escribas aquí es lo que ve el público.</p>" +
        '<form class="aform" id="exSemForm" autocomplete="off"><div class="tbl"><table style="min-width:520px"><thead><tr><th>Día</th>' +
        COMIDAS.map(([, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" +
        [1, 2, 3, 4, 5, 6].map((d) =>
          "<tr><th>" + DIAS[d] + "</th>" +
          COMIDAS.map(([k]) => '<td><input name="' + d + "|" + k + '" maxlength="120" aria-label="' + DIAS[d] + " " + k + '" value="' + E(por[d + "|" + k] || "") + '"></td>').join("") + "</tr>"
        ).join("") +
        '</tbody></table></div><p class="small-note" id="exSemMsg" role="status"></p><div><button type="submit">Guardar semana</button></div></form>';
    }
    // --- historial (todos) ---
    const grupos = new Map();
    h.data.forEach((f) => { if (!grupos.has(f.semana)) grupos.set(f.semana, []); grupos.get(f.semana).push(f); });
    const hist = [...grupos.entries()].map(([s, fs]) => {
      const por = {}; fs.forEach((f) => (por[f.dia + "|" + f.comida] = f.plato));
      const filas = [1, 2, 3, 4, 5, 6].map((d) =>
        "<tr><th>" + DIAS[d] + "</th>" + COMIDAS.map(([k]) => "<td>" + E(por[d + "|" + k] || "—") + "</td>").join("") + "</tr>").join("");
      return '<details class="cn-det" style="margin:6px 0"><summary>' + E(rotulo(s)) + (s === lunesDe() ? " · esta semana" : "") + "</summary>" +
        '<div class="tbl"><table style="min-width:520px"><thead><tr><th>Día</th>' + COMIDAS.map(([, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" + filas + "</tbody></table></div>" +
        '<button type="button" class="ghost danger" data-ex-del="' + s + '">Eliminar esta semana</button></details>';
    }).join("");
    cuerpo.innerHTML = editor + '<h3 style="margin:18px 0 6px">Historial de comidas semanales</h3>' +
      (hist || '<p class="small-note">Aún no hay semanas guardadas.</p>') +
      '<p class="small-note">Cualquier usuario puede eliminar una semana del historial. No se puede deshacer.</p>';

    const f = cuerpo.querySelector("#exSemForm");
    if (f) {
      cuerpo.querySelector("#exSemFecha").addEventListener("change", (e) => e.target.value && semanas(lunesDe(e.target.value)));
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const m = cuerpo.querySelector("#exSemMsg");
        const quien = (logueado() && currentUser.apodo) || null;
        const filas = [];
        for (const d of [1, 2, 3, 4, 5, 6]) for (const [k] of COMIDAS) {
          const plato = f.elements[d + "|" + k].value.trim();
          if (/[<>"`]/.test(plato)) { m.textContent = 'Los platos no pueden llevar los signos < > " `.'; return; }
          filas.push({ semana: sem, dia: d, comida: k, plato, actualizado: new Date().toISOString(), apodo: quien });
        }
        m.textContent = "Guardando…";
        const x = await SB.from("menu_semanal").upsert(filas, { onConflict: "semana,dia,comida" });
        if (x.error) { m.textContent = x.error.message; return; }
        semanas(sem);
      });
    }
  }
  async function borrarSemana(sem) {
    if (!confirm("¿Eliminar del historial la " + rotulo(sem).toLowerCase() + "? No se puede deshacer.")) return;
    const r = await SB.from("menu_semanal").delete().eq("semana", sem);
    if (r.error) { alert(r.error.message); return; }
    semanas(admin() ? undefined : undefined);
  }

  // ---------- auditoría contable ----------
  const NOMBRES = {
    cnt_asientos: "Asientos", cnt_lineas: "Líneas", cnt_terceros: "Terceros", cnt_cuentas: "Cuentas",
    cnt_presupuesto: "Presupuesto", cnt_cierres: "Cierres", cnt_extractos: "Extractos",
    cnt_conciliaciones: "Conciliaciones", cnt_precios: "Precios",
  };
  const OPS = { INSERT: "Creó", UPDATE: "Cambió", DELETE: "Borró" };
  function resumen(f) {
    const x = f.despues || f.antes || {};
    const claves = ["numero", "periodo", "nombre", "concepto", "codigo", "cuenta", "corte", "descripcion"];
    const partes = claves.filter((k) => x[k] !== undefined && x[k] !== null && x[k] !== "").map((k) => x[k]);
    let t = partes.length ? partes.join(" · ") : JSON.stringify(x);
    if (f.op === "UPDATE" && f.antes && f.despues) {
      const dif = Object.keys(f.despues).filter((k) => JSON.stringify(f.despues[k]) !== JSON.stringify(f.antes[k]));
      if (dif.length) t += " — cambió: " + dif.join(", ");
    }
    return t.length > 140 ? t.slice(0, 140) + "…" : t;
  }
  async function auditoria(tabla) {
    const cuerpo = ventana("Auditoría contable");
    cuerpo.innerHTML = '<p class="small-note">Cargando…</p>';
    let q = SB.from("cnt_auditoria").select("*").order("t", { ascending: false }).limit(200);
    if (tabla) q = q.eq("tabla", tabla);
    const r = await q;
    if (r.error) {
      cuerpo.innerHTML = '<p class="small-note">' + E(r.error.message) + "</p>";
      return;
    }
    const opts =
      '<option value="">Todas las tablas</option>' +
      Object.entries(NOMBRES).map(([k, v]) => '<option value="' + k + '"' + (k === tabla ? " selected" : "") + ">" + v + "</option>").join("");
    cuerpo.innerHTML =
      '<label>Mostrar<select id="exAudT">' + opts + "</select></label>" +
      '<p class="small-note">Últimos ' + r.data.length + " cambios" + (r.data.length === 200 ? " (máximo 200)" : "") + ". Nadie puede editar ni borrar este registro desde la app.</p>" +
      '<div class="tbl"><table style="min-width:560px"><thead><tr><th>Fecha</th><th>Quién</th><th>Qué</th><th>Detalle</th></tr></thead><tbody>' +
      (r.data.length
        ? r.data.map((f) =>
            "<tr><td>" + E(new Date(f.t).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })) + "</td><td>" + E(f.apodo || "sistema") +
            "</td><td>" + E((OPS[f.op] || f.op) + " · " + (NOMBRES[f.tabla] || f.tabla)) + "</td><td>" + E(resumen(f)) + "</td></tr>"
          ).join("")
        : '<tr><td colspan="4">Aún no hay cambios registrados.</td></tr>') +
      "</tbody></table></div>";
    cuerpo.querySelector("#exAudT").addEventListener("change", (e) => auditoria(e.target.value));
  }

  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-ex-del]");
    if (del && logueado()) { borrarSemana(del.dataset.exDel); return; }
    const b = e.target.closest("[data-ex]");
    if (!b || !admin()) return;
    if (b.dataset.ex === "sem") semanas();
    else if (b.dataset.ex === "aud") auditoria("");
  });
})();
