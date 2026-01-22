import { ipcMain } from 'electron'
import { findOne, findMany, execute, transaction } from './db'
import { v4 as uuidv4 } from 'uuid'

// ========== INTERFACES ==========

interface Resource {
  id: string
  topicId: string
  title: string
  type: string
  url: string
  thumbnail?: string
  duration?: number
  metadata?: string
  createdAt: string
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
  resources?: Resource[]
  createdAt?: string
}

interface Module {
  id: string
  subjectId: string
  name: string
  description?: string
  order: number
  topics?: Topic[]
  createdAt?: string
}

interface Subject {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  icon?: string
  targetDate?: string
  archived: number // SQLite stores boolean as 0/1
  modules?: Module[]
  createdAt?: string
}

interface Class {
  id: string
  courseId: string
  batchId?: string
  title: string
  description?: string
  type: string
  scheduledAt?: string
  videoUrl?: string
  duration?: number
  order: number
  status: string
  watchedDuration: number
  completionPercentage: number
  isImportant: boolean
  createdAt: string
  updatedAt: string
}

interface Batch {
  id: string
  courseId: string
  name: string
  startDate: string
  endDate: string
}

interface StudySession {
  id: string
  userId: string
  subjectId?: string
  startTime: string
  sessionType: string
  duration: number
  notes?: string
  focusScore?: number
  endTime?: string
  createdAt: string
}

interface BackupData {
  version: number
  timestamp: string
  subjects: Subject[]
  modules: Module[]
  topics: Topic[]
  resources: Resource[]
  studySessions: StudySession[]
  courses: Course[]
  classes: Class[]
  batches: Batch[]
}

interface Course {
  id: string
  userId: string
  name: string
  platform?: string
  instructor?: string
  description?: string
  color: string
  totalClasses: number
  attendedClasses: number
  createdAt: string
  classes?: Class[]
  batches?: Batch[]
}

// ========== SUBJECT OPERATIONS ==========

// Get all subjects for a user
ipcMain.handle('subjects:getAll', async (_, userId: string) => {
  try {
    const subjects = findMany<Subject>(
      `
      SELECT s.*, 
        (SELECT COUNT(*) FROM Module WHERE subjectId = s.id) as moduleCount
      FROM Subject s
      WHERE s.userId = ?
      ORDER BY s.createdAt DESC
    `,
      [userId]
    )

    // Get modules and topics for each subject

    // ... existing code ...

    const enrichedSubjects = subjects.map((subject: Subject) => {
      const modules = findMany<Module>(
        `
        SELECT m.*,
          (SELECT COUNT(*) FROM Topic WHERE moduleId = m.id) as topicCount
        FROM Module m
        WHERE m.subjectId = ?
        ORDER BY m."order" ASC
      `,
        [subject.id]
      )

      const modulesWithTopics = modules.map((module: Module) => ({
        ...module,
        topics: findMany<Topic>(
          `
          SELECT * FROM Topic WHERE moduleId = ? ORDER BY "order" ASC
        `,
          [module.id]
        )
      }))

      return { ...subject, modules: modulesWithTopics }
    })

    return { success: true, data: enrichedSubjects }
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return { success: false, error: 'Failed to fetch subjects' }
  }
})

