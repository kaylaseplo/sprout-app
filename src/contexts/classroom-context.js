import { createContext, useContext } from 'react'

export const ClassroomContext = createContext(undefined)

export function useClassrooms() {
  const context = useContext(ClassroomContext)
  if (context === undefined) {
    throw new Error('useClassrooms must be used within a ClassroomProvider')
  }
  return context
}
