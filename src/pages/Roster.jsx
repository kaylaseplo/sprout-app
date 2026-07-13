import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function Roster({ classroom }) {
  const [children, setChildren] = useState([])
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadChildren() {
      if (active) setLoading(true)

      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('first_name', { ascending: true })

      if (active) {
        setChildren(data ?? [])
        setLoading(false)
      }
    }

    loadChildren()

    return () => {
      active = false
    }
  }, [classroom.id])

  async function handleAdd(e) {
    e.preventDefault()
    const name = firstName.trim()
    if (!name) return

    setError('')

    const { data, error } = await supabase
      .from('children')
      .insert({ classroom_id: classroom.id, first_name: name })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setChildren((prev) => [...prev, data].sort((a, b) => a.first_name.localeCompare(b.first_name)))
    setFirstName('')
  }

  async function handleRemove(childId) {
    const { error } = await supabase.from('children').delete().eq('id', childId)

    if (error) {
      setError(error.message)
      return
    }

    setChildren((prev) => prev.filter((c) => c.id !== childId))
  }

  return (
    <div className="roster">
      <h2 className="roster-title">Roster</h2>

      {loading ? (
        <p className="roster-empty">Loading…</p>
      ) : children.length === 0 ? (
        <p className="roster-empty">No children yet. Add one below.</p>
      ) : (
        <ul className="roster-list">
          {children.map((child) => (
            <li key={child.id} className="roster-item">
              <span>{child.first_name}</span>
              <button
                type="button"
                className="roster-remove"
                onClick={() => handleRemove(child.id)}
                aria-label={`Remove ${child.first_name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="auth-error">{error}</p>}

      <form className="roster-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Child's first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <button type="submit" disabled={!firstName.trim()}>
          Add
        </button>
      </form>
    </div>
  )
}
