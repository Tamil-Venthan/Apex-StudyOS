import { execute, findOne } from './db';
/**
 * Creates all database tables if they don't exist
 * This ensures the app works on fresh installations in production
 */
function createSchema() {
    // User table
    execute(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "avatar" TEXT,
      "preferences" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Subject table
    execute(`
    CREATE TABLE IF NOT EXISTS "Subject" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "color" TEXT NOT NULL DEFAULT '#3B82F6',
      "icon" TEXT,
      "targetDate" DATETIME,
      "archived" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Module table
    execute(`
    CREATE TABLE IF NOT EXISTS "Module" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "subjectId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "order" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Module_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Topic table
    execute(`
    CREATE TABLE IF NOT EXISTS "Topic" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "moduleId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "order" INTEGER NOT NULL,
      "completed" BOOLEAN NOT NULL DEFAULT false,
      "isImportant" BOOLEAN NOT NULL DEFAULT false,
      "totalDuration" INTEGER,
      "watchedDuration" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Topic_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Resource table
    execute(`
    CREATE TABLE IF NOT EXISTS "Resource" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "topicId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "thumbnail" TEXT,
      "duration" INTEGER,
      "metadata" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Resource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Course table
    execute(`
    CREATE TABLE IF NOT EXISTS "Course" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "platform" TEXT,
      "instructor" TEXT,
      "totalClasses" INTEGER NOT NULL DEFAULT 0,
      "attendedClasses" INTEGER NOT NULL DEFAULT 0,
      "description" TEXT,
      "thumbnail" TEXT,
      "color" TEXT NOT NULL DEFAULT '#8B5CF6',
      "startDate" DATETIME,
      "endDate" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Batch table
    execute(`
    CREATE TABLE IF NOT EXISTS "Batch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "courseId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "startDate" DATETIME,
      "endDate" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Class table
    execute(`
    CREATE TABLE IF NOT EXISTS "Class" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "courseId" TEXT NOT NULL,
      "batchId" TEXT,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "type" TEXT NOT NULL DEFAULT 'recorded',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "scheduledAt" DATETIME,
      "attendedAt" DATETIME,
      "videoUrl" TEXT,
      "thumbnail" TEXT,
      "duration" INTEGER,
      "watchedDuration" INTEGER NOT NULL DEFAULT 0,
      "completionPercentage" REAL NOT NULL DEFAULT 0,
      "classNotes" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isImportant" BOOLEAN NOT NULL DEFAULT false,
      "tags" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Class_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Class_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
    // StudySession table (with updated schema from migration)
    execute(`
    CREATE TABLE IF NOT EXISTS "StudySession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "subjectId" TEXT,
      "duration" INTEGER NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'manual',
      "startTime" DATETIME,
      "endTime" DATETIME,
      "focusScore" INTEGER,
      "notes" TEXT,
      "sessionType" TEXT,
      "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StudySession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
    // Create indexes for StudySession
    execute(`CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId")`);
    execute(`CREATE INDEX IF NOT EXISTS "StudySession_subjectId_idx" ON "StudySession"("subjectId")`);
    execute(`CREATE INDEX IF NOT EXISTS "StudySession_completedAt_idx" ON "StudySession"("completedAt")`);
    // Achievement table
    execute(`
    CREATE TABLE IF NOT EXISTS "Achievement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Quiz table
    execute(`
    CREATE TABLE IF NOT EXISTS "Quiz" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "subjectId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Quiz_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // Question table
    execute(`
    CREATE TABLE IF NOT EXISTS "Question" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "quizId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "question" TEXT NOT NULL,
      "options" TEXT,
      "correctAnswer" TEXT NOT NULL,
      "explanation" TEXT,
      CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    // QuizAttempt table
    execute(`
    CREATE TABLE IF NOT EXISTS "QuizAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "quizId" TEXT NOT NULL,
      "score" REAL NOT NULL,
      "answers" TEXT NOT NULL,
      "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
    console.log('✅ Database schema created/verified successfully');
}
/**
 * Initializes the database with schema and default data
 */
export function initializeDatabase() {
    try {
        // 1. Create all tables first
        createSchema();
        // 2. Create default user if none exists
        const user = findOne('SELECT COUNT(*) as count FROM User');
        const userCount = user?.count || 0;
        if (userCount === 0) {
            execute(`INSERT INTO User (id, name, preferences, createdAt) VALUES (?, ?, ?, ?)`, [
                'user-1',
                'Student',
                '{}',
                new Date().toISOString()
            ]);
            console.log('✅ Default user created');
        }
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}
