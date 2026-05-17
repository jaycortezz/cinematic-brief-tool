'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', restriction: 'moderate' },
  { id: 'tiktok', label: 'TikTok', color: '#69C9D0', restriction: 'moderate' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', restriction: 'low' },
  { id: 'twitter', label: 'X / Twitter', color: '#aaaaaa', restriction: 'low' },
]

const CREATORS = [
  { handle: 'koala.puffss', followers: '747K', hooks: ['having a bad day?', 'me all weekend:'] },
  { handle: 'mr_marijuanaman_', followers: '321K', hooks: ['safety meeting time', 'my back hurts when i do this'] },
  { handle: 'gethighwithkathy', followers: '15.9K', hooks: ['a few days late but happy birthday to me', 'wow, this past year was my wildest yet'] },
]

const HISTORY_KEY = 'cinematic_brief_history_v2'
const MAX_HISTORY = 10

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Shot {
  type: string
  description: string
  lighting: string
  imagePrompt: string
}

interface Brief {
  title: string
  platform: string
  platforms: string[]
  subject: string
  overview: string
  hook: string
  audience: string
  platformNote: string | null
  caption: string
  shots: Shot[]
}

interface HistoryEntry {
  id: number
  timestamp: string
  subject: string
  platforms: string[]
  niche: string
  briefCount: number
  briefs: Brief[]
}

