/* Construye los archivos publicables de Kokoa Virtual a partir de las fuentes legibles.
 *
 *   node construir.cjs <carpeta-fuentes> <carpeta-salida>
 *
 * - estilos.css: se consolida (se juntan los @media iguales y las reglas con el mismo selector)
 *   SOLO cuando el orden de la cascada no cambia, se quitan los !important que se puede
 *   demostrar que sobran, y se minifica.
 * - app.js, prestamos.js, contabilidad.js: se minifican (los nombres globales se conservan
 *   porque los tres archivos comparten el mismo ámbito global).
 */
const fs = require("fs");
const path = require("path");

function cargar(nombre, rutas) {
  for (const r of rutas) { try { return require(path.join(r, nombre)); } catch (_) {} }
  return require(nombre);
}
const NM = "/home/claude/.npm-global/lib/node_modules";
const postcss = cargar("postcss", [NM + "/@mermaid-js/mermaid-cli/node_modules"]);
const esbuild = cargar("esbuild", [NM + "/tsx/node_modules"]);

/* ---------- especificidad ---------- */
function especificidad(sel) {
  // devuelve a*10000 + b*100 + c
  let s = sel.replace(/\\./g, "x");
  s = s.replace(/"[^"]*"|'[^']*'/g, '""');
  let a = 0, b = 0, c = 0;
  // :where(...) -> 0
  s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
  // :not/:is/:has(...) -> especificidad del argumento más específico
  let extra = 0;
  s = s.replace(/:(not|is|has|matches)\(((?:[^()]|\([^()]*\))*)\)/g, (_, _n, arg) => {
    let m = 0;
    for (const p of splitTop(arg)) m = Math.max(m, especificidad(p));
    extra += m; return "";
  });
  s = s.replace(/\[[^\]]*\]/g, () => { b++; return " "; });
  s = s.replace(/#[\w-]+/g, () => { a++; return " "; });
  s = s.replace(/::[\w-]+(\([^)]*\))?/g, () => { c++; return " "; });
  s = s.replace(/:(before|after|first-line|first-letter)\b/g, () => { c++; return " "; });
  s = s.replace(/:[\w-]+(\([^)]*\))?/g, () => { b++; return " "; });
  s = s.replace(/\.[\w-]+/g, () => { b++; return " "; });
  s = s.replace(/(^|[\s>+~])([a-zA-Z][\w-]*)/g, (m, p) => { c++; return p + " "; });
  return a * 10000 + b * 100 + c + extra;
}
function splitTop(sel) {
  const out = []; let d = 0, cur = "", q = null;
  for (const ch of sel) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === "(" || ch === "[") d++;
    if (ch === ")" || ch === "]") d--;
    if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* ---------- familias de propiedades (shorthand <-> longhand) ---------- */
function fam(p) {
  p = p.toLowerCase();
  if (p.startsWith("--") || p.startsWith("-webkit-") || p.startsWith("-moz-")) return p;
  if (/^(min|max)-/.test(p)) return p;
  if (/^(top|right|bottom|left|inset)(-|$)/.test(p)) return "inset";
  if (/^(gap|row-gap|column-gap|grid-gap)$/.test(p)) return "gap";
  if (/^(align|justify|place)-/.test(p)) return "align";
  if (/^text-decoration/.test(p)) return "text-decoration";
  if (/^text-/.test(p)) return p;
  if (/^scroll-/.test(p)) return p;
  if (/^(flex|grid)(-|$)/.test(p)) return p.startsWith("flex") ? "flex" : "grid";
  if (/^overflow(-x|-y)?$/.test(p)) return "overflow";
  const m = p.match(/^(margin|padding|border|background|font|transition|animation|list-style|outline|columns?|mask|white-space)(-|$)/);
  if (m) return m[1] === "column" || m[1] === "columns" ? "columns" : m[1];
  return p;
}

/* ---------- lectura del CSS como "átomos" (una regla + su contexto @media) ---------- */
function leer(css) {
  const root = postcss.parse(css);
  const atoms = [];
  const regla = (r, ctx) => {
    const selectors = splitTop(r.selector.replace(/\s+/g, " ").trim());
    const decls = [];
    r.each(n => {
      if (n.type === "decl") decls.push({ prop: n.prop, value: n.value, important: !!n.important });
      else if (n.type !== "comment") throw new Error("Nodo inesperado dentro de una regla: " + n.type);
    });
    atoms.push({ ctx, selectors, decls, specs: selectors.map(especificidad), fixed: false });
  };
  root.each(n => {
    if (n.type === "comment") return;
    if (n.type === "rule") return regla(n, "");
    if (n.type === "atrule" && n.name === "media") {
      n.each(c => {
        if (c.type === "comment") return;
        if (c.type !== "rule") throw new Error("Contenido inesperado en @media: " + c.type);
        regla(c, n.params);
      });
      return;
    }
    if (n.type === "atrule" && n.name === "keyframes") {
      atoms.push({ ctx: "@kf " + n.params, raw: n.toString(), decls: [], selectors: [], specs: [], fixed: true });
      return;
    }
    throw new Error("Nodo de primer nivel no previsto: " + n.type + " " + (n.name || ""));
  });
  return atoms;
}

