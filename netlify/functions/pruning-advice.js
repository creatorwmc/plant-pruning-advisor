import Anthropic from '@anthropic-ai/sdk'
import { verifyToken, authError } from './lib/verify-token.js'

const SYSTEM_PROMPT = `You are an expert horticulturist providing specific pruning instructions for a plant in a photo. The user has selected a pruning goal.

Analyze the photo and provide structured pruning advice using a limbs-based model. Each limb entry identifies a specific branch or section of the plant and recommends an action.

Respond ONLY with valid JSON, no preamble or markdown fences:
{
  "summary": "One-paragraph overview of the pruning plan",
  "limbs": [
    {
      "label": "Human-readable identifier for this branch/section (e.g. 'Main leader, top section')",
      "nodesFromTip": <integer or null — count of nodes from the growing tip to the cut point. null when no specific node count applies (e.g. a 'leave' recommendation)>,
      "action": "cut" | "leave",
      "reasoning": "Why this action — what it achieves botanically"
    }
  ],
  "tools": ["Tool name with any relevant specification"],
  "warnings": ["Any cautions — sap irritation, timing, disease risk, etc."]
}`

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

  const { speciesName, goal, imageBase64 } = body
  if (!speciesName || !goal || !imageBase64) {
    return new Response(JSON.stringify({ error: 'speciesName, goal, and imageBase64 required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    let mediaType = 'image/jpeg'
    const match = imageBase64.match(/^data:(image\/\w+);/)
    if (match) mediaType = match[1]

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `This plant has been identified as: ${speciesName}\n\nThe user wants to achieve this pruning goal: ${goal}\n\nProvide specific pruning instructions using the limbs model. For each identifiable branch or section, say whether to cut or leave and why. Include node counts from the tip where applicable.`,
          },
        ],
      }],
    })

    const text = response.content[0].text
    const result = JSON.parse(text)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[pruning-advice] failed:', err)
    return new Response(JSON.stringify({ error: 'Pruning advice generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}