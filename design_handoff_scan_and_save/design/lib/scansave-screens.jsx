// scansave-screens.jsx — the three key screens, parameterized by theme (T), colors (C), strings (t).

function SSScreenRoot({ C, T, children }) {
  return (
    <div style={{
      width: 402, height: 874, position: 'relative', overflow: 'hidden',
      background: C.bg, fontFamily: T.fontBody, color: C.ink,
      WebkitFontSmoothing: 'antialiased', boxSizing: 'border-box',
    }}>{children}</div>
  );
}

function ssDisplay(T, size) {
  return {
    fontFamily: T.fontDisplay, fontWeight: T.displayWeight,
    fontSize: Math.round(size * T.displayScale), letterSpacing: T.displaySpacing,
    lineHeight: 1.1, whiteSpace: 'nowrap',
  };
}

// ─────────────────────────────────────────────────────────
// 1 · INVENTORY
// ─────────────────────────────────────────────────────────
function SSInventoryScreen({ T, C, t, showAddedBy }) {
  const items = window.SS_ITEMS;
  const fridge = items.filter(i => i.loc === 'fridge');
  const pantry = items.filter(i => i.loc === 'pantry');
  const expiring = items.filter(i => i.days <= 2);

  const row = (item, isLast) => {
    const p = t.products[item.key];
    return (
      <div key={item.key} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
      }}>
        <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 2 }}>{p.detail}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          {ssExpiryBadge(item.days, t, T, C)}
          {showAddedBy && <SSAvatar name={t.members[item.by]} color={C.avatars[item.by]} size={18} T={T} />}
        </div>
      </div>
    );
  };

  return (
    <SSScreenRoot C={C} T={T}>
      <div style={{ padding: '64px 20px 0' }}>
        {/* household pill + bell */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 100, padding: '6px 12px 6px 7px',
            boxShadow: C.shadow,
          }}>
            <div style={{ display: 'flex' }}>
              {[0, 1].map(i => (
                <div key={i} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', border: `2px solid ${C.surface}` }}>
                  <SSAvatar name={t.members[i]} color={C.avatars[i]} size={22} T={T} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{t.household}</span>
            <SSIcon name="chevDown" size={14} color={C.inkFaint} />
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: C.surface,
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', position: 'relative', boxShadow: C.shadow,
          }}>
            <SSIcon name="bell" size={20} color={C.inkSoft} />
            <div style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: `1.5px solid ${C.surface}` }}></div>
          </div>
        </div>

        {/* title */}
        <div style={ssDisplay(T, 32)}>{t.inv.title}</div>
        <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>{t.inv.summary(23, 3)}</div>

        {/* expiring soon carousel */}
        <div style={{ marginTop: 20 }}>
          <SSSectionLabel T={T} C={C} right={
            <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: C.primary }}>{t.inv.seeAll}</span>
          }>{t.inv.soon}</SSSectionLabel>
          <div style={{ display: 'flex', gap: 10, marginRight: -20 }}>
            {expiring.map(item => {
              const p = t.products[item.key];
              return (
                <div key={item.key} style={{
                  minWidth: 128, background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: T.r.card - 6, padding: 12, boxShadow: C.shadow,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <SSTile label={p.name} tile={C.tiles[item.tile]} T={T} size={38} />
                    {ssExpiryBadge(item.days, t, T, C)}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 2 }}>{p.detail}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18 }}>
          {t.inv.filters.map((f, i) => (
            <div key={f} style={{
              padding: '8px 13px', borderRadius: T.r.chip, fontSize: 13, fontWeight: 600,
              letterSpacing: T.style === 'noir' ? '0.03em' : '-0.01em',
              background: i === 0 ? C.ink : C.surface,
              color: i === 0 ? C.bg : C.inkSoft,
              border: `1px solid ${i === 0 ? C.ink : C.border}`,
              whiteSpace: 'nowrap',
            }}>{f}</div>
          ))}
        </div>

        {/* fridge */}
        <SSSectionLabel T={T} C={C} right={<span style={{ fontFamily: T.fontBody, fontSize: 12, color: C.inkFaint }}>{fridge.length + 8}</span>}>{t.inv.sections.fridge}</SSSectionLabel>
        <SSCard T={T} C={C}>
          {fridge.map((item, i) => row(item, i === fridge.length - 1))}
        </SSCard>

        {/* pantry */}
        <div style={{ marginTop: 18 }}>
          <SSSectionLabel T={T} C={C} right={<span style={{ fontFamily: T.fontBody, fontSize: 12, color: C.inkFaint }}>{pantry.length + 7}</span>}>{t.inv.sections.pantry}</SSSectionLabel>
          <SSCard T={T} C={C}>
            {pantry.map((item, i) => row(item, i === pantry.length - 1))}
          </SSCard>
        </div>
      </div>
      <SSTabBar T={T} C={C} t={t} active="inventory" />
    </SSScreenRoot>
  );
}