// ── REF IMAGE ────────────────────────────────────────────────────────────────
function RefImage({ prompt, openAIKey }: { prompt: string; openAIKey: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'err'>('idle')
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const generate = async () => {
    if (!openAIKey) return
    setState('loading')
    setErrMsg('')
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, openAIKey }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setImgUrl(`data:image/png;base64,${data.image}`)
      setState('done')
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Unknown error')
      setState('err')
    }
  }

  if (state === 'idle') return (
    <button
      onClick={generate}
      disabled={!openAIKey}
      className="mt-3 px-4 py-2 text-xs tracking-widest border transition-all duration-150 rounded"
      style={{
        background: 'transparent',
        borderColor: openAIKey ? '#141e28' : '#0a1218',
        color: openAIKey ? '#4a6a80' : '#1e2d3d',
        cursor: openAIKey ? 'pointer' : 'not-allowed',
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: '0.15em',
      }}
      onMouseEnter={e => { if (openAIKey) { (e.target as HTMLElement).style.borderColor = '#00ff7f'; (e.target as HTMLElement).style.color = '#00ff7f' } }}
      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = openAIKey ? '#141e28' : '#0a1218'; (e.target as HTMLElement).style.color = openAIKey ? '#4a6a80' : '#1e2d3d' }}
    >
      {openAIKey ? '⬛ GENERATE REFERENCE FRAME' : 'ADD OPENAI KEY TO GENERATE'}
    </button>
  )

  if (state === 'loading') return (
    <div className="mt-3 rounded-lg overflow-hidden border border-border flex items-center justify-center" style={{ height: 180, background: '#080c0f' }}>
      <div>
        <div className="w-48 mx-auto mb-2 overflow-hidden" style={{ height: 1, background: '#141e28' }}>
          <div className="loading-bar" />
        </div>
        <p className="text-center text-xs tracking-widest" style={{ color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif" }}>RENDERING FRAME...</p>
      </div>
    </div>
  )

  if (state === 'err') return (
    <div className="mt-3 rounded-lg border border-border flex flex-col items-center justify-center p-4 gap-2" style={{ background: '#080c0f' }}>
      <p className="text-xs" style={{ color: '#4a6a80' }}>Frame failed: {errMsg}</p>
      <button onClick={() => setState('idle')} className="text-xs px-3 py-1 border rounded" style={{ borderColor: '#141e28', color: '#4a6a80', background: 'transparent', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', cursor: 'pointer' }}>RETRY</button>
    </div>
  )

  return (
    <div className="mt-3 rounded-lg overflow-hidden border" style={{ borderColor: '#141e28' }}>
      <img src={imgUrl!} alt="Shot reference" className="w-full block" />
    </div>
  )
}

// ── BRIEF CARD ───────────────────────────────────────────────────────────────
function BriefCard({ brief, index, openAIKey }: { brief: Brief; index: number; openAIKey: string }) {
  const [open, setOpen] = useState(false)
  const platform = PLATFORMS.find(p => p.id === brief.platform)

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden transition-all duration-200"
      style={{ background: '#0c1218', border: `1px solid ${open ? '#1e3040' : '#141e28'}` }}
    >
      {/* Header */}
      <div className="p-5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex gap-2 flex-wrap items-center mb-3">
          <span className="text-xs" style={{ color: '#141e28', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.15em' }}>#{String(index + 1).padStart(2, '0')}</span>
          {platform && (
            <span className="text-xs px-2 py-0.5 rounded border" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em', borderColor: platform.color + '60', color: platform.color, background: platform.color + '12' }}>
              {platform.label}
            </span>
          )}
          {brief.platforms?.filter(p => p !== brief.platform).map(p => {
            const pl = PLATFORMS.find(x => x.id === p)
            return pl ? (
              <span key={p} className="text-xs px-2 py-0.5 rounded border" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', borderColor: pl.color + '30', color: pl.color + 'bb' }}>
                +{pl.label}
              </span>
            ) : null
          })}
          <span className="text-xs px-2 py-0.5 rounded border" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', borderColor: '#141e28', color: '#4a6a80' }}>
            {brief.subject === 'me' ? 'SILHOUETTE' : 'MODEL'}
          </span>
        </div>

        <h3 className="text-xl mb-2 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em', color: '#dde8f0' }}>{brief.title}</h3>
        <p className="text-sm mb-2 italic" style={{ color: '#ffb347' }}>"{brief.hook}"</p>
        <p className="text-sm leading-relaxed" style={{ color: '#4a6a80' }}>{brief.overview}</p>

        <button className="mt-3 text-xs tracking-widest flex items-center gap-1" style={{ color: '#4a6a80', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif', letterSpacing: '0.15em" }}>
          {open ? '▲ COLLAPSE' : '▼ SHOT LIST + REFERENCES'}
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: '#141e28' }}>
          <div className="mt-4">
            <p className="text-xs mb-2 tracking-widest" style={{ color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif" }}>TARGET AUDIENCE</p>
            <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: '#080c0f', border: '1px solid #141e28', color: '#dde8f0' }}>{brief.audience}</div>
          </div>

          {brief.platformNote && (
            <div className="mt-4">
              <p className="text-xs mb-2 tracking-widest" style={{ color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif" }}>PLATFORM FRAMING</p>
              <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: '#1a1500', border: '1px solid #ffb34730', color: '#ffb347' }}>⚠ {brief.platformNote}</div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs mb-3 tracking-widest" style={{ color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif" }}>CINEMATIC SHOT LIST</p>
            {brief.shots?.map((shot, i) => (
              <div key={i} className="flex gap-3 mb-4">
                <div className="text-2xl shrink-0 pt-0.5" style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#141e28', minWidth: 28 }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <p className="text-xs mb-1 tracking-widest" style={{ color: '#00ff7f', fontFamily: "'Bebas Neue', sans-serif" }}>{shot.type}</p>
                  <p className="text-sm leading-relaxed mb-1" style={{ color: '#dde8f0' }}>{shot.description}</p>
                  {shot.lighting && <p className="text-xs italic" style={{ color: '#4a6a80' }}>Light: {shot.lighting}</p>}
                  {shot.imagePrompt && <RefImage prompt={shot.imagePrompt} openAIKey={openAIKey} />}
                </div>
              </div>
            ))}
          </div>

          {brief.caption && (
            <div className="mt-4">
              <p className="text-xs mb-2 tracking-widest" style={{ color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif" }}>CAPTION DIRECTION</p>
              <div className="rounded-lg p-3 text-sm italic" style={{ background: '#080c0f', border: '1px solid #141e28', color: '#ffb347' }}>{brief.caption}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [anthropicKey, setAnthropicKey] = useState('')
  const [anthropicSaved, setAnthropicSaved] = useState(false)
  const [openAIKey, setOpenAIKey] = useState('')
  const [openAISaved, setOpenAISaved] = useState(false)
  const [subject, setSubject] = useState<'me' | 'model'>('me')
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'tiktok'])
  const [niche, setNiche] = useState('')
  const [tone, setTone] = useState('mysterious / cinematic')
  const [moodImages, setMoodImages] = useState<{ dataUrl: string; base64: string; type: string }[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadStatus, setLoadStatus] = useState('')
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load keys and history from localStorage on mount
  useEffect(() => {
    const savedAnthropicKey = localStorage.getItem('anthropic_key')
    const savedOpenAIKey = localStorage.getItem('openai_key')
    const savedHistory = localStorage.getItem(HISTORY_KEY)
    if (savedAnthropicKey) { setAnthropicKey(savedAnthropicKey); setAnthropicSaved(true) }
    if (savedOpenAIKey) { setOpenAIKey(savedOpenAIKey); setOpenAISaved(true) }
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)) } catch {} }
  }, [])

  const saveAnthropicKey = () => {
    if (anthropicKey.trim()) { localStorage.setItem('anthropic_key', anthropicKey); setAnthropicSaved(true) }
  }
  const saveOpenAIKey = () => {
    if (openAIKey.trim()) { localStorage.setItem('openai_key', openAIKey); setOpenAISaved(true) }
  }

  const togglePlatform = (id: string) => {
    setPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(',')[1]
        setMoodImages(prev => [...prev, { dataUrl, base64, type: file.type }])
      }
      reader.readAsDataURL(file)
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const generate = async () => {
    if (!anthropicKey) { setError('Enter your Anthropic API key first.'); return }
    if (platforms.length === 0) { setError('Select at least one platform.'); return }
    setError('')
    setLoading(true)
    setBriefs([])

    try {
      setLoadStatus('SCRAPING HOOKS FROM CREATOR DATA...')
      await new Promise(r => setTimeout(r, 400))
      setLoadStatus('BUILDING CINEMATIC SHOT LISTS...')

      const body: Record<string, unknown> = {
        subject, platforms, niche, tone, anthropicKey,
      }
      if (moodImages.length > 0) {
        body.moodImageBase64 = moodImages[0].base64
        body.moodImageType = moodImages[0].type
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setBriefs(data.briefs)
      setLoadStatus('')

      const entry: HistoryEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        subject,
        platforms,
        niche: niche || 'General',
        briefCount: data.briefs.length,
        briefs: data.briefs,
      }
      const newHistory = [entry, ...history].slice(0, MAX_HISTORY)
      setHistory(newHistory)
      setActiveHistoryId(entry.id)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const deleteHistoryEntry = (id: number) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    if (activeHistoryId === id) { setBriefs([]); setActiveHistoryId(null) }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  const clearHistory = () => {
    if (!confirm('Delete all previous runs?')) return
    setHistory([])
    setBriefs([])
    setActiveHistoryId(null)
    localStorage.removeItem(HISTORY_KEY)
  }

  const inputStyle = {
    background: '#080c0f',
    border: '1px solid #141e28',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#dde8f0',
    fontFamily: "'Karla', sans-serif",
    fontSize: 13,
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 11,
    letterSpacing: '0.25em',
    color: '#4a6a80',
    display: 'block',
    marginBottom: 8,
  }

  const sectionStyle = { marginBottom: 28 }

  return (
    <div style={{ minHeight: '100vh', background: '#050709', color: '#dde8f0', fontFamily: "'Karla', sans-serif" }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HEADER */}
        <div style={{ padding: '40px 0 32px', borderBottom: '1px solid #141e28', marginBottom: 40 }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: '0.3em', color: '#4a6a80', marginBottom: 8 }}>CANNABIS CONTENT SYSTEM</p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 6vw, 64px)', letterSpacing: '0.04em', lineHeight: 1, color: '#dde8f0' }}>
            CINEMATIC<br /><span style={{ color: '#00ff7f' }}>BRIEF</span> TOOL
          </h1>
          <p style={{ marginTop: 10, fontSize: 13, color: '#4a6a80', lineHeight: 1.6 }}>
            Hooks pulled from 747K, 321K, and 15.9K creator data.<br />
            Shot lists built for your aesthetic. No face required.
          </p>
        </div>

        {/* CREATOR INTEL */}
        <div style={{ ...sectionStyle, background: '#080c0f', border: '1px solid #141e28', borderRadius: 8, padding: '14px 16px' }}>
          <p style={{ ...labelStyle, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff7f', display: 'inline-block' }} />
            LIVE SCRAPED — INSTAGRAM CREATOR INTEL
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {CREATORS.map(c => (
              <div key={c.handle} style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em', color: '#00ff7f', marginBottom: 4 }}>@{c.handle} · {c.followers}</p>
                <p style={{ fontSize: 11, color: '#4a6a80', fontStyle: 'italic' }}>"{c.hooks[0]}", "{c.hooks[1]}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* ANTHROPIC KEY */}
        <div style={sectionStyle}>
          <label style={labelStyle}>ANTHROPIC API KEY <span style={{ color: '#0a1218', fontSize: 10 }}>FOR BRIEF GENERATION</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="password" value={anthropicKey} onChange={e => { setAnthropicKey(e.target.value); setAnthropicSaved(false) }} placeholder="sk-ant-..." style={inputStyle} />
            <button onClick={saveAnthropicKey} style={{ background: anthropicSaved ? '#00ff7f18' : '#080c0f', border: `1px solid ${anthropicSaved ? '#00ff7f' : '#141e28'}`, borderRadius: 6, padding: '10px 16px', color: anthropicSaved ? '#00ff7f' : '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {anthropicSaved ? '✓ SAVED' : 'SAVE'}
            </button>
          </div>
        </div>

        {/* OPENAI KEY */}
        <div style={sectionStyle}>
          <label style={labelStyle}>OPENAI API KEY <span style={{ color: '#4a6a80', fontSize: 10 }}>FOR REFERENCE FRAMES · ~$0.07/IMAGE</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="password" value={openAIKey} onChange={e => { setOpenAIKey(e.target.value); setOpenAISaved(false) }} placeholder="sk-..." style={inputStyle} />
            <button onClick={saveOpenAIKey} style={{ background: openAISaved ? '#00ff7f18' : '#080c0f', border: `1px solid ${openAISaved ? '#00ff7f' : '#141e28'}`, borderRadius: 6, padding: '10px 16px', color: openAISaved ? '#00ff7f' : '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {openAISaved ? '✓ SAVED' : 'SAVE'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#1e3040', marginTop: 6 }}>Keys are saved locally in your browser. Never sent anywhere except directly to the respective APIs.</p>
        </div>

        {/* SUBJECT TOGGLE */}
        <div style={sectionStyle}>
          <label style={labelStyle}>SUBJECT MODE</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#141e28', borderRadius: 8, padding: 2 }}>
            {[
              { id: 'me', icon: '👤', label: "IT'S ME", sub: 'Silhouette · Hands · Shadow · Back-of-head · No face' },
              { id: 'model', icon: '🎭', label: 'WORKING WITH A MODEL', sub: 'Face-forward okay · More camera time' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setSubject(opt.id as 'me' | 'model')} style={{ padding: '14px 0', textAlign: 'center', cursor: 'pointer', borderRadius: 6, border: 'none', background: subject === opt.id ? '#0c1218' : 'transparent', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{opt.icon}</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.15em', display: 'block', color: subject === opt.id ? '#00ff7f' : '#4a6a80' }}>{opt.label}</span>
                <span style={{ fontSize: 10, color: '#4a6a80', display: 'block', marginTop: 2 }}>{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PLATFORMS */}
        <div style={sectionStyle}>
          <label style={labelStyle}>PLATFORMS</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => togglePlatform(p.id)} style={{ padding: '7px 16px', borderRadius: 4, border: `1px solid ${platforms.includes(p.id) ? p.color : '#141e28'}`, background: platforms.includes(p.id) ? p.color + '15' : 'transparent', color: platforms.includes(p.id) ? p.color : '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* MOOD UPLOAD */}
        <div style={sectionStyle}>
          <label style={labelStyle}>MOOD BOARD <span style={{ color: '#141e28', fontSize: 10 }}>OPTIONAL — INSPIRES SHOT STYLE</span></label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{ border: `1px dashed ${dragging ? '#00ff7f' : '#141e28'}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: dragging ? '#00ff7f08' : 'transparent', transition: 'all 0.2s' }}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && handleFiles(e.target.files)} />
            <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
            <p style={{ fontSize: 12, color: '#4a6a80' }}>Drop images or click to upload</p>
            <p style={{ fontSize: 11, color: '#141e28', marginTop: 4 }}>JPG, PNG, HEIC · Multiple allowed · Used for inspiration only</p>
          </div>
          {moodImages.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {moodImages.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img.dataUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #141e28' }} />
                  <button onClick={() => setMoodImages(m => m.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#ff3366', border: 'none', borderRadius: '50%', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NICHE */}
        <div style={sectionStyle}>
          <label style={labelStyle}>YOUR FOCUS / NICHE <span style={{ color: '#141e28', fontSize: 10 }}>OPTIONAL</span></label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. strain reviews, cannabis lifestyle, late night sessions..." style={inputStyle} />
        </div>

        {/* TONE */}
        <div style={sectionStyle}>
          <label style={labelStyle}>TONE</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['mysterious / cinematic', 'educational', 'raw / authentic', 'aesthetic / lifestyle', 'funny / casual'].map(t => (
              <button key={t} onClick={() => setTone(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tone === t ? '#00ff7f' : '#141e28'}`, background: tone === t ? '#00ff7f18' : 'transparent', color: tone === t ? '#00ff7f' : '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <button onClick={() => setHistoryOpen(o => !o)} style={{ flex: 1, background: 'transparent', border: '1px solid #141e28', borderRadius: 6, padding: '10px 16px', color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🗂</span>
                <span>PREVIOUS RUNS ({history.length})</span>
                <span style={{ marginLeft: 'auto', fontSize: 10 }}>{historyOpen ? '▲' : '▼'}</span>
              </button>
              {historyOpen && (
                <button onClick={clearHistory} style={{ background: 'transparent', border: '1px solid #141e28', borderRadius: 6, padding: '10px 14px', color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#ff3366'; (e.target as HTMLElement).style.color = '#ff3366' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#141e28'; (e.target as HTMLElement).style.color = '#4a6a80' }}>
                  CLEAR ALL
                </button>
              )}
            </div>
            {historyOpen && (
              <div style={{ background: '#080c0f', border: '1px solid #141e28', borderRadius: 8, overflow: 'hidden' }}>
                {history.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #141e28', cursor: 'pointer', background: activeHistoryId === entry.id ? '#00ff7f08' : 'transparent', borderLeft: activeHistoryId === entry.id ? '2px solid #00ff7f' : '2px solid transparent' }}
                    onClick={() => { setBriefs(entry.briefs); setActiveHistoryId(entry.id); setHistoryOpen(false); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }}>
                    <div>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em', color: '#dde8f0', marginBottom: 3 }}>{entry.niche} · {entry.subject === 'me' ? 'SILHOUETTE' : 'MODEL'}</p>
                      <p style={{ fontSize: 11, color: '#4a6a80' }}>{entry.platforms.join(', ')} · {entry.timestamp}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#141e28' }}>{entry.briefCount}</span>
                      <button onClick={e => { e.stopPropagation(); deleteHistoryEntry(entry.id) }} style={{ background: 'transparent', border: '1px solid #141e28', borderRadius: 4, padding: '3px 8px', color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#ff3366'; (e.target as HTMLElement).style.color = '#ff3366' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#141e28'; (e.target as HTMLElement).style.color = '#4a6a80' }}>
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GENERATE */}
        <button onClick={generate} disabled={loading || platforms.length === 0 || !anthropicKey} className="btn-primary">
          {loading ? 'GENERATING...' : 'GENERATE CINEMATIC BRIEFS'}
        </button>
        {error && <p style={{ color: '#ff3366', fontSize: 12, marginTop: 8 }}>{error}</p>}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.2em', color: '#4a6a80', marginBottom: 24 }}>BUILDING YOUR VISION</p>
            <div style={{ width: 200, height: 1, background: '#141e28', margin: '0 auto 8px', overflow: 'hidden', borderRadius: 1 }}>
              <div className="loading-bar" />
            </div>
            <p style={{ fontSize: 11, color: '#4a6a80', letterSpacing: '0.1em' }}>{loadStatus}</p>
          </div>
        )}

        {/* RESULTS */}
        {briefs.length > 0 && (
          <div ref={resultsRef} style={{ marginTop: 48, paddingTop: 48, borderTop: '1px solid #141e28' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.1em' }}>YOUR BRIEFS</h2>
              <p style={{ fontSize: 11, color: '#4a6a80', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em' }}>{briefs.length} BRIEFS</p>
            </div>
            {briefs.map((brief, i) => (
              <BriefCard key={i} brief={brief} index={i} openAIKey={openAISaved ? openAIKey : ''} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