// Create a new subject
ipcMain.handle(
  'subjects:create',
  async (
    _,
    data: {
      userId: string
      name: string
      description?: string
      color?: string
      icon?: string
      targetDate?: string
    }
  ) => {
    try {
      const id = uuidv4()
      const params = [
        id,
        data.userId,
        data.name,
        data.description || null,
        data.color || '#3B82F6',
        data.icon || null,
        data.targetDate || null,
        new Date().toISOString()
      ]

      execute(
        `INSERT INTO Subject (id, userId, name, description, color, icon, targetDate, archived, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        params
      )

      const subject = findOne('SELECT * FROM Subject WHERE id = ?', [id])

      return { success: true, data: subject }
    } catch (error) {
      console.error('Error creating subject:', error)
      return { success: false, error: 'Failed to create subject' }
    }
  }
)

// Update a subject
ipcMain.handle(
  'subjects:update',
  async (
    _,
    id: string,
    data: {
      name?: string
      description?: string
      color?: string
      icon?: string
      targetDate?: string
      archived?: boolean
    }
  ) => {
    try {
      const updates: string[] = []
      const values: (string | number | boolean | null | undefined)[] = []

      if (data.name !== undefined) {
        updates.push('name = ?')
        values.push(data.name)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.color !== undefined) {
        updates.push('color = ?')
        values.push(data.color)
      }
      if (data.icon !== undefined) {
        updates.push('icon = ?')
        values.push(data.icon)
      }
      if (data.targetDate !== undefined) {
        updates.push('targetDate = ?')
        values.push(data.targetDate)
      }
      if (data.archived !== undefined) {
        updates.push('archived = ?')
        values.push(data.archived ? 1 : 0)
      }

      values.push(id)
      execute(`UPDATE Subject SET ${updates.join(', ')} WHERE id = ?`, values)

      const subject = findOne('SELECT * FROM Subject WHERE id = ?', [id])
      return { success: true, data: subject }
    } catch (error) {
      console.error('Error updating subject:', error)
      return { success: false, error: 'Failed to update subject' }
    }
  }
)

// Delete a subject
ipcMain.handle('subjects:delete', async (_, id: string) => {
  try {
    execute('DELETE FROM Subject WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    console.error('Error deleting subject:', error)
    return { success: false, error: 'Failed to delete subject' }
  }
})

// Get a single subject with full details
ipcMain.handle('subjects:getById', async (_, id: string) => {
  try {
    const subject = findOne<Subject>('SELECT * FROM Subject WHERE id = ?', [id])
    if (!subject) {
      return { success: false, error: 'Subject not found' }
    }

    const modules = findMany<Module>(
      `
      SELECT * FROM Module WHERE subjectId = ? ORDER BY \`order\` ASC
    `,
      [id]
    )

    let totalTopics = 0
    let completedTopics = 0

    const modulesWithTopics = modules.map((module: Module) => {
      const topics = findMany<Topic>(
        `
        SELECT * FROM Topic WHERE moduleId = ? ORDER BY \`order\` ASC
      `,
        [module.id]
      )

      totalTopics += topics.length
      completedTopics += topics.filter((t) => t.completed).length

      const topicsWithResources = topics.map((topic: Topic) => ({
        ...topic,
        resources: findMany<Resource>('SELECT * FROM Resource WHERE topicId = ?', [topic.id])
      }))

      return { ...module, topics: topicsWithResources }
    })

    return {
      success: true,
      data: { ...subject, modules: modulesWithTopics, totalTopics, completedTopics }
    }
  } catch (error) {
    console.error('Error fetching subject:', error)
    return { success: false, error: 'Failed to fetch subject' }
  }
})

// ========== MODULE OPERATIONS ==========

