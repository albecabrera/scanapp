// proto-inventory.jsx — interactive inventory tab + item detail sheet + household
// selector sheet + alerts sheet. Pure presentation; state lives in the app shell.

function ssProductInfo(t, key) {
  return t.products[key] || t.scanPool[key];
}

function ssDateLabel(days, lang) {
  const d = new Date(Date.now() + days * 86400000);
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

// ── Inventory tab ─────────────────────────────────────────
function SSProtoInventory({ T, C, t, items, filter, setFilter, onItemTap, showAddedBy, onHouseholdTap, onBellTap, householdName, newItemId }) {
  const expiring = items.filter(i => i.days <= 2);
  const filters = [
    { id: 'all', label: t.inv.filters[0] },
    { id: 'fridge', label: t.inv.filters[1] },
    { id: 'freezer', label: t.inv.filters[2] },
    { id: 'pantry', label: t.inv.filters[3] },
  ];
  const sections = ['fridge', 'freezer', 'pantry']
    .filter(loc => filter === 'all' || filter === loc)
    .map(loc => ({ loc, items: items.filter(i => i.loc === loc) }))
    .filter(s => s.items.length);

  const row = (item, isLast) => {
    const p = ssProductInfo(t, item.key);
    return (
      <SSPress key={item.id} onClick={() => onItemTap(item)} scale={0.98}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
          '--ss-new-bg': C.primaryTint,
          animation: item.id === newItemId ? 'ss-newitem 2s 0.4s both' : 'none',
          backgroundColor: item.id === newItemId ? C.primaryTint : 'transparent',
        }}>
          <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}{item.qty > 1 && <span style={{ color: C.inkFaint, fontWeight: 600 }}> ×{item.qty}</span>}
            </div>
            <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 2 }}>{p.detail}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {ssExpiryBadge(item.days, t, T, C)}
            {showAddedBy && <SSAvatar name={t.members[item.by]} color={C.avatars[item.by]} size={18} T={T} />}
          </div>
        </div>
      </SSPress>
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '64px 20px 120px' }}>
        {/* household pill + bell */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <SSGlass pill onClick={onHouseholdTap} style={{ paddingLeft: 7 }}>
            <div style={{ display: 'flex' }}>
              {[0, 1].map(i => (
                <div key={i} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', border: `2px solid ${C.surface}` }}>
                  <SSAvatar name={t.members[i]} color={C.avatars[i]} size={22} T={T} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', color: C.ink, fontFamily: T.fontBody }}>{householdName}</span>
            <SSIcon name="chevDown" size={14} color={C.inkFaint} />
          </SSGlass>
          <SSGlass onClick={onBellTap} style={{ position: 'relative' }}>
            <SSIcon name="bell" size={20} color={C.inkSoft} />
            {expiring.length > 0 && <div style={{ position: 'absolute', top: -1, right: 0, width: 9, height: 9, borderRadius: '50%', background: C.danger, border: `1.5px solid ${C.surface}` }}></div>}
          </SSGlass>
        </div>

        {/* title */}
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{t.inv.title}</div>
        <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>{t.inv.summary(items.length, expiring.length)}</div>

        {/* expiring soon carousel */}
        {expiring.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <SSSectionLabel T={T} C={C}>{t.inv.soon}</SSSectionLabel>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -20px', padding: '0 20px 4px' }}>
              {expiring.map(item => {
                const p = ssProductInfo(t, item.key);
                return (
                  <SSPress key={item.id} onClick={() => onItemTap(item)} scale={0.96}>
                    <div style={{
                      width: 128, boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: T.r.card - 6, padding: 12, boxShadow: C.shadow, flexShrink: 0,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={38} />
                        {ssExpiryBadge(item.days, t, T, C)}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 2 }}>{p.detail}</div>
                    </div>
                  </SSPress>
                );
              })}
            </div>
          </div>
        )}

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18 }}>
          {filters.map(f => {
            const on = filter === f.id;
            return (
              <SSPress key={f.id} onClick={() => setFilter(f.id)} scale={0.94}>
                <div style={{
                  padding: '8px 13px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  background: on ? C.ink : C.surface, color: on ? C.bg : C.inkSoft,
                  border: `1px solid ${on ? C.ink : C.border}`, whiteSpace: 'nowrap',
                  transition: `background 0.3s ${SS_EASE}, color 0.3s ${SS_EASE}`,
                }}>{f.label}</div>
              </SSPress>
            );
          })}
        </div>

        {/* sections */}
        {sections.map(s => (
          <div key={s.loc} style={{ marginBottom: 18 }}>
            <SSSectionLabel T={T} C={C} right={<span style={{ fontFamily: T.fontBody, fontSize: 12, color: C.inkFaint }}>{s.items.length}</span>}>
              {t.inv.sections[s.loc]}
            </SSSectionLabel>
            <SSCard T={T} C={C} style={{ overflow: 'hidden' }}>
              {s.items.map((item, i) => row(item, i === s.items.length - 1))}
            </SSCard>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Item detail sheet content ─────────────────────────────
function SSItemDetail({ T, C, t, lang, item, onConsume, onRemove, onQty }) {
  if (!item) return null;
  const p = ssProductInfo(t, item.key);
  const d = t.detail;
  const row = (label, value, isLast) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0', borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{value}</span>
    </div>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={58} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 3 }}>{p.detail}</div>
        </div>
        {ssExpiryBadge(item.days, t, T, C)}
      </div>
      <div style={{ marginTop: 10 }}>
        {row(d.expiry, <span style={{ fontSize: 14.5, fontWeight: 600 }}>{ssDateLabel(item.days, lang)}</span>)}
        {row(d.location, <span style={{ fontSize: 14.5, fontWeight: 600 }}>{d.locations[item.loc]}</span>)}
        {row(d.addedBy, (
          <React.Fragment>
            <SSAvatar name={t.members[item.by]} color={C.avatars[item.by]} size={22} T={T} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.members[item.by]}</span>
          </React.Fragment>
        ))}
        {row(d.qty, (
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <SSPress onClick={() => onQty(-1)} scale={0.85}><div style={{ width: 30, height: 30, borderRadius: 10, background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SSIcon name="minus" size={15} color={C.inkSoft} /></div></SSPress>
            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
            <SSPress onClick={() => onQty(1)} scale={0.85}><div style={{ width: 30, height: 30, borderRadius: 10, background: C.primaryTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SSIcon name="plus" size={15} color={C.primary} /></div></SSPress>
          </span>
        ), true)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <SSButton label={d.consume} onClick={onConsume} C={C} T={T} />
        <SSButton label={d.remove} onClick={onRemove} C={C} T={T} variant="danger" />
      </div>
    </div>
  );
}

// ── Household selector sheet content ──────────────────────
function SSHouseholdSelector({ T, C, t, current, onPick }) {
  const homes = [
    { name: t.household, members: [0, 1, 2, 3] },
    { name: t.household2, members: [0, 2] },
  ];
  return (
    <div>
      <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', marginBottom: 14 }}>{t.sel.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {homes.map(h => {
          const on = h.name === current;
          return (
            <SSPress key={h.name} onClick={() => onPick(h.name)}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px',
                background: C.surface, borderRadius: T.r.card - 4,
                border: `1.5px solid ${on ? C.primary : C.border}`,
                boxShadow: on ? `0 0 0 4px ${C.primary}1A` : 'none',
                transition: `border-color 0.3s ${SS_EASE}, box-shadow 0.3s ${SS_EASE}`,
              }}>
                <div style={{ display: 'flex' }}>
                  {h.members.slice(0, 3).map((m, i) => (
                    <div key={m} style={{ marginLeft: i ? -9 : 0, borderRadius: '50%', border: `2px solid ${C.surface}` }}>
                      <SSAvatar name={t.members[m]} color={C.avatars[m]} size={28} T={T} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{h.name}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{t.hh.membersCount(h.members.length)}</div>
                </div>
                {on && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SSIcon name="check" size={13} color={C.onPrimary} />
                  </div>
                )}
              </div>
            </SSPress>
          );
        })}
        <SSPress onClick={() => {}}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 0', borderRadius: T.r.card - 4, border: `1.5px dashed ${C.inkFaint}`,
            color: C.inkSoft, fontSize: 14.5, fontWeight: 600,
          }}>
            <SSIcon name="plus" size={16} color={C.inkSoft} />
            {t.sel.new}
          </div>
        </SSPress>
      </div>
    </div>
  );
}

// ── Alerts sheet content ──────────────────────────────────
function SSAlertsSheet({ T, C, t, items, onItemTap }) {
  const expiring = items.filter(i => i.days <= 2).sort((a, b) => a.days - b.days);
  return (
    <div>
      <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', marginBottom: 14 }}>{t.alerts.title}</div>
      {expiring.length === 0 && <div style={{ fontSize: 14, color: C.inkSoft, padding: '10px 0 20px' }}>{t.alerts.empty}</div>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {expiring.map((item, i) => {
          const p = ssProductInfo(t, item.key);
          return (
            <SSPress key={item.id} onClick={() => onItemTap(item)} scale={0.98}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i === expiring.length - 1 ? 'none' : `1px solid ${C.border}` }}>
                <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 2 }}>{t.members[item.by]}</div>
                </div>
                {ssExpiryBadge(item.days, t, T, C)}
              </div>
            </SSPress>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ssProductInfo, ssDateLabel, SSProtoInventory, SSItemDetail, SSHouseholdSelector, SSAlertsSheet });
