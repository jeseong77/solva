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
      CREATE TABLE IF NOT EXISTS Objectives (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        isBottleneck INTEGER NOT NULL DEFAULT 0,
        bottleneckAnalysis TEXT,
        parentId TEXT,
        childObjectiveIds TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL,
        deadline TEXT,
        isFeatured INTEGER NOT NULL DEFAULT 0,
        fulfillingProjectId TEXT,
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        "order" INTEGER, -- 여기가 수정된 부분입니다.
        FOREIGN KEY (parentId) REFERENCES Objectives(id) ON DELETE CASCADE,
        FOREIGN KEY (fulfillingProjectId) REFERENCES Projects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS Projects (
        id TEXT PRIMARY KEY NOT NULL,
        objectiveId TEXT NOT NULL,
        title TEXT NOT NULL,
        completionCriteriaText TEXT,
        numericalTarget INTEGER,
        currentNumericalProgress INTEGER NOT NULL DEFAULT 0,
        performanceScore INTEGER NOT NULL DEFAULT 50,
        status TEXT NOT NULL,
        isLocked INTEGER NOT NULL DEFAULT 0,
        ruleIds TEXT NOT NULL DEFAULT '[]',
        taskIds TEXT NOT NULL DEFAULT '[]',
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Rules (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        title TEXT NOT NULL,
        isLocked INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Tasks (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        isRepeatable INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        isLocked INTEGER NOT NULL DEFAULT 0,
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS StarReports (
        id TEXT PRIMARY KEY NOT NULL,
        objectiveId TEXT NOT NULL,
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        timeSpent INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE
      );
    `);
    console.log(
      "[DB] Database tables (Objectives, Projects, Rules, Tasks, StarReports) initialized successfully or already exist."
    );
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };