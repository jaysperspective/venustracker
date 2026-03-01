import { useState, useEffect, useMemo } from 'react'

const HOUSES = [
  {
    number: 1, sign: 'Aries', modality: 'Cardinal', element: 'Fire',
    title: 'Self & Identity',
    body: 'Venus in the First House infuses the personality with grace, magnetism, and an instinct for beauty. There is a natural charm that draws others near without effort. Cardinal fire makes this placement action-oriented — Venus here does not wait to be loved; it steps forward, presenting itself with confidence. The body and appearance are often striking, and the person leads relationships with enthusiasm and initiative.',
  },
  {
    number: 2, sign: 'Taurus', modality: 'Fixed', element: 'Earth',
    title: 'Values & Resources',
    body: 'This is Venus in her home territory. Fixed earth anchors love to the material and sensory world — beauty, comfort, loyalty, and abundance. Relationships are built slowly and held tightly. There is a deep need for security in love, and an innate talent for attracting wealth through aesthetic pursuits. Venus here tends toward possessiveness, but also toward extraordinary generosity with those she trusts.',
  },
  {
    number: 3, sign: 'Gemini', modality: 'Mutable', element: 'Air',
    title: 'Communication & Mind',
    body: 'Mutable air gives Venus a flirtatious, curious, and conversational quality. Love is expressed through words, wit, and intellectual exchange. This placement thrives in local community, with siblings, and through writing or teaching. Attraction is sparked by intelligence. The heart changes its mind freely — Venus here seeks variety in connection and may love many people across many forms simultaneously.',
  },
  {
    number: 4, sign: 'Cancer', modality: 'Cardinal', element: 'Water',
    title: 'Home & Roots',
    body: 'Cardinal water moves Venus inward, toward the hearth. Love is maternal, protective, and deeply tied to family and ancestral roots. The home becomes a sanctuary of beauty. Relationships are nourished through care, food, and emotional attunement. This placement carries the memory of past loves longer than most, and the capacity for devotion runs very deep. Security and belonging are the highest expressions of affection.',
  },
  {
    number: 5, sign: 'Leo', modality: 'Fixed', element: 'Fire',
    title: 'Creativity & Romance',
    body: 'Fixed fire makes this one of Venus\'s most radiant placements. Love is theatrical, generous, and deeply creative. Romance is pursued with a lion\'s heart — passionately and loyally. There is a natural gift for the arts, performance, and pleasure. Venus here wants to be adored and to adore in return, lavishly. Children, artistic projects, and grand gestures of love are central themes. Joy is treated as sacred.',
  },
  {
    number: 6, sign: 'Virgo', modality: 'Mutable', element: 'Earth',
    title: 'Service & Craft',
    body: 'Mutable earth brings Venus into the realm of daily ritual and refinement. Love is expressed through acts of service — the perfectly timed cup of tea, the careful attention to a partner\'s needs. Beauty is found in precision and craft. This placement has a discerning eye that can veer into criticism, but at its best it is the love that shows up consistently, practically, and without drama. Health and work routines are arenas of devotion.',
  },
  {
    number: 7, sign: 'Libra', modality: 'Cardinal', element: 'Air',
    title: 'Partnership & Balance',
    body: 'This is Venus\'s second home. Cardinal air makes partnership itself the initiating force — Venus here is activated by the presence of the other. Marriage, contracts, and all one-on-one bonds are blessed with grace and a profound sense of fairness. The hunger for harmony can lead to compromise at cost to self, but the highest expression is a love rooted in genuine equality, mutual respect, and aesthetic shared life.',
  },
  {
    number: 8, sign: 'Scorpio', modality: 'Fixed', element: 'Water',
    title: 'Transformation & Depth',
    body: 'Fixed water takes Venus to the underworld. Love here is magnetic, all-consuming, and regenerative. Shallow connection is intolerable — this placement craves merger, vulnerability, and the intimacy of shared secrets and shared resources. There is a natural talent for understanding desire, power, and psychological complexity. Death, inheritance, and taboo are Venus\'s territory here. Heartbreak is deeply transformative rather than merely painful.',
  },
  {
    number: 9, sign: 'Sagittarius', modality: 'Mutable', element: 'Fire',
    title: 'Philosophy & Expansion',
    body: 'Mutable fire sets Venus wandering — across continents, philosophies, and belief systems. Love is expansive and freedom-oriented. Foreign cultures, higher learning, and spiritual seeking are deeply attractive. This placement finds romance on journeys and falls for those whose worldview expands its own. Long-distance relationships are common. Beauty is found in diversity, in the vast and the far-reaching, in the meaning beneath experience.',
  },
  {
    number: 10, sign: 'Capricorn', modality: 'Cardinal', element: 'Earth',
    title: 'Career & Legacy',
    body: 'Cardinal earth elevates Venus into the public sphere. Love and beauty are channeled into ambition, reputation, and lasting achievement. This placement is drawn to those with status and authority, and often builds its own. Aesthetic vision is applied to career. Relationships may be approached with practicality — partnership as alliance. At depth, however, Venus in the Tenth longs for a love that endures, that stands as testimony to a life well-built.',
  },
  {
    number: 11, sign: 'Aquarius', modality: 'Fixed', element: 'Air',
    title: 'Community & Vision',
    body: 'Fixed air makes friendship the highest form of love. Venus here is loyal to ideals as much as to individuals, and finds romance within community, activism, and collective vision. There is an egalitarian streak — everyone deserves beauty. Unconventional relationships and non-traditional structures are often preferred. The heart beats for humanity. Group belonging and shared utopian dreams are the arenas where Venus shines most fully.',
  },
  {
    number: 12, sign: 'Pisces', modality: 'Mutable', element: 'Water',
    title: 'Spirit & Dissolution',
    body: 'Mutable water dissolves Venus\'s boundaries entirely. Love here transcends the personal and touches the mystical. There is a capacity for unconditional compassion that borders on self-sacrifice. Art, music, and spiritual practice become devotional acts. Relationships may be hidden, fated, or karmic in nature. The longing is for union — not just with another person, but with something greater. At its highest, this is the love that asks for nothing and gives everything.',
  },
]

const CULTURES = [
  {
    name: 'Sumer & Babylon — Inanna / Ishtar',
    body: `In the oldest written records of human civilization, Venus was already the queen of heaven. The Sumerian goddess Inanna and her Babylonian counterpart Ishtar were directly identified with the planet — their temples were oriented to Venus's risings, their hymns tracked her synodic cycle, and their myths encoded her disappearances below the horizon as a descent into the underworld.\n\nThe Hymn to Inanna, among the earliest surviving literature on Earth, describes Venus as a dual force: goddess of love and of war, embodying both the tender and the terrible. The morning star was her warrior face; the evening star her face of seduction. This duality — the planet that appears before sunrise and again after sunset, seemingly two stars — seeded mythology across the ancient world.`,
  },
  {
    name: 'Ancient Greece — Aphrodite',
    body: `The Greeks named the evening star Hesperos and the morning star Phosphoros before Pythagoras recognized them as one body. Once unified, the planet was given to Aphrodite, goddess of love, beauty, desire, and the sea-foam from which she was said to have been born.\n\nAphrodite's domain was not mere romance — she governed the force of eros itself, the primordial magnetism that holds the cosmos together. Plato's Symposium distinguishes two Aphrodites: Urania (heavenly, spiritual love) and Pandemos (earthly, common love) — a distinction that mirrors the planet's own two appearances. Her son Eros (desire) and her companion Himeros (longing) extended her influence into all acts of creation.`,
  },
  {
    name: 'Rome — Venus',
    body: `Rome inherited and amplified the Greek tradition, elevating Venus to a position of supreme civic importance. She was not only the goddess of love but the divine ancestress of the Roman people through Aeneas, and thus of Julius Caesar and Augustus, who claimed descent from her. The month of April was sacred to her. The days of the week in Romance languages still carry her name: vendredi, viernes, venerdì — Friday.\n\nVenus Genetrix (the mother), Venus Victrix (the victorious), and Venus Felix (the fortunate) were her honored aspects. Roman generals prayed to her before battle; poets placed her at the center of the universe's creative impulse.`,
  },
  {
    name: 'Maya — The Venus Calendar',
    body: `No civilization tracked Venus more precisely than the Maya. Their astronomers determined the synodic period of Venus to be 584 days — accurate to within a fraction of a day — and wove this into a sacred calendar called the Venus Round, in which 5 synodic cycles of Venus (2,920 days) equaled exactly 8 solar years and 65 Tzolk'in cycles.\n\nThe Dresden Codex, one of the four surviving Maya books, contains a Venus almanac of extraordinary precision, tracking her heliacal risings as a morning star with prophetic attention. The heliacal rise of Venus was considered dangerous — a time when the spear-wielding Venus-Quetzalcoatl descended to strike rulers and sacred objects with his rays.\n\nWar was timed to Venus. Captives were sacrificed at her conjunctions. The great feathered serpent Quetzalcoatl was, in one of his aspects, the planet Venus — and the Aztec calendar system inherited this veneration entirely.`,
  },
  {
    name: 'Egypt — Tioumoutiri & the Dual Star',
    body: `Ancient Egyptians recognized Venus as a dual entity: Tioumoutiri as the morning star and Ouaiti as the evening star. The planet was associated with the soul of Osiris crossing the sky and with the goddess Hathor, whose divine domain — music, fertility, beauty, and love — mirrored Aphrodite's closely.\n\nIn the Pyramid Texts, Venus's appearances are linked to royal resurrection. The morning star's role as herald of the sun connected it to themes of rebirth and the journey of the dead through the underworld — an echo of Inanna's descent encoded in Egyptian cosmology.`,
  },
  {
    name: 'India — Shukra',
    body: `In Vedic astrology, Venus is Shukra (Sanskrit: शुक्र, "bright" or "clear"), one of the nine celestial bodies of the Navagraha. Shukra governs sensual pleasure, luxury, the arts, music, romance, fertility, and material wealth. He is the guru of the Asuras — the teacher of divine knowledge to the demonic forces — and is said to know the secret of immortality.\n\nShukra's day is Friday. His metal is silver, his gemstone diamond, his direction southeast. In a birth chart, a well-placed Shukra brings artistic gifts, charisma, and abundance; an afflicted Shukra may bring indulgence, vanity, or difficulties in relationship. Shukra governs the signs Vrishabha (Taurus) and Tula (Libra), mirroring the Western astrological tradition.`,
  },
  {
    name: 'China — Tài Bái Jīnxīng',
    body: `In Chinese astronomical tradition, Venus is 太白金星 (Tài Bái Jīnxīng) — the "Great White Metal Star." Associated with the Metal element, the direction West, the season of Autumn, and the color white, Venus held a complex role in Chinese cosmology.\n\nAs a court diviner, Tài Bái Jīnxīng was personified as a wise, gentle old man who served as a divine messenger — a mediator between heaven and earth. Omens were drawn from Venus's brightness and position: a brilliant Venus at dawn presaged military success; unusual motions were interpreted as warnings to rulers. The planet's synodic cycle was also tracked in early Chinese calendrical astronomy with notable precision.`,
  },
  {
    name: 'Norse & Germanic — Frigg / Freyja',
    body: `The Germanic and Norse goddess Freyja (and her counterpart Frigg) gave her name to Friday in English — derived from Old English Frīgedæg, itself a translation of the Latin dies Veneris (Venus's day). This linguistic bridge points to a deep structural equivalence recognized by ancient cultures.\n\nFreyja governed love, fertility, beauty, war, and death — she received half the warriors slain in battle, housing them in her hall Fólkvangr. Like Inanna and Aphrodite, she was a goddess who held the erotic and the martial in the same hand. Her necklace Brísingamen, won through nights with four dwarves, was an artifact of desire with cosmic power. Scholars have long noted the mythological parallels between Freyja and the planet that crosses the sky before dawn.`,
  },
  {
    name: 'Yoruba & African Diaspora — Oshun',
    body: `In the Yoruba cosmological system of West Africa, and throughout the diaspora traditions it gave rise to — Candomblé in Brazil, Lucumí/Santería in Cuba and the Caribbean, and related lineages across the Americas — Oshun is the Orisha of fresh water, rivers, love, beauty, fertility, sensuality, and abundance. Her domain maps precisely onto the planetary archetype of Venus.\n\nOshun is associated with the color gold, with honey, with rivers and streams, with mirrors and the art of adornment. She is the force that makes life sweet. Her number is five — the same number that Venus traces in the sky across eight years. She is the youngest of the major Orishas but holds the power that none of the others can do without: without Oshun, creation loses the quality that makes it worth sustaining.\n\nIn Lucumí practice, her day is Saturday, and her planetary correspondence is Venus directly. The Orishas are understood as forces of nature and of the divine — not distant figures but living, present intelligences that move through the world in recognizable patterns. Oshun moves wherever water flows, wherever love forms, wherever beauty draws the eye and opens the heart.\n\nThe diaspora traditions preserved this knowledge through centuries of forced displacement, encoding it in song, ceremony, and initiation lineage. To honor Oshun is to acknowledge that the universe has a sweetness at its center — and that this sweetness has a face, a name, and a cycle in the sky.`,
  },
  {
    name: 'Islamic Golden Age — Al-Zahrā',
    body: `Arabic astronomical tradition named Venus الزهرة (Al-Zahrā, "The Brilliant One" or "The Radiant"). Medieval Arab astronomers made extraordinarily precise measurements of Venus's motion. Al-Battani refined the length of the solar year and planetary periods with instruments of remarkable accuracy; Ibn al-Haytham (Alhazen) wrote on the nature of the planets' light.\n\nIn Islamic astrological tradition — which preserved and extended Greek learning through the translation movements — Venus retained her role as governor of beauty, love, music, pleasure, and wealth. Her influence was considered benefic, bringing harmony and refinement to the houses she occupied.`,
  },
]

