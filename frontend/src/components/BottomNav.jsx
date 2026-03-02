const TABS = [
  {
    id: 'venus',
    label: 'Venus',
    icon: (active) => (
      // Venus symbol ♀ — circle with cross below
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="5.5" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" />
        <line x1="12" y1="14.5" x2="12" y2="21" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="9" y1="18" x2="15" y2="18" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'sky',
    label: 'Sky',
    icon: (active) => {
      const c = active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'
      return (
        // Compass rose — circle with N/S needle
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
          {/* North needle (filled) */}
          <path d="M12 4.5 L14 11.5 L12 10.5 L10 11.5 Z" fill={c} />
          {/* South needle (dimmed) */}
          <path d="M12 19.5 L14 12.5 L12 13.5 L10 12.5 Z" fill={c} opacity="0.38" />
          <circle cx="12" cy="12" r="1.8" fill={c} />
        </svg>
      )
    },
  },
  {
    id: 'info',
    label: 'Guide',
    icon: (active) => (
      // Open book icon
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 6C10 4.5 7 4 4 4.5V19c3-.5 6 0 8 1.5M12 6c2-1.5 5-2 8-1.5V19c-3-.5-6 0-8 1.5M12 6v15.5"
          stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'news',
    label: 'News',
    icon: (active) => (
      // Newspaper icon — folded paper with lines
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="13" height="15" rx="1.5" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.6" />
        <path d="M17 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-3" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="7.5" y1="9" x2="13.5" y2="9" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7.5" y1="12" x2="13.5" y2="12" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7.5" y1="15" x2="11" y2="15" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
    icon: (active) => {
      const c = active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'
      return (
        // Info circle icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
          <line x1="12" y1="11" x2="12" y2="17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.1" fill={c} />
        </svg>
      )
    },
  },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: 'calc(62px + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: '#3D3D2E',
      borderTop: '0.5px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0 0',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab.icon(isActive)}
            <span style={{
              fontSize: '0.62rem',
              letterSpacing: '0.03em',
              color: isActive ? '#C5C9A8' : 'rgba(245,237,208,0.4)',
              fontWeight: isActive ? 600 : 400,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
