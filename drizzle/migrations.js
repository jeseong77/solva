// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
// import m0000 from './0000_modern_loki.sql';

const m0000 = `
CREATE TABLE "active_sessions" (
	"thread_id" text PRIMARY KEY NOT NULL,
	"start_time" integer NOT NULL,
	"is_paused" integer DEFAULT false NOT NULL,
	"paused_time" integer DEFAULT 0 NOT NULL,
	FOREIGN KEY ("thread_id") REFERENCES "thread_items"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "gaps" (
	"id" text PRIMARY KEY NOT NULL,
	"objective_id" text NOT NULL,
	"title" text NOT NULL,
	"ideal_state" text NOT NULL,
	"current_state" text NOT NULL,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"objective_goals" text,
	"cover_image_uri" text,
	"avatar_image_uri" text,
	"icon" text,
	"color" text,
	"order" integer,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "problem_tags" (
	"problem_id" text NOT NULL,
	"tag_id" text NOT NULL,
	PRIMARY KEY("problem_id", "tag_id"),
	FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY NOT NULL,
	"objective_id" text NOT NULL,
	"gap_id" text,
	"title" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"urgency" integer,
	"importance" integer,
	"tags" text DEFAULT '[]',
	"child_thread_ids" text DEFAULT '[]',
	"time_spent" integer DEFAULT 0 NOT NULL,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	"resolved_at" integer,
	"archived_at" integer,
	"star_report_id" text,
	FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY ("gap_id") REFERENCES "gaps"("id") ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_thread_id" text NOT NULL,
	"content" text NOT NULL,
	"occurred_at" integer,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY ("parent_thread_id") REFERENCES "thread_items"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "star_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"problem_id" text NOT NULL,
	"situation" text NOT NULL,
	"task" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"learnings" text,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "star_reports_problem_id_unique" ON "star_reports" ("problem_id");--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique" ON "tags" ("name");--> statement-breakpoint
CREATE TABLE "thread_items" (
	"id" text PRIMARY KEY NOT NULL,
	"problem_id" text NOT NULL,
	"parent_id" text,
	"child_thread_ids" text DEFAULT '[]',
	"author_id" text,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"is_important" integer DEFAULT false,
	"result_ids" text DEFAULT '[]',
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	"is_resolved" integer,
	"is_completed" integer,
	"status" text,
	"deadline" integer,
	"completed_at" integer,
	"time_spent" integer,
	"start_time" integer,
	FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY ("parent_id") REFERENCES "thread_items"("id") ON UPDATE no action ON DELETE set null,
	FOREIGN KEY ("author_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"is_completed" integer DEFAULT false NOT NULL,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	"completed_at" integer
);
--> statement-breakpoint
CREATE TABLE "user_links" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"title" text,
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"username" text,
	"email" text,
	"bio" text,
	"introduction" text,
	"avatar_image_uri" text,
	"cover_image_uri" text,
	"location" text,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	"updated_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_problems" (
	"id" text PRIMARY KEY NOT NULL,
	"objective_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"week_identifier" text NOT NULL,
	"notes" text,
	"created_at" integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON UPDATE no action ON DELETE cascade
);

`;

  export default {
    journal,
    migrations: {
      m0000
    }
  }
  