function VenusRose({ size = 300, showLabel = true }) {
  const cx = 200, cy = 200
  const rV = 0.723, rE = 1.0
  const wV = (2 * Math.PI) / 224.7
  const wE = (2 * Math.PI) / 365.25
  const T = 8 * 365.25
  const N = 2400
  const scale = 88

  const d = useMemo(() => {
    const segments = []
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * T
      const x = cx + (rV * Math.cos(wV * t) - rE * Math.cos(wE * t)) * scale
      const y = cy - (rV * Math.sin(wV * t) - rE * Math.sin(wE * t)) * scale
      segments.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return segments.join(' ')
  }, [])
  const maxR = (rV + rE) * scale
  const minR = (rE - rV) * scale
  const vbH = showLabel ? 430 : 410

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="100%" viewBox={`0 0 400 ${vbH}`} style={{ maxWidth: size }}>
        <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="rgba(61,61,46,0.14)" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={minR} fill="none" stroke="rgba(61,61,46,0.1)" strokeWidth="0.8" strokeDasharray="2 4" />
        <path d={d} fill="none" stroke="rgba(61,61,46,0.55)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={3} fill="#3D3D2E" />
        {showLabel && (
          <text x={cx} y={cy + maxR + 30} textAnchor="middle" fontSize="9.5" fill="rgba(61,61,46,0.4)"
            letterSpacing="1.6" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
            8-YEAR CYCLE · 5 INFERIOR CONJUNCTIONS
          </text>
        )}
      </svg>
    </div>
  )
}

