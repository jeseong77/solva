import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm"; 
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// --- Tables ---


/**
 * Users: Stores user profile information.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  username: text("username"),
  email: text("email"),
  bio: text("bio"),
  introduction: text("introduction"),
  avatarImageUri: text("avatar_image_uri"),
  coverImageUri: text("cover_image_uri"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * UserLinks: Stores external links associated with a user.
 */
export const userLinks = sqliteTable("user_links", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform", {
    enum: ["website", "github", "linkedin", "twitter", "instagram", "other"],
  }).notNull(),
  url: text("url").notNull(),
  title: text("title"),
});

export const usersRelations = relations(users, ({ many }) => ({
  links: many(userLinks),
}));

export const userLinksRelations = relations(userLinks, ({ one }) => ({
  user: one(users, {
    fields: [userLinks.userId],
    references: [users.id],
  }),
}));

/**
 * Objectives: High-level goals or areas of focus for a user.
 */
export const objectives = sqliteTable("objectives", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["persona", "product"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  objectiveGoals: text("objective_goals"),
  coverImageUri: text("cover_image_uri"),
  avatarImageUri: text("avatar_image_uri"),
  icon: text("icon"),
  color: text("color"),
  order: integer("order"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * Gaps: The space between the current and ideal state for an Objective.
 */
export const gaps = sqliteTable("gaps", {
  id: text("id").primaryKey(),
  objectiveId: text("objective_id")
    .notNull()
    .references(() => objectives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  idealState: text("ideal_state").notNull(),
  currentState: text("current_state").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * Problems: Specific challenges or issues tied to an Objective.
 */
export const problems = sqliteTable("problems", {
  id: text("id").primaryKey(),
  objectiveId: text("objective_id")
    .notNull()
    .references(() => objectives.id, { onDelete: "cascade" }),
  gapId: text("gap_id").references(() => gaps.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["active", "onHold", "resolved", "archived"],
  }).notNull(),
  priority: text("priority", {
    enum: ["high", "medium", "low", "none"],
  }).notNull(),
  urgency: integer("urgency"),
  importance: integer("importance"),
  // FIX: Use text column with mode: 'json' instead of the old json() helper.
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .default(sql`'[]'`),
  childThreadIds: text("child_thread_ids", { mode: "json" })
    .$type<string[]>()
    .default(sql`'[]'`),
  timeSpent: integer("time_spent").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  starReportId: text("star_report_id"),
});

/**
 * WeeklyProblems: A join table to associate problems with a specific week.
 */
export const weeklyProblems = sqliteTable("weekly_problems", {
  id: text("id").primaryKey(),
  objectiveId: text("objective_id")
    .notNull()
    .references(() => objectives.id, { onDelete: "cascade" }),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  weekIdentifier: text("week_identifier").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * ThreadItems: Represents a polymorphic entity for all types of thread items.
 */
export const threadItems = sqliteTable("thread_items", {
  id: text("id").primaryKey(),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): any => threadItems.id, {
    onDelete: "set null",
  }),
  childThreadIds: text("child_thread_ids", { mode: "json" })
    .$type<string[]>()
    .default(sql`'[]'`),
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  type: text("type", {
    enum: ["General", "Insight", "Bottleneck", "Task", "Action", "Session"],
  }).notNull(),
  content: text("content").notNull(),
  isImportant: integer("is_important", { mode: "boolean" }).default(false),
  resultIds: text("result_ids", { mode: "json" })
    .$type<string[]>()
    .default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),

  // Bottleneck-specific
  isResolved: integer("is_resolved", { mode: "boolean" }),

  // Task-specific
  isCompleted: integer("is_completed", { mode: "boolean" }),

  // Action-specific
  status: text("status", {
    enum: ["todo", "inProgress", "completed", "cancelled"],
  }),
  deadline: integer("deadline", { mode: "timestamp_ms" }),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),

  // Action & Session specific
  timeSpent: integer("time_spent"),

  // Session-specific
  startTime: integer("start_time", { mode: "timestamp_ms" }),
});

/**
 * Results: Concrete outcomes or deliverables attached to a ThreadItem.
 */
export const results = sqliteTable("results", {
  id: text("id").primaryKey(),
  parentThreadId: text("parent_thread_id")
    .notNull()
    .references(() => threadItems.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * StarReports: A retrospective report written after resolving a problem.
 */
export const starReports = sqliteTable("star_reports", {
  id: text("id").primaryKey(),
  problemId: text("problem_id")
    .notNull()
    .unique()
    .references(() => problems.id, { onDelete: "cascade" }),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  learnings: text("learnings"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * Tags: Reusable tags that can be associated with problems.
 */
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color"),
});

/**
 * ProblemTags: A join table to create a many-to-many relationship.
 */
export const problemTags = sqliteTable(
  "problem_tags",
  {
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.problemId, t.tagId] }),
  })
);

/**
 * ActiveSession: Tracks a currently running session timer.
 */
export const activeSessions = sqliteTable("active_sessions", {
  threadId: text("thread_id")
    .primaryKey()
    .references(() => threadItems.id, { onDelete: "cascade" }),
  startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
  isPaused: integer("is_paused", { mode: "boolean" }).notNull().default(false),
  // FIX: Wrap the default numeric value in the sql`` helper.
  pausedTime: integer("paused_time", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`0`),
});

/**
 * Todos: Standalone to-do items.
 */
export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});
