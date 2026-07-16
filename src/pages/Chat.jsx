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
  const [conversationStartIndex, setConversationStartIndex] = useState(0)
  const [draftingNote, setDraftingNote] = useState(false)
  const [noteReviewText, setNoteReviewText] = useState(null)
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    async function loadMessages() {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      query = classroom ? query.eq('classroom_id', classroom.id) : query.is('classroom_id', null)

      const { data } = await query

      if (active) {
        setMessages(data ?? [])
        setConversationStartIndex(0)
        setNoteReviewText(null)
        setNoteSaved(false)
        setError('')
      }
    }

    loadMessages()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, classroom?.id])

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

  function handleSelectChild(childId) {
    setSelectedChildId(childId)
    setConversationStartIndex(messages.length)
    setNoteReviewText(null)
    setNoteSaved(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setError('')
    setInput('')
    setSending(true)
    setNoteSaved(false)

    const userMessage = { role: 'user', content, _localId: crypto.randomUUID() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role: 'user', content, classroom_id: classroom?.id ?? null })

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
      .insert({ user_id: user.id, role: 'assistant', content: data.reply, classroom_id: classroom?.id ?? null })

    setSending(false)
  }

  async function handleAddNote() {
    const relevantMessages = messages
      .slice(conversationStartIndex)
      .map(({ role, content }) => ({ role, content }))

    if (relevantMessages.length === 0 || !selectedChildId) return

    setDraftingNote(true)
    setError('')
    setNoteSaved(false)

    const { data, error: fnError } = await supabase.functions.invoke('draft-child-note', {
      body: { childId: selectedChildId, messages: relevantMessages },
    })

    setDraftingNote(false)

    if (fnError || data?.error) {
      setError(fnError?.message || data.error)
      return
    }

    setNoteReviewText(data.draft ?? '')
  }

  async function handleConfirmSaveNote() {
    const note = (noteReviewText ?? '').trim()
    if (!note || !selectedChildId || !classroom) return

    setSavingNote(true)
    setError('')

    const { error: noteError } = await supabase.from('child_notes').insert({
      child_id: selectedChildId,
      classroom_id: classroom.id,
      created_by: user.id,
      note,
      source: 'chat',
    })

    setSavingNote(false)

    if (noteError) {
      setError(noteError.message)
      return
    }

    setNoteReviewText(null)
    setConversationStartIndex(messages.length)
    setNoteSaved(true)
  }

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null
  const hasNewChildConversation =
    !!selectedChildId && messages.length > conversationStartIndex && !sending

  return (
    <div className="screen chat-screen">
      {classroom && children.length > 0 && (
        <label className="chat-child-select-row">
          Who is this about?
          <select value={selectedChildId} onChange={(e) => handleSelectChild(e.target.value)}>
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
        {messages.map((m, i) => (
          <div key={m._localId ?? m.id ?? i} className={`chat-bubble chat-bubble-${m.role}`}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {sending && <div className="chat-bubble chat-bubble-assistant chat-loading">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {selectedChild && noteReviewText !== null && (
        <div className="chat-note-review">
          <label className="classroom-field">
            Review the note before saving (about {selectedChild.first_name})
            <textarea
              className="photo-caption-input"
              value={noteReviewText}
              onChange={(e) => setNoteReviewText(e.target.value)}
              rows={4}
            />
          </label>
          <div className="photo-tag-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmSaveNote}
              disabled={savingNote || !noteReviewText.trim()}
            >
              {savingNote ? 'Saving…' : 'Confirm & save note'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setNoteReviewText(null)}
              disabled={savingNote}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {noteReviewText === null && noteSaved && (
        <p className="photo-saved-message chat-note-saved-message">
          Note saved for {selectedChild?.first_name}.
        </p>
      )}

      {noteReviewText === null && hasNewChildConversation && (
        <button
          type="button"
          className="btn btn-secondary chat-add-note-button"
          onClick={handleAddNote}
          disabled={draftingNote}
        >
          {draftingNote ? 'Drafting note…' : `Add note about ${selectedChild.first_name}`}
        </button>
      )}

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
