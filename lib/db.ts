// src/lib/db.ts
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = "Solva.db";
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
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA foreign_keys = ON;");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Personas (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        personaGoals TEXT,
        avatarImageUri TEXT,
        icon TEXT,
        color TEXT,
        problemIds TEXT NOT NULL DEFAULT '[]', -- JSON string for string[]
        createdAt TEXT NOT NULL,              -- ISO8601 datetime string
        "order" INTEGER
      );

      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,                 -- FK to Personas table
        originatingObjectiveId TEXT,           -- Nullable, FK to Objectives table (for bottlenecks)
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,                    -- ProblemStatus
        priority TEXT NOT NULL DEFAULT 'medium', -- Priority (default medium)
        
        -- resolutionCriteriaText, resolutionNumericalTarget, currentNumericalProgress REMOVED
        
        objectiveIds TEXT NOT NULL DEFAULT '[]', -- JSON string for string[]
        ruleIds TEXT NOT NULL DEFAULT '[]',      -- JSON string for string[]
        tagIds TEXT DEFAULT '[]',                -- JSON string for string[]
        
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,                 -- ISO8601 datetime string
        resolvedAt TEXT,                         -- ISO8601 datetime string
        archivedAt TEXT,                         -- ISO8601 datetime string
        starReportId TEXT UNIQUE,                -- Nullable, FK to StarReports table
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
        FOREIGN KEY (originatingObjectiveId) REFERENCES Objectives(id) ON DELETE SET NULL,
        FOREIGN KEY (starReportId) REFERENCES StarReports(id) ON DELETE SET NULL 
      );

      CREATE TABLE IF NOT EXISTS Objectives (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,                 -- FK to Problems table
        title TEXT NOT NULL,
        description TEXT,
        parentId TEXT,                           -- Self-referential FK to Objectives table
        childObjectiveIds TEXT NOT NULL DEFAULT '[]', -- JSON string for string[]
        blockingProblemIds TEXT NOT NULL DEFAULT '[]', -- JSON string for string[] (IDs of Problem entities)
        status TEXT NOT NULL,                    -- ObjectiveStatus
        deadline TEXT,                           -- ISO8601 datetime string, Nullable
        timeSpent INTEGER NOT NULL DEFAULT 0,
        
        -- Completion criteria fields MOVED HERE from Problem
        completionCriteriaText TEXT,
        numericalTarget INTEGER,
        currentNumericalProgress INTEGER DEFAULT 0,

        createdAt TEXT NOT NULL,                 -- ISO8601 datetime string
        completedAt TEXT,                        -- ISO8601 datetime string, Nullable
        "order" INTEGER,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Objectives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Rules (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,                 -- FK to Problems table
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,                 -- ISO8601 datetime string
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
        -- isLocked 필드 제거됨
      );

      CREATE TABLE IF NOT EXISTS Tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        createdAt TEXT NOT NULL                  -- ISO8601 datetime string
      );

      CREATE TABLE IF NOT EXISTS StarReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,                 -- FK to Problems table
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        timeSpent INTEGER,                       -- Nullable
        createdAt TEXT NOT NULL,                 -- ISO8601 datetime string
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );
    `);
    // Projects 및 Tasks 테이블은 제거됨
    console.log(
      "[DB] Database tables (Personas, Problems, Objectives, Rules, Tags, StarReports) initialized successfully or already exist."
    );
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };