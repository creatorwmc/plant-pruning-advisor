import { useState, useRef, useEffect } from 'react'
import { auth } from '../firebase'
import { isKairosUser } from '../lib/kairosHandshake'
import './ChatPanel.css'

const LUMEN_URL = 'https://kairos-pwa.netlify.app/.netlify/functions/lumen-satellite-chat'
const STANDALONE_URL = '/.netlify/functions/standalone-chat'

export default function ChatPanel({ plantContext, kairosMembership }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef(null)
  const isGolden = isKairosUser(kairosMembership)

  useEffect(() => {
    if (open && isGolden && !loaded) {
      loadConversation()
    }
  }, [open, isGolden, loaded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversation() {
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(LUMEN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setConversationId(data.conversationId)
      setMessages(data.messages || [])
      setLoaded(true)
    } catch {
      // Lumen unavailable — degrade to standalone
    }
  }

  async function send() {
    if (!input.trim() || streaming) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)

    const assistantIdx = messages.length + 1
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const token = await auth.currentUser.getIdToken()

      if (isGolden && conversationId) {
        const res = await fetch(LUMEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversationId, message: userMsg, plantContext }),
        })
        await parseSSE(res, assistantIdx)
      } else {
        const res = await fetch(STANDALONE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: userMsg, plantContext }),
        })
        await parseSSE(res, assistantIdx)
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIdx] = { role: 'assistant', content: 'Something went wrong. Try again.' }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  async function parseSSE(res, idx) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      const lines = buf.split('\n')
      buf = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') return

        try {
          const parsed = JSON.parse(payload)
          if (parsed.type === 'error') {
            setMessages((prev) => {
              const copy = [...prev]
              copy[idx] = { role: 'assistant', content: parsed.error?.message || 'Error' }
              return copy
            })
            return
          }
          if (parsed.delta?.text) {
            setMessages((prev) => {
              const copy = [...prev]
              copy[idx] = { ...copy[idx], content: (copy[idx]?.content || '') + parsed.delta.text }
              return copy
            })
          }
        } catch { /* skip */ }
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {isGolden && <span className="golden-dot" />}
      </button>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>{isGolden ? 'Lumen' : 'Plant Assistant'}</h3>
        <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Ask about this plant's care, pruning, or herbal properties.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this plant..."
          disabled={streaming}
        />
        <button className="chat-send" onClick={send} disabled={!input.trim() || streaming} aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