/* dos átomos "interactúan" si el orden entre ellos podría cambiar qué declaración gana */
function interactuan(A, B) {
  if (A.fixed || B.fixed) return false;
  const sa = new Set(A.specs);
  const iguales = B.specs.some(s => sa.has(s));
  if (!iguales) return false; // la especificidad decide, el orden no importa
  for (const da of A.decls) for (const db of B.decls) {
    if (fam(da.prop) !== fam(db.prop)) continue;
    if (da.important !== db.important) continue; // importante siempre gana a normal
    return true;
  }
  return false;
}

/* ---------- consolidación ---------- */
function consolidar(atoms, stats) {
  let cambio = true, pasadas = 0;
  while (cambio && pasadas++ < 8) {
    cambio = false;
    for (let i = 1; i < atoms.length; i++) {
      const a = atoms[i];
      if (a.fixed) continue;
      let j = -1;
      for (let k = i - 1; k >= 0; k--) if (!atoms[k].fixed && atoms[k].ctx === a.ctx) { j = k; break; }
      if (j === -1 || j === i - 1) continue;
      let libre = true;
      for (let k = j + 1; k < i; k++) if (interactuan(a, atoms[k])) { libre = false; break; }
      if (!libre) continue;
      atoms.splice(i, 1);
      atoms.splice(j + 1, 0, a);
      cambio = true;
    }
  }
  // juntar átomos consecutivos con el mismo contexto y el mismo selector
  const out = [];
  for (const a of atoms) {
    const p = out[out.length - 1];
    if (p && !p.fixed && !a.fixed && p.ctx === a.ctx && p.selectors.join(",") === a.selectors.join(",")) {
      p.decls = p.decls.concat(a.decls);
      stats.reglasFusionadas++;
    } else out.push(a);
  }
  // quitar declaraciones idénticas repetidas dentro de una misma regla (conservando la última)
  for (const a of out) {
    if (a.fixed) continue;
    const L = a.decls;
    for (let k = L.length - 1; k >= 0; k--) {
      for (let m = k - 1; m >= 0; m--) {
        const x = L[m], y = L[k];
        if (x.prop === y.prop && x.value === y.value && x.important === y.important) {
          let choque = false;
          for (let n = m + 1; n < k; n++) if (fam(L[n].prop) === fam(x.prop)) { choque = true; break; }
          if (!choque) { L.splice(m, 1); stats.declRepetidas++; k--; }
          break;
        }
      }
    }
  }
  return out;
}

