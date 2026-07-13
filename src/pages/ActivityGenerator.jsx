import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/auth-context'

const ENERGY_LEVELS = ['Low', 'Medium', 'High']
const SETTINGS = ['Indoor', 'Outdoor']
const RATINGS = [1, 2, 3, 4, 5]

export function ActivityGenerator({ classroom }) {
  const { user } = useAuth()
  const [energyLevel, setEnergyLevel] = useState('Medium')
  const [timeAvailable, setTimeAvailable] = useState('')
  const [setting, setSetting] = useState('Indoor')
  const [supplies, setSupplies] = useState('')
  const [theme, setTheme] = useState('')
  const [activities, setActivities] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setGenerating(true)
    setActivities([])

    const { data: recent } = await supabase
      .from('activities')
      .select('output_json, created_at')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false })
      .limit(15)

    const recentTitles = (recent ?? [])
      .map((row) => row.output_json?.title)
      .filter(Boolean)

    const inputs = {
      ageGroup: classroom.age_group,
      energyLevel,
      timeAvailable,
      setting,
      supplies,
      theme,
    }

    const { data, error: fnError } = await supabase.functions.invoke('generate-activities', {
      body: { ...inputs, recentTitles },
    })

    if (fnError || data?.error) {
      setError(fnError?.message || data.error)
      setGenerating(false)
      return
    }

    const generated = data.activities ?? []

    const rows = generated.map((activity) => ({
      classroom_id: classroom.id,
      created_by: user.id,
      inputs_json: inputs,
      output_json: activity,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('activities')
      .insert(rows)
      .select()

    if (insertError) {
      setError(insertError.message)
      setGenerating(false)
      return
    }

    setActivities(inserted)
    setGenerating(false)
  }

  async function handleRate(activityId, rating) {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, rating } : a))
    )

    await supabase.from('activities').update({ rating }).eq('id', activityId)
  }

  return (
    <div className="activity-generator">
      <h2 className="activity-title">Activity Generator</h2>

      <form className="activity-form" onSubmit={handleGenerate}>
        <label className="classroom-field">
          Energy level
          <select value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)}>
            {ENERGY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="classroom-field">
          Time available
          <input
            type="text"
            placeholder="e.g. 20 minutes"
            value={timeAvailable}
            onChange={(e) => setTimeAvailable(e.target.value)}
            required
          />
        </label>

        <label className="classroom-field">
          Setting
          <select value={setting} onChange={(e) => setSetting(e.target.value)}>
            {SETTINGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="classroom-field">
          Supplies on hand
          <input
            type="text"
            placeholder="e.g. crayons, blocks, paper"
            value={supplies}
            onChange={(e) => setSupplies(e.target.value)}
          />
        </label>

        <label className="classroom-field">
          This week's theme (optional)
          <input
            type="text"
            placeholder="e.g. Ocean animals"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={generating}>
          {generating ? 'Generating…' : 'Generate activities'}
        </button>
      </form>

      {activities.length > 0 && (
        <div className="activity-cards">
          {activities.map((activity) => {
            const { title, description, materials, duration_minutes } = activity.output_json ?? {}
            return (
              <div key={activity.id} className="activity-card">
                <h3 className="activity-card-title">{title}</h3>
                {duration_minutes && (
                  <p className="activity-card-meta">{duration_minutes} min</p>
                )}
                <p className="activity-card-description">{description}</p>
                {Array.isArray(materials) && materials.length > 0 && (
                  <ul className="activity-card-materials">
                    {materials.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
                <div className="activity-rating">
                  {RATINGS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`activity-rating-star ${
                        activity.rating >= n ? 'activity-rating-star-active' : ''
                      }`}
                      onClick={() => handleRate(activity.id, n)}
                      aria-label={`Rate ${n} out of 5`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
