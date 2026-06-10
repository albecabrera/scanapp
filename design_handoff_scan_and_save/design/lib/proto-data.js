// proto-data.js — extends SS_I18N with strings for the interactive prototype.
// Load AFTER lib/scansave-data.js.

(function () {
  const es = window.SS_I18N.es;
  const de = window.SS_I18N.de;

  es.ob = {
    tagline: 'El inventario de tu hogar, compartido.',
    bullets: [
      { icon: 'scan', text: 'Escanea y añade en segundos' },
      { icon: 'home', text: 'Inventario compartido con tu familia' },
      { icon: 'bell', text: 'Avisos antes de que caduque' },
    ],
    start: 'Empezar',
    chooseTitle: '¿Cómo quieres empezar?',
    chooseSub: 'Siempre podrás crear o unirte a más hogares.',
    create: 'Crear un hogar',
    createSub: 'Un espacio nuevo para tu familia',
    join: 'Unirme con código',
    joinSub: 'Alguien te ha invitado',
    createTitle: 'Tu hogar',
    nameLabel: 'Nombre del hogar',
    createCta: 'Crear hogar',
    joinTitle: 'Código de invitación',
    joinSub2: 'Pídele el código a quien te invitó.',
    joinCta: 'Unirme',
    doneTitle: '¡Listo!',
    doneSub: 'Tu hogar ya está creado. Invita a tu familia cuando quieras desde la pestaña Hogar.',
    doneCta: 'Ir al inventario',
    back: 'Atrás',
  };
  de.ob = {
    tagline: 'Euer Haushaltsvorrat, gemeinsam verwaltet.',
    bullets: [
      { icon: 'scan', text: 'Scannen und in Sekunden hinzufügen' },
      { icon: 'home', text: 'Gemeinsamer Vorrat für die ganze Familie' },
      { icon: 'bell', text: 'Erinnerungen, bevor etwas abläuft' },
    ],
    start: "Los geht's",
    chooseTitle: 'Wie möchtest du starten?',
    chooseSub: 'Du kannst jederzeit weitere Haushalte erstellen oder beitreten.',
    create: 'Haushalt erstellen',
    createSub: 'Ein neuer Bereich für deine Familie',
    join: 'Mit Code beitreten',
    joinSub: 'Du wurdest eingeladen',
    createTitle: 'Dein Haushalt',
    nameLabel: 'Name des Haushalts',
    createCta: 'Haushalt erstellen',
    joinTitle: 'Einladungscode',
    joinSub2: 'Frag die Person, die dich eingeladen hat, nach dem Code.',
    joinCta: 'Beitreten',
    doneTitle: 'Geschafft!',
    doneSub: 'Dein Haushalt ist bereit. Lade deine Familie jederzeit über den Tab „Haushalt" ein.',
    doneCta: 'Zu den Vorräten',
    back: 'Zurück',
  };

  es.detail = {
    location: 'Ubicación',
    expiry: 'Caducidad',
    qty: 'Cantidad',
    addedBy: 'Añadido por',
    consume: 'Consumir 1',
    remove: 'Eliminar',
    locations: { fridge: 'Nevera', freezer: 'Congelador', pantry: 'Despensa' },
  };
  de.detail = {
    location: 'Ort',
    expiry: 'MHD',
    qty: 'Menge',
    addedBy: 'Hinzugefügt von',
    consume: '1 verbrauchen',
    remove: 'Entfernen',
    locations: { fridge: 'Kühlschrank', freezer: 'Gefrierfach', pantry: 'Vorratsschrank' },
  };

  es.toast = {
    added: 'Añadido al hogar',
    consumed: 'Marcado como consumido',
    removed: 'Producto eliminado',
    copied: 'Código copiado',
    switched: (n) => `Cambiado a ${n}`,
  };
  de.toast = {
    added: 'Zum Haushalt hinzugefügt',
    consumed: 'Als verbraucht markiert',
    removed: 'Produkt entfernt',
    copied: 'Code kopiert',
    switched: (n) => `Gewechselt zu ${n}`,
  };

  es.sel = { title: 'Tus hogares', new: 'Nuevo hogar', current: 'Actual' };
  de.sel = { title: 'Deine Haushalte', new: 'Neuer Haushalt', current: 'Aktuell' };

  es.alerts = { title: 'Avisos', empty: 'Nada vence pronto', expires: 'vence' };
  de.alerts = { title: 'Mitteilungen', empty: 'Nichts läuft bald ab', expires: 'läuft ab' };

  // products that the simulated scanner "finds" (not in the starting inventory)
  es.scanPool = {
    butter: { name: 'Mantequilla', detail: 'Kerrygold · 250 g' },
    salmon: { name: 'Salmón ahumado', detail: 'Royal · 100 g' },
    juice:  { name: 'Zumo de naranja', detail: 'Don Simón · 1 L' },
  };
  de.scanPool = {
    butter: { name: 'Butter', detail: 'Kerrygold · 250 g' },
    salmon: { name: 'Räucherlachs', detail: 'Royal · 100 g' },
    juice:  { name: 'Orangensaft', detail: 'Valensina · 1 L' },
  };

  // secondary household for the selector
  es.household2 = 'Piso de Valencia';
  de.household2 = 'WG München';

  window.SS_SCAN_POOL = [
    { key: 'butter', days: 21, loc: 'fridge', tile: 1 },
    { key: 'salmon', days: 4,  loc: 'fridge', tile: 2 },
    { key: 'juice',  days: 12, loc: 'fridge', tile: 5 },
  ];
})();
