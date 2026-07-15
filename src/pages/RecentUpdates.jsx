import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SIGNED_URL_EXPIRY_SECONDS = 3600

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RecentUpdates({ classroom, onBack }) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (active) setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('photo_updates')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      const withUrls = await Promise.all(
        (data ?? []).map(async (row) => {
          const { data: signed } = await supabase.storage
            .from('photos')
            .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRY_SECONDS)
          return { ...row, signedUrl: signed?.signedUrl ?? null }
        })
      )

      if (active) {
        setUpdates(withUrls)
        setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [classroom.id])

  return (
    <div className="screen photo-screen">
      <div className="photo-recent-header">
        <h2 className="screen-title">Recent updates</h2>
        <button type="button" className="btn btn-outline photo-recent-back" onClick={onBack}>
          + New photo
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="roster-empty">Loading…</p>
      ) : updates.length === 0 ? (
        <p className="roster-empty">No photo updates saved yet for this classroom.</p>
      ) : (
        <div className="photo-recent-list">
          {updates.map((update) => {
            const taggedNames = Array.isArray(update.tagged_children_json)
              ? update.tagged_children_json.map((c) => c.first_name).filter(Boolean)
              : []

            return (
              <div key={update.id} className="photo-recent-card">
                {update.signedUrl && (
                  <img src={update.signedUrl} alt="" className="photo-recent-image" />
                )}
                {update.caption && <p className="photo-recent-caption">{update.caption}</p>}
                {taggedNames.length > 0 && (
                  <p className="photo-tagged-summary">Tagged: {taggedNames.join(', ')}</p>
                )}
                <p className="photo-recent-meta">{formatDate(update.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
