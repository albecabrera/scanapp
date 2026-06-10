// scansave-ui.jsx — shared atoms for the Scan & Save direction explorations.
// Props convention: T = theme meta (fonts, radii, style), C = current color set (light/dark).

const SS_ICON_PATHS = {
  bell: <path d="M12 4a5 5 0 0 0-5 5v3.2c0 .7-.3 1.4-.8 1.9L5 15.3c-.5.5-.1 1.7.6 1.7h12.8c.7 0 1.1-1.2.6-1.7l-1.2-1.2a2.7 2.7 0 0 1-.8-1.9V9a5 5 0 0 0-5-5Zm-2 14.5a2 2 0 0 0 4 0" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  chevDown: <path d="M6 9.5l6 6 6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  chevRight: <path d="M9.5 6l6 6-6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  scan: <g fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" /><path d="M7.5 9.5v5M10.5 9.5v5M13.5 9.5v5M16.5 9.5v5" /></g>,
  basket: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 9.5h15l-1.4 8.2a2 2 0 0 1-2 1.8H7.9a2 2 0 0 1-2-1.8L4.5 9.5Z" /><path d="M8.5 9.5 12 4.5l3.5 5" /><path d="M9.5 13v3M14.5 13v3" /></g>,
  home: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 12 4l7.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-8.5Z" /><path d="M9.5 20.5v-6h5v6" /></g>,
  share: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5v11" /><path d="M8 7l4-3.5L16 7" /><path d="M6 11.5H5.5A1.5 1.5 0 0 0 4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6a1.5 1.5 0 0 0-1.5-1.5H18" /></g>,
  copy: <g fill="none" strokeWidth="1.7" strokeLinejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M5 14.5a1.8 1.8 0 0 1-1.5-1.8v-7A2.2 2.2 0 0 1 5.7 3.5h7A1.8 1.8 0 0 1 14.5 5" strokeLinecap="round" /></g>,
  calendar: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10.5h16M8.5 3.5v3.5M15.5 3.5v3.5" /></g>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" strokeWidth="1.9" strokeLinecap="round" />,
  flash: <path d="M13 3 6 13.5h4.5L10.5 21l7-10.5H13L13 3Z" fill="none" strokeWidth="1.7" strokeLinejoin="round" />,
  plus: <path d="M12 5.5v13M5.5 12h13" fill="none" strokeWidth="2" strokeLinecap="round" />,
  minus: <path d="M5.5 12h13" fill="none" strokeWidth="2" strokeLinecap="round" />,
  clock: <g fill="none" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2.5" /></g>,
  gear: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 3.6l1 2.3 2.5-.5 1.5 2 2.3 1-.5 2.6 1.7 1.9-1.7 1.9.5 2.6-2.3 1-1.5 2-2.5-.5-1 2.3-1-2.3-2.5.5-1.5-2-2.3-1 .5-2.6L3.5 13l1.7-1.9-.5-2.6 2.3-1 1.5-2 2.5.5 1-2.3Z" /></g>,
};

function SSIcon({ name, size = 22, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill="none" style={{ display: 'block', flexShrink: 0, ...style }}>
      {SS_ICON_PATHS[name]}
    </svg>
  );
}

function SSAvatar({ name, color, size = 28, T, ring = null }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: T.fontBody, fontWeight: 700,
      fontSize: size * 0.42, letterSpacing: '0.02em', flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      mixBlendMode: 'normal',
    }}>
      <span style={{ filter: 'brightness(10)', opacity: 0.95 }}>{name[0]}</span>
    </div>
  );
}

// Product thumbnail tile — tinted square with initial (placeholder for real photos)
function SSTile({ label, tile, T, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: T.r.tile, background: tile.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: tile.fg, fontFamily: T.fontDisplay, fontWeight: T.style === 'mercado' ? 400 : 700,
      fontSize: size * (T.style === 'mercado' ? 0.5 : 0.42), flexShrink: 0,
    }}>{label[0]}</div>
  );
}

