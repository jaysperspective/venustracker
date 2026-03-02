export default function AboutPage() {
  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingLeft: 20,
      paddingRight: 20,
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
    }}>

      {/* App Info Header */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontFamily: 'Georgia, serif',
          fontWeight: 'normal',
          color: 'var(--dark)',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}>
          Venus Tracker
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--dark-muted)',
          marginBottom: 4,
        }}>
          Version 1.0.0
        </p>
        <p style={{
          fontSize: '0.92rem',
          color: 'var(--dark-muted)',
          lineHeight: 1.7,
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
          marginBottom: 6,
        }}>
          Astronomy & astrology companion for Venus
        </p>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--dark-muted)',
        }}>
          Created by Esaias
        </p>
      </div>

      {/* Privacy Policy */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontSize: '0.65rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dark-muted)',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '1px solid var(--border)',
        }}>
          Privacy Policy
        </h2>
        <div style={{
          background: 'var(--sand)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 18px',
        }}>
          <p style={paraStyle}>
            <strong>Location data</strong> — Your location is used on-device only to calculate the positions
            of Venus and the Moon relative to your sky. It is never transmitted to third parties and is never
            stored on our servers.
          </p>
          <p style={paraStyle}>
            <strong>Camera</strong> — The camera is used only for the Sky Finder live viewfinder overlay.
            No images are captured, stored, or transmitted.
          </p>
          <p style={paraStyle}>
            <strong>News</strong> — News articles are fetched from Google News RSS feeds. No user data is
            sent with these requests.
          </p>
          <p style={paraStyle}>
            <strong>Analytics</strong> — Venus Tracker does not collect any analytics, usage data, or
            personal information.
          </p>
          <p style={paraStyle}>
            <strong>Third-party services</strong> — The app connects to Nominatim (OpenStreetMap) for
            reverse geocoding and JPL Horizons for astronomical data. These requests are anonymous and
            contain no personally identifiable information.
          </p>
          <p style={{ ...paraStyle, marginBottom: 0 }}>
            No cookies, no tracking, no advertising.
          </p>
        </div>
      </section>

      {/* Terms of Service */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontSize: '0.65rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dark-muted)',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '1px solid var(--border)',
        }}>
          Terms of Service
        </h2>
        <div style={{
          background: 'var(--sand)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 18px',
        }}>
          <p style={paraStyle}>
            Venus Tracker is provided "as is" without warranty of any kind, express or implied, including
            but not limited to the warranties of merchantability, fitness for a particular purpose, and
            noninfringement.
          </p>
          <p style={paraStyle}>
            All astronomical and astrological data presented in this app is for informational and
            educational purposes only.
          </p>
          <p style={paraStyle}>
            We are not responsible for the accuracy of data provided by third-party sources, including
            JPL Horizons, Google News, and Nominatim/OpenStreetMap.
          </p>
          <p style={paraStyle}>
            By using this app, you assume all risk related to its use.
          </p>
          <p style={{ ...paraStyle, marginBottom: 0 }}>
            These terms may be updated from time to time. Continued use of the app constitutes acceptance
            of any changes.
          </p>
        </div>
      </section>
    </div>
  )
}

const paraStyle = {
  fontSize: '0.84rem',
  color: 'var(--dark)',
  lineHeight: 1.75,
  marginBottom: 12,
  marginTop: 0,
}
