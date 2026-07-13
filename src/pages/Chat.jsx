import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/auth-context'

export function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setError('')
    setInput('')
    setSending(true)

    const userMessage = { role: 'user', content }
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
      body: { messages: nextMessages.map(({ role, content }) => ({ role, content })) },
    })

    if (fnError || data?.error) {
      setError(fnError?.message || data.error)
      setSending(false)
      return
    }

    const assistantMessage = { role: 'assistant', content: data.reply }
    setMessages((prev) => [...prev, assistantMessage])

    await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role: 'assistant', content: data.reply })

    setSending(false)
  }

  return (
    <div className="screen chat-screen">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={m.id ?? i} className={`chat-bubble chat-bubble-${m.role}`}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
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
