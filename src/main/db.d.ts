import Database from 'better-sqlite3';
export declare function initializeDatabase(): Database.Database;
export declare function getDatabase(): Database.Database;
export declare function closeDatabase(): void;
export declare function findOne<T>(sql: string, params?: (string | number | boolean | null | undefined)[]): T | undefined;
export declare function findMany<T>(sql: string, params?: (string | number | boolean | null | undefined)[]): T[];
export declare function execute(sql: string, params?: (string | number | boolean | null | undefined)[]): Database.RunResult;
export declare function transaction<T>(callback: () => T): T;
export default getDatabase;
