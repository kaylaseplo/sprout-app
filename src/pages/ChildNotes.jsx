import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ChildNotes({ child, onBack }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (active) setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('child_notes')
        .select('*')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      setNotes(data ?? [])
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [child.id])

  async function handleDelete(noteId) {
    setDeletingId(noteId)
    setError('')

    const { error: deleteError } = await supabase.from('child_notes').delete().eq('id', noteId)

    setDeletingId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  return (
    <div className="screen child-notes-screen">
      <div className="photo-recent-header">
        <h2 className="screen-title">{child.first_name}'s notes</h2>
        <button type="button" className="btn btn-outline photo-recent-back" onClick={onBack}>
          Back to roster
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="roster-empty">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="roster-empty">No notes saved for {child.first_name} yet.</p>
      ) : (
        <ul className="child-notes-list">
          {notes.map((note) => (
            <li key={note.id} className="child-notes-item">
              <p className="child-notes-text">{note.note}</p>
              <div className="child-notes-meta-row">
                <span className="child-notes-meta">{formatDate(note.created_at)}</span>
                <button
                  type="button"
                  className="roster-remove"
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                >
                  {deletingId === note.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
