const PATHS = {
  bell: <path d="M12 4a5 5 0 0 0-5 5v3.2c0 .7-.3 1.4-.8 1.9L5 15.3c-.5.5-.1 1.7.6 1.7h12.8c.7 0 1.1-1.2.6-1.7l-1.2-1.2a2.7 2.7 0 0 1-.8-1.9V9a5 5 0 0 0-5-5Zm-2 14.5a2 2 0 0 0 4 0" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  chevDown: <path d="M6 9.5l6 6 6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  chevRight: <path d="M9.5 6l6 6-6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  scan: <g fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" /><path d="M7.5 9.5v5M10.5 9.5v5M13.5 9.5v5M16.5 9.5v5" /></g>,
  basket: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 9.5h15l-1.4 8.2a2 2 0 0 1-2 1.8H7.9a2 2 0 0 1-2-1.8L4.5 9.5Z" /><path d="M8.5 9.5 12 4.5l3.5 5" /><path d="M9.5 13v3M14.5 13v3" /></g>,
  home: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 12 4l7.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-8.5Z" /><path d="M9.5 20.5v-6h5v6" /></g>,
  share: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5v11M8 7l4-3.5L16 7" /><path d="M6 11.5H5.5A1.5 1.5 0 0 0 4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6a1.5 1.5 0 0 0-1.5-1.5H18" /></g>,
  copy: <g fill="none" strokeWidth="1.7" strokeLinejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M5 14.5a1.8 1.8 0 0 1-1.5-1.8v-7A2.2 2.2 0 0 1 5.7 3.5h7A1.8 1.8 0 0 1 14.5 5" strokeLinecap="round" /></g>,
  calendar: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10.5h16M8.5 3.5v3.5M15.5 3.5v3.5" /></g>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" strokeWidth="1.9" strokeLinecap="round" />,
  flash: <path d="M13 3 6 13.5h4.5L10.5 21l7-10.5H13L13 3Z" fill="none" strokeWidth="1.7" strokeLinejoin="round" />,
  plus: <path d="M12 5.5v13M5.5 12h13" fill="none" strokeWidth="2" strokeLinecap="round" />,
  minus: <path d="M5.5 12h13" fill="none" strokeWidth="2" strokeLinecap="round" />,
  clock: <g fill="none" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2.5" /></g>,
  gear: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 3.6l1 2.3 2.5-.5 1.5 2 2.3 1-.5 2.6 1.7 1.9-1.7 1.9.5 2.6-2.3 1-1.5 2-2.5-.5-1 2.3-1-2.3-2.5.5-1.5-2-2.3-1 .5-2.6L3.5 13l1.7-1.9-.5-2.6 2.3-1 1.5-2 2.5.5 1-2.3Z" /></g>,
  user: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></g>,
  cart: <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 4.5h2l2.2 11a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2l1.4-7H6.5" /><circle cx="9.5" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /></g>,
  search: <g fill="none" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></g>,
  chart: <g fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M5 19.5v-7M12 19.5v-13M19 19.5v-4" /></g>,
  sun: <g fill="none" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></g>,
  moon: <path d="M19.5 13.5A7.5 7.5 0 0 1 10.5 4.5a7.5 7.5 0 1 0 9 9Z" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  globe: <g fill="none" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="8.2" /><path d="M3.8 12h16.4M12 3.8c2.3 2.2 3.5 5 3.5 8.2s-1.2 6-3.5 8.2c-2.3-2.2-3.5-5-3.5-8.2s1.2-6 3.5-8.2Z" /></g>,
}

export default function Icon({ name, size = 22, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill="none" style={{ display: 'block', flexShrink: 0, ...style }}>
      {PATHS[name]}
    </svg>
  )
}
