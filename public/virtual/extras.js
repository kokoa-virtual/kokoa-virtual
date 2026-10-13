(() => {
  const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const admin = () => typeof esAdmin === "function" && esAdmin();

  const CARDS =
    '<div class="editor-card" data-extras="1"><h3>Comidas semanales</h3>' +
    '<p class="small-note" style="margin:0">Desayuno, almuerzo y cena de lunes a sábado. Es el menú que ve el público; cada semana queda en un historial.</p>' +
    '<div class="pick"><button type="button" data-ex="sem">Editar</button></div></div>' +
    '<div class="editor-card" data-extras="1"><h3>Auditoría contable</h3>' +
    '<p class="small-note" style="margin:0">Quién cambió qué y cuándo en la contabilidad.</p>' +
    '<div class="pick"><button type="button" class="ghost" data-ex="aud">Ver</button></div></div>';

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

  let fondo = null;
  let previo = null;
  function cerrarVentana() {
    if (!fondo || fondo.hidden) return;
    fondo.hidden = true;
    if (previo && previo.isConnected) previo.focus();
    previo = null;
  }
  function ventana(titulo) {
    if (!fondo) {
      fondo = document.createElement("div");
      fondo.className = "modal-backdrop";
      fondo.hidden = true;
      fondo.innerHTML =
        '<section class="modal mwin" role="dialog" aria-modal="true" aria-labelledby="exTit" tabindex="-1" style="max-width:760px">' +
        '<div class="modal-head"><h2 id="exTit"></h2><button type="button" class="ghost" data-ex-x="1">Cerrar</button></div>' +
        '<div class="mwb" id="exBody"></div></section>';
      document.body.appendChild(fondo);
      fondo.addEventListener("click", (e) => {
        if (e.target === fondo || e.target.closest("[data-ex-x]")) cerrarVentana();
      });
      addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !fondo.hidden) cerrarVentana();
      });
    }
    document.body.appendChild(fondo);
    fondo.querySelector("#exTit").textContent = titulo;
    if (fondo.hidden) previo = document.activeElement;
    fondo.hidden = false;
    fondo.querySelector(".modal").focus();
    return fondo.querySelector("#exBody");
  }
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";"));

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
  const nota = (cuerpo, texto) => { cuerpo.innerHTML = '<p class="small-note">' + E(texto) + "</p>"; };
  const logueado = () => typeof currentUser !== "undefined" && !!currentUser;

  async function semanas(semSel) {
    const cuerpo = ventana("Comidas semanales");
    nota(cuerpo, "Cargando…");
    const sem = semSel || lunesDe();
    let h, a;
    try {
      [h, a] = await Promise.all([
        SB.from("menu_semanal").select("semana,dia,comida,plato").neq("plato", "").order("semana", { ascending: false }).limit(1000),
        admin() ? SB.from("menu_semanal").select("dia,comida,plato").eq("semana", sem) : Promise.resolve({ data: [] }),
      ]);
    } catch {
      nota(cuerpo, "No se pudo cargar el menú. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (h.error || a.error) {
      nota(cuerpo, (h.error || a.error).message);
      return;
    }

    let editor = "";
    if (admin()) {
      const por = {};
      a.data.forEach((f) => (por[f.dia + "|" + f.comida] = f.plato));
      editor =
        '<h3 style="margin:0 0 6px">Editar semana</h3>' +
        '<label>Elige cualquier día de la semana<input type="date" id="exSemFecha" value="' + E(sem) + '"></label>' +
        '<p class="small-note" style="margin:6px 0">' + E(rotulo(sem)) + ". Lo que escribas aquí es lo que ve el público.</p>" +
        '<form class="aform" id="exSemForm" autocomplete="off"><div class="tbl"><table style="min-width:520px"><thead><tr><th>Día</th>' +
        COMIDAS.map(([, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" +
        [1, 2, 3, 4, 5, 6].map((d) =>
          "<tr><th>" + DIAS[d] + "</th>" +
          COMIDAS.map(([k]) => '<td><input name="' + d + "|" + k + '" maxlength="120" aria-label="' + DIAS[d] + " " + k + '" value="' + E(por[d + "|" + k] || "") + '"></td>').join("") + "</tr>"
        ).join("") +
        '</tbody></table></div><p class="small-note" id="exSemMsg" role="status"></p><div><button type="submit">Guardar semana</button></div></form>';
    }

    const grupos = new Map();
    h.data.forEach((f) => { if (!grupos.has(f.semana)) grupos.set(f.semana, []); grupos.get(f.semana).push(f); });
    const hist = [...grupos.entries()].map(([s, fs]) => {
      const por = {}; fs.forEach((f) => (por[f.dia + "|" + f.comida] = f.plato));
      const filas = [1, 2, 3, 4, 5, 6].map((d) =>
        "<tr><th>" + DIAS[d] + "</th>" + COMIDAS.map(([k]) => "<td>" + E(por[d + "|" + k] || "—") + "</td>").join("") + "</tr>").join("");
      return '<details class="cn-det" style="margin:6px 0"><summary>' + E(rotulo(s)) + (s === lunesDe() ? " · esta semana" : "") + "</summary>" +
        '<div class="tbl"><table style="min-width:520px"><thead><tr><th>Día</th>' + COMIDAS.map(([, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" + filas + "</tbody></table></div>" +
        '<button type="button" class="ghost danger" data-ex-del="' + E(s) + '">Eliminar esta semana</button></details>';
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
        try {
          const x = await SB.from("menu_semanal").upsert(filas, { onConflict: "semana,dia,comida" });
          if (x.error) { m.textContent = x.error.message; return; }
        } catch {
          m.textContent = "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
          return;
        }
        semanas(sem);
      });
    }
  }
  async function borrarSemana(sem) {
    if (!confirm("¿Eliminar del historial la " + rotulo(sem).toLowerCase() + "? No se puede deshacer.")) return;
    let r;
    try {
      r = await SB.from("menu_semanal").delete().eq("semana", sem);
    } catch {
      alert("No se pudo eliminar. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (r.error) { alert(r.error.message); return; }
    semanas();
  }

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
    nota(cuerpo, "Cargando…");
    let q = SB.from("cnt_auditoria").select("*").order("t", { ascending: false }).limit(200);
    if (tabla) q = q.eq("tabla", tabla);
    let r;
    try {
      r = await q;
    } catch {
      nota(cuerpo, "No se pudo cargar la auditoría. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (r.error) {
      nota(cuerpo, r.error.message);
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