const NAV_SECTIONS = [
  { id: 'cycle',          label: 'The Cycle' },
  { id: 'two-stars',      label: 'Two Stars' },
  { id: 'morning-evening',label: 'Morning · Evening' },
  { id: 'forty-days',     label: '40 Days' },
  { id: 'cultures',       label: 'Cultures' },
  { id: 'houses',         label: 'Houses' },
]

function SectionNav() {
  return (
    <div style={{
      display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4,
      marginBottom: 36, WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
    }}>
      <style>{`.section-nav::-webkit-scrollbar { display: none }`}</style>
      {NAV_SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            flexShrink: 0,
            background: 'var(--sand)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '6px 13px',
            fontSize: '0.72rem',
            color: 'var(--dark-muted)',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 16 }}>
      <h2 style={{
        fontSize: '0.65rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--dark-muted)',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function CultureCard({ name, body }) {
  const paragraphs = body.split('\n\n')
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{
        fontSize: '0.95rem',
        fontFamily: 'Georgia, serif',
        color: 'var(--dark)',
        marginBottom: 8,
        fontWeight: 'normal',
        fontStyle: 'italic',
      }}>
        {name}
      </h3>
      {paragraphs.map((p, i) => (
        <p key={i} style={{
          fontSize: '0.88rem',
          color: 'var(--dark)',
          lineHeight: 1.75,
          marginBottom: i < paragraphs.length - 1 ? 10 : 0,
        }}>
          {p}
        </p>
      ))}
    </div>
  )
}

const MODALITY_COLORS = {
  Cardinal: { bg: '#C5C9A8', label: '#3D3D2E' },
  Fixed:    { bg: '#A8B8C4', label: '#3D3D2E' },
  Mutable:  { bg: '#E5E8C4', label: '#3D3D2E' },
}

function HouseCard({ h }) {
  const mc = MODALITY_COLORS[h.modality]
  return (
    <div style={{
      background: 'var(--sand)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <span style={{
            fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--dark-muted)',
          }}>
            House {h.number} · {h.sign}
          </span>
          <div style={{ fontSize: '1rem', fontFamily: 'Georgia, serif', color: 'var(--dark)', marginTop: 2 }}>
            {h.title}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
          <span style={{
            fontSize: '0.62rem', padding: '2px 8px', borderRadius: 10,
            background: mc.bg, color: mc.label, letterSpacing: '0.05em',
          }}>
            {h.modality}
          </span>
          <span style={{
            fontSize: '0.62rem', color: 'var(--dark-muted)', letterSpacing: '0.04em',
          }}>
            {h.element}
          </span>
        </div>
      </div>
      <p style={{ fontSize: '0.84rem', color: 'var(--dark)', lineHeight: 1.7, margin: 0 }}>
        {h.body}
      </p>
    </div>
  )
}