/* ---------- !important que se puede demostrar que sobra ---------- */
function propsEnLineas(html, js) {
  const s = new Set();
  const add = p => { p = (p || "").trim(); if (p) s.add(fam(p.replace(/[A-Z]/g, c => "-" + c.toLowerCase()))); };
  for (const m of html.matchAll(/style="([^"]*)"/g)) for (const p of m[1].split(";")) add(p.split(":")[0]);
  for (const m of js.matchAll(/style="([^"]*)"/g)) for (const p of m[1].split(";")) { const k = p.split(":")[0]; if (!k.includes("$")) add(k); }
  for (const m of js.matchAll(/\.style\.([a-zA-Z]+)/g)) if (!["cssText", "setProperty", "removeProperty", "getPropertyValue"].includes(m[1])) add(m[1]);
  for (const m of js.matchAll(/style\.(?:setProperty|removeProperty|getPropertyValue)\(\s*["']([^"']+)/g)) add(m[1]);
  for (const m of js.matchAll(/cssText\s*=\s*["'`]([^"'`]*)/g)) for (const p of m[1].split(";")) add(p.split(":")[0]);
  for (const m of js.matchAll(/setAttribute\(\s*["']style["']\s*,\s*["'`]([^"'`]*)/g)) for (const p of m[1].split(";")) add(p.split(":")[0]);
  return s;
}

function quitarImportantes(atoms, inline, animadas, stats, detalle) {
  // orden global de cada declaración
  const todas = [];
  atoms.forEach((a, ai) => a.decls.forEach((d, di) => todas.push({ a, d, ai, di, f: fam(d.prop) })));
  const porFam = new Map();
  for (const t of todas) { if (!porFam.has(t.f)) porFam.set(t.f, []); porFam.get(t.f).push(t); }
  const aQuitar = [];
  for (const t of todas) {
    if (!t.d.important) continue;
    stats.importantes++;
    const motivo = r => { detalle.push({ sel: t.a.selectors.join(", "), ctx: t.a.ctx, prop: t.d.prop, motivo: r }); };
    if (/prefers-reduced-motion/.test(t.a.ctx)) { motivo("accesibilidad: movimiento reducido, se conserva a propósito"); continue; }
    if (inline.has(t.f)) { motivo("la propiedad también se fija en línea (HTML/JS)"); continue; }
    if (animadas.has(t.f)) { motivo("la propiedad se anima en un @keyframes"); continue; }
    const dmin = Math.min(...t.a.specs);
    let ok = true, why = "";
    for (const e of porFam.get(t.f)) {
      if (e === t) continue;
      if (e.d.important) { ok = false; why = "compite con otro !important"; break; }
      const emax = Math.max(...e.a.specs);
      const despues = t.ai > e.ai || (t.ai === e.ai && t.di > e.di);
      if (dmin > emax) continue;
      if (dmin === emax && despues) continue;
      ok = false; why = "otra regla de la misma propiedad la ganaría sin !important"; break;
    }
    if (ok) aQuitar.push(t); else motivo(why);
  }
  // quitar de a uno comprobando de nuevo contra el estado actual no hace falta: la prueba compara contra
  // TODAS las demás declaraciones y ningún otro !important, así que quitar varias a la vez es seguro
  for (const t of aQuitar) { t.d.important = false; stats.importantesQuitados++; detalle.push({ sel: t.a.selectors.join(", "), ctx: t.a.ctx, prop: t.d.prop, motivo: "QUITADO" }); }
}

/* ---------- salida ---------- */
function escribir(atoms) {
  const partes = [];
  let ctx = null, buf = [];
  const volcar = () => {
    if (!buf.length) return;
    partes.push(ctx ? `@media ${ctx}{\n${buf.join("\n")}\n}` : buf.join("\n"));
    buf = [];
  };
  for (const a of atoms) {
    if (a.fixed) { volcar(); ctx = null; partes.push(a.raw); continue; }
    if (a.ctx !== ctx) { volcar(); ctx = a.ctx; }
    buf.push(`${a.selectors.join(",")}{${a.decls.map(d => `${d.prop}:${d.value}${d.important ? "!important" : ""}`).join(";")}}`);
  }
  volcar();
  return partes.join("\n") + "\n";
}

function main() {
  const [src, out, opt] = process.argv.slice(2);
  if (!src || !out) { console.error("uso: node construir.cjs <fuentes> <salida> [--informe]"); process.exit(1); }
  fs.mkdirSync(out, { recursive: true });
  const leerF = f => fs.readFileSync(path.join(src, f), "utf8");
  const jsNombres = ["app.js", "prestamos.js", "contabilidad.js"];
  const hp = [path.join(src, "index.html"), path.join(out, "index.html")].find(f => fs.existsSync(f));
  const html = hp ? fs.readFileSync(hp, "utf8") : "";
  const js = jsNombres.map(leerF).join("\n");

  const css = leerF("estilos.css");
  const stats = { reglasFusionadas: 0, declRepetidas: 0, importantes: 0, importantesQuitados: 0 };
  const atoms = consolidar(leer(css), stats);

  const animadas = new Set();
  postcss.parse(css).walkAtRules("keyframes", k => k.walkDecls(d => animadas.add(fam(d.prop))));
  const inline = propsEnLineas(html, js);
  ["position", "right", "bottom", "width", "height", "border"].forEach(p => inline.add(fam(p)));
  const detalle = [];
  quitarImportantes(atoms, inline, animadas, stats, detalle);

  const cssConsolidado = escribir(atoms);
  const TARGET = ["chrome80", "safari13", "firefox78", "edge80"];
  const cssMin = esbuild.transformSync(cssConsolidado, { loader: "css", minify: true, target: TARGET, legalComments: "none" }).code;
  fs.writeFileSync(path.join(out, "estilos.css"), cssMin);
  fs.writeFileSync(path.join(out, "_estilos.consolidado.css"), cssConsolidado);
  for (const f of jsNombres) {
    const min = esbuild.transformSync(leerF(f), { loader: "js", minify: true, target: ["es2020"], legalComments: "none" }).code;
    fs.writeFileSync(path.join(out, f), min);
  }
  const bloques = atoms.reduce((n, a, i) => n + (!a.fixed && a.ctx && (i === 0 || atoms[i - 1].ctx !== a.ctx) ? 1 : 0), 0);
  console.log(JSON.stringify({ ...stats, bloquesMedia: bloques, atomos: atoms.length }));
  if (opt === "--informe") fs.writeFileSync(path.join(out, "_importantes.json"), JSON.stringify(detalle, null, 1));
}
main();