// Create a module
ipcMain.handle(
  'modules:create',
  async (
    _,
    data: {
      subjectId: string
      name: string
      description?: string
      order: number
    }
  ) => {
    try {
      const id = uuidv4()
      execute(
        `INSERT INTO Module (id, subjectId, name, description, \`order\`, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.subjectId,
          data.name,
          data.description || null,
          data.order,
          new Date().toISOString()
        ]
      )
      const module = findOne<Module>('SELECT * FROM Module WHERE id = ?', [id])
      return { success: true, data: module }
    } catch (error) {
      console.error('Error creating module:', error)
      return { success: false, error: 'Failed to create module' }
    }
  }
)

// Update a module
ipcMain.handle(
  'modules:update',
  async (
    _,
    id: string,
    data: {
      name?: string
      description?: string
      order?: number
    }
  ) => {
    try {
      const updates: string[] = []
      const values: (string | number | boolean | null | undefined)[] = []

      if (data.name !== undefined) {
        updates.push('name = ?')
        values.push(data.name)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.order !== undefined) {
        updates.push('"order" = ?')
        values.push(data.order)
      }

      values.push(id)
      execute(`UPDATE Module SET ${updates.join(', ')} WHERE id = ?`, values)

      const module = findOne<Module>('SELECT * FROM Module WHERE id = ?', [id])
      return { success: true, data: module }
    } catch (error) {
      console.error('Error updating module:', error)
      return { success: false, error: 'Failed to update module' }
    }
  }
)

// Delete a module
ipcMain.handle('modules:delete', async (_, id: string) => {
  try {
    execute('DELETE FROM Module WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    console.error('Error deleting module:', error)
    return { success: false, error: 'Failed to delete module' }
  }
})

// Bulk import modules with topics
ipcMain.handle(
  'modules:bulkImport',
  async (
    _,
    data: {
      subjectId: string
      modules: Array<{
        name: string
        description?: string
        topics?: Array<{
          name: string
          description?: string
        }>
      }>
      startOrder: number
    }
  ) => {
    try {
      const results: Module[] = []
      let moduleOrder = data.startOrder

      for (const moduleData of data.modules) {
        const moduleId = uuidv4()
        execute(
          `INSERT INTO Module (id, subjectId, name, description, \`order\`, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            moduleId,
            data.subjectId,
            moduleData.name,
            moduleData.description || null,
            moduleOrder++,
            new Date().toISOString()
          ]
        )

        const module = findOne<Module>('SELECT * FROM Module WHERE id = ?', [moduleId])

        // Create topics for this module if any
        const topics: Topic[] = []
        if (moduleData.topics && moduleData.topics.length > 0) {
          let topicOrder = 1
          for (const topicData of moduleData.topics) {
            const topicId = uuidv4()
            execute(
              `INSERT INTO Topic (id, moduleId, name, description, "order", completed, isImportant, totalDuration, watchedDuration, createdAt)
               VALUES (?, ?, ?, ?, ?, 0, 0, null, 0, ?)`,
              [
                topicId,
                moduleId,
                topicData.name,
                topicData.description || null,
                topicOrder++,
                new Date().toISOString()
              ]
            )
            const topic = findOne<Topic>('SELECT * FROM Topic WHERE id = ?', [topicId])
            if (topic) topics.push(topic)
          }
        }

        if (module) {
          results.push({ ...module, topics })
        }
      }

      return { success: true, data: results }
    } catch (error) {
      console.error('Error bulk importing modules:', error)
      return { success: false, error: 'Failed to bulk import modules' }
    }
  }
)

// ========== TOPIC OPERATIONS ==========

// Create a topic
ipcMain.handle(
  'topics:create',
  async (
    _,
    data: {
      moduleId: string
      name: string
      description?: string
      order: number
      totalDuration?: number
      isImportant?: boolean
    }
  ) => {
    try {
      const id = uuidv4()
      execute(
        `INSERT INTO Topic (id, moduleId, name, description, "order", completed, isImportant, totalDuration, watchedDuration, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?)`,
        [
          id,
          data.moduleId,
          data.name,
          data.description || null,
          data.order,
          data.isImportant ? 1 : 0,
          data.totalDuration || null,
          new Date().toISOString()
        ]
      )
      const topic = findOne<Topic>('SELECT * FROM Topic WHERE id = ?', [id])
      return { success: true, data: topic }
    } catch (error) {
      console.error('Error creating topic:', error)
      return { success: false, error: 'Failed to create topic' }
    }
  }
)

// Update a topic
ipcMain.handle(
  'topics:update',
  async (
    _,
    id: string,
    data: {
      name?: string
      description?: string
      completed?: boolean
      isImportant?: boolean
      watchedDuration?: number
      order?: number
    }
  ) => {
    try {
      const updates: string[] = []
      const values: (string | number | boolean | null | undefined)[] = []

      if (data.name !== undefined) {
        updates.push('name = ?')
        values.push(data.name)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.completed !== undefined) {
        updates.push('completed = ?')
        values.push(data.completed ? 1 : 0)
      }
      if (data.isImportant !== undefined) {
        updates.push('isImportant = ?')
        values.push(data.isImportant ? 1 : 0)
      }
      if (data.watchedDuration !== undefined) {
        updates.push('watchedDuration = ?')
        values.push(data.watchedDuration)
      }
      if (data.order !== undefined) {
        updates.push('"order" = ?')
        values.push(data.order)
      }

      values.push(id)
      execute(`UPDATE Topic SET ${updates.join(', ')} WHERE id = ?`, values)

      const topic = findOne<Topic>('SELECT * FROM Topic WHERE id = ?', [id])
      return { success: true, data: topic }
    } catch (error) {
      console.error('Error updating topic:', error)
      return { success: false, error: 'Failed to update topic' }
    }
  }
)

// Delete a topic
ipcMain.handle('topics:delete', async (_, id: string) => {
  try {
    execute('DELETE FROM Topic WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    console.error('Error deleting topic:', error)
    return { success: false, error: 'Failed to delete topic' }
  }
})

// ========== COURSE OPERATIONS ==========

// Get all courses for a user
ipcMain.handle('courses:getAll', async (_, userId: string) => {
  try {
    const courses = findMany<Course>(
      'SELECT * FROM Course WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    )

    // Enrich courses with classes and batches
    const enrichedCourses = courses.map((course: Course) => {
      const classes = findMany<Class>(
        'SELECT * FROM Class WHERE courseId = ? ORDER BY `order` ASC',
        [course.id]
      )
      const batches = findMany<Batch>('SELECT * FROM Batch WHERE courseId = ?', [course.id])
      return { ...course, classes, batches }
    })

    return { success: true, data: enrichedCourses }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { success: false, error: 'Failed to fetch courses' }
  }
})

// Create a course
ipcMain.handle(
  'courses:create',
  async (
    _,
    data: {
      userId: string
      name: string
      platform?: string
      instructor?: string
      description?: string
      color?: string
      totalClasses?: number
    }
  ) => {
    try {
      const id = uuidv4()
      execute(
        `INSERT INTO Course (id, userId, name, platform, instructor, description, color, totalClasses, attendedClasses, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          id,
          data.userId,
          data.name,
          data.platform || null,
          data.instructor || null,
          data.description || null,
          data.color || '#8B5CF6',
          data.totalClasses || 0,
          new Date().toISOString()
        ]
      )
      const course = findOne('SELECT * FROM Course WHERE id = ?', [id])
      return { success: true, data: course }
    } catch (error) {
      console.error('Error creating course:', error)
      return { success: false, error: 'Failed to create course' }
    }
  }
)

// Update a course
ipcMain.handle(
  'courses:update',
  async (
    _,
    id: string,
    data: {
      name?: string
      platform?: string
      instructor?: string
      description?: string
      color?: string
      totalClasses?: number
      attendedClasses?: number
    }
  ) => {
    try {
      const updates: string[] = []
      const values: (string | number | boolean | null | undefined)[] = []

      if (data.name !== undefined) {
        updates.push('name = ?')
        values.push(data.name)
      }
      if (data.platform !== undefined) {
        updates.push('platform = ?')
        values.push(data.platform)
      }
      if (data.instructor !== undefined) {
        updates.push('instructor = ?')
        values.push(data.instructor)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.color !== undefined) {
        updates.push('color = ?')
        values.push(data.color)
      }
      if (data.totalClasses !== undefined) {
        updates.push('totalClasses = ?')
        values.push(data.totalClasses)
      }
      if (data.attendedClasses !== undefined) {
        updates.push('attendedClasses = ?')
        values.push(data.attendedClasses)
      }

      values.push(id)
      execute(`UPDATE Course SET ${updates.join(', ')} WHERE id = ?`, values)

      const course = findOne('SELECT * FROM Course WHERE id = ?', [id])
      return { success: true, data: course }
    } catch (error) {
      console.error('Error updating course:', error)
      return { success: false, error: 'Failed to update course' }
    }
  }
)

// Delete a course
ipcMain.handle('courses:delete', async (_, id: string) => {
  try {
    execute('DELETE FROM Course WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    console.error('Error deleting course:', error)
    return { success: false, error: 'Failed to delete course' }
  }
})

// Get course by ID with full details
ipcMain.handle('courses:getById', async (_, id: string) => {
  try {
    const course = findOne('SELECT * FROM Course WHERE id = ?', [id])
    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    const classes = findMany('SELECT * FROM Class WHERE courseId = ? ORDER BY `order` ASC', [id])
    const batches = findMany('SELECT * FROM Batch WHERE courseId = ?', [id])

    return { success: true, data: { ...course, classes, batches } }
  } catch (error) {
    console.error('Error fetching course:', error)
    return { success: false, error: 'Failed to fetch course' }
  }
})

// ========== CLASS OPERATIONS ==========

// Create a class
ipcMain.handle(
  'classes:create',
  async (
    _,
    data: {
      courseId: string
      batchId?: string
      title: string
      description?: string
      type?: string
      scheduledAt?: string
      videoUrl?: string
      duration?: number
      order?: number
    }
  ) => {
    try {
      const id = uuidv4()
      execute(
        `INSERT INTO Class (id, courseId, batchId, title, description, type, scheduledAt, videoUrl, duration, "order", status, watchedDuration, completionPercentage, isImportant, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, ?, ?)`,
        [
          id,
          data.courseId,
          data.batchId || null,
          data.title.toString(),
          data.description || null,
          data.type || 'recorded',
          data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
          data.videoUrl || null,
          data.duration || null,
          data.order || 0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      )

      // Update course total classes count
      execute('UPDATE Course SET totalClasses = totalClasses + 1 WHERE id = ?', [data.courseId])

      const classItem = findOne('SELECT * FROM Class WHERE id = ?', [id])
      return { success: true, data: classItem }
    } catch (error) {
      console.error('Error creating class:', error)
      return { success: false, error: 'Failed to create class' }
    }
  }
)

// Update a class
ipcMain.handle(
  'classes:update',
  async (
    _,
    id: string,
    data: {
      title?: string
      description?: string
      status?: string
      watchedDuration?: number
      completionPercentage?: number
      isImportant?: boolean
      attendedAt?: string
    }
  ) => {
    try {
      const updates: string[] = []
      const values: (string | number | boolean | null | undefined)[] = []

      if (data.title !== undefined) {
        updates.push('title = ?')
        values.push(data.title)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.watchedDuration !== undefined) {
        updates.push('watchedDuration = ?')
        values.push(data.watchedDuration)
      }
      if (data.completionPercentage !== undefined) {
        updates.push('completionPercentage = ?')
        values.push(data.completionPercentage)
      }
      if (data.isImportant !== undefined) {
        updates.push('isImportant = ?')
        values.push(data.isImportant ? 1 : 0)
      }

      if (data.status !== undefined) {
        updates.push('status = ?')
        values.push(data.status)
        if (data.status === 'attended' && !data.attendedAt) {
          updates.push('attendedAt = ?')
          values.push(new Date().toISOString())
        }
      }

      if (data.attendedAt) {
        updates.push('attendedAt = ?')
        values.push(data.attendedAt)
      }

      values.push(id)

      // Get previous state to handle course counts correctly
      const previousClassItem = findOne<Class>('SELECT * FROM Class WHERE id = ?', [id])

      execute(`UPDATE Class SET ${updates.join(', ')} WHERE id = ?`, values)

      const classItem = findOne<Class>('SELECT * FROM Class WHERE id = ?', [id])

      // Update course attended classes count if status changed
      if (previousClassItem && classItem && data.status) {
        // Increment if moving TO attended (from anything else)
        if (data.status === 'attended' && previousClassItem.status !== 'attended') {
          execute('UPDATE Course SET attendedClasses = attendedClasses + 1 WHERE id = ?', [
            classItem.courseId
          ])
        }
        // Decrement if moving FROM attended (to anything else)
        else if (data.status !== 'attended' && previousClassItem.status === 'attended') {
          execute('UPDATE Course SET attendedClasses = MAX(0, attendedClasses - 1) WHERE id = ?', [
            classItem.courseId
          ])
        }
      }

      return { success: true, data: classItem }
    } catch (error) {
      console.error('Error updating class:', error)
      return { success: false, error: 'Failed to update class' }
    }
  }
)

// Delete a class
ipcMain.handle('classes:delete', async (_, id: string) => {
  try {
    const classItem = findOne<Class>('SELECT * FROM Class WHERE id = ?', [id])
    if (classItem) {
      execute('DELETE FROM Class WHERE id = ?', [id])
      execute('UPDATE Course SET totalClasses = totalClasses - 1 WHERE id = ?', [
        classItem.courseId
      ])

      // If the class was attended, we must also decrement the attendedClasses count
      if (classItem.status === 'attended') {
        execute('UPDATE Course SET attendedClasses = MAX(0, attendedClasses - 1) WHERE id = ?', [
          classItem.courseId
        ])
      }
    }
    return { success: true }
  } catch (error) {
    console.error('Error deleting class:', error)
    return { success: false, error: 'Failed to delete class' }
  }
})

// ========================================
// APP RESET
// =============================================
ipcMain.handle('app:resetData', async () => {
  try {
    // Execute deletions in order to respect foreign key constraints (if any enforced, though SQLite usually needs PRAGMA foreign_keys = ON)
    // Even without strict enforcement, it's good practice.

    // 1. Child tables first
    execute('DELETE FROM Resource')
    execute('DELETE FROM StudySession')

    // 3. Top-level tables
    execute('DELETE FROM Subject')
    execute('DELETE FROM Course')

    // 4. Analytics/Settings if strictly DB based (Settings seem local storage based but just in case of future expansion)
    // execute('DELETE FROM Settings') // User settings are currently in localStorage, so this might be skipped or reserved.

    console.log('Database reset successful')
    return { success: true }
  } catch (error) {
    console.error('Error resetting database:', error)
    return { success: false, error: 'Failed to reset database' }
  }
})

// ========================================
// BACKUP & RESTORE
// =============================================

// Create a full database backup
ipcMain.handle('app:createBackup', async () => {
  try {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      subjects: findMany('SELECT * FROM Subject'),
      modules: findMany('SELECT * FROM Module'),
      topics: findMany('SELECT * FROM Topic'),
      resources: findMany('SELECT * FROM Resource'),
      studySessions: findMany('SELECT * FROM StudySession'),
      courses: findMany('SELECT * FROM Course'),
      classes: findMany('SELECT * FROM Class'),
      batches: findMany('SELECT * FROM Batch')
    }
    return { success: true, data }
  } catch (error) {
    console.error('Error creating backup:', error)
    return { success: false, error: 'Failed to create backup' }
  }
})

// Restore database from backup
ipcMain.handle('app:restoreBackup', async (_, backupData: BackupData) => {
  try {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data')
    }

    // specific validation could be added here

    transaction(() => {
      // 1. CLEAR EXISTING DATA (Respect Foreign Keys)
      // Delete child tables first
      execute('DELETE FROM Resource')
      execute('DELETE FROM Topic')
      execute('DELETE FROM Module')
      execute('DELETE FROM Class')
      execute('DELETE FROM Batch')
      execute('DELETE FROM StudySession')
      // Delete parent tables
      execute('DELETE FROM Subject')
      execute('DELETE FROM Course')

      // 2. RESTORE DATA (Insert parents first)

      // Subjects
      if (Array.isArray(backupData.subjects)) {
        const stmt =
          'INSERT INTO Subject (id, userId, name, description, color, icon, targetDate, archived, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const s of backupData.subjects) {
          execute(stmt, [
            s.id,
            s.userId,
            s.name,
            s.description,
            s.color,
            s.icon,
            s.targetDate,
            s.archived,
            s.createdAt
          ])
        }
      }

      // Courses
      if (Array.isArray(backupData.courses)) {
        const stmt =
          'INSERT INTO Course (id, userId, name, platform, instructor, description, color, totalClasses, attendedClasses, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const c of backupData.courses) {
          execute(stmt, [
            c.id,
            c.userId,
            c.name,
            c.platform,
            c.instructor,
            c.description,
            c.color,
            c.totalClasses,
            c.attendedClasses,
            c.createdAt
          ])
        }
      }

      // Modules (depend on Subject)
      if (Array.isArray(backupData.modules)) {
        const stmt =
          'INSERT INTO Module (id, subjectId, name, description, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        for (const m of backupData.modules) {
          execute(stmt, [m.id, m.subjectId, m.name, m.description, m.order, m.createdAt])
        }
      }

      // Batches (depend on Course)
      if (Array.isArray(backupData.batches)) {
        const stmt =
          'INSERT INTO Batch (id, courseId, name, startDate, endDate) VALUES (?, ?, ?, ?, ?)'
        for (const b of backupData.batches) {
          execute(stmt, [b.id, b.courseId, b.name, b.startDate, b.endDate])
        }
      }

      // Topics (depend on Module)
      if (Array.isArray(backupData.topics)) {
        const stmt =
          'INSERT INTO Topic (id, moduleId, name, description, "order", completed, isImportant, totalDuration, watchedDuration, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const t of backupData.topics) {
          execute(stmt, [
            t.id,
            t.moduleId,
            t.name,
            t.description,
            t.order,
            t.completed,
            t.isImportant,
            t.totalDuration,
            t.watchedDuration,
            t.createdAt
          ])
        }
      }

      // Classes (depend on Course, optional Batch)
      if (Array.isArray(backupData.classes)) {
        const stmt =
          'INSERT INTO Class (id, courseId, batchId, title, description, type, scheduledAt, videoUrl, duration, "order", status, watchedDuration, completionPercentage, isImportant, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const c of backupData.classes) {
          execute(stmt, [
            c.id,
            c.courseId,
            c.batchId,
            c.title,
            c.description,
            c.type,
            c.scheduledAt,
            c.videoUrl,
            c.duration,
            c.order,
            c.status,
            c.watchedDuration,
            c.completionPercentage,
            c.isImportant,
            c.createdAt,
            c.updatedAt
          ])
        }
      }

      // Resources (depend on Topic)
      if (Array.isArray(backupData.resources)) {
        const stmt =
          'INSERT INTO Resource (id, topicId, title, type, url, thumbnail, duration, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const r of backupData.resources) {
          execute(stmt, [
            r.id,
            r.topicId,
            r.title,
            r.type,
            r.url,
            r.thumbnail,
            r.duration,
            r.metadata,
            r.createdAt
          ])
        }
      }

      // StudySessions (depend on Subject/User)
      if (Array.isArray(backupData.studySessions)) {
        const stmt =
          'INSERT INTO StudySession (id, userId, subjectId, startTime, sessionType, duration, notes, focusScore, endTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        for (const s of backupData.studySessions) {
          execute(stmt, [
            s.id,
            s.userId,
            s.subjectId,
            s.startTime,
            s.sessionType,
            s.duration,
            s.notes,
            s.focusScore,
            s.endTime,
            s.createdAt
          ])
        }
      }
    })

    console.log('Database backup restored successfully')
    return { success: true }
  } catch (error) {
    console.error('Error restoring backup:', error)
    return { success: false, error: 'Failed to restore backup' }
  }
})
// STUDY SESSIONS
// =============================================
ipcMain.handle('sessions:create', async (_event, data) => {
  try {
    const id = uuidv4()
    execute(
      `INSERT INTO StudySession (id, userId, subjectId, startTime, sessionType, duration, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        data.userId,
        data.subjectId || null,
        data.startTime,
        data.sessionType || 'pomodoro',
        new Date().toISOString()
      ]
    )
    const session = findOne('SELECT * FROM StudySession WHERE id = ?', [id])
    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('sessions:update', async (_event, id, updates) => {
  try {
    const updateFields: string[] = []
    const values: (string | number | boolean | null | undefined)[] = []

    if (updates.endTime !== undefined) {
      updateFields.push('endTime = ?')
      values.push(updates.endTime)
    }
    if (updates.duration !== undefined) {
      updateFields.push('duration = ?')
      values.push(updates.duration)
    }
    if (updates.focusScore !== undefined) {
      updateFields.push('focusScore = ?')
      values.push(updates.focusScore)
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?')
      values.push(updates.notes)
    }

    values.push(id)
    execute(`UPDATE StudySession SET ${updateFields.join(', ')} WHERE id = ?`, values)

    const session = findOne<StudySession>('SELECT * FROM StudySession WHERE id = ?', [id])

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('sessions:getToday', async (_event, userId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessions = findMany(
      'SELECT * FROM StudySession WHERE userId = ? AND datetime(startTime) >= datetime(?) ORDER BY startTime DESC',
      [userId, today.toISOString()]
    )
    return { success: true, data: sessions }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('sessions:getWeek', async (_event, userId) => {
  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const sessions = findMany(
      'SELECT * FROM StudySession WHERE userId = ? AND datetime(startTime) >= datetime(?) ORDER BY startTime DESC',
      [userId, weekAgo.toISOString()]
    )
    return { success: true, data: sessions }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// ========== TIMER SESSION OPERATIONS ==========

// Save a completed timer session
ipcMain.handle(
  'timer:saveSession',
  async (
    _,
    data: {
      userId: string
      subjectId?: string | null
      duration: number
      type: string
    }
  ) => {
    try {
      const id = uuidv4()
      const now = new Date().toISOString()
      execute(
        `INSERT INTO StudySession (id, userId, subjectId, duration, sessionType, endTime, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.userId, data.subjectId || null, data.duration, data.type, now, now]
      )

      const session = findOne('SELECT * FROM StudySession WHERE id = ?', [id])
      return { success: true, data: session }
    } catch (error) {
      console.error('Error saving timer session:', error)
      return { success: false, error: 'Failed to save session' }
    }
  }
)

