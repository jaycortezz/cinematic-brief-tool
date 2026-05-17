import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { prompt, openAIKey } = await req.json()

    if (!openAIKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 400 })
    }

    const client = new OpenAI({ apiKey: openAIKey })

    const enhancedPrompt = `Cinematic still frame, dark moody night photography, Portland Oregon urban environment. ${prompt}. Deep crushed blacks, green neon glow, amber streetlight, rain-slicked pavement, film grain, anamorphic lens, 35mm cinematic, mysterious atmospheric mood, no faces visible, silhouette only if person present.`

    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      n: 1,
      size: '1792x1024',
      quality: 'medium',
    })

    const b64 = (response.data[0] as { b64_json?: string }).b64_json
    if (!b64) throw new Error('No image returned from OpenAI')

    return NextResponse.json({ image: b64 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
