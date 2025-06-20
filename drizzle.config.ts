import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "expo", // This is crucial for Expo SQLite
  schema: "./lib/db/schema.ts", // Path to the schema file we created
  out: "./drizzle", // Folder where migration files will be stored
});
