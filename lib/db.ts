// src/lib/db.ts
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = "ClearPath.db";
let _dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_dbInstance !== null) {
    return _dbInstance;
  }
  _dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return _dbInstance;
}

const initDatabase = async () => {
  const db = await getDatabase();
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        parentId TEXT,
        childProblemIds TEXT,      -- JSON string for string[]
        status TEXT NOT NULL,      -- ProblemStatus
        path TEXT,
        projectId TEXT,            -- Replaces associatedTaskIds, links to Projects table
        retrospectiveReportId TEXT,
        createdAt TEXT NOT NULL,   -- ISO 8601 string
        resolvedAt TEXT,
        archivedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE SET NULL -- 프로젝트 삭제 시 Problem의 projectId는 NULL로
      );

      CREATE TABLE IF NOT EXISTS Projects (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        title TEXT NOT NULL,
        completionCriteriaText TEXT,
        numericalTarget INTEGER,
        currentNumericalProgress INTEGER DEFAULT 0,
        performanceScore INTEGER DEFAULT 50,
        status TEXT NOT NULL,      -- ProjectStatus
        isLocked INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        focused TEXT NOT NULL DEFAULT 'unfocused', -- ProjectFocusStatus
        doItemIds TEXT,            -- JSON string for string[]
        dontItemIds TEXT,          -- JSON string for string[]
        taskIds TEXT,              -- JSON string for string[]
        createdAt TEXT NOT NULL,   -- ISO 8601 string
        completedAt TEXT,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE -- Problem 삭제 시 관련된 Project도 삭제
      );

      CREATE TABLE IF NOT EXISTS DoItems (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        recurrenceRule TEXT NOT NULL,
        lastUpdatedDate TEXT,      -- ISO 8601 string
        successCount INTEGER NOT NULL DEFAULT 0,
        failureCount INTEGER NOT NULL DEFAULT 0,
        isLocked INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        createdAt TEXT NOT NULL,   -- ISO 8601 string
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS DontItems (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        observancePeriod TEXT NOT NULL,
        lastUpdatedDate TEXT,      -- ISO 8601 string
        successCount INTEGER NOT NULL DEFAULT 0,
        failureCount INTEGER NOT NULL DEFAULT 0,
        isLocked INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        createdAt TEXT NOT NULL,   -- ISO 8601 string
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Tasks (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,   -- Changed from problemId, links to Projects table
        title TEXT NOT NULL,
        description TEXT,
        isRepeatable INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        status TEXT NOT NULL,       -- TaskStatus
        isLocked INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        createdAt TEXT NOT NULL,    -- ISO 8601 string
        completedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE -- 프로젝트 삭제 시 관련 Task도 삭제
      );

      CREATE TABLE IF NOT EXISTS RetrospectiveReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        situation TEXT NOT NULL,
        task TEXT NOT NULL,        -- Renamed from starTask
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        createdAt TEXT NOT NULL,   -- ISO 8601 string
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );
    `);
    console.log("[DB] Database tables (Problems, Projects, DoItems, DontItems, Tasks, RetrospectiveReports) initialized successfully or already exist.");
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };