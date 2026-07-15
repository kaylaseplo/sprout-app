import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/auth-context'

export function Chat({ classroom }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [savingNoteKey, setSavingNoteKey] = useState(null)
  const [savedNoteKeys, setSavedNoteKeys] = useState(new Set())
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []))
  }, [user.id])

  useEffect(() => {
    let active = true

    async function loadChildren() {
      if (!classroom) {
        await Promise.resolve()
        if (active) {
          setChildren([])
          setSelectedChildId('')
        }
        return
      }

      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('first_name', { ascending: true })

      if (active) setChildren(data ?? [])
    }

    loadChildren()

    return () => {
      active = false
    }
  }, [classroom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setError('')
    setInput('')
    setSending(true)

    const userMessage = {
      role: 'user',
      content,
      _localId: crypto.randomUUID(),
      childId: selectedChildId || null,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role: 'user', content })

    if (insertError) {
      setError(insertError.message)
      setSending(false)
      return
    }

    const { data, error: fnError } = await supabase.functions.invoke('chat', {
      body: {
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        childId: selectedChildId || undefined,
      },
    })

    if (fnError || data?.error) {
      setError(fnError?.message || data.error)
      setSending(false)
      return
    }

    const assistantMessage = { role: 'assistant', content: data.reply, _localId: crypto.randomUUID() }
    setMessages((prev) => [...prev, assistantMessage])

    await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role: 'assistant', content: data.reply })

    setSending(false)
  }

  async function handleSaveNote(message) {
    const child = children.find((c) => c.id === message.childId)
    const key = message._localId
    if (!child || !classroom || !key) return

    setSavingNoteKey(key)
    setError('')

    const { error: noteError } = await supabase.from('child_notes').insert({
      child_id: child.id,
      classroom_id: classroom.id,
      created_by: user.id,
      note: message.content,
      source: 'chat',
    })

    setSavingNoteKey(null)

    if (noteError) {
      setError(noteError.message)
      return
    }

    setSavedNoteKeys((prev) => new Set(prev).add(key))
  }

  return (
    <div className="screen chat-screen">
      {classroom && children.length > 0 && (
        <label className="chat-child-select-row">
          Who is this about?
          <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
            <option value="">General question</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="chat-messages">
        {messages.map((m, i) => {
          const key = m._localId ?? m.id ?? i
          const child = m.childId ? children.find((c) => c.id === m.childId) : null

          return (
            <div key={key} className={`chat-bubble-group chat-bubble-group-${m.role}`}>
              <div className={`chat-bubble chat-bubble-${m.role}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {m.role === 'user' && child && (
                savedNoteKeys.has(key) ? (
                  <span className="chat-note-inline chat-note-inline-saved">Saved as note ✓</span>
                ) : (
                  <button
                    type="button"
                    className="chat-note-inline"
                    onClick={() => handleSaveNote(m)}
                    disabled={savingNoteKey === key}
                  >
                    {savingNoteKey === key ? 'Saving…' : `Save as note about ${child.first_name}`}
                  </button>
                )
              )}
            </div>
          )
        })}
        {sending && <div className="chat-bubble chat-bubble-assistant chat-loading">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="auth-error">{error}</p>}
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a behavior or development question…"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
