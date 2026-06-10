// desktop-app.jsx — responsive desktop/tablet layout for Scan & Save (Fresco).
// Reuses atoms from scansave-ui.jsx, proto-shared.jsx, proto-inventory.jsx (ssProductInfo, ssDateLabel).

// extra strings
(function () {
  window.SS_I18N.de.desk = {
    search: 'Suchen…', scan: 'Produkt scannen', addTitle: 'Produkt hinzufügen',
    eanLabel: 'Barcode (EAN)', lookup: 'Nachschlagen', cancel: 'Abbrechen',
    items: (n) => `${n} Produkte`, all: 'Alle Orte', detail: 'Details',
  };
  window.SS_I18N.es.desk = {
    search: 'Buscar…', scan: 'Escanear producto', addTitle: 'Añadir producto',
    eanLabel: 'Código de barras (EAN)', lookup: 'Buscar', cancel: 'Cancelar',
    items: (n) => `${n} productos`, all: 'Todas las ubicaciones', detail: 'Detalles',
  };
})();

// ── Sidebar ───────────────────────────────────────────────
function DeskSidebar({ T, C, t, view, setView, collapsed, onScan, householdName, onSwitch }) {
  const navItem = (key, icon, label) => {
    const on = view === key;
    return (
      <SSPress key={key} onClick={() => setView(key)} scale={0.97}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '11px 0' : '11px 13px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 13, background: on ? C.primaryTint : 'transparent',
          color: on ? C.primary : C.inkSoft, transition: `background 0.25s ${SS_EASE}`,
        }}>
          <SSIcon name={icon} size={21} color="currentColor" />
          {!collapsed && <span style={{ fontSize: 14.5, fontWeight: on ? 700 : 600 }}>{label}</span>}
        </div>
      </SSPress>
    );
  };
  return (
    <div style={{
      width: collapsed ? 76 : 232, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${C.border}`, padding: collapsed ? '20px 12px' : '20px 16px',
      boxSizing: 'border-box', transition: `width 0.4s ${SS_EASE}`, background: C.surface,
    }}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 26 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 13, background: C.primary, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${C.primary}4D`,
        }}>
          <SSIcon name="scan" size={20} color={C.onPrimary} />
        </div>
        {!collapsed && <span style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Scan &amp; Save</span>}
      </div>

      {/* scan CTA */}
      <SSPress onClick={onScan}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          background: C.primary, color: C.onPrimary, borderRadius: 14,
          padding: collapsed ? '12px 0' : '13px 0', fontSize: 14.5, fontWeight: 700,
          boxShadow: `0 8px 20px ${C.primary}40`, marginBottom: 18,
        }}>
          <SSIcon name="scan" size={19} color={C.onPrimary} />
          {!collapsed && t.desk.scan}
        </div>
      </SSPress>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItem('inventory', 'basket', t.tabs.inventory)}
        {navItem('home', 'home', t.tabs.home)}
      </div>

      <div style={{ flex: 1 }}></div>

      {/* household switcher */}
      <SSPress onClick={onSwitch} scale={0.97}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '8px 0' : '9px 11px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 13, border: `1px solid ${C.border}`, background: C.bg,
        }}>
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', border: `2px solid ${C.surface}` }}>
                <SSAvatar name={t.members[i]} color={C.avatars[i]} size={22} T={T} />
              </div>
            ))}
          </div>
          {!collapsed && (
            <React.Fragment>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{householdName}</span>
              <SSIcon name="chevDown" size={13} color={C.inkFaint} />
            </React.Fragment>
          )}
        </div>
      </SSPress>
    </div>
  );
}

