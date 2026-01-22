import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'database.db')
  : path.join(process.cwd(), 'prisma', 'dev.db')

// Initialize database
let db: Database.Database

export function initializeDatabase(): Database.Database {
  if (db) return db

  // Ensure directory exists
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Copy default database if needed (in production)
  if (app.isPackaged && !fs.existsSync(dbPath)) {
    const resourceDbPath = path.join(process.resourcesPath, 'prisma', 'dev.db')
    if (fs.existsSync(resourceDbPath)) {
      fs.copyFileSync(resourceDbPath, dbPath)
      console.log('Database initialized successfully at:', dbPath)
    }
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  console.log('Database connected:', dbPath)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
  }
}

// Helper functions for common queries
export function findOne<T>(
  sql: string,
  params: (string | number | boolean | null | undefined)[] = []
): T | undefined {
  const db = getDatabase()
  return db.prepare(sql).get(...params) as T | undefined
}

export function findMany<T>(
  sql: string,
  params: (string | number | boolean | null | undefined)[] = []
): T[] {
  const db = getDatabase()
  return db.prepare(sql).all(...params) as T[]
}

export function execute(
  sql: string,
  params: (string | number | boolean | null | undefined)[] = []
): Database.RunResult {
  const db = getDatabase()
  return db.prepare(sql).run(...params)
}

export function transaction<T>(callback: () => T): T {
  const db = getDatabase()
  return db.transaction(callback)()
}

export default getDatabase
