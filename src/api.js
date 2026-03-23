const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export function getApiKey() {
  return localStorage.getItem('pruning_advisor_api_key');
}

export function setApiKey(key) {
  localStorage.setItem('pruning_advisor_api_key', key.trim());
}

function parseJSONResponse(text) {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

function getBase64AndMediaType(dataUrl) {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  let mediaType = 'image/jpeg';
  const match = dataUrl.match(/^data:(image\/\w+);/);
  if (match) mediaType = match[1];
  return { base64, mediaType };
}

export async function analyzePhoto(base64ImageData) {
  const apiKey = getApiKey();
  if (!apiKey) return { error: 'API key is required.' };

  try {
    const { base64, mediaType } = getBase64AndMediaType(base64ImageData);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: `You are an expert horticulturist and arborist analyzing a plant photo.

Your job:
1. Identify the plant species (give your best guess and confidence level)
2. Describe its current shape, structure, and growth pattern in plain language
3. Note any health concerns visible in the photo
4. Identify key structural features: leader branches, laterals, suckers, deadwood, crossing branches, water sprouts
5. Assess whether now is an appropriate time to prune this species (assume the user is in USDA zone 5-6, Colorado, elevation ~7000ft unless they say otherwise)
6. List 3-6 pruning shape/style goals that are horticulturally appropriate for this specific species

For each pruning goal, provide:
- id: a snake_case identifier (use these when possible: open_center, central_leader, espalier, natural, formal_hedge, tree_form, size_reduction, vase, climbing, rejuvenation, canopy_lift, thinning, structural)
- name: short descriptive name
- description: one sentence explaining what it achieves
- difficulty: "easy", "moderate", or "experienced"
- timing: when this type of pruning is best done
- shape: the snake_case shape id for the silhouette icon (same as id)

Respond ONLY in JSON format with no preamble or markdown:
{
  "species_name": "Common name (Scientific name)",
  "confidence": "high/medium/low",
  "current_analysis": "Plain language description of what you see...",
  "health_notes": "Any health concerns or positive observations...",
  "structure_notes": "Key structural features identified...",
  "pruning_timing": "Whether now is appropriate and why...",
  "goals": [
    {
      "id": "open_center",
      "name": "Open center / vase shape",
      "description": "Opens the interior to sunlight...",
      "difficulty": "moderate",
      "timing": "Best in late winter...",
      "shape": "open_center"
    }
  ]
}`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: 'Please analyze this plant for pruning advice.' },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { error: `API error (${response.status}): ${errBody}` };
    }

    const data = await response.json();
    return parseJSONResponse(data.content[0].text);
  } catch (err) {
    return { error: err.message || 'Failed to analyze photo.' };
  }
}

export async function getPruningInstructions(base64ImageData, species, selectedGoal) {
  const apiKey = getApiKey();
  if (!apiKey) return { error: 'API key is required.' };

  try {
    const { base64, mediaType } = getBase64AndMediaType(base64ImageData);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        system: `You are an expert horticulturist providing specific pruning instructions for a plant in a photo. The user has selected a target shape/style goal.

Your job is to provide SPECIFIC, DIRECTIONAL pruning instructions that reference the actual plant visible in the photo. Use clock positions (12 o'clock = top, 3 = right, 6 = bottom, 9 = left), relative height (low/middle/upper canopy), and left/right orientation as the viewer sees the photo.

Be specific: NOT "remove crossing branches" but "The branch at about 2 o'clock in the upper canopy crosses behind the main leader — remove it where it meets the parent branch."

Respond ONLY in JSON format with no preamble or markdown:
{
  "summary": "One-paragraph overview of the pruning plan...",
  "priority_cuts": [
    {
      "location": "Description referencing the photo — clock position, height, left/right...",
      "action": "What to do — remove, shorten, thin...",
      "cut_type": "thinning cut / heading cut / removal cut",
      "reason": "Why this matters..."
    }
  ],
  "shaping_cuts": [
    {
      "location": "Where on the plant...",
      "action": "What to do...",
      "direction": "Which direction this encourages new growth...",
      "amount": "How much to remove — fraction, inches, etc."
    }
  ],
  "leave_alone": [
    "Description of branches/areas that should not be touched and why..."
  ],
  "tools": ["hand pruners", "loppers", "etc."],
  "estimated_time": "30-45 minutes",
  "followup": "When to check progress, next pruning window, care notes...",
  "warnings": ["Any cautions — disease risk, timing concerns, etc."],
  "annotation_guides": [
    {
      "clock_position": "2 o'clock",
      "height_percent": 75,
      "side": "right",
      "action": "remove",
      "label": "Remove crossing branch"
    }
  ]
}`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `This plant has been identified as: ${species}

The user wants to achieve this pruning goal: ${selectedGoal.name}
Goal description: ${selectedGoal.description}

Please provide specific pruning instructions referencing the plant as it appears in this photo. Use clock positions and directional language so the user can match your instructions to what they see.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { error: `API error (${response.status}): ${errBody}` };
    }

    const data = await response.json();
    return parseJSONResponse(data.content[0].text);
  } catch (err) {
    return { error: err.message || 'Failed to generate pruning instructions.' };
  }
}