// Expiry badge — kind: 'danger' | 'warn' | 'neutral'
function SSBadge({ label, kind, T, C }) {
  const map = {
    danger: { bg: C.dangerBg, fg: C.danger },
    warn: { bg: C.warnBg, fg: C.warn },
    neutral: { bg: C.surface2, fg: C.inkSoft },
  };
  const m = map[kind];
  return (
    <span style={{
      background: m.bg, color: m.fg, borderRadius: T.r.chip === 100 ? 100 : 7,
      padding: '4px 9px', fontSize: 12, fontWeight: 600, fontFamily: T.fontBody,
      letterSpacing: T.style === 'noir' ? '0.04em' : '0',
      textTransform: T.style === 'noir' ? 'uppercase' : 'none',
      whiteSpace: 'nowrap', lineHeight: '14px', display: 'inline-block',
    }}>{label}</span>
  );
}

function ssExpiryBadge(days, t, T, C) {
  if (days === 0) return <SSBadge label={t.days.today} kind="danger" T={T} C={C} />;
  if (days === 1) return <SSBadge label={t.days.tomorrow} kind="danger" T={T} C={C} />;
  if (days <= 7) return <SSBadge label={t.days.inDays(days)} kind="warn" T={T} C={C} />;
  return <SSBadge label={t.days.months(Math.round(days / 30))} kind="neutral" T={T} C={C} />;
}

// Section label above lists
function SSSectionLabel({ children, T, C, right = null }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 2px', marginBottom: 10,
    }}>
      <span style={{
        fontFamily: T.fontBody, fontSize: T.style === 'noir' ? 12 : 13, fontWeight: 700,
        color: C.inkSoft, letterSpacing: T.style === 'noir' ? '0.1em' : '0.02em',
        textTransform: T.style === 'noir' ? 'uppercase' : 'none',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      {right && <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{right}</span>}
    </div>
  );
}

// Bottom tab bar — 3 items, raised central scan button
function SSTabBar({ T, C, t, active }) {
  const tab = (key, icon, label) => {
    const on = active === key;
    return (
      <div key={key} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        color: on ? C.primary : C.inkFaint, paddingTop: 12,
      }}>
        <SSIcon name={icon} size={24} color="currentColor" />
        <span style={{
          fontFamily: T.fontBody, fontSize: 11, fontWeight: on ? 700 : 500,
          letterSpacing: T.style === 'noir' ? '0.05em' : '0.01em',
        }}>{label}</span>
      </div>
    );
  };
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      background: C.tabBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'flex-start', paddingBottom: 26, height: 88, boxSizing: 'border-box',
    }}>
      {tab('inventory', 'basket', t.tabs.inventory)}
      {/* raised scan button */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 56, height: 56, borderRadius: T.r.btn === 12 ? 16 : '50%', background: C.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -20, boxShadow: `0 8px 20px ${C.primary}55`,
        }}>
          <SSIcon name="scan" size={28} color={C.onPrimary} />
        </div>
        <span style={{
          fontFamily: T.fontBody, fontSize: 11, fontWeight: active === 'scan' ? 700 : 500,
          color: active === 'scan' ? C.primary : C.inkFaint,
          letterSpacing: T.style === 'noir' ? '0.05em' : '0.01em',
        }}>{t.tabs.scan}</span>
      </div>
      {tab('home', 'home', t.tabs.home)}
    </div>
  );
}

// Card shell
function SSCard({ children, T, C, style = {} }) {
  return (
    <div style={{
      background: C.surface, borderRadius: T.r.card, border: `1px solid ${C.border}`,
      boxShadow: C.shadow, ...style,
    }}>{children}</div>
  );
}

// iOS-style toggle
function SSToggle({ on, C }) {
  return (
    <div style={{
      width: 46, height: 28, borderRadius: 100, background: on ? C.primary : C.surface2,
      position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      border: `1px solid ${on ? 'transparent' : C.border}`, boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 22, height: 22,
        borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

Object.assign(window, {
  SSIcon, SSAvatar, SSTile, SSBadge, ssExpiryBadge, SSSectionLabel, SSTabBar, SSCard, SSToggle,
});
