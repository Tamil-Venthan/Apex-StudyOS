import { create } from 'zustand'

export interface Subject {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  targetDate?: string // ISO date string for SQLite compatibility
  archived: boolean
  modules?: Module[]
}

export interface Module {
  id: string
  subjectId: string
  name: string
  description?: string
  order: number
  topics?: Topic[]
}

export interface Resource {
  id: string
  topicId: string
  title: string
  type: string
  url: string
  thumbnail?: string
}

export interface Topic {
  id: string
  moduleId: string
  name: string
  description?: string
  order: number
  completed: boolean
  isImportant: boolean
  totalDuration?: number
  watchedDuration: number
  resources?: Resource[]
}

interface SubjectStore {
  subjects: Subject[]
  currentSubject: Subject | null
  loading: boolean
  error: string | null

  // Actions
  fetchSubjects: (userId?: string) => Promise<void>
  fetchSubjectById: (id: string) => Promise<void>
  createSubject: (data: Partial<Subject>) => Promise<{ success: boolean }>
  updateSubject: (id: string, data: Partial<Subject>) => Promise<{ success: boolean }>
  deleteSubject: (id: string) => Promise<{ success: boolean }>
  setCurrentSubject: (subject: Subject | null) => void
}

// Temporary user ID (in production, this would come from auth)
const TEMP_USER_ID = 'user-1'

// Helper interfaces for DB responses (where booleans might be 0/1)
interface DBTopic extends Omit<Topic, 'completed' | 'isImportant'> {
  completed: number | boolean
  isImportant: number | boolean
}

interface DBModule extends Omit<Module, 'topics'> {
  topics?: DBTopic[]
}

interface DBSubject extends Omit<Subject, 'archived' | 'modules'> {
  archived: number | boolean
  modules?: DBModule[]
}

const normalizeSubject = (subject: DBSubject): Subject => ({
  ...subject,
  archived: Boolean(subject.archived),
  modules: subject.modules?.map((m) => ({
    ...m,
    topics: m.topics?.map((t) => ({
      ...t,
      completed: Boolean(t.completed),
      isImportant: Boolean(t.isImportant)
    }))
  }))
})

export const useSubjectStore = create<SubjectStore>((set, get) => ({
  subjects: [],
  currentSubject: null,
  loading: false,
  error: null,

  fetchSubjects: async (userId: string = TEMP_USER_ID) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('subjects:getAll', userId)
      if (result.success) {
        // Normalize 0/1 to boolean for potential SQLite inconsistency
        const normalizedSubjects = result.data.map(normalizeSubject)
        console.log('Fetched subjects:', normalizedSubjects)
        set({ subjects: normalizedSubjects, loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      set({ error: 'Failed to fetch subjects', loading: false })
    }
  },

  fetchSubjectById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('subjects:getById', id)
      if (result.success) {
        set({ currentSubject: normalizeSubject(result.data), loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch (error) {
      console.error('Failed to fetch subject:', error)
      set({ error: 'Failed to fetch subject', loading: false })
    }
  },

  createSubject: async (data: Partial<Subject>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('subjects:create', {
        userId: TEMP_USER_ID,
        ...data
      })
      if (result.success) {
        const newSubject = normalizeSubject(result.data)
        set({ subjects: [...get().subjects, newSubject], loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch (error) {
      console.error('Failed to create subject:', error)
      set({ error: 'Failed to create subject', loading: false })
      return { success: false }
    }
  },

  updateSubject: async (id: string, data: Partial<Subject>) => {
    set({ loading: true, error: null })
    try {
      console.log('Updating subject:', id, data)
      const result = await window.electron.ipcRenderer.invoke('subjects:update', id, data)
      if (result.success) {
        const updatedSubject = normalizeSubject(result.data)
        set({
          subjects: get().subjects.map((s) => (s.id === id ? { ...s, ...updatedSubject } : s)),
          loading: false
        })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch (error) {
      console.error('Failed to update subject:', error)
      set({ error: 'Failed to update subject', loading: false })
      return { success: false }
    }
  },

  deleteSubject: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('subjects:delete', id)
      if (result.success) {
        set({
          subjects: get().subjects.filter((s) => s.id !== id),
          loading: false
        })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
      set({ error: 'Failed to delete subject', loading: false })
      return { success: false }
    }
  },

  setCurrentSubject: (subject: Subject | null) => {
    set({ currentSubject: subject })
  }
}))
