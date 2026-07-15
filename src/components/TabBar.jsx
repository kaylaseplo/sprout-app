import { ActivityIcon, CameraIcon, ChatIcon, ClassroomIcon } from './icons'

const TABS = [
  { id: 'chat', label: 'Chat', Icon: ChatIcon },
  { id: 'activities', label: 'Activities', Icon: ActivityIcon },
  { id: 'photos', label: 'Photos', Icon: CameraIcon },
  { id: 'classroom', label: 'Classroom', Icon: ClassroomIcon },
]

export function TabBar({ activeTab, onChange }) {
  return (
    <nav className="tab-bar" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`tab-bar-item ${activeTab === id ? 'tab-bar-item-active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
