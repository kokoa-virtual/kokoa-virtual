/* movil.js — ajustes móviles de Kokoa Virtual (punto 2: botones de Contabilidad; punto 6: alto de la barra inferior).
   Se carga después de contabilidad.js. Para deshacer: quitar el <script> en index.html. */
(() => {
  const SEL = "#cnt > .tabs[role=tablist]";
  const movil = matchMedia("(max-width:760px)");
  let ultimo = null;

  // Marca si hay más botones fuera de pantalla a la izquierda / derecha
  function marcar(el) {
    if (!el) return;
    const izq = el.scrollLeft > 4;
    const der = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    el.classList.toggle("ov-l", izq);
    el.classList.toggle("ov-r", der);
  }

  // Cada render de Contabilidad recrea la fila y la deja al inicio:
  // se vuelve a centrar el botón activo para que no quede escondido.
  function centrarActivo(el) {
    const a = el.querySelector('.tab[aria-pressed="true"]');
    if (!a) return;
    const rc = el.getBoundingClientRect();
    const ra = a.getBoundingClientRect();
    el.scrollLeft += (ra.left - rc.left) - (rc.width - ra.width) / 2;
  }

  function revisar() {
    const el = document.querySelector(SEL);
    if (!el) { ultimo = null; return; }
    if (el !== ultimo) {
      ultimo = el;
      if (movil.matches) centrarActivo(el);
    }
    marcar(el);
  }

  // scroll no burbujea: se escucha en captura
  document.addEventListener("scroll", e => {
    const t = e.target;
    if (t && t.matches && t.matches(SEL)) marcar(t);
  }, true);

  addEventListener("resize", () => marcar(document.querySelector(SEL)));
  addEventListener("orientationchange", () => setTimeout(() => marcar(document.querySelector(SEL)), 200));

  // Punto 6: alto real de la barra inferior -> variable CSS --barra-h
  // (movil.css la usa para que el contenido no quede tapado).
  const barra = document.getElementById("views");
  function medirBarra() {
    if (!barra) return;
    const fija = getComputedStyle(barra).position === "fixed";
    const h = fija ? Math.ceil(barra.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--barra-h", h + "px");
  }
  if (barra) {
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(medirBarra).observe(barra);
    addEventListener("resize", medirBarra);
    addEventListener("orientationchange", () => setTimeout(medirBarra, 200));
    medirBarra();
  }

  new MutationObserver(revisar).observe(document.body, { childList: true, subtree: true });
  revisar();
})();
