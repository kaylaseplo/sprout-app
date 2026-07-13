import { useAuth } from '../contexts/auth-context'
import { useClassrooms } from '../contexts/classroom-context'
import { Chat } from './Chat'
import { ClassroomPanel } from './ClassroomPanel'
import { ActivityGenerator } from './ActivityGenerator'

export function Home() {
  const { profile, user, signOut } = useAuth()
  const { currentClassroom } = useClassrooms()

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Sprout</h1>
        <button type="button" onClick={() => signOut()}>
          Log out
        </button>
      </header>
      <p>Welcome, {profile?.full_name || user?.email}.</p>
      <ClassroomPanel />
      {currentClassroom && (
        <ActivityGenerator key={currentClassroom.id} classroom={currentClassroom} />
      )}
      <Chat />
    </div>
  )
}
