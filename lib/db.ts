// lib/db.ts
import { User } from "@/types";
import * as SQLite from "expo-sqlite";
import { AppConfig } from "./config";

// ✅ [수정] 버전 2 마이그레이션 스크립트를 구체적으로 작성합니다.
const MIGRATIONS: { [key: number]: string[] } = {
  // 버전 1: 초기 스키마 (기존 사용자의 데이터베이스가 이 구조를 가집니다)
  1: [
    `PRAGMA journal_mode = WAL;`,
    `PRAGMA foreign_keys = ON;`,
    `CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY NOT NULL, displayName TEXT NOT NULL, username TEXT, email TEXT, bio TEXT,
      introduction TEXT, avatarImageUri TEXT, coverImageUri TEXT, location TEXT, links TEXT,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS Personas (
      id TEXT PRIMARY KEY NOT NULL, userId TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
      personaGoals TEXT, coverImageUri TEXT, avatarImageUri TEXT, icon TEXT, color TEXT,
      problemIds TEXT NOT NULL DEFAULT '[]', createdAt TEXT NOT NULL, "order" INTEGER,
      FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Problems (
      id TEXT PRIMARY KEY NOT NULL, personaId TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
      status TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'none', urgency INTEGER, importance INTEGER, 
      tags TEXT, childThreadIds TEXT NOT NULL DEFAULT '[]', timeSpent INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL, resolvedAt TEXT, archivedAt TEXT, starReportId TEXT UNIQUE,
      FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS WeeklyProblems (
      id TEXT PRIMARY KEY NOT NULL, personaId TEXT NOT NULL, problemId TEXT NOT NULL,
      weekIdentifier TEXT NOT NULL, notes TEXT, createdAt TEXT NOT NULL,
      FOREIGN KEY (personaId) REFERENCES Personas(id) ON DELETE CASCADE,
      FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
    );`,
    // ... 나머지 모든 CREATE TABLE 구문들 ...
    `CREATE TABLE IF NOT EXISTS Todos (
      id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL, isCompleted INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL, completedAt TEXT
    );`,
  ],
  // ✅ [작성] 버전 2 마이그레이션 스크립트
  2: [
    // 1. Personas 테이블 이름을 Objectives로 변경
    `ALTER TABLE Personas RENAME TO Objectives;`,
    // 2. Objectives 테이블에 objectiveGoals 컬럼 추가 (향후 personaGoals 제거를 위함)
    `ALTER TABLE Objectives ADD COLUMN objectiveGoals TEXT;`,
    // 3. 기존 personaGoals 데이터를 새로운 objectiveGoals 컬럼으로 복사
    `UPDATE Objectives SET objectiveGoals = personaGoals;`,
    // 4. Objectives 테이블에 type 컬럼 추가
    `ALTER TABLE Objectives ADD COLUMN type TEXT;`,
    // 5. 기존 데이터는 모두 'persona' 타입으로 설정
    `UPDATE Objectives SET type = 'persona' WHERE type IS NULL;`,
    // 6. Problems 테이블의 personaId 컬럼 이름을 objectiveId로 변경
    `ALTER TABLE Problems RENAME COLUMN personaId TO objectiveId;`,
    // 7. WeeklyProblems 테이블의 personaId 컬럼 이름을 objectiveId로 변경
    `ALTER TABLE WeeklyProblems RENAME COLUMN personaId TO objectiveId;`,
    // 8. Gaps 테이블 신규 생성
    `CREATE TABLE IF NOT EXISTS Gaps (
      id TEXT PRIMARY KEY NOT NULL,
      objectiveId TEXT NOT NULL,
      title TEXT NOT NULL,
      idealState TEXT NOT NULL,
      currentState TEXT NOT NULL,
      problemIds TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE
    );`,
    // 참고: SQLite는 ALTER TABLE로 컬럼을 삭제하는 기능(DROP COLUMN)을 최근에야 지원하기 시작했습니다.
    // 호환성을 위해 personaGoals 컬럼은 일단 남겨두는 것이 안전할 수 있습니다.
  ],
};

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync(AppConfig.DATABASE_NAME);
}

export const initDatabase = async () => {
  const db = await getDatabase();
  try {
    const { user_version: currentVersion } = (await db.getFirstAsync<{
      user_version: number;
    }>("PRAGMA user_version;")) ?? { user_version: 0 };

    console.log(
      `[DB] 현재 DB 버전: ${currentVersion}, 목표 DB 버전: ${AppConfig.LATEST_DB_VERSION}`
    );

    if (currentVersion >= AppConfig.LATEST_DB_VERSION) {
      console.log("[DB] DB가 최신 버전입니다.");
      await db.execAsync("PRAGMA foreign_keys = ON;");
      return;
    }

    console.log(`[DB] 마이그레이션을 시작합니다...`);
    for (let v = currentVersion + 1; v <= AppConfig.LATEST_DB_VERSION; v++) {
      const scripts = MIGRATIONS[v];
      if (scripts) {
        console.log(`[DB] 버전 ${v}로 마이그레이션 중...`);
        await db.withTransactionAsync(async () => {
          for (const script of scripts) {
            await db.execAsync(script);
          }
        });
        await db.execAsync(`PRAGMA user_version = ${v};`);
        console.log(`[DB] 버전 ${v}로 마이그레이션 완료.`);
      }
    }

    // --- 기본 사용자 데이터 생성 확인 (마이그레이션 후 실행) ---
    const userResult = await db.getFirstAsync<User>(
      "SELECT * FROM Users WHERE id = ?;",
      AppConfig.LOCAL_USER_ID
    );

    if (!userResult) {
      console.log("[DB] Default user not found. Creating one...");
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO Users (id, displayName, links, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);`,
        [AppConfig.LOCAL_USER_ID, "My Profile", "[]", now, now]
      );
      console.log("[DB] Default user created successfully.");
    }

    console.log("[DB] 모든 테이블과 데이터가 준비되었습니다.");
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
};