// ─────────────────────────────────────────────────────────
// 2 · SCAN + ADD
// ─────────────────────────────────────────────────────────
function SSScanScreen({ T, C, t, dark }) {
  const camH = 422;
  const glass = {
    width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const corner = (rot, x, y) => (
    <svg key={rot} width="34" height="34" viewBox="0 0 34 34" style={{ position: 'absolute', [y]: -2, [x]: -2, transform: `rotate(${rot}deg)` }}>
      <path d="M2 14V8a6 6 0 0 1 6-6h6" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );

  const fieldLabel = { fontSize: 12, fontWeight: 700, color: C.inkFaint, letterSpacing: T.style === 'noir' ? '0.08em' : '0.03em', textTransform: T.style === 'noir' ? 'uppercase' : 'none', marginBottom: 7 };
  const fieldBox = { background: C.surface2, borderRadius: T.r.seg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' };

  return (
    <SSScreenRoot C={C} T={T}>
      {/* camera */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: camH + 40, background: C.camBg }}>
        <div style={{ position: 'absolute', top: 64, left: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div style={glass}><SSIcon name="x" size={19} color="#fff" /></div>
          <div style={glass}><SSIcon name="flash" size={19} color="#fff" /></div>
        </div>
        <div style={{ position: 'absolute', top: 128, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13.5, fontWeight: 500, letterSpacing: '0.01em' }}>{t.scan.hint}</div>
        {/* viewfinder */}
        <div style={{ position: 'absolute', top: 162, left: '50%', transform: 'translateX(-50%)', width: 252, height: 148 }}>
          {corner(0, 'left', 'top')}{corner(90, 'right', 'top')}{corner(270, 'left', 'bottom')}{corner(180, 'right', 'bottom')}
          {/* scan line */}
          <div style={{ position: 'absolute', left: 14, right: 14, top: 78, height: 2, borderRadius: 2, background: C.primary, boxShadow: `0 0 14px 2px ${C.primary}` }}></div>
          {/* faux barcode */}
          <div style={{ position: 'absolute', inset: '30px 50px', display: 'flex', gap: 3, alignItems: 'stretch', opacity: 0.5 }}>
            {[3, 1, 2, 1, 4, 1, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2].map((w, i) => (
              <div key={i} style={{ width: w * 1.7, background: '#fff', borderRadius: 1 }}></div>
            ))}
          </div>
        </div>
        {/* detected EAN pill */}
        <div style={{ position: 'absolute', top: 332, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 100,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)',
          }}>
            <SSIcon name="check" size={14} color={C.style === 'noir' ? C.primary : '#7BE3A4'} />
            <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 600, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{window.SS_EAN}</span>
          </div>
        </div>
      </div>

      {/* bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: camH,
        background: C.bg, borderRadius: `${T.r.card + 6}px ${T.r.card + 6}px 0 0`,
        padding: '10px 20px 0', boxSizing: 'border-box',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ width: 38, height: 5, borderRadius: 100, background: C.inkFaint, opacity: 0.35, margin: '0 auto 14px' }}></div>

        {/* found product */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <SSTile label={t.products.oat.name} tile={C.tiles[0]} T={T} size={54} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...ssDisplay(T, 19), lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.products.oat.name}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{t.products.oat.detail}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            borderRadius: 100, background: C.primaryTint, color: C.primary,
            fontSize: 11.5, fontWeight: 700,
          }}>
            <SSIcon name="check" size={12} color={C.primary} />
            {t.scan.source}
          </div>
        </div>

        {/* location segmented */}
        <div style={{ marginTop: 18 }}>
          <div style={fieldLabel}>{t.scan.location}</div>
          <div style={{ ...fieldBox, padding: 3, gap: 3 }}>
            {t.scan.locations.map((l, i) => (
              <div key={l} style={{
                flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: T.r.seg - 3,
                fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                background: i === 0 ? C.surface : 'transparent',
                color: i === 0 ? C.ink : C.inkSoft,
                boxShadow: i === 0 ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              }}>{l}</div>
            ))}
          </div>
        </div>

        {/* expiry + qty */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1.4 }}>
            <div style={fieldLabel}>{t.scan.expiry}</div>
            <div style={{ ...fieldBox, padding: '11px 13px', gap: 9 }}>
              <SSIcon name="calendar" size={18} color={C.primary} />
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.scan.dateValue}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>{t.scan.qty}</div>
            <div style={{ ...fieldBox, padding: '7px 10px', justifyContent: 'space-between' }}>
              <SSIcon name="minus" size={16} color={C.inkFaint} />
              <span style={{ fontSize: 15.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>1</span>
              <SSIcon name="plus" size={16} color={C.primary} />
            </div>
          </div>
        </div>

        {/* assignee */}
        <div style={{ marginTop: 16 }}>
          <div style={fieldLabel}>{t.scan.assignee}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {t.members.map((m, i) => (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: i === 0 ? 1 : 0.55 }}>
                <SSAvatar name={m} color={C.avatars[i]} size={38} T={T} ring={i === 0 ? C.primary : null} />
                <span style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.ink : C.inkSoft }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          position: 'absolute', left: 20, right: 20, bottom: 38,
          background: C.primary, color: C.onPrimary, borderRadius: T.r.btn,
          padding: '16px 0', textAlign: 'center', fontSize: 16, fontWeight: 700,
          letterSpacing: T.style === 'noir' ? '0.03em' : '-0.01em',
          boxShadow: `0 10px 24px ${C.primary}4D`,
        }}>{t.scan.cta}</div>
      </div>
    </SSScreenRoot>
  );
}

