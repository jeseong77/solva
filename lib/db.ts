// src/lib/db.ts (또는 프로젝트 내 적절한 경로)
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "ClearPath.db";

// 데이터베이스 인스턴스를 저장하기 위한 변수
// 새 API에서는 openDatabaseAsync 호출 시 내부적으로 캐싱될 수 있으나,
// 명시적으로 한 번만 열도록 관리하는 것이 좋습니다.
let _dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * 데이터베이스 인스턴스를 가져옵니다.
 * 인스턴스가 없으면 새로 열고, 있으면 기존 인스턴스를 반환합니다.
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_dbInstance !== null) {
    return _dbInstance;
  }
  _dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return _dbInstance;
}

/**
 * 데이터베이스 테이블을 초기화하는 함수입니다.
 * 앱 시작 시 호출되어야 합니다.
 */
const initDatabase = async () => {
  const db = await getDatabase();
  try {
    // PRAGMA 설정은 각각 실행하는 것이 안전할 수 있습니다.
    await db.execAsync('PRAGMA journal_mode = WAL;'); // 성능 향상을 위해 WAL 모드 권장
    await db.execAsync('PRAGMA foreign_keys = ON;'); // 외래 키 제약 조건 활성화

    // 테이블 생성 쿼리들을 한 번의 execAsync로 실행
    // (IF NOT EXISTS를 사용하여 이미 테이블이 존재하면 오류 없이 넘어갑니다)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Problems (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        parentId TEXT,
        childProblemIds TEXT, -- JSON 문자열로 저장 (예: '["id1", "id2"]')
        status TEXT NOT NULL,   -- 'active', 'evaluating', 'resolved', 'archived'
        path TEXT,
        associatedTaskIds TEXT, -- JSON 문자열로 저장
        retrospectiveReportId TEXT,
        createdAt TEXT NOT NULL, -- ISO 8601 형식의 문자열
        resolvedAt TEXT,
        archivedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS Tasks (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        title TEXT NOT NULL,
        isRepeatable INTEGER NOT NULL, -- 0 (false) 또는 1 (true)
        status TEXT NOT NULL,       -- 'todo', 'inProgress', 'completed'
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS RetrospectiveReports (
        id TEXT PRIMARY KEY NOT NULL,
        problemId TEXT NOT NULL,
        situation TEXT NOT NULL,
        starTask TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        learnings TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
      );
    `);
    console.log("[DB] Database tables initialized successfully or already exist.");
  } catch (error) {
    console.error("[DB] Error initializing database tables: ", error);
    throw error; // 호출한 쪽에서 오류를 처리할 수 있도록 다시 throw
  }
};

// getDatabase 함수는 주로 내부 CRUD 함수에서 사용하고,
// initDatabase는 앱 초기화 시 사용합니다.
// 필요에 따라 getDatabase를 직접 export 하여 스토어나 다른 곳에서 사용할 수 있습니다.
export { getDatabase, initDatabase };