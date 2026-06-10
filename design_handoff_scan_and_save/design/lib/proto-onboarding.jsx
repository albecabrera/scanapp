// proto-onboarding.jsx — welcome → create/join household → done. Slide transitions.

function SSObStep({ active, dir, children }) {
  // dir: -1 step is left of current, 0 current, 1 right of current
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      opacity: active ? 1 : 0,
      transform: active ? 'translateX(0)' : `translateX(${dir * 56}px)`,
      transition: `opacity 0.45s ${SS_EASE}, transform 0.55s ${SS_EASE}`,
      pointerEvents: active ? 'auto' : 'none',
      padding: '0 26px', boxSizing: 'border-box',
    }}>{children}</div>
  );
}

function SSOnboarding({ T, C, t, dark, onFinish }) {
  const [step, setStep] = React.useState(0);     // 0 welcome · 1 choose · 2 form · 3 done
  const [mode, setMode] = React.useState('create');
  const ob = t.ob;
  const name = mode === 'create' ? t.household : t.household2;

  const backBtn = (to) => (
    <div style={{ position: 'absolute', top: 64, left: 20, zIndex: 5 }}>
      <SSGlass dark={dark} onClick={() => setStep(to)}>
        <SSIcon name="chevRight" size={18} color={C.inkSoft} style={{ transform: 'rotate(180deg)' }} />
      </SSGlass>
    </div>
  );

  const title = (txt, sub) => (
    <div style={{ marginTop: 132 }}>
      <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{txt}</div>
      {sub && <div style={{ fontSize: 14.5, color: C.inkSoft, marginTop: 10, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );

  const input = (label, value) => (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, letterSpacing: '0.03em', marginBottom: 8 }}>{label}</div>
      <div style={{
        background: C.surface, border: `1.5px solid ${C.primary}`, borderRadius: T.r.btn,
        padding: '15px 16px', display: 'flex', alignItems: 'center',
        boxShadow: `0 0 0 4px ${C.primary}1A`,
      }}>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: mode === 'join' ? '0.1em' : '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ width: 2, height: 22, background: C.primary, marginLeft: 2, borderRadius: 2, animation: 'ss-pulse 1.1s ease-in-out infinite' }}></span>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, background: C.bg, color: C.ink,
      fontFamily: T.fontBody, overflow: 'hidden',
    }}>
      {/* soft background bloom */}
      <div style={{
        position: 'absolute', top: -160, left: -120, width: 420, height: 420, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.primaryTint} 0%, transparent 68%)`, pointerEvents: 'none',
      }}></div>

      {/* 0 · WELCOME */}
      <SSObStep active={step === 0} dir={step > 0 ? -1 : 1}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 24, background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 16px 36px ${C.primary}59`,
          }}>
            <SSIcon name="scan" size={38} color={C.onPrimary} />
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', marginTop: 26, lineHeight: 1.05 }}>Scan &amp; Save</div>
          <div style={{ fontSize: 16.5, color: C.inkSoft, marginTop: 12, lineHeight: 1.45, maxWidth: 290 }}>{ob.tagline}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36 }}>
            {ob.bullets.map((b, i) => (
              <div key={b.icon} className="ss-fadeup" style={{ display: 'flex', alignItems: 'center', gap: 13, animationDelay: `${0.15 + i * 0.1}s` }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 14, background: C.primaryTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SSIcon name={b.icon} size={20} color={C.primary} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingBottom: 52 }}>
          <SSButton label={ob.start} onClick={() => setStep(1)} C={C} T={T} />
        </div>
      </SSObStep>

      {/* 1 · CHOOSE */}
      <SSObStep active={step === 1} dir={step > 1 ? -1 : 1}>
        {backBtn(0)}
        {title(ob.chooseTitle, ob.chooseSub)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 30 }}>
          {[
            { m: 'create', icon: 'plus', txt: ob.create, sub: ob.createSub },
            { m: 'join', icon: 'share', txt: ob.join, sub: ob.joinSub },
          ].map(o => (
            <SSPress key={o.m} onClick={() => { setMode(o.m); setStep(2); }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 15, padding: '18px 17px',
                background: C.surface, borderRadius: T.r.card, border: `1px solid ${C.border}`,
                boxShadow: C.shadow,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 16, background: C.primaryTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <SSIcon name={o.icon} size={22} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{o.txt}</div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{o.sub}</div>
                </div>
                <SSIcon name="chevRight" size={16} color={C.inkFaint} />
              </div>
            </SSPress>
          ))}
        </div>
      </SSObStep>

      {/* 2 · CREATE or JOIN form */}
      <SSObStep active={step === 2} dir={step > 2 ? -1 : 1}>
        {backBtn(1)}
        {mode === 'create' ? (
          <React.Fragment>
            {title(ob.createTitle)}
            {input(ob.nameLabel, t.household)}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {title(ob.joinTitle, ob.joinSub2)}
            {input(ob.joinTitle, window.SS_INVITE_CODE)}
          </React.Fragment>
        )}
        <div style={{ flex: 1 }}></div>
        <div style={{ paddingBottom: 52 }}>
          <SSButton label={mode === 'create' ? ob.createCta : ob.joinCta} onClick={() => setStep(3)} C={C} T={T} />
        </div>
      </SSObStep>

      {/* 3 · DONE */}
      <SSObStep active={step === 3} dir={1}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {step === 3 && (
            <div style={{
              width: 92, height: 92, borderRadius: '50%', background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 18px 44px ${C.primary}59`, animation: 'ss-pop 0.6s 0.1s both',
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.onPrimary} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="26" style={{ animation: 'ss-checkdraw 0.55s 0.45s both' }} />
              </svg>
            </div>
          )}
          <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', marginTop: 28 }}>{ob.doneTitle}</div>
          <div style={{ fontSize: 14.5, color: C.inkSoft, marginTop: 12, lineHeight: 1.5, maxWidth: 280 }}>{ob.doneSub}</div>
          <div style={{
            marginTop: 22, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px',
            background: C.surface, borderRadius: 100, border: `1px solid ${C.border}`, boxShadow: C.shadow,
          }}>
            <SSAvatar name={t.members[0]} color={C.avatars[0]} size={22} T={T} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
        </div>
        <div style={{ paddingBottom: 52 }}>
          <SSButton label={ob.doneCta} onClick={() => onFinish(name)} C={C} T={T} />
        </div>
      </SSObStep>
    </div>
  );
}

Object.assign(window, { SSOnboarding });
