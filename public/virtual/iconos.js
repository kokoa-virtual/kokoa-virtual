(() => {
  const P = {
    quitar: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    agregar: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    pedido: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    graficos: '<path d="M5 20v-9M12 20V4M19 20v-6"/>',
    historial: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    prestar: '<path d="M7 17 17 7M9 7h8v8"/>',
    devolver: '<path d="M17 7 7 17M15 17H7V9"/>',
    encurso: '<path d="M7 3h10M7 21h10M8 3v3.5L12 11l4-4.5V3M8 21v-3.5L12 13l4 4.5V21"/>',
    reg: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
    dia: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    inf: '<path d="M5 20v-9M12 20V4M19 20v-6"/>',
    cie: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    cat: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    mas: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    fecha: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
    buscar: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  const svg = (n, t = 22) =>
    `<svg class="ki" viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
  window.KI = { svg, paths: P };
})();
