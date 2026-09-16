import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import './PruneResult.css'

function SchematicDiagram({ limbs }) {
  if (!limbs?.length) return null

  const cutLimbs = limbs.filter((l) => l.action === 'cut')
  const leaveLimbs = limbs.filter((l) => l.action === 'leave')
  const maxNodes = Math.max(...limbs.map((l) => l.nodesFromTip || 6), 6)
  const stemHeight = 240
  const nodeSpacing = stemHeight / (maxNodes + 1)

  return (
    <svg className="schematic-svg" viewBox="0 0 200 300" fill="none">
      {/* Stem */}
      <line x1="100" y1="280" x2="100" y2="30" stroke="var(--soil-brown)" strokeWidth="3" strokeLinecap="round" />

      {/* Nodes */}
      {Array.from({ length: maxNodes }, (_, i) => {
        const y = 280 - (i + 1) * nodeSpacing
        const nodeNum = i + 1
        const cutHere = cutLimbs.find((l) => l.nodesFromTip === nodeNum)
        const leaveHere = leaveLimbs.find((l) => l.nodesFromTip === nodeNum)

        return (
          <g key={i}>
            {/* Node dot */}
            <circle cx="100" cy={y} r="4" fill="var(--soil-brown)" />

            {/* Side branches */}
            <line x1="100" y1={y} x2={i % 2 === 0 ? '140' : '60'} y2={y - 10} stroke="var(--soil-brown)" strokeWidth="1.5" strokeLinecap="round" />

            {/* Node label */}
            <text x={i % 2 === 0 ? '148' : '52'} y={y - 6} fontSize="9" fill="rgba(92,61,46,0.5)" textAnchor={i % 2 === 0 ? 'start' : 'end'}>
              {nodeNum}
            </text>

            {/* Cut marker */}
            {cutHere && (
              <g>
                <line x1="85" y1={y - 8} x2="115" y2={y + 8} stroke="var(--barn-red)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="115" y1={y - 8} x2="85" y2={y + 8} stroke="var(--barn-red)" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}

            {/* Leave marker */}
            {leaveHere && (
              <circle cx="100" cy={y} r="8" stroke="var(--pasture-green)" strokeWidth="2" fill="none" />
            )}
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(10, 10)">
        <line x1="0" y1="4" x2="10" y2="12" stroke="var(--barn-red)" strokeWidth="2" />
        <line x1="10" y1="4" x2="0" y2="12" stroke="var(--barn-red)" strokeWidth="2" />
        <text x="16" y="12" fontSize="9" fill="var(--soil-brown)">Cut</text>
        <circle cx="55" cy="8" r="6" stroke="var(--pasture-green)" strokeWidth="1.5" fill="none" />
        <text x="66" y="12" fontSize="9" fill="var(--soil-brown)">Leave</text>
      </g>
    </svg>
  )
}

export default function PruneResult() {
  const { plantId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { result, imageBase64, speciesName, fromHistory } = location.state || {}
  const [showSchematic, setShowSchematic] = useState(false)
  const [saved, setSaved] = useState(!!fromHistory)

  if (!result) {
    navigate(`/plants/${plantId}`)
    return null
  }

  async function handleSave() {
    if (saved) return
    try {
      await addDoc(collection(db, 'pruning_sessions'), {
        plantId,
        ownerId: auth.currentUser.uid,
        photoStoragePath: null,
        goal: result.goal || 'general',
        limbs: result.limbs || [],
        summary: result.summary || '',
        tools: result.tools || [],
        warnings: result.warnings || [],
        createdAt: serverTimestamp(),
      })
      setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  return (
    <div className="prune-result-page fade-in">
      <header className="prune-header">
        <button className="back-btn" onClick={() => navigate(`/plants/${plantId}`)} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Pruning Plan</h1>
      </header>

      {imageBase64 && <img className="prune-photo" src={imageBase64} alt="Plant" />}

      {result.summary && <p className="prune-summary">{result.summary}</p>}

      {result.limbs?.length > 0 && (
        <div className="limbs-section">
          <div className="limbs-header">
            <h2>Limbs</h2>
            <button className="schematic-toggle" onClick={() => setShowSchematic((v) => !v)}>
              {showSchematic ? 'Show text' : 'Show diagram'}
            </button>
          </div>

          {showSchematic ? (
            <SchematicDiagram limbs={result.limbs} />
          ) : (
            <div className="limbs-list">
              {result.limbs.map((limb, i) => (
                <div key={i} className={`limb-card limb-${limb.action}`}>
                  <div className="limb-header">
                    <span className={`limb-action-pill ${limb.action === 'cut' ? 'pill-cut' : 'pill-leave'}`}>
                      {limb.action}
                    </span>
                    <span className="limb-label">{limb.label}</span>
                  </div>
                  {limb.nodesFromTip != null && (
                    <span className="limb-nodes">{limb.nodesFromTip} nodes from tip</span>
                  )}
                  <p className="limb-reasoning">{limb.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result.tools?.length > 0 && (
        <div className="tools-section">
          <h2>Tools Needed</h2>
          <ul className="tools-list">
            {result.tools.map((tool, i) => (
              <li key={i}>{typeof tool === 'string' ? tool : tool.name}</li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div className="warnings-section">
          <h2>Warnings</h2>
          {result.warnings.map((warn, i) => (
            <div key={i} className="warning-item">
              <svg className="warning-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a07520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{typeof warn === 'string' ? warn : warn.text || warn.message}</span>
            </div>
          ))}
        </div>
      )}

      {!fromHistory && (
        <button className={`save-result-btn ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saved}>
          {saved ? 'Saved' : 'Save This Plan'}
        </button>
      )}
    </div>
  )
}
