// src/store/slices/tagSlice.ts

import { getDatabase } from "@/lib/db";
import { Tag } from "@/types";
import type {
  AppState,
  TagSlice as TagSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * 데이터베이스에서 가져온 데이터를 Tag 타입으로 변환합니다.
 * @param dbItem - 데이터베이스의 row 아이템
 * @returns Tag 타입 객체
 */
const parseTagFromDB = (dbItem: any): Tag => ({
  id: dbItem.id,
  name: dbItem.name,
  color: dbItem.color === null ? undefined : dbItem.color,
});

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
      const db = await getDatabase();
      const dbResults = await db.getAllAsync<any>(
        "SELECT * FROM Tags ORDER BY name ASC;"
      );
      const fetchedTags = dbResults.map(parseTagFromDB);

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
      ...tagData,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Tags (id, name, color) VALUES (?, ?, ?);`,
        [newTag.id, newTag.name, newTag.color ?? null]
      );

      set((state) => ({
        tags: [...state.tags, newTag].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));

      console.log("[TagSlice] Tag added:", newTag.name);
      return newTag;
    } catch (error) {
      // UNIQUE 제약 조건 위반 시 에러가 발생할 수 있습니다.
      console.error("[TagSlice] Error adding tag:", error);
      return null;
    }
  },

  /**
   * 기존 태그를 업데이트합니다.
   */
  updateTag: async (tagToUpdate) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`UPDATE Tags SET name = ?, color = ? WHERE id = ?;`, [
        tagToUpdate.name,
        tagToUpdate.color ?? null,
        tagToUpdate.id,
      ]);

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
   * 참고: 이 작업은 Problem에 연결된 태그 문자열을 자동으로 제거하지 않습니다.
   */
  deleteTag: async (tagId) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Tags WHERE id = ?;`, [tagId]);

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
    return get().tags.find((t) => t.id === id);
  },
});