// Get timer sessions with optional filters
ipcMain.handle(
  'timer:getSessions',
  async (
    _,
    filters: {
      userId: string
      subjectId?: string
      startDate?: string
      endDate?: string
      type?: string
    }
  ) => {
    try {
      let query =
        'SELECT s.*, subj.name as subjectName, subj.color as subjectColor FROM StudySession s LEFT JOIN Subject subj ON s.subjectId = subj.id WHERE s.userId = ?'
      const params: string[] = [filters.userId]

      if (filters.subjectId) {
        query += ' AND s.subjectId = ?'
        params.push(filters.subjectId)
      }
      if (filters.type) {
        if (filters.type === 'focus') {
          query += " AND s.sessionType IN ('focus', 'pomodoro')"
        } else {
          query += ' AND s.sessionType = ?'
          params.push(filters.type)
        }
      }
      if (filters.startDate) {
        query += ' AND datetime(s.endTime) >= datetime(?)'
        params.push(filters.startDate)
      }
      if (filters.endDate) {
        query += ' AND datetime(s.endTime) <= datetime(?)'
        params.push(filters.endDate)
      }

      query += ' ORDER BY s.endTime DESC'
      const sessions = findMany(query, params)
      return { success: true, data: sessions }
    } catch (error) {
      console.error('Error fetching timer sessions:', error)
      return { success: false, error: 'Failed to fetch sessions' }
    }
  }
)