// ─────────────────────────────────────────────────────────
// 3 · HOUSEHOLD (members + invite + notification rules)
// ─────────────────────────────────────────────────────────
function SSHouseholdScreen({ T, C, t }) {
  const roles = [0, 1, 2, 3].map(i => (i === 0 ? t.hh.admin : t.hh.member));
  return (
    <SSScreenRoot C={C} T={T}>
      <div style={{ padding: '74px 20px 0' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={ssDisplay(T, 32)}>{t.household}</div>
            <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>{t.hh.membersCount(4)}</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: C.surface,
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.shadow,
          }}>
            <SSIcon name="gear" size={20} color={C.inkSoft} />
          </div>
        </div>

        {/* invite card */}
        <div style={{
          marginTop: 20, borderRadius: T.r.card, padding: '18px 18px 16px',
          background: T.style === 'noir' ? C.primaryTint : C.primaryTint,
          border: `1px solid ${C.primary}33`,
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primary, letterSpacing: T.style === 'noir' ? '0.08em' : '0.02em', textTransform: T.style === 'noir' ? 'uppercase' : 'none' }}>{t.hh.invite}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ ...ssDisplay(T, 27), letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{window.SS_INVITE_CODE}</span>
            <div style={{
              width: 38, height: 38, borderRadius: T.r.btn === 12 ? 10 : '50%',
              background: C.surface, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SSIcon name="copy" size={17} color={C.inkSoft} />
            </div>
          </div>
          <div style={{
            marginTop: 14, background: C.primary, color: C.onPrimary, borderRadius: T.r.btn,
            padding: '13px 0', textAlign: 'center', fontSize: 14.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <SSIcon name="share" size={17} color={C.onPrimary} />
            {t.hh.share}
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 10, textAlign: 'center' }}>{t.hh.inviteHint}</div>
        </div>

        {/* members */}
        <div style={{ marginTop: 20 }}>
          <SSSectionLabel T={T} C={C} right={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: C.primary }}>
              <SSIcon name="plus" size={13} color={C.primary} />{t.hh.invite.split(' ')[0]}
            </span>
          }>{t.hh.membersTitle} · 4</SSSectionLabel>
          <SSCard T={T} C={C}>
            {t.members.map((m, i) => (
              <div key={m} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderBottom: i === 3 ? 'none' : `1px solid ${C.border}`,
              }}>
                <SSAvatar name={m} color={C.avatars[i]} size={38} T={T} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{m}{i === 0 ? <span style={{ color: C.inkFaint, fontWeight: 500 }}> · {t.you}</span> : ''}</div>
                </div>
                <SSBadge label={roles[i]} kind={i === 0 ? 'warn' : 'neutral'} T={T} C={C} />
                <SSIcon name="chevRight" size={15} color={C.inkFaint} />
              </div>
            ))}
          </SSCard>
        </div>

        {/* notification rules */}
        <div style={{ marginTop: 20 }}>
          <SSSectionLabel T={T} C={C}>{t.hh.notif}</SSSectionLabel>
          <SSCard T={T} C={C} style={{ padding: '14px 14px 13px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 9 }}>{t.hh.notifLead}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {t.hh.thresholds.map((d, i) => {
                const on = i > 0;
                return (
                  <div key={d} style={{
                    flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: T.r.seg,
                    fontSize: 13, fontWeight: on ? 700 : 500,
                    background: on ? C.primaryTint : C.surface2,
                    color: on ? C.primary : C.inkSoft,
                    border: `1px solid ${on ? C.primary + '4D' : C.border}`,
                  }}>{d}</div>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15, paddingTop: 13, borderTop: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{t.hh.allCritical}</div>
              <SSToggle on C={C} />
            </div>
            <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 9, lineHeight: 1.4 }}>{t.hh.perOwner}</div>
          </SSCard>
        </div>
      </div>
      <SSTabBar T={T} C={C} t={t} active="home" />
    </SSScreenRoot>
  );
}

Object.assign(window, { SSInventoryScreen, SSScanScreen, SSHouseholdScreen, SSScreenRoot });
