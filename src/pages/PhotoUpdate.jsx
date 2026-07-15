import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resizeImage } from '../lib/image'
import { useAuth } from '../contexts/auth-context'
import { CameraIcon, MicIcon } from '../components/icons'
import { RecentUpdates } from './RecentUpdates'

const SpeechRecognitionApi =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export function PhotoUpdate({ classroom }) {
  const { user } = useAuth()
  const [view, setView] = useState('new')
  const [step, setStep] = useState('capture')
  const [children, setChildren] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [taggedIds, setTaggedIds] = useState(new Set())
  const [listening, setListening] = useState(false)
  const [caption, setCaption] = useState('')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('children')
      .select('*')
      .eq('classroom_id', classroom.id)
      .order('first_name', { ascending: true })
      .then(({ data }) => setChildren(data ?? []))
  }, [classroom.id])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleCapture(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setError('')

    try {
      const resized = await resizeImage(file)
      setPhoto(resized)
      setPreviewUrl(URL.createObjectURL(resized.blob))
      setTaggedIds(new Set())
      setStep('tag')
    } catch {
      setError('Could not process that photo. Try again.')
    }
  }

  function toggleChild(childId) {
    setTaggedIds((prev) => {
      const next = new Set(prev)
      if (next.has(childId)) {
        next.delete(childId)
      } else {
        next.add(childId)
      }
      return next
    })
  }

  function handleListen() {
    if (!SpeechRecognitionApi) return

    const recognition = new SpeechRecognitionApi()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      setTaggedIds((prev) => {
        const next = new Set(prev)
        children.forEach((child) => {
          if (transcript.includes(child.first_name.toLowerCase())) {
            next.add(child.id)
          }
        })
        return next
      })
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    setListening(true)
    recognition.start()
  }

  async function handleContinueToReview() {
    setGeneratingCaption(true)
    setError('')

    const taggedNames = children
      .filter((c) => taggedIds.has(c.id))
      .map((c) => c.first_name)

    const { data, error: fnError } = await supabase.functions.invoke('draft-caption', {
      body: { imageBase64: photo.base64, mediaType: photo.mediaType, childrenNames: taggedNames },
    })

    setGeneratingCaption(false)

    if (fnError || data?.error) {
      setError(fnError?.message || data.error)
      setCaption('')
      setStep('review')
      return
    }

    setCaption(data.caption ?? '')
    setStep('review')
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const taggedNames = children
      .filter((c) => taggedIds.has(c.id))
      .map((c) => ({ id: c.id, first_name: c.first_name }))

    const storagePath = `${classroom.id}/${crypto.randomUUID()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, photo.blob, { contentType: photo.mediaType })

    if (uploadError) {
      setSaving(false)
      setError(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from('photo_updates').insert({
      classroom_id: classroom.id,
      created_by: user.id,
      storage_path: storagePath,
      caption,
      tagged_children_json: taggedNames,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setStep('capture')
      setPhoto(null)
      setPreviewUrl(null)
      setTaggedIds(new Set())
      setCaption('')
    }, 1500)
  }

  function handleRetake() {
    setStep('capture')
    setPhoto(null)
    setPreviewUrl(null)
    setTaggedIds(new Set())
    setCaption('')
    setError('')
  }

  if (view === 'recent') {
    return <RecentUpdates classroom={classroom} onBack={() => setView('new')} />
  }

  if (step === 'capture') {
    return (
      <div className="screen photo-screen">
        <div className="photo-recent-header">
          <h2 className="screen-title">Photo Update</h2>
          <button
            type="button"
            className="btn btn-outline photo-recent-back"
            onClick={() => setView('recent')}
          >
            Recent updates
          </button>
        </div>
        <div className="photo-capture-card">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            id="photoCaptureInput"
            className="photo-capture-input"
          />
          <label htmlFor="photoCaptureInput" className="btn btn-primary photo-capture-button">
            <CameraIcon />
            Snap a photo
          </label>
          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>
    )
  }

  if (step === 'tag') {
    const taggedNames = children.filter((c) => taggedIds.has(c.id)).map((c) => c.first_name)

    return (
      <div className="screen photo-screen">
        <h2 className="screen-title">Tag children</h2>

        {previewUrl && <img src={previewUrl} alt="Captured" className="photo-preview" />}

        {SpeechRecognitionApi && (
          <button
            type="button"
            className={`btn btn-secondary photo-voice-button ${listening ? 'photo-voice-button-active' : ''}`}
            onClick={handleListen}
            disabled={listening}
          >
            <MicIcon />
            {listening ? 'Listening…' : 'Say the names'}
          </button>
        )}

        {children.length === 0 ? (
          <p className="roster-empty">No children in this classroom's roster yet.</p>
        ) : (
          <div className="photo-roster-grid">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                className={`photo-roster-button ${
                  taggedIds.has(child.id) ? 'photo-roster-button-active' : ''
                }`}
                onClick={() => toggleChild(child.id)}
              >
                {child.first_name}
              </button>
            ))}
          </div>
        )}

        {taggedNames.length > 0 && (
          <p className="photo-tagged-summary">Tagged: {taggedNames.join(', ')}</p>
        )}

        {error && <p className="auth-error">{error}</p>}

        <div className="photo-tag-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleContinueToReview}
            disabled={generatingCaption}
          >
            {generatingCaption ? 'Drafting caption…' : 'Continue'}
          </button>
          <button type="button" className="btn btn-outline" onClick={handleRetake}>
            Retake
          </button>
        </div>
      </div>
    )
  }

  const taggedNames = children.filter((c) => taggedIds.has(c.id)).map((c) => c.first_name)

  return (
    <div className="screen photo-screen">
      <h2 className="screen-title">Review &amp; save</h2>

      {previewUrl && <img src={previewUrl} alt="Captured" className="photo-preview" />}

      {taggedNames.length > 0 && (
        <p className="photo-tagged-summary">Tagged: {taggedNames.join(', ')}</p>
      )}

      <label className="classroom-field">
        Caption
        <textarea
          className="photo-caption-input"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
        />
      </label>

      {error && <p className="auth-error">{error}</p>}
      {saved && <p className="photo-saved-message">Saved!</p>}

      <div className="photo-tag-actions">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleRetake} disabled={saving}>
          Retake
        </button>
      </div>
    </div>
  )
}
