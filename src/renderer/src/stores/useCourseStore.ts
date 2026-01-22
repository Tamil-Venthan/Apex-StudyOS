import { create } from 'zustand'

export interface Course {
  id: string
  userId: string
  name: string
  platform?: string
  instructor?: string
  totalClasses: number
  attendedClasses: number
  description?: string
  thumbnail?: string
  color: string
  startDate?: Date
  endDate?: Date
  batches?: Batch[]
  classes?: Class[]
}

export interface Batch {
  id: string
  courseId: string
  name: string
  description?: string
  startDate?: Date
  endDate?: Date
  classes?: Class[]
}

export interface Class {
  id: string
  courseId: string
  batchId?: string
  title: string
  description?: string
  type: string // 'live', 'recorded', 'doubt_session'
  status: string // 'pending', 'attended', 'missed', 'partially_watched'
  scheduledAt?: Date | null
  attendedAt?: Date | null
  videoUrl?: string
  thumbnail?: string
  duration?: number
  watchedDuration: number
  completionPercentage: number
  classNotes?: string
  order: number
  isImportant: boolean
  tags: string
  createdAt: Date
  updatedAt: Date
}

interface CourseStore {
  courses: Course[]
  currentCourse: Course | null
  loading: boolean
  error: string | null

  // Actions
  fetchCourses: (userId?: string) => Promise<void>
  fetchCourseById: (id: string) => Promise<void>
  createCourse: (data: Partial<Course>) => Promise<{ success: boolean }>
  updateCourse: (id: string, data: Partial<Course>) => Promise<{ success: boolean }>
  deleteCourse: (id: string) => Promise<{ success: boolean }>
  setCurrentCourse: (course: Course | null) => void

  // Class actions
  createClass: (data: Partial<Class>) => Promise<{ success: boolean }>
  updateClass: (id: string, data: Partial<Class>) => Promise<{ success: boolean }>
  deleteClass: (id: string) => Promise<{ success: boolean }>
  markClassAttended: (id: string) => Promise<{ success: boolean }>
  markClassPending: (id: string) => Promise<{ success: boolean }>
}

// Temporary user ID
const TEMP_USER_ID = 'user-1'

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,

  fetchCourses: async (userId: string = TEMP_USER_ID) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('courses:getAll', userId)
      if (result.success) {
        set({ courses: result.data, loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch {
      set({ error: 'Failed to fetch courses', loading: false })
    }
  },

  fetchCourseById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('courses:getById', id)
      if (result.success) {
        set({ currentCourse: result.data, loading: false })
      } else {
        set({ error: result.error, loading: false })
      }
    } catch {
      set({ error: 'Failed to fetch course', loading: false })
    }
  },

  createCourse: async (data: Partial<Course>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('courses:create', {
        userId: TEMP_USER_ID,
        ...data
      })
      if (result.success) {
        set({ courses: [result.data, ...get().courses], loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to create course', loading: false })
      return { success: false }
    }
  },

  updateCourse: async (id: string, data: Partial<Course>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('courses:update', id, data)
      if (result.success) {
        set({
          courses: get().courses.map((c) => (c.id === id ? { ...c, ...result.data } : c)),
          loading: false
        })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to update course', loading: false })
      return { success: false }
    }
  },

  deleteCourse: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('courses:delete', id)
      if (result.success) {
        set({
          courses: get().courses.filter((c) => c.id !== id),
          loading: false
        })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to delete course', loading: false })
      return { success: false }
    }
  },

  setCurrentCourse: (course: Course | null) => {
    set({ currentCourse: course })
  },

  createClass: async (data: Partial<Class>) => {
    set({ loading: true, error: null })
    try {
      // Convert Date objects to ISO strings for IPC serialization
      // Handle various date formats: Date objects, date strings, or undefined
      let scheduledAtStr: string | undefined = undefined
      if (data.scheduledAt) {
        if (data.scheduledAt instanceof Date) {
          scheduledAtStr = data.scheduledAt.toISOString()
        } else if (typeof data.scheduledAt === 'string') {
          // Already a string, ensure it's a valid ISO string
          const parsed = new Date(data.scheduledAt)
          if (!isNaN(parsed.getTime())) {
            scheduledAtStr = parsed.toISOString()
          }
        } else if (typeof data.scheduledAt === 'object' && data.scheduledAt !== null) {
          // Handle Date-like objects (from different JS contexts)
          const dateValue = new Date(data.scheduledAt as unknown as string | number)
          if (!isNaN(dateValue.getTime())) {
            scheduledAtStr = dateValue.toISOString()
          }
        }
      }

      const ipcData = {
        ...data,
        scheduledAt: scheduledAtStr
      }

      const result = await window.electron.ipcRenderer.invoke('classes:create', ipcData)
      if (result.success) {
        // Refresh current course to get updated classes
        if (get().currentCourse?.id === data.courseId) {
          await get().fetchCourseById(data.courseId!)
        }
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to create class', loading: false })
      return { success: false }
    }
  },

  updateClass: async (id: string, data: Partial<Class>) => {
    set({ loading: true, error: null })
    try {
      // Serialize Date objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ipcData: any = { ...data }

      if (data.attendedAt) {
        if (data.attendedAt instanceof Date) {
          ipcData.attendedAt = data.attendedAt.toISOString()
        } else if (typeof data.attendedAt === 'string') {
          // Ensure it is a valid date string if needed, or leave as is if IPC handles ISO strings
          // verification logic similar to createClass could go here but let's keep it simple for now
        }
      }

      if (data.scheduledAt) {
        if (data.scheduledAt instanceof Date) {
          ipcData.scheduledAt = data.scheduledAt.toISOString()
        }
      }

      const result = await window.electron.ipcRenderer.invoke('classes:update', id, ipcData)
      if (result.success) {
        // Refresh current course
        if (get().currentCourse) {
          await get().fetchCourseById(get().currentCourse!.id)
        }
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to update class', loading: false })
      return { success: false }
    }
  },

  deleteClass: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('classes:delete', id)
      if (result.success) {
        // Refresh current course
        if (get().currentCourse) {
          await get().fetchCourseById(get().currentCourse!.id)
        }
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to delete class', loading: false })
      return { success: false }
    }
  },

  markClassAttended: async (id: string) => {
    return await get().updateClass(id, {
      status: 'attended',
      attendedAt: new Date()
    })
  },

  markClassPending: async (id: string) => {
    return await get().updateClass(id, {
      status: 'pending',
      attendedAt: null
    })
  }
}))
