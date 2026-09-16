// Seed the known-good Ficus lyrata species_info document.
// Run: node seed-ficus-lyrata.mjs
//
// Requires: .service-accounts/wortcunning.json present locally.

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const sa = JSON.parse(readFileSync('.service-accounts/wortcunning.json', 'utf8'))
initializeApp({ credential: cert(sa) })
const db = getFirestore()

const doc = {
  scientificName: 'Ficus lyrata',
  commonNames: ['Fiddle leaf fig', 'Banjo fig', 'Lyre-leaved fig'],
  plantnetTaxonId: null,
  description: "A West African rainforest fig, native to lowland tropical forest in countries like Cameroon and Sierra Leone, grown as an understory tree in the wild and as a large architectural houseplant everywhere else. Known for large, glossy, violin-shaped (lyre-shaped) leaves with prominent veining, and for a strong single growing point that gives it a distinctive tall, sparse, top-heavy silhouette when grown indoors without any shaping.",
  herbalAndMedicinalUses: "No significant traditional medicinal or herbal use is documented for this species specifically. It belongs to the genus Ficus, which does include species with real traditional-medicine histories (Ficus carica, the edible fig, and Ficus religiosa, used in Ayurveda) \u2014 but Ficus lyrata itself is a relatively recent introduction to cultivation (popularized as a houseplant mainly from the mid-20th century onward) and was not part of the traditional pharmacopeia those other species belong to. Like most Ficus species, its sap is a mild skin and eye irritant (a latex compound, not a toxin with therapeutic use) and it is mildly toxic to cats and dogs if ingested \u2014 worth noting under care information, not medicine.",
  symbolicReadings: [
    {
      tradition: 'Western esoteric (planetary/elemental)',
      correspondence: "No specific documented planetary or elemental attribution exists for Ficus lyrata by name in the standard herbal-astrological sources (Culpeper and successors catalog fig broadly under Jupiter, but that attribution is for the edible fig, Ficus carica, not this species).",
      groundedness: 'synthesized',
      notes: "Offered reading only: its single strong vertical leader and broad leaves read naturally as Jupiter-adjacent (expansive, dominant growth) if you want a correspondence to work with, but this is an extension by analogy from Ficus carica, not a documented attribution for lyrata itself.",
    },
    {
      tradition: 'Traditional Chinese medicine / Chinese plant theory',
      correspondence: 'No entry for this species in Chinese materia medica or classical plant theory.',
      groundedness: 'synthesized',
      notes: 'Some other Ficus species appear in regional Chinese herbal use (notably Ficus carica fruit, used for its cooling, moistening qualities), but Ficus lyrata is not native to and has no history within this tradition. Nothing offered here beyond that absence.',
    },
    {
      tradition: 'Vedic / Ayurvedic (dravyaguna)',
      correspondence: 'No entry for this species. The genus carries major weight in this tradition through Ficus religiosa (Peepal/Ashvattha), sacred in both Hinduism and Buddhism, but that is a botanically and culturally distinct species.',
      groundedness: 'synthesized',
      notes: "It would be a real distortion to transfer Peepal's sacred status onto Ficus lyrata just because they share a genus \u2014 flagging this explicitly so the app doesn't quietly imply your houseplant is 'the sacred fig.' It isn't.",
    },
    {
      tradition: 'Druidic / Celtic tree lore',
      correspondence: 'None. Fig is not a tree native to the British Isles or continental Celtic regions and does not appear in the Ogham tree calendar or related lore.',
      groundedness: 'synthesized',
      notes: "No forced correspondence offered here \u2014 this is a case where honesty means saying the tradition simply has nothing to say about this plant, rather than manufacturing a reading to fill the slot.",
    },
  ],
  generatedAt: null,
  generatedByModel: 'hand-authored-seed',
}

await db.collection('species_info').doc('ficus-lyrata').set(doc)
console.log('Seeded species_info/ficus-lyrata')
process.exit(0)
