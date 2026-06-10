// proto-shared.jsx — liquid-glass primitives, sheets, toasts, tab bar, press states
// for the Scan & Save interactive prototype. Requires scansave-ui.jsx (SSIcon, SSAvatar…).

const SS_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // Apple-like spring-ish ease

(function injectProtoCSS() {
  if (document.getElementById('ss-proto-css')) return;
  const el = document.createElement('style');
  el.id = 'ss-proto-css';
  el.textContent = `
    @keyframes ss-scanline { 0% { top: 12%; } 50% { top: 84%; } 100% { top: 12%; } }
    @keyframes ss-pop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes ss-fadeup { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ss-newitem { 0% { background-color: var(--ss-new-bg); } 100% { background-color: transparent; } }
    @keyframes ss-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
    @keyframes ss-checkdraw { from { stroke-dashoffset: 26; } to { stroke-dashoffset: 0; } }
    .ss-fadeup { animation: ss-fadeup 0.5s ${SS_EASE} both; }
    @media (prefers-reduced-motion: reduce) {
      .ss-fadeup { animation: none; }
    }
  `;
  document.head.appendChild(el);
})();

// Pressable wrapper — scales down while pressed, Apple-style
function SSPress({ children, onClick, style = {}, scale = 0.96, disabled = false }) {
  const [down, setDown] = React.useState(false);
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        cursor: disabled ? 'default' : 'pointer', userSelect: 'none',
        transform: down ? `scale(${scale})` : 'scale(1)',
        transition: `transform 0.25s ${SS_EASE}`,
        ...style,
      }}
    >{children}</div>
  );
}

// Liquid-glass surface (blur + tint + inner shine) — circle or pill
function SSGlass({ children, dark = false, size = 42, pill = false, onClick, style = {} }) {
  const base = {
    height: size, minWidth: size, borderRadius: 100,
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: pill ? '0 14px' : 0,
    boxShadow: dark
      ? '0 2px 6px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.18)'
      : '0 1px 3px rgba(18,35,25,0.06), 0 4px 12px rgba(18,35,25,0.06)',
    ...style,
  };
  const inner = (
    <React.Fragment>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 100,
        backdropFilter: 'blur(14px) saturate(170%)', WebkitBackdropFilter: 'blur(14px) saturate(170%)',
        background: dark ? 'rgba(40,52,44,0.55)' : 'rgba(255,255,255,0.55)',
      }}></div>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 100, pointerEvents: 'none',
        boxShadow: dark
          ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.12), inset -1px -1px 1px rgba(255,255,255,0.05)'
          : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.8), inset -1px -1px 1px rgba(255,255,255,0.4)',
        border: dark ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid rgba(18,35,25,0.07)',
      }}></div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </React.Fragment>
  );
  return onClick
    ? <SSPress onClick={onClick} scale={0.92} style={base}>{inner}</SSPress>
    : <div style={base}>{inner}</div>;
}

// Bottom sheet inside the device — scrim + sprung panel. Stays mounted.
function SSSheet({ open, onClose, C, T, children, maxH = 620 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(8,16,11,0.45)',
        opacity: open ? 1 : 0, transition: `opacity 0.4s ${SS_EASE}`,
        backdropFilter: open ? 'blur(2px)' : 'none',
      }}></div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: maxH,
        background: C.bg, borderRadius: '28px 28px 0 0',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.3)',
        transform: open ? 'translateY(0)' : 'translateY(105%)',
        transition: `transform 0.55s ${SS_EASE}`,
        padding: '10px 20px 34px', boxSizing: 'border-box',
      }}>
        <div style={{ width: 38, height: 5, borderRadius: 100, background: C.inkFaint, opacity: 0.35, margin: '0 auto 14px' }}></div>
        {children}
      </div>
    </div>
  );
}

// Toast — glass pill that floats above the tab bar
function SSToast({ toast, C, T }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 106, zIndex: 70,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      opacity: toast ? 1 : 0,
      transform: toast ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
      transition: `opacity 0.35s ${SS_EASE}, transform 0.45s ${SS_EASE}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 100,
        background: C.ink, color: C.bg, fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.bg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="26" style={{ animation: toast ? 'ss-checkdraw 0.5s 0.1s both' : 'none' }} />
        </svg>
        {toast && toast.label}
      </div>
    </div>
  );
}

// Interactive tab bar — glass, animated active state, raised scan button
function SSProtoTabBar({ T, C, t, active, onSelect }) {
  const tab = (key, icon, label) => {
    const on = active === key;
    return (
      <SSPress key={key} onClick={() => onSelect(key)} scale={0.92} style={{ flex: 1 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: on ? C.primary : C.inkFaint, paddingTop: 12,
          transition: `color 0.3s ${SS_EASE}`,
        }}>
          <div style={{ transform: on ? 'translateY(-1px)' : 'none', transition: `transform 0.3s ${SS_EASE}` }}>
            <SSIcon name={icon} size={24} color="currentColor" />
          </div>
          <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: on ? 700 : 500 }}>{label}</span>
        </div>
      </SSPress>
    );
  };
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      background: C.tabBg, backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      borderTop: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'flex-start', paddingBottom: 26, height: 88, boxSizing: 'border-box',
    }}>
      {tab('inventory', 'basket', t.tabs.inventory)}
      <SSPress onClick={() => onSelect('scan')} scale={0.9} style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: -20, boxShadow: `0 8px 20px ${C.primary}55`,
            transform: active === 'scan' ? 'scale(1.06)' : 'scale(1)',
            transition: `transform 0.35s ${SS_EASE}`,
          }}>
            <SSIcon name="scan" size={28} color={C.onPrimary} />
          </div>
          <span style={{
            fontFamily: T.fontBody, fontSize: 11, fontWeight: active === 'scan' ? 700 : 500,
            color: active === 'scan' ? C.primary : C.inkFaint,
          }}>{t.tabs.scan}</span>
        </div>
      </SSPress>
      {tab('home', 'home', t.tabs.home)}
    </div>
  );
}

// Primary button
function SSButton({ label, onClick, C, T, icon = null, variant = 'primary', style = {} }) {
  const v = {
    primary: { background: C.primary, color: C.onPrimary, boxShadow: `0 10px 24px ${C.primary}4D` },
    tint: { background: C.primaryTint, color: C.primary, boxShadow: 'none' },
    danger: { background: 'transparent', color: C.danger, boxShadow: 'none' },
    ghost: { background: C.surface2, color: C.ink, boxShadow: 'none' },
  }[variant];
  return (
    <SSPress onClick={onClick} style={{ ...style }}>
      <div style={{
        ...v, borderRadius: T.r.btn, padding: '15px 0', textAlign: 'center',
        fontFamily: T.fontBody, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {icon && <SSIcon name={icon} size={18} color="currentColor" />}
        {label}
      </div>
    </SSPress>
  );
}

Object.assign(window, { SS_EASE, SSPress, SSGlass, SSSheet, SSToast, SSProtoTabBar, SSButton });
