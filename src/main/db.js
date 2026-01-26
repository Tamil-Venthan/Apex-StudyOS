import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'database.db')
    : path.join(process.cwd(), 'prisma', 'dev.db');
// Initialize database
let db;
export function initializeDatabase() {
    if (db)
        return db;
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    // Copy default database if needed (in production)
    if (app.isPackaged && !fs.existsSync(dbPath)) {
        const resourceDbPath = path.join(process.resourcesPath, 'prisma', 'dev.db');
        if (fs.existsSync(resourceDbPath)) {
            fs.copyFileSync(resourceDbPath, dbPath);
            console.log('Database initialized successfully at:', dbPath);
        }
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('Database connected:', dbPath);
    return db;
}
export function getDatabase() {
    if (!db) {
        return initializeDatabase();
    }
    return db;
}
export function closeDatabase() {
    if (db) {
        db.close();
    }
}
// Helper functions for common queries
export function findOne(sql, params = []) {
    const db = getDatabase();
    return db.prepare(sql).get(...params);
}
export function findMany(sql, params = []) {
    const db = getDatabase();
    return db.prepare(sql).all(...params);
}
export function execute(sql, params = []) {
    const db = getDatabase();
    return db.prepare(sql).run(...params);
}
export function transaction(callback) {
    const db = getDatabase();
    return db.transaction(callback)();
}
export default getDatabase;
