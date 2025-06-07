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
      CREATE TABLE IF NOT EXISTS Personas (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        personaGoals TEXT,
        avatarImageUri TEXT,
        icon TEXT,
        color TEXT,
        problemIds TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL,
        "order" INTEGER
      );

      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,
        originatingObjectiveId TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        objectiveIds TEXT NOT NULL DEFAULT '[]',
        ruleIds TEXT NOT NULL DEFAULT '[]',
        tagIds TEXT DEFAULT '[]',
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        resolvedAt TEXT,
        archivedAt TEXT,
        starReportId TEXT UNIQUE,
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
        FOREIGN KEY (originatingObjectiveId) REFERENCES Objectives(id) ON DELETE SET NULL,
        FOREIGN KEY (starReportId) REFERENCES StarReports(id) ON DELETE SET NULL 
      );

      CREATE TABLE IF NOT EXISTS Objectives (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        parentId TEXT,
        childObjectiveIds TEXT NOT NULL DEFAULT '[]',
        blockingProblemIds TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL,
        deadline TEXT,
        timeSpent INTEGER NOT NULL DEFAULT 0,
        workSessionIds TEXT NOT NULL DEFAULT '[]',
        completionCriteriaText TEXT,
        numericalTarget INTEGER,
        currentNumericalProgress INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        "order" INTEGER,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Objectives(id) ON DELETE CASCADE
      );

      -- WorkSession 테이블 추가 --
      CREATE TABLE IF NOT EXISTS WorkSessions (
          id TEXT PRIMARY KEY NOT NULL,
          objectiveId TEXT NOT NULL,
          startTime TEXT NOT NULL,
          duration INTEGER NOT NULL,
          notes TEXT,
          isPomodoro INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
          createdAt TEXT NOT NULL,
          FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Rules (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS StarReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        timeSpent INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS WeeklyProblems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,
        problemId TEXT NOT NULL,
        weekIdentifier TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );
    `);

    console.log(
      "[DB] Database tables (Personas, Problems, Objectives, WorkSessions, Rules, Tags, StarReports, WeeklyProblems) initialized successfully or already exist."
    );
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };
