// src/lib/db.ts
import * as SQLite from "expo-sqlite";

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
      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL, -- e.g., "active", "onHold", "resolved", "archived"
        priority TEXT NOT NULL, -- e.g., "high", "medium", "low"
        resolutionCriteriaText TEXT,
        resolutionNumericalTarget INTEGER,
        currentNumericalProgress INTEGER DEFAULT 0,
        objectiveIds TEXT NOT NULL DEFAULT '[]', -- JSON string array
        ruleIds TEXT NOT NULL DEFAULT '[]', -- JSON string array
        tagIds TEXT DEFAULT '[]', -- JSON string array
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL, -- ISO8601 datetime string
        resolvedAt TEXT, -- ISO8601 datetime string
        archivedAt TEXT, -- ISO8601 datetime string
        starReportId TEXT UNIQUE, -- Optional link to a specific StarReport
        FOREIGN KEY (starReportId) REFERENCES StarReports(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS Objectives (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL, -- Foreign key to Problems table
        title TEXT NOT NULL,
        description TEXT,
        parentId TEXT, -- Self-referential for sub-objectives
        childObjectiveIds TEXT NOT NULL DEFAULT '[]', -- JSON string array
        blockingProblemIds TEXT NOT NULL DEFAULT '[]', -- JSON string array
        status TEXT NOT NULL, -- e.g., "todo", "inProgress", "completed"
        deadline TEXT, -- ISO8601 datetime string
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL, -- ISO8601 datetime string
        completedAt TEXT, -- ISO8601 datetime string
        "order" INTEGER,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Objectives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Rules (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL, -- Foreign key to Problems table
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL, -- ISO8601 datetime string
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS StarReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL, -- Foreign key to Problems table
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        timeSpent INTEGER,
        createdAt TEXT NOT NULL, -- ISO8601 datetime string
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        createdAt TEXT NOT NULL -- ISO8601 datetime string
      );
    `);
    // Projects and Tasks tables are removed as per new types.
    console.log(
      "[DB] Database tables (Problems, Objectives, Rules, StarReports, Tags) initialized successfully or already exist."
    );
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };
