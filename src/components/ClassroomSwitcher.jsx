import { useClassrooms } from '../contexts/classroom-context'

export function ClassroomSwitcher() {
  const { classrooms, currentClassroomId, setCurrentClassroomId } = useClassrooms()

  if (classrooms.length === 0) return null

  return (
    <select
      className="classroom-select"
      value={currentClassroomId ?? ''}
      onChange={(e) => setCurrentClassroomId(e.target.value)}
      aria-label="Select classroom"
    >
      {classrooms.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.age_group})
        </option>
      ))}
    </select>
  )
}
