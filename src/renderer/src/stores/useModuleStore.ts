import { create } from 'zustand'

interface Module {
  id: string
  subjectId: string
  name: string
  description?: string
  order: number
  topics?: Topic[]
}

interface Topic {
  id: string
  moduleId: string
  name: string
  description?: string
  order: number
  completed: boolean
  isImportant: boolean
  totalDuration?: number
  watchedDuration: number
}

interface ModuleStore {
  loading: boolean
  error: string | null

  // Actions
  createModule: (data: Partial<Module>) => Promise<{ success: boolean }>
  updateModule: (id: string, data: Partial<Module>) => Promise<{ success: boolean }>
  deleteModule: (id: string) => Promise<{ success: boolean }>

  // Topic actions
  createTopic: (data: Partial<Topic>) => Promise<{ success: boolean }>
  updateTopic: (id: string, data: Partial<Topic>) => Promise<{ success: boolean }>
  deleteTopic: (id: string) => Promise<{ success: boolean }>
}

export const useModuleStore = create<ModuleStore>((set) => ({
  loading: false,
  error: null,

  createModule: async (data: Partial<Module>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('modules:create', data)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to create module', loading: false })
      return { success: false }
    }
  },

  updateModule: async (id: string, data: Partial<Module>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('modules:update', id, data)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to update module', loading: false })
      return { success: false }
    }
  },

  deleteModule: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('modules:delete', id)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to delete module', loading: false })
      return { success: false }
    }
  },

  createTopic: async (data: Partial<Topic>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('topics:create', data)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to create topic', loading: false })
      return { success: false }
    }
  },

  updateTopic: async (id: string, data: Partial<Topic>) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('topics:update', id, data)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to update topic', loading: false })
      return { success: false }
    }
  },

  deleteTopic: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electron.ipcRenderer.invoke('topics:delete', id)
      if (result.success) {
        set({ loading: false })
        return { success: true }
      } else {
        set({ error: result.error, loading: false })
        return { success: false }
      }
    } catch {
      set({ error: 'Failed to delete topic', loading: false })
      return { success: false }
    }
  }
}))
