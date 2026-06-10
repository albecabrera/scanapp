// scansave-data.js — i18n strings (es/de) + sample inventory data
// Plain JS, exposed on window.

(function () {
  const PRODUCTS_META = [
    { key: 'oat',  days: 0,   by: 0, loc: 'fridge',  tile: 0 },
    { key: 'yog',  days: 1,   by: 1, loc: 'fridge',  tile: 1 },
    { key: 'chk',  days: 2,   by: 2, loc: 'fridge',  tile: 2 },
    { key: 'tom',  days: 5,   by: 0, loc: 'fridge',  tile: 3 },
    { key: 'garb', days: 240, by: 3, loc: 'pantry',  tile: 4 },
    { key: 'spag', days: 420, by: 1, loc: 'pantry',  tile: 5 },
  ];

  const es = {
    langName: 'Español',
    household: 'Casa Cabrera',
    members: ['Ana', 'Luis', 'Marta', 'Hugo'],
    you: 'tú',
    tabs: { inventory: 'Inventario', scan: 'Escanear', home: 'Hogar' },
    inv: {
      title: 'Inventario',
      summary: (n, e) => `${n} productos · ${e} vencen pronto`,
      soon: 'Vence pronto',
      seeAll: 'Ver todo',
      filters: ['Todo', 'Nevera', 'Congelador', 'Despensa'],
      sections: { fridge: 'Nevera', freezer: 'Congelador', pantry: 'Despensa' },
    },
    days: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      inDays: (n) => `${n} días`,
      months: (n) => `${n} meses`,
      expired: 'Vencido',
    },
    scan: {
      title: 'Escanear',
      hint: 'Alinea el código de barras',
      found: 'Encontrado',
      source: 'Open Food Facts',
      location: 'Ubicación',
      locations: ['Nevera', 'Congelador', 'Despensa'],
      expiry: 'Caducidad',
      dateValue: '24 jun 2026',
      qty: 'Cantidad',
      assignee: 'Responsable',
      cta: 'Añadir al hogar',
    },
    hh: {
      title: 'Hogar',
      membersCount: (n) => `${n} miembros`,
      invite: 'Invitar al hogar',
      inviteHint: 'El código caduca en 7 días',
      share: 'Compartir enlace',
      copy: 'Copiar',
      membersTitle: 'Miembros',
      admin: 'Admin',
      member: 'Miembro',
      notif: 'Alertas de caducidad',
      notifLead: 'Avisar antes',
      thresholds: ['1 día', '3 días', '7 días'],
      allCritical: 'Avisar a todos si vence mañana',
      perOwner: 'Por defecto se avisa a quien añadió el producto.',
    },
    products: {
      oat:  { name: 'Leche de avena',   detail: 'Oatly · 1 L' },
      yog:  { name: 'Yogur griego',     detail: 'Fage · 500 g' },
      chk:  { name: 'Pechuga de pollo', detail: 'Bandeja · 350 g' },
      tom:  { name: 'Tomates cherry',   detail: '250 g' },
      garb: { name: 'Garbanzos cocidos', detail: 'Bote · 570 g' },
      spag: { name: 'Espaguetis',       detail: 'Barilla · 500 g' },
    },
  };

  const de = {
    langName: 'Deutsch',
    household: 'Familie Weber',
    members: ['Anna', 'Lukas', 'Marie', 'Hugo'],
    you: 'du',
    tabs: { inventory: 'Vorräte', scan: 'Scannen', home: 'Haushalt' },
    inv: {
      title: 'Vorräte',
      summary: (n, e) => `${n} Produkte · ${e} laufen bald ab`,
      soon: 'Läuft bald ab',
      seeAll: 'Alle ansehen',
      filters: ['Alle', 'Kühlschrank', 'Gefrierfach', 'Vorrat'],
      sections: { fridge: 'Kühlschrank', freezer: 'Gefrierfach', pantry: 'Vorratsschrank' },
    },
    days: {
      today: 'Heute',
      tomorrow: 'Morgen',
      inDays: (n) => `${n} Tage`,
      months: (n) => `${n} Monate`,
      expired: 'Abgelaufen',
    },
    scan: {
      title: 'Scannen',
      hint: 'Barcode im Rahmen ausrichten',
      found: 'Gefunden',
      source: 'Open Food Facts',
      location: 'Ort',
      locations: ['Kühlschrank', 'Gefrierfach', 'Vorrat'],
      expiry: 'MHD',
      dateValue: '24. Juni 2026',
      qty: 'Menge',
      assignee: 'Zuständig',
      cta: 'Zum Haushalt hinzufügen',
    },
    hh: {
      title: 'Haushalt',
      membersCount: (n) => `${n} Mitglieder`,
      invite: 'Zum Haushalt einladen',
      inviteHint: 'Code läuft in 7 Tagen ab',
      share: 'Link teilen',
      copy: 'Kopieren',
      membersTitle: 'Mitglieder',
      admin: 'Admin',
      member: 'Mitglied',
      notif: 'Ablauf-Erinnerungen',
      notifLead: 'Vorlaufzeit',
      thresholds: ['1 Tag', '3 Tage', '7 Tage'],
      allCritical: 'Alle warnen, wenn morgen abläuft',
      perOwner: 'Standardmäßig wird benachrichtigt, wer das Produkt hinzugefügt hat.',
    },
    products: {
      oat:  { name: 'Hafermilch',           detail: 'Oatly · 1 L' },
      yog:  { name: 'Griechischer Joghurt', detail: 'Fage · 500 g' },
      chk:  { name: 'Hähnchenbrust',        detail: 'Schale · 350 g' },
      tom:  { name: 'Kirschtomaten',        detail: '250 g' },
      garb: { name: 'Kichererbsen',         detail: 'Glas · 570 g' },
      spag: { name: 'Spaghetti',            detail: 'Barilla · 500 g' },
    },
  };

  window.SS_I18N = { es, de };
  window.SS_ITEMS = PRODUCTS_META;
  window.SS_INVITE_CODE = 'CASA-7K2M';
  window.SS_EAN = '8 410188 012096';
})();
