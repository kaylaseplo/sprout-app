import { useState } from 'react'
import { useClassrooms } from '../contexts/classroom-context'
import { Roster } from './Roster'

export function ClassroomPanel() {
  const {
    classrooms,
    currentClassroomId,
    currentClassroom,
    setCurrentClassroomId,
    createClassroom,
    loading,
  } = useClassrooms()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await createClassroom(name.trim(), ageGroup.trim())

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setAgeGroup('')
    setShowCreate(false)
  }

  if (loading) return null

  return (
    <div className="classroom-panel">
      <div className="classroom-switcher-row">
        {classrooms.length > 0 && (
          <select
            className="classroom-select"
            value={currentClassroomId ?? ''}
            onChange={(e) => setCurrentClassroomId(e.target.value)}
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.age_group})
              </option>
            ))}
          </select>
        )}
        {!showCreate && (
          <button
            type="button"
            className="classroom-new-button"
            onClick={() => setShowCreate(true)}
          >
            + New classroom
          </button>
        )}
      </div>

      {showCreate && (
        <form className="classroom-create-form" onSubmit={handleCreate}>
          <label className="classroom-field">
            Classroom name
            <input
              type="text"
              placeholder="e.g. Lions Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="classroom-field">
            Age group
            <input
              type="text"
              placeholder="e.g. 2-3"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create classroom'}
          </button>
          <button
            type="button"
            className="classroom-cancel-button"
            onClick={() => setShowCreate(false)}
            disabled={submitting}
          >
            Cancel
          </button>
        </form>
      )}

      {!showCreate && classrooms.length === 0 && (
        <p className="classroom-empty">No classrooms yet. Create one to get started.</p>
      )}

      {currentClassroom && <Roster classroom={currentClassroom} />}
    </div>
  )
}