// ── Inventory grid view ───────────────────────────────────
function DeskInventory({ T, C, t, items, filter, setFilter, onItemTap, selectedId, compact }) {
  const filters = [
    { id: 'all', label: t.inv.filters[0] }, { id: 'fridge', label: t.inv.filters[1] },
    { id: 'freezer', label: t.inv.filters[2] }, { id: 'pantry', label: t.inv.filters[3] },
  ];
  const sections = ['fridge', 'freezer', 'pantry']
    .filter(loc => filter === 'all' || filter === loc)
    .map(loc => ({ loc, items: items.filter(i => i.loc === loc) }))
    .filter(s => s.items.length);
  const expiring = items.filter(i => i.days <= 2);

  return (
    <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ padding: '26px 28px 40px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 27, letterSpacing: '-0.02em' }}>{t.inv.title}</div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 4 }}>{t.inv.summary(items.length, expiring.length)}</div>
          </div>
          {/* search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 100, padding: '10px 16px', width: compact ? 150 : 230,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke={C.inkFaint} strokeWidth="1.8" /><path d="M16 16l4.5 4.5" stroke={C.inkFaint} strokeWidth="1.8" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 13.5, color: C.inkFaint }}>{t.desk.search}</span>
          </div>
          <SSGlass style={{ position: 'relative' }}>
            <SSIcon name="bell" size={19} color={C.inkSoft} />
            {expiring.length > 0 && <div style={{ position: 'absolute', top: -1, right: 0, width: 9, height: 9, borderRadius: '50%', background: C.danger, border: `1.5px solid ${C.surface}` }}></div>}
          </SSGlass>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {filters.map(f => {
            const on = filter === f.id;
            return (
              <SSPress key={f.id} onClick={() => setFilter(f.id)} scale={0.94}>
                <div style={{
                  padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  background: on ? C.ink : C.surface, color: on ? C.bg : C.inkSoft,
                  border: `1px solid ${on ? C.ink : C.border}`, whiteSpace: 'nowrap',
                  transition: `background 0.3s ${SS_EASE}, color 0.3s ${SS_EASE}`,
                }}>{f.label}</div>
              </SSPress>
            );
          })}
        </div>

        {/* sections as card grids */}
        {sections.map(s => (
          <div key={s.loc} style={{ marginBottom: 26 }}>
            <SSSectionLabel T={T} C={C} right={<span style={{ fontFamily: T.fontBody, fontSize: 12, color: C.inkFaint }}>{t.desk.items(s.items.length)}</span>}>
              {t.inv.sections[s.loc]}
            </SSSectionLabel>
            <div style={{
              display: 'grid', gap: 12,
              gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 180 : 200}px, 1fr))`,
            }}>
              {s.items.map(item => {
                const p = ssProductInfo(t, item.key);
                const sel = item.id === selectedId;
                return (
                  <SSPress key={item.id} onClick={() => onItemTap(item)} scale={0.97}>
                    <div style={{
                      background: C.surface, borderRadius: 16, padding: 14, boxSizing: 'border-box',
                      border: `1.5px solid ${sel ? C.primary : C.border}`,
                      boxShadow: sel ? `0 0 0 4px ${C.primary}1A` : C.shadow,
                      transition: `border-color 0.25s ${SS_EASE}, box-shadow 0.25s ${SS_EASE}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={42} />
                        {ssExpiryBadge(item.days, t, T, C)}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}{item.qty > 1 && <span style={{ color: C.inkFaint }}> ×{item.qty}</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 3 }}>{p.detail}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: C.inkSoft, background: C.surface2, borderRadius: 100, padding: '3px 9px' }}>{t.detail.locations[item.loc]}</span>
                        <SSAvatar name={t.members[item.by]} color={C.avatars[item.by]} size={20} T={T} />
                      </div>
                    </div>
                  </SSPress>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail side panel ─────────────────────────────────────
function DeskDetail({ T, C, t, lang, item, open, onClose, onConsume, onRemove, onQty, overlay }) {
  return (
    <div style={{
      width: 318, flexShrink: 0, boxSizing: 'border-box',
      borderLeft: `1px solid ${C.border}`, background: C.surface,
      padding: '22px 22px 26px', overflowY: 'auto',
      ...(overlay ? {
        position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 40,
        boxShadow: '-18px 0 48px rgba(0,0,0,0.18)',
        transform: open ? 'translateX(0)' : 'translateX(105%)',
        transition: `transform 0.5s ${SS_EASE}`,
      } : {
        marginRight: open ? 0 : -318,
        transition: `margin-right 0.5s ${SS_EASE}`,
      }),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.inkSoft }}>{t.desk.detail}</span>
        <SSPress onClick={onClose} scale={0.85}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SSIcon name="x" size={15} color={C.inkSoft} />
          </div>
        </SSPress>
      </div>
      {item && (
        <SSItemDetail T={T} C={C} t={t} lang={lang} item={item}
          onConsume={onConsume} onRemove={onRemove} onQty={onQty} />
      )}
    </div>
  );
}