// Get timer session statistics
ipcMain.handle('timer:getSessionStats', async (_, userId: string) => {
  try {
    // Get total focus time - use sessionType instead of type
    const focusSessions = findMany<{ duration: number }>(
      `SELECT duration FROM StudySession WHERE userId = ? AND sessionType IN ('focus', 'pomodoro')`,
      [userId]
    )

    const totalFocusSeconds = focusSessions.reduce((sum, session) => sum + session.duration, 0)
    const totalFocusMinutes = Math.floor(totalFocusSeconds / 60) // Duration is in seconds

    // Get session count
    const sessionCount = focusSessions.length

    // Get sessions today - use endTime instead of completedAt
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionsToday =
      findOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM StudySession WHERE userId = ? AND sessionType IN ('focus', 'pomodoro') AND endTime IS NOT NULL AND datetime(endTime) >= datetime(?)`,
        [userId, today.toISOString()]
      )?.count || 0

    // Get sessions this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)
    const sessionsThisWeek =
      findOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM StudySession WHERE userId = ? AND sessionType IN ('focus', 'pomodoro') AND endTime IS NOT NULL AND datetime(endTime) >= datetime(?)`,
        [userId, weekAgo.toISOString()]
      )?.count || 0

    return {
      success: true,
      data: {
        totalFocusMinutes,
        totalSessions: sessionCount,
        sessionsToday,
        sessionsThisWeek
      }
    }
  } catch (error) {
    console.error('Error fetching session stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
})

// Get weekly history for chart
ipcMain.handle('timer:getWeeklyHistory', async (_, userId: string) => {
  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6) // Include today
    weekAgo.setHours(0, 0, 0, 0)

    // Query sessions using 'sessionType' and 'endTime' which is how they're actually saved
    const sessions = findMany<{ duration: number; endTime: string }>(
      `SELECT duration, endTime FROM StudySession WHERE userId = ? AND sessionType IN ('focus', 'pomodoro') AND endTime IS NOT NULL AND datetime(endTime) >= datetime(?) ORDER BY endTime ASC`,
      [userId, weekAgo.toISOString()]
    )

    // Sort keys based on time
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' } as const))
    }

    const aggregated = days.map((day) => ({ name: day, minutes: 0 }))

    sessions.forEach((session) => {
      if (session.endTime) {
        const dayName = new Date(session.endTime).toLocaleDateString('en-US', {
          weekday: 'short'
        } as const)
        const entry = aggregated.find((a) => a.name === dayName)
        if (entry) {
          entry.minutes += Math.floor(session.duration / 60)
        }
      }
    })

    return { success: true, data: aggregated }
  } catch (error) {
    console.error('Error fetching weekly history:', error)
    return { success: false, error: 'Failed to fetch history' }
  }
})

