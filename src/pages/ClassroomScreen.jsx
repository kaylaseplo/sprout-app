import { useState } from 'react'
import { useClassrooms } from '../contexts/classroom-context'
import { Roster } from './Roster'
import { ClassroomIcon } from '../components/icons'

export function ClassroomScreen() {
  const { classrooms, currentClassroom, createClassroom, loading } = useClassrooms()

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
    <div className="screen classroom-panel">
      <h2 className="screen-title">Classroom</h2>

      <div className="classroom-create-card">
        {!showCreate && (
          <button
            type="button"
            className="btn btn-secondary classroom-new-button"
            onClick={() => setShowCreate(true)}
          >
            + New classroom
          </button>
        )}

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
            <div className="classroom-create-form-buttons">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create classroom'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showCreate && classrooms.length === 0 && (
          <p className="classroom-empty">No classrooms yet. Create one to get started.</p>
        )}
      </div>

      {currentClassroom ? (
        <Roster classroom={currentClassroom} />
      ) : (
        classrooms.length > 0 && (
          <div className="screen-empty">
            <ClassroomIcon className="screen-empty-icon" width={40} height={40} />
            <p>Select a classroom above to see its roster.</p>
          </div>
        )
      )}
    </div>
  )
}
