// src/lib/tagSlice.ts

import { StateCreator } from "zustand";
import { Tag, Problem } from "@/types"; // Problem is needed for updating Problem.tagIds
import type {
  AppState,
  TagSlice as TagSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// Helper to parse Tag from DB record
const parseTagFromDB = (dbItem: any): Tag => ({
  id: dbItem.id,
  name: dbItem.name,
  color: dbItem.color === null ? undefined : dbItem.color, // Handle null from DB for optional color
  createdAt: new Date(dbItem.createdAt),
});

// Helper to sort tags by name
const sortTagsByName = (tags: Tag[]): Tag[] => {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name));
};

export const createTagSlice: StateCreator<
  AppState,
  [],
  [],
  TagSliceInterface
> = (set, get) => ({
  tags: [],
  isLoadingTags: false,

  fetchTags: async () => {
    set({ isLoadingTags: true });
    try {
      const db = await getDatabase();
      const query = "SELECT * FROM Tags ORDER BY name ASC;";
      const results = await db.getAllAsync<any>(query);
      const fetchedTags = results.map(parseTagFromDB);
      set({ tags: fetchedTags, isLoadingTags: false });
      // console.log(`[TagSlice] Tags fetched:`, fetchedTags.length);
    } catch (error) {
      console.error("[TagSlice] Error fetching tags:", error);
      set({ isLoadingTags: false });
    }
  },

  // tagData: Omit<Tag, "id" | "createdAt">
  // Expected to contain: name
  // Optional: color
  addTag: async (tagData) => {
    const newTag: Tag = {
      id: uuidv4(),
      name: tagData.name,
      color: tagData.color,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      // The Tags table has a UNIQUE constraint on the name column.
      // Attempting to insert a duplicate name will result in a SQLiteConstraintError.
      // This should be handled by the caller or UI, e.g., by checking if a tag with that name already exists.
      await db.runAsync(
        `INSERT INTO Tags (id, name, color, createdAt)
         VALUES (?, ?, ?, ?);`,
        [
          newTag.id,
          newTag.name,
          newTag.color === undefined ? null : newTag.color,
          newTag.createdAt.toISOString(),
        ]
      );

      const updatedTags = sortTagsByName([...get().tags, newTag]);
      set({ tags: updatedTags });
      console.log("[TagSlice] Tag added:", newTag.name);
      return newTag;
    } catch (error) {
      // Specifically check for constraint errors if possible, or let the caller handle generic errors.
      // For example, error.message might include "UNIQUE constraint failed: Tags.name"
      console.error(
        "[TagSlice] Error adding tag (possibly duplicate name):",
        error
      );
      return null;
    }
  },

  updateTag: async (tagToUpdate) => {
    const currentTags = get().tags;
    const tagIndex = currentTags.findIndex((t) => t.id === tagToUpdate.id);
    if (tagIndex === -1) {
      console.error("[TagSlice] Tag not found for update:", tagToUpdate.id);
      return null;
    }

    // Ensure createdAt is not part of the update payload to DB if it's immutable
    const { id, createdAt, ...updateData } = tagToUpdate;

    const db = await getDatabase();
    try {
      // Similar to addTag, updating the name to an existing name (not its own) would violate UNIQUE constraint.
      await db.runAsync(
        `UPDATE Tags SET name = ?, color = ?
         WHERE id = ?;`,
        [
          updateData.name,
          updateData.color === undefined ? null : updateData.color,
          id,
        ]
      );

      const updatedTags = sortTagsByName(
        currentTags.map((t) => (t.id === id ? tagToUpdate : t))
      );
      set({ tags: updatedTags });
      console.log("[TagSlice] Tag updated:", tagToUpdate.name);
      return tagToUpdate;
    } catch (error) {
      console.error(
        "[TagSlice] Error updating tag (possibly duplicate name):",
        error
      );
      return null;
    }
  },

  deleteTag: async (tagId) => {
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Tags WHERE id = ?;`, [tagId]);

      // Remove the tagId from all problems that might be using it
      const problemsToUpdate: Problem[] = [];
      get().problems.forEach((problem) => {
        if (problem.tagIds && problem.tagIds.includes(tagId)) {
          problemsToUpdate.push({
            ...problem,
            tagIds: problem.tagIds.filter((id) => id !== tagId),
          });
        }
      });

      // Update each affected problem
      // This uses Promise.all to wait for all updates to complete.
      // Note: updateProblem itself also updates the problem in the DB.
      await Promise.all(
        problemsToUpdate.map((problem) => get().updateProblem(problem))
      );

      const updatedTags = sortTagsByName(
        get().tags.filter((t) => t.id !== tagId)
      );
      set({ tags: updatedTags });
      console.log("[TagSlice] Tag deleted:", tagId);
      return true;
    } catch (error) {
      console.error("[TagSlice] Error deleting tag:", error);
      return false;
    }
  },

  getTagById: (id: string) => {
    return get().tags.find((t) => t.id === id);
  },
});
