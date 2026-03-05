const TABS = [
  {
    id: 'sky',
    label: 'Sky',
    icon: (active) => {
      const c = active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
          <path d="M12 4.5 L14 11.5 L12 10.5 L10 11.5 Z" fill={c} />
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
    id: 'venus',
    label: 'Venus',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="5.5" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" />
        <line x1="12" y1="14.5" x2="12" y2="21" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="9" y1="18" x2="15" y2="18" stroke={active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'tonight',
    label: 'Tonight',
    icon: (active) => {
      const c = active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'
      return (
        // Moon/star — night sky icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="17.5" cy="6.5" r="1" fill={c} />
          <circle cx="19" cy="10" r="0.6" fill={c} opacity="0.6" />
        </svg>
      )
    },
  },
  {
    id: 'log',
    label: 'Log',
    icon: (active) => {
      const c = active ? '#C5C9A8' : 'rgba(245,237,208,0.4)'
      return (
        // Notebook/pencil icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="1.6" />
          <line x1="9" y1="7" x2="15" y2="7" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9" y1="10.5" x2="15" y2="10.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9" y1="14" x2="12" y2="14" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
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
      maxWidth: '100%',
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
