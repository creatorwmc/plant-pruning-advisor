import Anthropic from '@anthropic-ai/sdk'
import { verifyToken, authError } from './lib/verify-token.js'

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096

const BASE_SYSTEM = `You are a knowledgeable botanical assistant within Plants 101, a houseplant and herbalism app. You help users with plant care, identification questions, pruning guidance, and herbal/medicinal plant knowledge.

When discussing herbal, medicinal, or symbolic properties of plants, always distinguish between documented traditional uses and synthesized or speculative readings. Never present synthesized correspondences as established tradition. Note genus-level lore versus species-level lore — a famous genus does not confer its traditional weight onto every species within it.

Be helpful, direct, and specific. If you don't know something, say so.`

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const auth = await verifyToken(req)
  if (auth.error) return authError(auth)

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { message, plantContext } = body
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'message required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (message.length > 50000) {
    return new Response(JSON.stringify({ error: 'Message too large' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let systemText = BASE_SYSTEM
  if (plantContext?.commonName || plantContext?.speciesName) {
    systemText += `\n\nThe user is currently viewing: ${plantContext.commonName || 'a plant'} (${plantContext.speciesName || 'unknown species'}) in Plants 101.`
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(payload))
      try {
        const modelStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemText,
          messages: [{ role: 'user', content: message }],
        })

        for await (const event of modelStream) {
          if (event.type !== 'content_block_delta' || event.delta?.type !== 'text_delta') continue
          const delta = event.delta.text || ''
          if (!delta) continue
          send(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { text: delta } })}\n\n`)
        }

        send('data: [DONE]\n\n')
      } catch (err) {
        console.error('[standalone-chat] failed:', err)
        send(`data: ${JSON.stringify({ type: 'error', error: { message: 'AI service unavailable' } })}\n\n`)
        send('data: [DONE]\n\n')
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}