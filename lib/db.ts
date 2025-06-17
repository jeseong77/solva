// lib/db.ts
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "Solva.db";
const LOCAL_USER_ID = "local-user";
let _dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_dbInstance !== null) {
    return _dbInstance;
  }
  _dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return _dbInstance;
}

export const initDatabase = async () => {
  const db = await getDatabase();
  try {
    // 동시 쓰기 및 읽기 성능 향상을 위해 WAL 모드 활성화
    await db.execAsync("PRAGMA journal_mode = WAL;");
    // 외래 키 제약 조건 활성화
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // 테이블 생성 SQL 쿼리 실행
    await db.execAsync(`
      -- ✅ Users: 앱의 사용자 (MVP에서는 단일 로컬 유저)
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY NOT NULL,
        displayName TEXT NOT NULL,
        username TEXT,
        email TEXT,
        bio TEXT,
        introduction TEXT,
        avatarImageUri TEXT,
        coverImageUri TEXT,
        location TEXT,
        links TEXT, -- JSON 문자열로 UserLink[] 저장
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- ✅ Personas: 사용자의 역할 및 삶의 영역 (userId 추가)
      CREATE TABLE IF NOT EXISTS Personas (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL, -- 👩‍💻 User와의 연결고리
        title TEXT NOT NULL,
        description TEXT,
        personaGoals TEXT,
        coverImageUri TEXT, 
        avatarImageUri TEXT,
        icon TEXT,
        color TEXT,
        problemIds TEXT NOT NULL DEFAULT '[]', -- JSON 문자열로 배열 저장
        createdAt TEXT NOT NULL,
        "order" INTEGER,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      );

      -- Problems: 해결하고자 하는 구체적인 문제
      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'none',
        urgency INTEGER,
        importance INTEGER, 
        tags TEXT, -- JSON 문자열로 배열 저장
        childThreadIds TEXT NOT NULL DEFAULT '[]',
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        resolvedAt TEXT,
        archivedAt TEXT,
        starReportId TEXT UNIQUE,
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE
      );

      -- WeeklyProblems: 특정 주에 집중할 문제
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

      -- ThreadItems: 문제 해결 과정을 구성하는 모든 아이템
      CREATE TABLE IF NOT EXISTS ThreadItems (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        parentId TEXT,
        childThreadIds TEXT NOT NULL DEFAULT '[]',
        type TEXT NOT NULL, -- General, Insight, Bottleneck, Task, Action, Session
        content TEXT NOT NULL,
        isImportant INTEGER NOT NULL DEFAULT 0,
        resultIds TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL,
        authorId TEXT,
        -- 속성들
        isResolved INTEGER,
        isCompleted INTEGER,
        status TEXT,
        timeSpent INTEGER,
        deadline TEXT,
        completedAt TEXT,
        startTime TEXT,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES ThreadItems(id) ON DELETE CASCADE
      );

      -- Results: 각 스레드 아이템의 구체적인 결과물
      CREATE TABLE IF NOT EXISTS Results (
        id TEXT PRIMARY KEY NOT NULL,
        parentThreadId TEXT NOT NULL,
        content TEXT NOT NULL,
        occurredAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (parentThreadId) REFERENCES ThreadItems(id) ON DELETE CASCADE
      );

      -- Tags: 문제에 연결할 수 있는 태그
      CREATE TABLE IF NOT EXISTS Tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        color TEXT
      );

      -- StarReports: 문제 해결 후 작성하는 회고 (STAR 형식)
      CREATE TABLE IF NOT EXISTS StarReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );
      
      -- Todos: 독립적인 할 일 목록
      CREATE TABLE IF NOT EXISTS Todos (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        isCompleted INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      );
    `);

    // --- 2. 기본 사용자 데이터 생성 확인 ---
    const userResult = await db.getFirstAsync(
      "SELECT id FROM Users WHERE id = ?;",
      [LOCAL_USER_ID]
    );

    if (!userResult) {
      console.log("[DB] Default user not found. Creating one...");
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO Users (id, displayName, links, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?);`,
        [LOCAL_USER_ID, "My Profile", "[]", now, now]
      );
      console.log("[DB] Default user created successfully.");
    }

    console.log("[DB] All tables and default data are ready.");
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
};
