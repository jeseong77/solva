// src/lib/db.ts
import * as SQLite from "expo-sqlite";
import { WeeklyProblem } from "../types"; // 타입을 임포트하여 참조할 수 있습니다 (선택 사항).

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
    // 동시 쓰기 및 읽기 성능 향상을 위해 WAL 모드 활성화
    await db.execAsync("PRAGMA journal_mode = WAL;");
    // 외래 키 제약 조건 활성화
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // 테이블 생성 SQL 쿼리 실행
    await db.execAsync(`
      -- Personas: 사용자의 역할 및 삶의 영역
      CREATE TABLE IF NOT EXISTS Personas (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        personaGoals TEXT,
        coverImageUri TEXT, 
        avatarImageUri TEXT,
        icon TEXT,
        color TEXT,
        problemIds TEXT NOT NULL DEFAULT '[]', -- JSON 문자열로 배열 저장
        createdAt TEXT NOT NULL, -- ISO 8601 형식의 날짜 문자열
        "order" INTEGER
      );

      -- Problems: 해결하고자 하는 구체적인 문제
      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL, -- ProblemStatus 타입
        priority TEXT NOT NULL DEFAULT 'none', -- Priority 타입
        urgency INTEGER,
        importance INTEGER,
        tags TEXT, -- JSON 문자열로 배열 저장
        childThreadIds TEXT NOT NULL DEFAULT '[]', -- JSON 문자열로 배열 저장
        timeSpent INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        resolvedAt TEXT,
        archivedAt TEXT,
        starReportId TEXT UNIQUE,
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
        FOREIGN KEY (starReportId) REFERENCES StarReports(id) ON DELETE SET NULL
      );

      -- WeeklyProblems: 특정 주에 집중할 문제
      CREATE TABLE IF NOT EXISTS WeeklyProblems (
        id TEXT PRIMARY KEY NOT NULL,
        personaId TEXT NOT NULL,
        problemId TEXT NOT NULL,
        weekIdentifier TEXT NOT NULL, -- 예: "2025-W23"
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      -- ThreadItems: 문제 해결 과정을 구성하는 모든 아이템 (Single Table Inheritance)
      CREATE TABLE IF NOT EXISTS ThreadItems (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        parentId TEXT,
        childThreadIds TEXT NOT NULL DEFAULT '[]', -- JSON 문자열
        type TEXT NOT NULL, -- ThreadItemType
        content TEXT NOT NULL,
        isImportant INTEGER NOT NULL DEFAULT 0, -- 0: false, 1: true
        resultIds TEXT NOT NULL DEFAULT '[]', -- JSON 문자열
        createdAt TEXT NOT NULL,
        authorId TEXT,
        -- BottleneckThreadItem 속성
        isResolved INTEGER, -- 0: false, 1: true
        -- TaskThreadItem 속성
        isCompleted INTEGER, -- 0: false, 1: true
        -- ActionThreadItem 속성
        status TEXT, -- ActionStatus 타입
        timeSpent INTEGER,
        deadline TEXT,
        completedAt TEXT,
        -- SessionThreadItem 속성
        startTime TEXT,
        -- timeSpent는 ActionThreadItem과 공유
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
      -- ✅ [추가] Todos: 독립적인 할 일 목록
      CREATE TABLE IF NOT EXISTS Todos (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        isCompleted INTEGER NOT NULL DEFAULT 0, -- 0: false, 1: true
        createdAt TEXT NOT NULL,
        completedAt TEXT
      );
    `);

    // 성공 로그에 WeeklyProblems 테이블 추가
    console.log(
      "[DB] Database tables (Personas, Problems, WeeklyProblems, ThreadItems, Results, Tags, StarReports, Todos) initialized successfully or already exist."
    );
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error;
  }
};

export { getDatabase, initDatabase };