export default function InfoPage() {
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBack(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 100px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ marginBottom: 4 }}>
          <VenusRose size={160} showLabel={false} />
        </div>
        <h1 style={{
          fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: 'normal',
          color: 'var(--dark)', letterSpacing: '0.06em', marginBottom: 12,
        }}>
          Venus
        </h1>
        <p style={{
          fontSize: '0.92rem', color: 'var(--dark-muted)', lineHeight: 1.8,
          maxWidth: 560, margin: '0 auto',
        }}>
          The brightest object in the sky after the Sun and Moon. Never more than 47° from the Sun.
          Visible only at dawn or dusk. Cycling through an exact 8-year pentagram.
          Honored on every inhabited continent. The planet that has marked time, love, and war
          for as long as humans have looked upward.
        </p>
      </div>

      <SectionNav />

      {/* Why cycles matter */}
      <Section id="cycle" title="Why the Venus Cycle Matters">
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          Venus completes one synodic cycle — from inferior conjunction back to inferior conjunction —
          in approximately 584 days. Five of these cycles take almost exactly 8 Earth years (2,920 days),
          during which Venus traces a near-perfect five-pointed star, a pentagram, against the backdrop
          of the zodiac. This geometric precision was known to the Babylonians, the Maya, and the
          Pythagoreans. It is encoded in the five-petaled rose, the apple's core, and the proportions
          of the human body as described by Leonardo.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          Each phase of the cycle carries a distinct quality. The <strong>heliacal rise</strong> —
          Venus's first appearance as a morning star after inferior conjunction — was treated across
          cultures as a threshold moment: a new beginning, a resurrection, the return of a divine
          force from the underworld. The Maya marked this day with ceremony and, in some periods,
          with sacrifice. It is the anchor of this very calendar.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          The <strong>retrograde period</strong> — when Venus appears to reverse course across the sky
          for roughly 40 days near inferior conjunction — has been interpreted universally as a time of
          review, dissolution, and descent. The myth of Inanna's seven-gated descent into the underworld,
          during which she is stripped of her regalia one piece at a time, maps precisely onto Venus's
          increasing proximity to the Sun, her eventual invisibility, and her eventual re-emergence.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          The <strong>greatest elongations</strong> — east and west, the points of maximum angular
          distance from the Sun — mark Venus at her brightest and most visible. These are traditionally
          peak moments: the height of the evening star's reign, the height of the morning star's power.
          Agricultural calendars across the ancient Near East, Mesoamerica, and India used these moments
          to mark planting, harvest, and ceremony.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8 }}>
          Tracking Venus is not merely an astronomical exercise. It is an act of participation in
          a rhythm that human beings have used to organize meaning, time, love, and collective life
          for at least five thousand years. To know where Venus is in her cycle is to locate yourself
          in one of the oldest calendars our species has ever kept.
        </p>
      </Section>

      {/* Two Stars */}
      <Section id="two-stars" title="The Two Stars">
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          The ancients believed Venus was two separate celestial bodies. In Greek tradition,
          <em> Phosphoros</em> — the light-bringer — rose before the Sun in the eastern sky at dawn,
          while <em>Hesperus</em> shone in the west after sunset. They were named, hymned, and worshipped
          as distinct gods, two luminaries of entirely different character. It was the pre-Socratic
          philosopher Parmenides, around 500 BCE, who first recognized they were one and the same body.
          The single planet of love had been playing two roles all along: the inner and the outer,
          the coming and the going, the morning and the evening.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8 }}>
          This discovery carries its own mythology. What appeared as two was always one.
          The shadow of all that Venus governs — beauty, love, desire, connection — is the understanding
          that there is only love. Every longing, every aesthetic impulse, every reaching toward another,
          is love encountering itself from a different angle. The morning and the evening are the same light.
        </p>
      </Section>

      {/* Morning Star / Evening Star */}
      <Section id="morning-evening" title="Morning Star · Evening Star">
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 20 }}>
          These two modes carry genuinely distinct qualities. To know which face Venus is showing
          right now is to know something real about how her energy is moving in the world.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{
            background: '#C5C9A8', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '16px 14px',
          }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#5A5A40', marginBottom: 6 }}>
              Morning Star
            </div>
            <div style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', color: '#3D3D2E', marginBottom: 10, fontStyle: 'italic' }}>
              Libra quality
            </div>
            <p style={{ fontSize: '0.82rem', color: '#3D3D2E', lineHeight: 1.7, margin: 0 }}>
              Appears before the day begins, leading the Sun above the horizon. Cardinal air: she moves
              toward the other, toward the horizon of what might be. Her love is anticipation.
              Her beauty catches you across a crowded room. Idealistic, socially alive, perpetually
              reaching for connection.
            </p>
          </div>

          <div style={{
            background: '#A8B8C4', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '16px 14px',
          }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#3D4A52', marginBottom: 6 }}>
              Evening Star
            </div>
            <div style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', color: '#3D3D2E', marginBottom: 10, fontStyle: 'italic' }}>
              Taurus quality
            </div>
            <p style={{ fontSize: '0.82rem', color: '#3D3D2E', lineHeight: 1.7, margin: 0 }}>
              Appears after the work of the day is done, presiding over rest and pleasure. Fixed earth:
              present, grounded, sensory. This Venus knows what she values and does not chase. Her love
              is loyalty. Her beauty deepens with familiarity. She does not perform — she simply is.
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8 }}>
          During <strong>retrograde</strong>, Venus transitions between these two modes — disappearing
          from one sky to re-emerge in the other. The crossing is the underworld passage. The phase your
          Venus Tracker shows right now tells you which face she is presenting.
        </p>
      </Section>

      {/* The 40 Days */}
      <Section id="forty-days" title="The 40 Days">
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          Venus retrograde lasts approximately 40 days. The number resonates across traditions.
          In Hebrew and Christian scripture, forty is the number of passage: Noah's flood lasted
          forty days and forty nights. Moses spent forty days on the mountain. Jesus fasted forty
          days in the desert before his ministry began. The Israelites wandered forty years before
          entering the promised land. In each case, the forty-day period is not punishment — it is
          preparation. A descent that precedes an emergence. A stripping down before a rebuilding.
          A silence in which something essential is finally heard.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8, marginBottom: 14 }}>
          Venus retrograde follows the same grammar. As she draws close to Earth and appears to
          reverse her motion, she becomes invisible, passing through the underworld. Relationships
          surface old, unfinished material. The longing for love turns inward. What was easily
          projected onto another — what was easily idealized — comes home.
        </p>
        <div style={{
          background: 'var(--sand)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 14,
          fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontStyle: 'italic',
          color: 'var(--dark)', lineHeight: 1.8, textAlign: 'center',
        }}>
          "The shadow teaching of Venus is that all there is is love —
          and sometimes the way to know it is to go inside, for forty days, and look."
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8 }}>
          The ancients who named the morning and evening star as two gods were not wrong — they were
          seeing something real. But the deeper insight is that they were always one. In retrograde,
          Venus teaches this directly: all the love that moved outward is now moving inward.
          The forty days are not a withdrawal of grace. They are an intensification of it —
          turned inward, like a flame cupped by two hands.
        </p>
      </Section>

      {/* Cultures */}
      <Section id="cultures" title="Venus Across Cultures & Belief Systems">
        {CULTURES.map(c => <CultureCard key={c.name} name={c.name} body={c.body} />)}
      </Section>

      {/* Houses */}
      <Section id="houses" title="Venus in the Twelve Houses">
        <p style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.75, marginBottom: 20 }}>
          In astrological tradition, the twelve houses represent twelve domains of lived experience.
          Each house corresponds to a zodiac sign and carries a modality — Cardinal (initiating),
          Fixed (sustaining), or Mutable (adapting) — and an element. Where Venus falls in a birth
          chart shapes how love, beauty, and desire express themselves in that person's life.
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Cardinal — initiating', 'Fixed — sustaining', 'Mutable — adapting'].map((m, i) => {
            const colors = [MODALITY_COLORS.Cardinal, MODALITY_COLORS.Fixed, MODALITY_COLORS.Mutable]
            return (
              <span key={i} style={{
                fontSize: '0.7rem', padding: '3px 10px', borderRadius: 10,
                background: colors[i].bg, color: colors[i].label,
              }}>
                {m}
              </span>
            )
          })}
        </div>
        {HOUSES.map(h => <HouseCard key={h.number} h={h} />)}
      </Section>

    </div>

    {/* Back to top */}
    {showBack && (
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 'max(20px, calc((100vw - 430px) / 2 + 20px))',
          zIndex: 150,
          background: '#3D3D2E',
          color: '#F5EDD0',
          border: 'none',
          borderRadius: 20,
          padding: '8px 14px',
          fontSize: '0.72rem',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M6 10V2M6 2L2 6M6 2l4 4" stroke="#F5EDD0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Top
      </button>
    )}
    </>
  )
}