// ── Household view ────────────────────────────────────────
function DeskHousehold({ T, C, t, householdName, notifDays, setNotifDays, notifyAll, setNotifyAll, onCopy }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { setCopied(true); onCopy(); setTimeout(() => setCopied(false), 1800); };
  const roles = [0, 1, 2, 3].map(i => (i === 0 ? t.hh.admin : t.hh.member));
  return (
    <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ padding: '26px 28px 40px', maxWidth: 860, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 27, letterSpacing: '-0.02em' }}>{householdName}</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 4, marginBottom: 24 }}>{t.hh.membersCount(4)}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
          {/* left column: invite + notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ borderRadius: T.r.card, padding: '20px 20px 18px', background: C.primaryTint, border: `1px solid ${C.primary}33` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primary }}>{t.hh.invite}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 26, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{window.SS_INVITE_CODE}</span>
                <SSPress onClick={copy} scale={0.85}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: copied ? C.primary : C.surface, border: `1px solid ${copied ? C.primary : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: `background 0.3s ${SS_EASE}`,
                  }}>
                    <SSIcon name={copied ? 'check' : 'copy'} size={17} color={copied ? C.onPrimary : C.inkSoft} />
                  </div>
                </SSPress>
              </div>
              <div style={{ marginTop: 14 }}>
                <SSButton label={t.hh.share} icon="share" onClick={() => {}} C={C} T={T} />
              </div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 10, textAlign: 'center' }}>{t.hh.inviteHint}</div>
            </div>

            <SSCard T={T} C={C} style={{ padding: '16px 16px 14px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{t.hh.notif}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 9 }}>{t.hh.notifLead}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {t.hh.thresholds.map((d, i) => {
                  const on = notifDays.includes(i);
                  return (
                    <SSPress key={d} onClick={() => setNotifDays(on ? notifDays.filter(x => x !== i) : [...notifDays, i])} scale={0.94} style={{ flex: 1 }}>
                      <div style={{
                        textAlign: 'center', padding: '9px 0', borderRadius: 12, fontSize: 13,
                        fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
                        background: on ? C.primaryTint : C.surface2, color: on ? C.primary : C.inkSoft,
                        border: `1px solid ${on ? C.primary + '4D' : C.border}`,
                        transition: `background 0.25s ${SS_EASE}`,
                      }}>{d}</div>
                    </SSPress>
                  );
                })}
              </div>
              <SSPress onClick={() => setNotifyAll(!notifyAll)} scale={0.99}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15, paddingTop: 13, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{t.hh.allCritical}</div>
                  <SSToggle on={notifyAll} C={C} />
                </div>
              </SSPress>
              <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 9, lineHeight: 1.4 }}>{t.hh.perOwner}</div>
            </SSCard>
          </div>

          {/* right column: members */}
          <SSCard T={T} C={C} style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, padding: '15px 16px 11px' }}>{t.hh.membersTitle} · 4</div>
            {t.members.map((m, i) => (
              <div key={m} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                borderTop: `1px solid ${C.border}`,
              }}>
                <SSAvatar name={m} color={C.avatars[i]} size={38} T={T} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m}{i === 0 ? <span style={{ color: C.inkFaint, fontWeight: 500 }}> · {t.you}</span> : ''}</div>
                </div>
                <SSBadge label={roles[i]} kind={i === 0 ? 'warn' : 'neutral'} T={T} C={C} />
              </div>
            ))}
          </SSCard>
        </div>
      </div>
    </div>
  );
}

