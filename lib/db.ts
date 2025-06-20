// lib/db.ts

import { AppConfig } from "./config";
import * as schema from "./db/schema";
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations.js";

// This is the setup for the classic expo-sqlite API
const expoDb = SQLite.openDatabaseSync(AppConfig.DATABASE_NAME);

// The Drizzle instance is now created with the classic DB object
export const db = drizzle(expoDb, { schema });

// The new initialization function using the classic API
export const initDatabase = async () => {
  try {
    // FIX: PRAGMAs should be run on the raw expoDb object or with Drizzle's `sql` helper, not `Bun.sql`.
    // Running directly on the expoDb object is simple and effective.
    await expoDb.execAsync("PRAGMA foreign_keys = ON;");

    console.log("[DB] Running migrations...");
    await migrate(db, migrations);
    console.log("[DB] Migrations finished.");

    // Your existing logic for creating a default user, using Drizzle's syntax
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, AppConfig.LOCAL_USER_ID),
    });

    if (!userResult) {
      console.log("[DB] Default user not found. Creating one...");
      const now = new Date();
      await db.insert(schema.users).values({
        id: AppConfig.LOCAL_USER_ID,
        displayName: "My Profile",
        createdAt: now,
        updatedAt: now,
      });
      console.log("[DB] Default user created successfully.");
    }
    console.log("[DB] Database initialized and ready.");
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
};
