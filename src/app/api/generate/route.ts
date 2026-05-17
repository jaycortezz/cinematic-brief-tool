import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const CREATORS = [
  {
    handle: 'koala.puffss', followers: '747K',
    topHooks: ['having a bad day?', 'mary j is there no matter what', 'me all weekend:', 'on last night\'s stream:', 'make this after'],
    patterns: 'Comfort messaging, relatable emotional states, lifestyle moments'
  },
  {
    handle: 'mr_marijuanaman_', followers: '321K',
    topHooks: ['you\'re in my dream rotation', 'safety meeting time', 'my back hurts when i do this'],
    patterns: 'Product process ASMR, strain showcases, dry humor'
  },
  {
    handle: 'gethighwithkathy', followers: '15.9K',
    topHooks: ['a few days late but happy birthday to me', 'wow, this past year was my wildest yet', 'if there\'s one thing twenty-six taught me'],
    patterns: 'Personal milestones, authentic reflection, vulnerability goes viral'
  }
]

export async function POST(req: NextRequest) {
  try {
    const { subject, platforms, niche, tone, anthropicKey, moodImageBase64, moodImageType } = await req.json()

    const client = new Anthropic({ apiKey: anthropicKey })

    const platformDetails = platforms.map((id: string) => {
      const map: Record<string, string> = {
        instagram: 'Instagram (restriction: moderate)',
        tiktok: 'TikTok (restriction: moderate)',
        youtube: 'YouTube (restriction: low)',
        twitter: 'X / Twitter (restriction: low)',
      }
      return map[id] || id
    })

    const creatorContext = CREATORS.map(c =>
      `@${c.handle} (${c.followers}): hooks — "${c.topHooks.join('", "')}" | pattern: ${c.patterns}`
    ).join('\n')

    const subjectNote = subject === 'me'
      ? 'The creator is NOT on camera. All shots must work as: silhouette, shadow, hands only, back-of-head, or pure environmental B-roll. NEVER suggest face-forward camera time.'
      : 'A model is the subject. Face-forward shots are acceptable. Keep the cinematic, mysterious aesthetic.'

    const moodNote = moodImageBase64
      ? 'The creator has uploaded a mood board image. Analyze its aesthetic, lighting, composition, and mood and incorporate those visual elements into shot descriptions and image prompts.'
      : ''

    const userContent: Anthropic.MessageParam['content'] = [
      ...(moodImageBase64 ? [{
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: moodImageType as 'image/jpeg' | 'image/png', data: moodImageBase64 }
      }] : []),
      {
        type: 'text' as const,
        text: `You are a cinematic cannabis content director.

SCRAPED CREATOR HOOKS (rewrite in dark/minimal style):
${creatorContext}

BRAND AESTHETIC:
- Colors: deep greens, amber/orange streetlights, red neon, crushed blacks
- Locations: Portland Oregon urban night — closed storefronts, rain-slicked streets, stairwells, parking structures, neon signs
- Camera: wide establishing, slow push-ins, macro close-ups, silhouettes, rack focus, wet pavement reflections
- Mood: mysterious, solitary, cinematic — NOT bright or lifestyle-positive
- Think: Wong Kar-wai, Christopher Doyle, Gregory Crewdson
- Practical light sources ONLY: streetlights, neon signs, store windows, headlights

SUBJECT MODE: ${subjectNote}
${moodNote}

TASK: Generate briefs for a cannabis creator.
${niche ? `Focus: ${niche}` : ''}
${tone ? `Tone: ${tone}` : ''}
Platforms: ${platformDetails.join(', ')}

QUOTA: 5 briefs per platform. Cross-platform briefs count toward each platform's quota of 5.

Platform framing: Instagram/TikTok = lifestyle/culture framing, no explicit drug use shown. YouTube/Twitter = more direct.

Return ONLY a valid JSON array. No markdown, no backticks.

Each object:
- title: string (dark, minimal, max 6 words e.g. "3AM. Still Here.")
- platform: string (primary platform)
- platforms: string[] (all platforms this works for)
- subject: string ("me" or "model")
- overview: string (2 sentences, cinematic concept)
- hook: string (rewritten from scraped data, dark/minimal, max 12 words, no emoji)
- audience: string (specific — mindset and aesthetic taste)
- platformNote: string | null
- caption: string (1-2 lines, minimal, poetic)
- shots: array of exactly 5 objects:
  - type: string (Wide establishing|Slow push-in|Macro close-up|Silhouette|Handheld drift|Top-down overhead|Through-glass|Reflection shot|Shadow play|Rack focus)
  - description: string (specific, actionable)
  - lighting: string (exact light source)
  - imagePrompt: string (OpenAI image gen prompt, dark cinematic Portland night, max 60 words, include "film grain, anamorphic lens, cinematic, 35mm")`
      }
    ]

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: userContent }]
    })

    const raw = message.content.map((b: Anthropic.ContentBlock) => 'text' in b ? b.text : '').join('')
    const clean = raw.replace(/```json|```/g, '').trim()

    // Truncation-safe parser
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      const matches: unknown[] = []
      let depth = 0, start = -1, inStr = false, escape = false
      for (let i = 0; i < clean.length; i++) {
        const ch = clean[i]
        if (escape) { escape = false; continue }
        if (ch === '\\' && inStr) { escape = true; continue }
        if (ch === '"' && depth > 0) { inStr = !inStr; continue }
        if (inStr) continue
        if (ch === '{') { if (depth === 0) start = i; depth++ }
        else if (ch === '}') {
          depth--
          if (depth === 0 && start !== -1) {
            try { matches.push(JSON.parse(clean.slice(start, i + 1))) } catch {}
            start = -1
          }
        }
      }
      if (matches.length === 0) throw new Error('Could not parse briefs')
      parsed = matches
    }

    return NextResponse.json({ briefs: parsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
