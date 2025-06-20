// types/index.ts

import * as schema from "@/lib/db/schema";

// --- Helper Types (These remain the same) ---

export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";
export type Priority = "high" | "medium" | "low" | "none";
export type ThreadItemType =
  | "General"
  | "Insight"
  | "Bottleneck"
  | "Task"
  | "Action"
  | "Session";
export type ActionStatus = "todo" | "inProgress" | "completed" | "cancelled";
export type ObjectiveType = "persona" | "product";

// --- Drizzle Inferred Main Entity Types ---
// Instead of manually defining interfaces, we infer the types directly
// from the database schema. This ensures they are always in sync.

// This is the raw database model for the 'users' table
export type DbUser = typeof schema.users.$inferSelect;
export interface User extends DbUser {
  links: UserLink[];
}
export type UserLink = typeof schema.userLinks.$inferSelect;
export type Objective = typeof schema.objectives.$inferSelect;
export type Gap = typeof schema.gaps.$inferSelect;
export type WeeklyProblem = typeof schema.weeklyProblems.$inferSelect;
export type Problem = typeof schema.problems.$inferSelect;
export type StarReport = typeof schema.starReports.$inferSelect;
export type Result = typeof schema.results.$inferSelect;
export type Tag = typeof schema.tags.$inferSelect;
export type Todo = typeof schema.todos.$inferSelect;
export type ActiveSession = typeof schema.activeSessions.$inferSelect;

// The ThreadItem type is a special case because it's a discriminated union.
// We define it based on the inferred type from the schema.
// This gives us a base type with all possible fields.
type BaseThreadItemFromDB = typeof schema.threadItems.$inferSelect;

// We can still define the discriminated union for stricter type checking in the app
export interface GeneralThreadItem extends BaseThreadItemFromDB {
  type: "General";
}
export interface InsightThreadItem extends BaseThreadItemFromDB {
  type: "Insight";
}
export interface BottleneckThreadItem extends BaseThreadItemFromDB {
  type: "Bottleneck";
}
export interface TaskThreadItem extends BaseThreadItemFromDB {
  type: "Task";
}
export interface ActionThreadItem extends BaseThreadItemFromDB {
  type: "Action";
}
export interface SessionThreadItem extends BaseThreadItemFromDB {
  type: "Session";
}

// All ThreadItem types are now based on the single, consistent schema type
export type ThreadItem =
  | GeneralThreadItem
  | InsightThreadItem
  | BottleneckThreadItem
  | TaskThreadItem
  | ActionThreadItem
  | SessionThreadItem;

// We also re-export the BaseThreadItem type for convenience if needed
export type BaseThreadItem = BaseThreadItemFromDB;
