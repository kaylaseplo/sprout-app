import { useAuth } from '../contexts/auth-context'
import { Chat } from './Chat'

export function Home() {
  const { profile, user, signOut } = useAuth()

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Sprout</h1>
        <button type="button" onClick={() => signOut()}>
          Log out
        </button>
      </header>
      <p>Welcome, {profile?.full_name || user?.email}.</p>
      <Chat />
    </div>
  )
}
