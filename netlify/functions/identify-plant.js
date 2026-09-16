import { verifyToken, authError } from './lib/verify-token.js'

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

  const { imageBase64 } = body
  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.PLANTNET_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'PlantNet API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    const buffer = Buffer.from(base64, 'base64')

    const formData = new FormData()
    formData.append('images', new Blob([buffer], { type: 'image/jpeg' }), 'plant.jpg')
    formData.append('organs', 'auto')

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
      { method: 'POST', body: formData },
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[identify-plant] PlantNet error:', response.status, errText)
      return new Response(JSON.stringify({ error: `PlantNet API error (${response.status})` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const candidates = (data.results || []).slice(0, 5).map((r) => ({
      score: r.score,
      scientificName: r.species?.scientificNameWithoutAuthor || r.species?.scientificName || 'Unknown',
      commonNames: r.species?.commonNames || [],
      genus: r.species?.genus?.scientificNameWithoutAuthor || null,
      family: r.species?.family?.scientificNameWithoutAuthor || null,
    }))

    return new Response(JSON.stringify({ candidates, bestMatch: data.bestMatch || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[identify-plant] failed:', err)
    return new Response(JSON.stringify({ error: 'Plant identification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}