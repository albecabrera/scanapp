// scansave-themes.js — three visual directions, each with light + dark token sets.
// Plain JS, exposed on window.SS_THEMES.

(function () {
  window.SS_THEMES = {
    // ── A · FRESCO — clean, natural greens, airy wellness/food feel ──
    fresh: {
      style: 'fresh',
      fontDisplay: "'Schibsted Grotesk', system-ui, sans-serif",
      fontBody: "'Schibsted Grotesk', system-ui, sans-serif",
      displayWeight: 700,
      displayScale: 1,
      displaySpacing: '-0.02em',
      r: { card: 22, tile: 14, chip: 100, btn: 16, seg: 12 },
      light: {
        bg: '#F4F6EF', surface: '#FFFFFF', surface2: '#EAEFE0',
        border: 'rgba(18,35,25,0.08)',
        ink: '#122319', inkSoft: 'rgba(18,35,25,0.6)', inkFaint: 'rgba(18,35,25,0.38)',
        primary: '#237A4B', onPrimary: '#FFFFFF', primaryTint: '#DCEDDD',
        warn: '#A1700E', warnBg: '#F5EAD0', danger: '#BC3D26', dangerBg: '#F8E2DB',
        tabBg: 'rgba(255,255,255,0.94)',
        avatars: ['#237A4B', '#A1700E', '#3E6B8C', '#8C5E3E'],
        tiles: [
          { bg: '#E3EEDA', fg: '#3F6B2E' }, { bg: '#F0E8D2', fg: '#8A6A1F' },
          { bg: '#F4E1DA', fg: '#A2543C' }, { bg: '#F6E0DE', fg: '#B04A3A' },
          { bg: '#EAE6D7', fg: '#73683F' }, { bg: '#F0E6CE', fg: '#94762A' },
        ],
        camBg: 'linear-gradient(165deg, #2B362E 0%, #18211B 55%, #0E1511 100%)',
        shadow: '0 10px 28px rgba(18,35,25,0.07)',
      },
      dark: {
        bg: '#0E1612', surface: '#172019', surface2: '#1F2B21',
        border: 'rgba(236,242,236,0.09)',
        ink: '#ECF2EC', inkSoft: 'rgba(236,242,236,0.62)', inkFaint: 'rgba(236,242,236,0.38)',
        primary: '#62C98D', onPrimary: '#0E1612', primaryTint: 'rgba(98,201,141,0.15)',
        warn: '#E0B35C', warnBg: 'rgba(224,179,92,0.14)', danger: '#E8765F', dangerBg: 'rgba(232,118,95,0.15)',
        tabBg: 'rgba(23,32,25,0.94)',
        avatars: ['#62C98D', '#E0B35C', '#7FAACB', '#C99A77'],
        tiles: [
          { bg: 'rgba(98,201,141,0.16)', fg: '#8FD9AE' }, { bg: 'rgba(224,179,92,0.16)', fg: '#E5C37E' },
          { bg: 'rgba(232,118,95,0.15)', fg: '#EC9A87' }, { bg: 'rgba(232,118,95,0.13)', fg: '#EC9A87' },
          { bg: 'rgba(190,180,140,0.14)', fg: '#CFC79E' }, { bg: 'rgba(214,178,92,0.13)', fg: '#DDC07A' },
        ],
        camBg: 'linear-gradient(165deg, #232C25 0%, #131A15 55%, #0A100C 100%)',
        shadow: '0 10px 28px rgba(0,0,0,0.4)',
      },
    },

    // ── B · NOCTURNO — premium dark-first, lime accent, technical ──
    noir: {
      style: 'noir',
      fontDisplay: "'Space Grotesk', system-ui, sans-serif",
      fontBody: "'Space Grotesk', system-ui, sans-serif",
      displayWeight: 600,
      displayScale: 1,
      displaySpacing: '-0.03em',
      r: { card: 18, tile: 10, chip: 10, btn: 12, seg: 10 },
      light: {
        bg: '#F1F2EE', surface: '#FFFFFF', surface2: '#E7E9E2',
        border: 'rgba(16,19,17,0.1)',
        ink: '#101311', inkSoft: 'rgba(16,19,17,0.6)', inkFaint: 'rgba(16,19,17,0.38)',
        primary: '#3E6B12', onPrimary: '#FFFFFF', primaryTint: '#E4F2C8',
        warn: '#96660B', warnBg: '#F2E7C9', danger: '#B53B22', dangerBg: '#F6E0D8',
        tabBg: 'rgba(255,255,255,0.94)',
        avatars: ['#3E6B12', '#96660B', '#2F5E72', '#7A4A2E'],
        tiles: [
          { bg: '#E7F0D2', fg: '#4A6E1C' }, { bg: '#F0EAD0', fg: '#80641A' },
          { bg: '#F2E1D8', fg: '#9A4F33' }, { bg: '#F4DEDB', fg: '#A6422F' },
          { bg: '#E9E7DA', fg: '#6E6840' }, { bg: '#EFE6CE', fg: '#8A7026' },
        ],
        camBg: 'linear-gradient(165deg, #23272A 0%, #15181A 55%, #0B0D0E 100%)',
        shadow: '0 10px 28px rgba(16,19,17,0.08)',
      },
      dark: {
        bg: '#0B0D0C', surface: '#141716', surface2: '#1C201E',
        border: 'rgba(242,245,240,0.09)',
        ink: '#F2F5F0', inkSoft: 'rgba(242,245,240,0.6)', inkFaint: 'rgba(242,245,240,0.36)',
        primary: '#C9F158', onPrimary: '#10130A', primaryTint: 'rgba(201,241,88,0.12)',
        warn: '#E8C158', warnBg: 'rgba(232,193,88,0.13)', danger: '#F07B5E', dangerBg: 'rgba(240,123,94,0.14)',
        tabBg: 'rgba(20,23,22,0.94)',
        avatars: ['#C9F158', '#E8C158', '#7FC8E8', '#E8A77F'],
        tiles: [
          { bg: 'rgba(201,241,88,0.13)', fg: '#D7F582' }, { bg: 'rgba(232,193,88,0.13)', fg: '#EDCE7C' },
          { bg: 'rgba(240,123,94,0.13)', fg: '#F49C85' }, { bg: 'rgba(240,123,94,0.11)', fg: '#F49C85' },
          { bg: 'rgba(200,190,150,0.12)', fg: '#D5CCA3' }, { bg: 'rgba(225,190,100,0.11)', fg: '#E6C97E' },
        ],
        camBg: 'linear-gradient(165deg, #1B1F1D 0%, #101312 55%, #070908 100%)',
        shadow: '0 10px 28px rgba(0,0,0,0.5)',
      },
    },

    // ── C · MERCADO — warm editorial, cream + terracotta, serif display ──
    mercado: {
      style: 'mercado',
      fontDisplay: "'Instrument Serif', Georgia, serif",
      fontBody: "'Instrument Sans', system-ui, sans-serif",
      displayWeight: 400,
      displayScale: 1.18,
      displaySpacing: '-0.01em',
      r: { card: 16, tile: 12, chip: 100, btn: 100, seg: 100 },
      light: {
        bg: '#F7F1E4', surface: '#FFFBF1', surface2: '#EFE6D2',
        border: 'rgba(44,32,20,0.1)',
        ink: '#2C2014', inkSoft: 'rgba(44,32,20,0.62)', inkFaint: 'rgba(44,32,20,0.4)',
        primary: '#B4451F', onPrimary: '#FFFBF1', primaryTint: '#F3DDCD',
        warn: '#96660B', warnBg: '#F1E4C4', danger: '#A92E22', dangerBg: '#F4DCD4',
        tabBg: 'rgba(255,251,241,0.95)',
        avatars: ['#B4451F', '#5F7036', '#96660B', '#41586B'],
        tiles: [
          { bg: '#EAE6CC', fg: '#6B6B2E' }, { bg: '#F1E3C8', fg: '#8A661C' },
          { bg: '#F2DCCB', fg: '#A2553B' }, { bg: '#F3D9D2', fg: '#A8432F' },
          { bg: '#E9E2CC', fg: '#74683E' }, { bg: '#F0E3C5', fg: '#8E7224' },
        ],
        camBg: 'linear-gradient(165deg, #332A20 0%, #211A12 55%, #14100A 100%)',
        shadow: '0 10px 28px rgba(44,32,20,0.08)',
      },
      dark: {
        bg: '#1C1610', surface: '#27201A', surface2: '#322a21',
        border: 'rgba(243,234,220,0.1)',
        ink: '#F3EADC', inkSoft: 'rgba(243,234,220,0.62)', inkFaint: 'rgba(243,234,220,0.38)',
        primary: '#E0794A', onPrimary: '#1C1610', primaryTint: 'rgba(224,121,74,0.15)',
        warn: '#DCAE57', warnBg: 'rgba(220,174,87,0.14)', danger: '#E06A55', dangerBg: 'rgba(224,106,85,0.15)',
        tabBg: 'rgba(39,32,26,0.95)',
        avatars: ['#E0794A', '#A8B16B', '#DCAE57', '#8FA8BC'],
        tiles: [
          { bg: 'rgba(168,177,107,0.15)', fg: '#C2CA8C' }, { bg: 'rgba(220,174,87,0.15)', fg: '#E3C078' },
          { bg: 'rgba(224,121,74,0.15)', fg: '#E89A74' }, { bg: 'rgba(224,106,85,0.14)', fg: '#E8917F' },
          { bg: 'rgba(200,185,140,0.13)', fg: '#D3C69E' }, { bg: 'rgba(215,180,95,0.13)', fg: '#DFC179' },
        ],
        camBg: 'linear-gradient(165deg, #2B231A 0%, #1A140E 55%, #0F0B07 100%)',
        shadow: '0 10px 28px rgba(0,0,0,0.45)',
      },
    },
  };
})();
