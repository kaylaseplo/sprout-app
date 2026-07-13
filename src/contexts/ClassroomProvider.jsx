import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth-context'
import { ClassroomContext } from './classroom-context'

export function ClassroomProvider({ children }) {
  const { user } = useAuth()
  const [classrooms, setClassrooms] = useState([])
  const [currentClassroomId, setCurrentClassroomId] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadClassrooms() {
    const { data, error } = await supabase
      .from('classroom_members')
      .select('classrooms(id, name, age_group, director_id, created_at)')
      .eq('user_id', user.id)

    if (error) {
      setLoading(false)
      return
    }

    const rooms = (data ?? []).map((row) => row.classrooms).filter(Boolean)
    setClassrooms(rooms)
    setCurrentClassroomId((prev) =>
      prev && rooms.some((r) => r.id === prev) ? prev : rooms[0]?.id ?? null
    )
    setLoading(false)
  }

  useEffect(() => {
    let active = true

    async function run() {
      if (!user) {
        await Promise.resolve()
        if (active) {
          setClassrooms([])
          setCurrentClassroomId(null)
          setLoading(false)
        }
        return
      }

      if (active) setLoading(true)
      await loadClassrooms()
    }

    run()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function createClassroom(name, ageGroup) {
    const insertPayload = { name, age_group: ageGroup, director_id: user.id }
    console.log('createClassroom: user.id =', user.id)
    console.log('createClassroom: insert payload =', insertPayload)

    const { data: classroom, error } = await supabase
      .from('classrooms')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.log('createClassroom: insert error =', error)
      return { error }
    }

    // A trigger auto-inserts the classroom_members row for the creator.
    await loadClassrooms()
    setCurrentClassroomId(classroom.id)
    return { data: classroom }
  }

  const value = {
    classrooms,
    currentClassroomId,
    currentClassroom: classrooms.find((c) => c.id === currentClassroomId) ?? null,
    setCurrentClassroomId,
    createClassroom,
    loading,
  }

  return (
    <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>
  )
}
