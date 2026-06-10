// proto-scan-household.jsx — interactive scanner tab + household tab.

// ── Scanner ───────────────────────────────────────────────
function SSProtoScan({ T, C, t, lang, active, product, onAdd, onClose }) {
  const [phase, setPhase] = React.useState('scanning'); // scanning → found → sheet
  const [loc, setLoc] = React.useState('fridge');
  const [qty, setQty] = React.useState(1);
  const [by, setBy] = React.useState(0);

  React.useEffect(() => {
    if (!active) { setPhase('scanning'); return; }
    setPhase('scanning'); setLoc(product.loc); setQty(1); setBy(0);
    const t1 = setTimeout(() => setPhase('found'), 1700);
    const t2 = setTimeout(() => setPhase('sheet'), 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active, product.key]);

  const found = phase !== 'scanning';
  const p = t.scanPool[product.key];
  const locKeys = ['fridge', 'freezer', 'pantry'];
  const fieldLabel = { fontSize: 12, fontWeight: 700, color: C.inkFaint, letterSpacing: '0.03em', marginBottom: 7, fontFamily: T.fontBody };
  const fieldBox = { background: C.surface2, borderRadius: T.r.seg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' };

  const corner = (rot, x, y) => (
    <svg key={rot} width="34" height="34" viewBox="0 0 34 34" style={{ position: 'absolute', [y]: -2, [x]: -2, transform: `rotate(${rot}deg)` }}>
      <path d="M2 14V8a6 6 0 0 1 6-6h6" fill="none" stroke={found ? C.primary : '#fff'} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
    </svg>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.camBg, overflow: 'hidden' }}>
      {/* top controls */}
      <div style={{ position: 'absolute', top: 64, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 5 }}>
        <SSGlass dark onClick={onClose}><SSIcon name="x" size={19} color="#fff" /></SSGlass>
        <SSGlass dark onClick={() => {}}><SSIcon name="flash" size={19} color="#fff" /></SSGlass>
      </div>
      <div style={{
        position: 'absolute', top: 132, width: '100%', textAlign: 'center',
        color: 'rgba(255,255,255,0.75)', fontSize: 13.5, fontWeight: 500, fontFamily: T.fontBody,
        opacity: phase === 'scanning' ? 1 : 0, transition: 'opacity 0.3s',
      }}>{t.scan.hint}</div>

      {/* viewfinder */}
      <div style={{ position: 'absolute', top: 196, left: '50%', transform: 'translateX(-50%)', width: 252, height: 150 }}>
        {corner(0, 'left', 'top')}{corner(90, 'right', 'top')}{corner(270, 'left', 'bottom')}{corner(180, 'right', 'bottom')}
        {/* faux barcode */}
        <div style={{ position: 'absolute', inset: '30px 50px', display: 'flex', gap: 3, alignItems: 'stretch', opacity: found ? 0.7 : 0.4, transition: 'opacity 0.3s' }}>
          {[3, 1, 2, 1, 4, 1, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2].map((w, i) => (
            <div key={i} style={{ width: w * 1.7, background: '#fff', borderRadius: 1 }}></div>
          ))}
        </div>
        {/* moving scan line */}
        {phase === 'scanning' && (
          <div style={{
            position: 'absolute', left: 14, right: 14, height: 2, borderRadius: 2,
            background: C.primary, boxShadow: `0 0 14px 2px ${C.primary}`,
            animation: 'ss-scanline 1.8s ease-in-out infinite',
          }}></div>
        )}
      </div>

      {/* detected EAN pill */}
      <div style={{ position: 'absolute', top: 372, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {found && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 100,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)',
            animation: 'ss-pop 0.5s both',
          }}>
            <SSIcon name="check" size={14} color="#7BE3A4" />
            <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 600, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontFamily: T.fontBody }}>{window.SS_EAN}</span>
          </div>
        )}
      </div>

      {/* add sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: C.bg, borderRadius: '28px 28px 0 0', color: C.ink,
        boxShadow: '0 -12px 48px rgba(0,0,0,0.35)', fontFamily: T.fontBody,
        transform: phase === 'sheet' ? 'translateY(0)' : 'translateY(105%)',
        transition: `transform 0.6s ${SS_EASE}`,
        padding: '10px 20px 34px', boxSizing: 'border-box',
      }}>
        <div style={{ width: 38, height: 5, borderRadius: 100, background: C.inkFaint, opacity: 0.35, margin: '0 auto 14px' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <SSTile label={p.name} tile={C.tiles[product.tile]} T={T} size={54} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{p.detail}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 100,
            background: C.primaryTint, color: C.primary, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            <SSIcon name="check" size={12} color={C.primary} />
            {t.scan.source}
          </div>
        </div>

        {/* location segmented */}
        <div style={{ marginTop: 18 }}>
          <div style={fieldLabel}>{t.scan.location}</div>
          <div style={{ ...fieldBox, padding: 3, gap: 3 }}>
            {locKeys.map((k, i) => {
              const on = loc === k;
              return (
                <SSPress key={k} onClick={() => setLoc(k)} scale={0.95} style={{ flex: 1 }}>
                  <div style={{
                    textAlign: 'center', padding: '9px 0', borderRadius: T.r.seg - 3,
                    fontSize: 13, fontWeight: on ? 700 : 500,
                    background: on ? C.surface : 'transparent', color: on ? C.ink : C.inkSoft,
                    boxShadow: on ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                    transition: `background 0.25s ${SS_EASE}, box-shadow 0.25s ${SS_EASE}`,
                  }}>{t.scan.locations[i]}</div>
                </SSPress>
              );
            })}
          </div>
        </div>

        {/* expiry + qty */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1.4 }}>
            <div style={fieldLabel}>{t.scan.expiry}</div>
            <div style={{ ...fieldBox, padding: '11px 13px', gap: 9 }}>
              <SSIcon name="calendar" size={18} color={C.primary} />
              <span style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{ssDateLabel(product.days, lang)}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>{t.scan.qty}</div>
            <div style={{ ...fieldBox, padding: '7px 10px', justifyContent: 'space-between' }}>
              <SSPress onClick={() => setQty(Math.max(1, qty - 1))} scale={0.8}><SSIcon name="minus" size={16} color={C.inkFaint} /></SSPress>
              <span style={{ fontSize: 15.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
              <SSPress onClick={() => setQty(qty + 1)} scale={0.8}><SSIcon name="plus" size={16} color={C.primary} /></SSPress>
            </div>
          </div>
        </div>

        {/* assignee */}
        <div style={{ marginTop: 16 }}>
          <div style={fieldLabel}>{t.scan.assignee}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {t.members.map((m, i) => (
              <SSPress key={m} onClick={() => setBy(i)} scale={0.88}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: by === i ? 1 : 0.55, transition: 'opacity 0.25s' }}>
                  <SSAvatar name={m} color={C.avatars[i]} size={38} T={T} ring={by === i ? C.primary : null} />
                  <span style={{ fontSize: 11, fontWeight: by === i ? 700 : 500, color: by === i ? C.ink : C.inkSoft }}>{m}</span>
                </div>
              </SSPress>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <SSButton label={t.scan.cta} onClick={() => onAdd({ ...product, loc, qty, by })} C={C} T={T} />
        </div>
      </div>
    </div>
  );
}

// ── Household tab ─────────────────────────────────────────
function SSProtoHousehold({ T, C, t, householdName, notifDays, setNotifDays, notifyAll, setNotifyAll, onCopy, onShare }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { setCopied(true); onCopy(); setTimeout(() => setCopied(false), 1800); };
  const roles = [0, 1, 2, 3].map(i => (i === 0 ? t.hh.admin : t.hh.member));

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '74px 20px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', whiteSpace: 'nowrap', lineHeight: 1.1 }}>{householdName}</div>
            <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>{t.hh.membersCount(4)}</div>
          </div>
          <SSGlass onClick={() => {}}><SSIcon name="gear" size={20} color={C.inkSoft} /></SSGlass>
        </div>

        {/* invite card */}
        <div style={{
          marginTop: 20, borderRadius: T.r.card, padding: '18px 18px 16px',
          background: C.primaryTint, border: `1px solid ${C.primary}33`,
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primary }}>{t.hh.invite}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 27, letterSpacing: '0.06em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{window.SS_INVITE_CODE}</span>
            <SSPress onClick={copy} scale={0.85}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: copied ? C.primary : C.surface, border: `1px solid ${copied ? C.primary : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: `background 0.3s ${SS_EASE}`,
              }}>
                <SSIcon name={copied ? 'check' : 'copy'} size={17} color={copied ? C.onPrimary : C.inkSoft} />
              </div>
            </SSPress>
          </div>
          <div style={{ marginTop: 14 }}>
            <SSButton label={t.hh.share} icon="share" onClick={onShare} C={C} T={T} style={{ width: '100%' }} />
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 10, textAlign: 'center' }}>{t.hh.inviteHint}</div>
        </div>

        {/* members */}
        <div style={{ marginTop: 20 }}>
          <SSSectionLabel T={T} C={C}>{t.hh.membersTitle} · 4</SSSectionLabel>
          <SSCard T={T} C={C} style={{ overflow: 'hidden' }}>
            {t.members.map((m, i) => (
              <SSPress key={m} onClick={() => {}} scale={0.98}>
                <div style={{
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
              </SSPress>
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
                const on = notifDays.includes(i);
                return (
                  <SSPress key={d} onClick={() => setNotifDays(on ? notifDays.filter(x => x !== i) : [...notifDays, i])} scale={0.94} style={{ flex: 1 }}>
                    <div style={{
                      textAlign: 'center', padding: '9px 0', borderRadius: T.r.seg,
                      fontSize: 13, fontWeight: on ? 700 : 500,
                      background: on ? C.primaryTint : C.surface2,
                      color: on ? C.primary : C.inkSoft,
                      border: `1px solid ${on ? C.primary + '4D' : C.border}`,
                      transition: `background 0.25s ${SS_EASE}, color 0.25s ${SS_EASE}`,
                      whiteSpace: 'nowrap',
                    }}>{d}</div>
                  </SSPress>
                );
              })}
            </div>
            <SSPress onClick={() => setNotifyAll(!notifyAll)} scale={0.99}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15, paddingTop: 13, borderTop: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{t.hh.allCritical}</div>
                <SSToggle on={notifyAll} C={C} />
              </div>
            </SSPress>
            <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 9, lineHeight: 1.4 }}>{t.hh.perOwner}</div>
          </SSCard>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SSProtoScan, SSProtoHousehold });