// ── Scan / add modal ──────────────────────────────────────
function DeskScanModal({ T, C, t, lang, open, onClose, product, onAdd }) {
  const [phase, setPhase] = React.useState('input'); // input → found
  const [loc, setLoc] = React.useState('fridge');
  const [qty, setQty] = React.useState(1);
  React.useEffect(() => {
    if (open) { setPhase('input'); setLoc(product.loc); setQty(1); }
  }, [open, product.key]);

  const p = t.scanPool[product.key];
  const locKeys = ['fridge', 'freezer', 'pantry'];
  const fieldLabel = { fontSize: 12, fontWeight: 700, color: C.inkFaint, letterSpacing: '0.03em', marginBottom: 7 };
  const fieldBox = { background: C.surface2, borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(8,16,11,0.45)',
        opacity: open ? 1 : 0, transition: `opacity 0.35s ${SS_EASE}`, backdropFilter: open ? 'blur(3px)' : 'none',
      }}></div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: 420, maxWidth: 'calc(100% - 48px)',
        background: C.bg, borderRadius: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        padding: '22px 22px 22px', boxSizing: 'border-box',
        transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -46%) scale(0.96)',
        opacity: open ? 1 : 0,
        transition: `transform 0.45s ${SS_EASE}, opacity 0.3s ${SS_EASE}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>{t.desk.addTitle}</span>
          <SSPress onClick={onClose} scale={0.85}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SSIcon name="x" size={15} color={C.inkSoft} />
            </div>
          </SSPress>
        </div>

        {/* EAN input */}
        <div style={{ marginBottom: 16 }}>
          <div style={fieldLabel}>{t.desk.eanLabel}</div>
          <div style={{ display: 'flex', gap: 9 }}>
            <div style={{ ...fieldBox, flex: 1, padding: '11px 13px', gap: 9, background: C.surface, borderColor: phase === 'input' ? C.primary : C.border, borderWidth: 1.5, boxShadow: phase === 'input' ? `0 0 0 4px ${C.primary}1A` : 'none' }}>
              <SSIcon name="scan" size={17} color={C.primary} />
              <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{window.SS_EAN}</span>
            </div>
            <SSPress onClick={() => setPhase('found')}>
              <div style={{
                background: phase === 'input' ? C.primary : C.primaryTint, color: phase === 'input' ? C.onPrimary : C.primary,
                borderRadius: 12, padding: '12px 16px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap',
                transition: `background 0.3s ${SS_EASE}`,
              }}>{t.desk.lookup}</div>
            </SSPress>
          </div>
        </div>

        {/* found product + form */}
        <div style={{
          overflow: 'hidden', maxHeight: phase === 'found' ? 420 : 0, opacity: phase === 'found' ? 1 : 0,
          transition: `max-height 0.5s ${SS_EASE}, opacity 0.4s ${SS_EASE}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px' }}>
            <SSTile label={p.name} tile={C.tiles[product.tile]} T={T} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{p.detail}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 100, background: C.primaryTint, color: C.primary, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
              <SSIcon name="check" size={12} color={C.primary} />
              {t.scan.source}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>{t.scan.location}</div>
            <div style={{ ...fieldBox, padding: 3, gap: 3 }}>
              {locKeys.map((k, i) => {
                const on = loc === k;
                return (
                  <SSPress key={k} onClick={() => setLoc(k)} scale={0.95} style={{ flex: 1 }}>
                    <div style={{
                      textAlign: 'center', padding: '8px 0', borderRadius: 9, fontSize: 13,
                      fontWeight: on ? 700 : 500, background: on ? C.surface : 'transparent',
                      color: on ? C.ink : C.inkSoft, boxShadow: on ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                      transition: `background 0.25s ${SS_EASE}`,
                    }}>{t.scan.locations[i]}</div>
                  </SSPress>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1.4 }}>
              <div style={fieldLabel}>{t.scan.expiry}</div>
              <div style={{ ...fieldBox, padding: '10px 13px', gap: 9 }}>
                <SSIcon name="calendar" size={17} color={C.primary} />
                <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{ssDateLabel(product.days, lang)}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>{t.scan.qty}</div>
              <div style={{ ...fieldBox, padding: '6px 10px', justifyContent: 'space-between' }}>
                <SSPress onClick={() => setQty(Math.max(1, qty - 1))} scale={0.8}><SSIcon name="minus" size={16} color={C.inkFaint} /></SSPress>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{qty}</span>
                <SSPress onClick={() => setQty(qty + 1)} scale={0.8}><SSIcon name="plus" size={16} color={C.primary} /></SSPress>
              </div>
            </div>
          </div>
          <SSButton label={t.scan.cta} onClick={() => onAdd({ ...product, loc, qty, by: 0 })} C={C} T={T} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DeskSidebar, DeskInventory, DeskDetail, DeskHousehold, DeskScanModal });
