import { useState, useEffect, useCallback } from 'react'
import { fetchNews } from '../api.js'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'astronomy', label: 'Astronomy' },
  { id: 'astrology', label: 'Astrology' },
]

const SAGE = '#C5C9A8'
const STEEL = '#8FA8B8'
const CREAM = '#F5EDD0'
const MUTED = 'rgba(245,237,208,0.45)'
const CARD_BG = 'rgba(61,61,46,0.7)'

function formatDate(pubDate) {
  if (!pubDate) return ''
  try {
    return new Date(pubDate).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return pubDate
  }
}

function Skeleton() {
  return (
    <div style={{
      background: CARD_BG,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {[80, 50, 100].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 16 : 12,
          width: `${w}%`,
          background: 'rgba(245,237,208,0.08)',
          borderRadius: 6,
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

function CategoryBadge({ category }) {
  const isAstro = category === 'astronomy'
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: 20,
      background: isAstro ? 'rgba(197,201,168,0.15)' : 'rgba(143,168,184,0.15)',
      color: isAstro ? SAGE : STEEL,
      border: `1px solid ${isAstro ? 'rgba(197,201,168,0.3)' : 'rgba(143,168,184,0.3)'}`,
    }}>
      {isAstro ? 'Astronomy' : 'Astrology'}
    </span>
  )
}

function ArticleCard({ article }) {
  return (
    <div style={{
      background: CARD_BG,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      border: '0.5px solid rgba(255,255,255,0.07)',
    }}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: CREAM,
          fontWeight: 600,
          fontSize: '0.9rem',
          lineHeight: 1.35,
          textDecoration: 'none',
        }}
      >
        {article.title}
      </a>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.7rem', color: MUTED }}>
          {article.source}{article.source && article.published ? ' · ' : ''}{formatDate(article.published)}
        </span>
        <CategoryBadge category={article.category} />
      </div>

      {article.summary && (
        <p style={{
          fontSize: '0.78rem',
          color: MUTED,
          margin: 0,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.summary}
        </p>
      )}
    </div>
  )
}

export default function NewsPage() {
  const [category, setCategory] = useState('all')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNews(category)
      setArticles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => { load() }, [load])

  return (
    <main style={{
      padding: '16px 16px 100px',
      minHeight: '100vh',
      boxSizing: 'border-box',
      background: '#2B2B1C',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: 600,
          color: CREAM,
          letterSpacing: '0.02em',
        }}>
          Venus in the News
        </h2>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: 'none',
            border: `1px solid rgba(197,201,168,0.3)`,
            borderRadius: 8,
            padding: '5px 10px',
            color: SAGE,
            fontSize: '0.72rem',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
      }}>
        {CATEGORIES.map(cat => {
          const isActive = category === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                background: isActive ? 'rgba(197,201,168,0.18)' : 'rgba(61,61,46,0.5)',
                border: `1px solid ${isActive ? 'rgba(197,201,168,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 20,
                padding: '6px 14px',
                color: isActive ? SAGE : MUTED,
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {error && (
        <div style={{
          background: 'rgba(200,80,80,0.12)',
          border: '1px solid rgba(200,80,80,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#E8A0A0',
          fontSize: '0.82rem',
          marginBottom: 12,
        }}>
          Failed to load news: {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
          : articles.length === 0 && !error
            ? (
              <div style={{ textAlign: 'center', color: MUTED, paddingTop: 40, fontSize: '0.85rem' }}>
                No articles found.
              </div>
            )
            : articles.map((article, i) => <ArticleCard key={i} article={article} />)
        }
      </div>
    </main>
  )
}
