import Anthropic from '@anthropic-ai/sdk'
import { verifyToken, authError } from './lib/verify-token.js'
import { getApp } from './lib/admin-app.js'
import { getFirestore } from 'firebase-admin/firestore'

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const SYSTEM_PROMPT = `You are a botanical and ethno-botanical reference writer. Given a plant species, produce a structured JSON document with:

1. "description" — a concise (2-4 sentence) botanical description of the species as commonly encountered (not a field guide entry, but enough to confirm identification). Include native range, growth habit, and the distinctive feature that makes it recognizable.

2. "herbalAndMedicinalUses" — documented traditional medicinal or herbal uses for THIS SPECIFIC SPECIES. If no significant use is documented for this species, say so plainly. Do not transfer uses from other species in the same genus — genus-level lore versus species-level lore is the most likely place this feature will overreach. If the genus carries documented weight in a tradition but this species does not, note the genus connection without claiming the species inherits it.

3. "symbolicReadings" — an array of exactly 4 entries, one per tradition:
   - "Western esoteric (planetary/elemental)"
   - "Traditional Chinese medicine / Chinese plant theory"
   - "Vedic / Ayurvedic (dravyaguna)"
   - "Druidic / Celtic tree lore"

   Each entry has:
   - "tradition": the tradition name
   - "correspondence": the specific documented attribution, or a clear statement that none exists
   - "groundedness": either "documented" (the attribution exists in the tradition's own literature for this specific species) or "synthesized" (you are extending by analogy, offering a reading, or the tradition has nothing to say about this plant)
   - "notes": context, caveats, the reasoning behind a synthesized reading, or an honest "nothing to say here"

   CRITICAL: default to "synthesized" unless you can point to a specific textual source. A genus-level attribution that doesn't name this species is "synthesized", not "documented". An absence is a valid answer — do not manufacture readings to fill slots.

Respond ONLY with valid JSON, no preamble or markdown fences.`

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

  const { scientificName, commonName, plantnetTaxonId } = body
  if (!scientificName) {
    return new Response(JSON.stringify({ error: 'scientificName required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const slug = toSlug(scientificName)
  const db = getFirestore(getApp())
  const docRef = db.collection('species_info').doc(slug)

  const existing = await docRef.get()
  if (existing.exists) {
    return new Response(JSON.stringify({ slug, ...existing.data(), cached: true }), {
      status: 200,
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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const commonNames = commonName ? [commonName] : []

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Species: ${scientificName}${commonName ? ` (commonly known as: ${commonName})` : ''}`,
      }],
    })

    const text = response.content[0].text
    const generated = JSON.parse(text)

    const doc = {
      scientificName,
      commonNames: commonNames.length ? commonNames : (generated.commonNames || []),
      plantnetTaxonId: plantnetTaxonId || null,
      description: generated.description,
      herbalAndMedicinalUses: generated.herbalAndMedicinalUses,
      symbolicReadings: generated.symbolicReadings,
      generatedAt: new Date(),
      generatedByModel: 'claude-sonnet-4-20250514',
    }

    await docRef.set(doc)

    return new Response(JSON.stringify({ slug, ...doc, cached: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-species-info] failed:', err)
    return new Response(JSON.stringify({ error: 'Species info generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}