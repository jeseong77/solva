// lib/db.ts
import { User } from "@/types";
import * as SQLite from "expo-sqlite";
import { AppConfig } from "./config";

const MIGRATIONS: { [key: number]: string[] } = {
  1: [
    // Users 테이블
    `CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY NOT NULL, 
      displayName TEXT NOT NULL, 
      username TEXT, 
      email TEXT, 
      bio TEXT,
      introduction TEXT, 
      avatarImageUri TEXT, 
      coverImageUri TEXT, 
      location TEXT, 
      links TEXT,
      createdAt TEXT NOT NULL, 
      updatedAt TEXT NOT NULL
    );`,

    // Objectives 테이블
    `CREATE TABLE IF NOT EXISTS Objectives (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      coverImageUri TEXT,
      avatarImageUri TEXT,
      icon TEXT,
      color TEXT,
      createdAt TEXT NOT NULL,
      "order" INTEGER,
      objectiveGoals TEXT,
      type TEXT,
      FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    );`,

    // Gaps 테이블
    `CREATE TABLE IF NOT EXISTS Gaps (
      id TEXT PRIMARY KEY NOT NULL,
      objectiveId TEXT NOT NULL,
      title TEXT NOT NULL,
      idealState TEXT NOT NULL,
      currentState TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE
    );`,

    // Problems 테이블
    `CREATE TABLE IF NOT EXISTS Problems (
      id TEXT PRIMARY KEY NOT NULL,
      objectiveId TEXT NOT NULL,
      gapId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      urgency INTEGER,
      importance INTEGER,
      tags TEXT,
      childThreadIds TEXT NOT NULL,
      timeSpent INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      resolvedAt TEXT,
      archivedAt TEXT,
      starReportId TEXT UNIQUE,
      FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE,
      FOREIGN KEY (gapId) REFERENCES Gaps(id) ON DELETE SET NULL
    );`,

    // ThreadItems 테이블
    `CREATE TABLE IF NOT EXISTS ThreadItems (
      id TEXT PRIMARY KEY NOT NULL,
      problemId TEXT NOT NULL,
      parentId TEXT,
      childThreadIds TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      isImportant INTEGER,
      resultIds TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      authorId TEXT,
      isResolved INTEGER, -- For BottleneckThreadItem
      isCompleted INTEGER, -- For TaskThreadItem
      status TEXT, -- For ActionThreadItem
      timeSpent INTEGER, -- For ActionThreadItem and SessionThreadItem
      deadline TEXT, -- For ActionThreadItem
      completedAt TEXT, -- For ActionThreadItem
      startTime TEXT, -- For SessionThreadItem
      FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES ThreadItems(id) ON DELETE CASCADE
    );`,

    // StarReports 테이블
    `CREATE TABLE IF NOT EXISTS StarReports (
      id TEXT PRIMARY KEY NOT NULL,
      problemId TEXT NOT NULL,
      situation TEXT NOT NULL,
      task TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL,
      learnings TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
    );`,

    // WeeklyProblems 테이블
    `CREATE TABLE IF NOT EXISTS WeeklyProblems (
      id TEXT PRIMARY KEY NOT NULL,
      objectiveId TEXT NOT NULL,
      problemId TEXT NOT NULL,
      weekIdentifier TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (objectiveId) REFERENCES Objectives(id) ON DELETE CASCADE,
      FOREIGN KEY (problemId) REFERENCES Problems(id) ON DELETE CASCADE
    );`,

    // Todos 테이블
    `CREATE TABLE IF NOT EXISTS Todos (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      isCompleted INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      completedAt TEXT
    );`,

    // Results 테이블
    `CREATE TABLE IF NOT EXISTS Results (
      id TEXT PRIMARY KEY NOT NULL,
      parentThreadId TEXT NOT NULL,
      content TEXT NOT NULL,
      occurredAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (parentThreadId) REFERENCES ThreadItems(id) ON DELETE CASCADE
    );`,

    // Tags 테이블
    `CREATE TABLE IF NOT EXISTS Tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT
    );`,
  ],
};

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync(AppConfig.DATABASE_NAME);
}

export const initDatabase = async () => {
  const db = await getDatabase();
  try {
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA foreign_keys = ON;");
    const { user_version: currentVersion } = (await db.getFirstAsync<{
      user_version: number;
    }>("PRAGMA user_version;")) ?? { user_version: 0 };

    console.log(
      `[DB] 현재 DB 버전: ${currentVersion}, 목표 DB 버전: ${AppConfig.LATEST_DB_VERSION}`
    );

    if (currentVersion >= AppConfig.LATEST_DB_VERSION) {
      console.log("[DB] DB가 최신 버전입니다.");
      return;
    }

    console.log(`[DB] 마이그레이션을 시작합니다...`);
    await db.execAsync("PRAGMA foreign_keys = OFF;");

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

    await db.execAsync("PRAGMA foreign_keys = ON;");

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
    await db.execAsync("PRAGMA foreign_keys = ON;");
    throw error;
  }
};
