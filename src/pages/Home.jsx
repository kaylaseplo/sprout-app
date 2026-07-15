import { useState } from 'react'
import { useAuth } from '../contexts/auth-context'
import { useClassrooms } from '../contexts/classroom-context'
import { Chat } from './Chat'
import { ActivityGenerator } from './ActivityGenerator'
import { PhotoUpdate } from './PhotoUpdate'
import { ClassroomScreen } from './ClassroomScreen'
import { ClassroomSwitcher } from '../components/ClassroomSwitcher'
import { TabBar } from '../components/TabBar'
import { LogoutIcon, ActivityIcon, CameraIcon } from '../components/icons'

export function Home() {
  const { signOut } = useAuth()
  const { currentClassroom } = useClassrooms()
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">Sprout</span>
        <div className="app-header-actions">
          <ClassroomSwitcher />
          <button
            type="button"
            className="icon-button"
            onClick={() => signOut()}
            aria-label="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'chat' && <Chat />}

        {activeTab === 'activities' &&
          (currentClassroom ? (
            <ActivityGenerator key={currentClassroom.id} classroom={currentClassroom} />
          ) : (
            <div className="screen-empty">
              <ActivityIcon className="screen-empty-icon" width={40} height={40} />
              <p>Create or select a classroom to generate activities.</p>
            </div>
          ))}

        {activeTab === 'photos' &&
          (currentClassroom ? (
            <PhotoUpdate key={currentClassroom.id} classroom={currentClassroom} />
          ) : (
            <div className="screen-empty">
              <CameraIcon className="screen-empty-icon" width={40} height={40} />
              <p>Create or select a classroom to add a photo update.</p>
            </div>
          ))}

        {activeTab === 'classroom' && <ClassroomScreen />}
      </main>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}
