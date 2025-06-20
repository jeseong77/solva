// src/store/slices/tagSlice.ts

import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { Tag } from "@/types";
import type {
  AppState,
  TagSlice as TagSliceInterface,
} from "@/types/storeTypes";
import { asc, eq } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// The parseTagFromDB function is NO LONGER NEEDED.

export const createTagSlice: StateCreator<
  AppState,
  [],
  [],
  TagSliceInterface
> = (set, get) => ({
  tags: [],
  isLoadingTags: false,

  /**
   * 데이터베이스에서 모든 태그를 불러옵니다.
   */
  fetchTags: async () => {
    set({ isLoadingTags: true });
    try {
      const fetchedTags = await db.select().from(tags).orderBy(asc(tags.name));

      set({
        tags: fetchedTags,
        isLoadingTags: false,
      });

      console.log(`[TagSlice] ${fetchedTags.length} tags fetched.`);
    } catch (error) {
      console.error("[TagSlice] Error fetching tags:", error);
      set({ isLoadingTags: false });
    }
  },

  /**
   * 새로운 태그를 추가합니다. 태그 이름은 고유해야 합니다.
   */
  addTag: async (tagData) => {
    const newTag: Tag = {
      id: uuidv4(),
      name: tagData.name,
      // Ensure optional color is null, not undefined, for the database
      color: tagData.color ?? null,
    };

    try {
      // Drizzle's insert is type-safe
      await db.insert(tags).values(newTag);

      // State update and sorting logic is preserved
      set((state) => ({
        tags: [...state.tags, newTag].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));

      console.log("[TagSlice] Tag added:", newTag.name);
      return newTag;
    } catch (error) {
      // UNIQUE constraint violation on 'name' will be caught here
      console.error("[TagSlice] Error adding tag:", error);
      return null;
    }
  },

  /**
   * 기존 태그를 업데이트합니다.
   */
  updateTag: async (tagToUpdate) => {
    try {
      // Drizzle's update query
      await db
        .update(tags)
        .set({
          name: tagToUpdate.name,
          color: tagToUpdate.color ?? null,
        })
        .where(eq(tags.id, tagToUpdate.id));

      // State update and sorting logic is preserved
      set((state) => ({
        tags: state.tags
          .map((t) => (t.id === tagToUpdate.id ? tagToUpdate : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));

      console.log("[TagSlice] Tag updated:", tagToUpdate.name);
      return tagToUpdate;
    } catch (error) {
      console.error("[TagSlice] Error updating tag:", error);
      return null;
    }
  },

  /**
   * 태그를 삭제합니다.
   */
  deleteTag: async (tagId) => {
    try {
      // Drizzle's delete query
      await db.delete(tags).where(eq(tags.id, tagId));

      set((state) => ({
        tags: state.tags.filter((t) => t.id !== tagId),
      }));

      console.log("[TagSlice] Tag deleted:", tagId);
      return true;
    } catch (error) {
      console.error("[TagSlice] Error deleting tag:", error);
      return false;
    }
  },

  /**
   * ID로 태그를 동기적으로 조회합니다.
   */
  getTagById: (id: string) => {
    // No changes needed
    return get().tags.find((t) => t.id === id);
  },
});