// ========== RESOURCE OPERATIONS ==========

// Create a resource
// Create a resource
ipcMain.handle(
  'resources:create',
  async (
    _,
    data: {
      topicId: string
      title: string
      type: string
      url: string
      thumbnail?: string
      duration?: number
      metadata?: string
    }
  ) => {
    try {
      const id = uuidv4()
      const now = new Date().toISOString()
      execute(
        'INSERT INTO Resource (id, topicId, title, type, url, thumbnail, duration, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          data.topicId,
          data.title,
          data.type,
          data.url,
          data.thumbnail || null,
          data.duration || null,
          data.metadata || null,
          now
        ]
      )
      const resource = findOne('SELECT * FROM Resource WHERE id = ?', [id])
      return { success: true, data: resource }
    } catch (error) {
      console.error('Error creating resource:', error)
      return { success: false, error: 'Failed to create resource' }
    }
  }
)

// Delete a resource
// Delete a resource
ipcMain.handle('resources:delete', async (_, id: string) => {
  try {
    execute('DELETE FROM Resource WHERE id = ?', [id])
    return { success: true }
  } catch (error) {
    console.error('Error deleting resource:', error)
    return { success: false, error: 'Failed to delete resource' }
  }
})

export function registerIpcHandlers(): void {
  console.log('IPC handlers registered')
}
