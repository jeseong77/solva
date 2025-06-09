// src/store/slices/resultSlice.ts

import { getDatabase } from "@/lib/db";
import { Result } from "@/types";
import type {
  AppState,
  ResultSlice as ResultSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * 데이터베이스에서 가져온 데이터를 Result 타입으로 변환합니다.
 * @param dbItem - 데이터베이스의 row 아이템
 * @returns Result 타입 객체
 */
const parseResultFromDB = (dbItem: any): Result => ({
  id: dbItem.id,
  parentThreadId: dbItem.parentThreadId,
  content: dbItem.content,
  occurredAt: dbItem.occurredAt ? new Date(dbItem.occurredAt) : undefined,
  createdAt: new Date(dbItem.createdAt),
});

export const createResultSlice: StateCreator<
  AppState,
  [],
  [],
  ResultSliceInterface
> = (set, get) => ({
  results: [],
  isLoadingResults: false,

  /**
   * 특정 스레드 아이템에 속한 모든 Result를 불러옵니다.
   */
  fetchResults: async (parentThreadId: string) => {
    set({ isLoadingResults: true });
    try {
      const db = await getDatabase();
      const dbResults = await db.getAllAsync<any>(
        "SELECT * FROM Results WHERE parentThreadId = ? ORDER BY createdAt ASC;",
        [parentThreadId]
      );
      const fetchedResults = dbResults.map(parseResultFromDB);

      // 기존 상태와 병합
      const existingIds = new Set(fetchedResults.map((r) => r.id));
      const untouchedResults = get().results.filter(
        (r) => !existingIds.has(r.id)
      );

      set({
        results: [...untouchedResults, ...fetchedResults],
        isLoadingResults: false,
      });

      console.log(
        `[ResultSlice] ${fetchedResults.length} results fetched for thread ${parentThreadId}.`
      );
    } catch (error) {
      console.error("[ResultSlice] Error fetching results:", error);
      set({ isLoadingResults: false });
    }
  },

  /**
   * 새로운 Result를 추가하고, 부모 ThreadItem의 resultIds를 업데이트합니다.
   */
  addResult: async (resultData) => {
    const newResult: Result = {
      id: uuidv4(),
      createdAt: new Date(),
      ...resultData,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Results (id, parentThreadId, content, occurredAt, createdAt)
         VALUES (?, ?, ?, ?, ?);`,
        [
          newResult.id,
          newResult.parentThreadId,
          newResult.content,
          newResult.occurredAt?.toISOString() ?? null,
          newResult.createdAt.toISOString(),
        ]
      );

      // 부모 ThreadItem의 resultIds 배열에 새 ID 추가
      const parentThread = get().getThreadItemById(newResult.parentThreadId);
      if (parentThread) {
        const updatedParent = {
          ...parentThread,
          resultIds: [...parentThread.resultIds, newResult.id],
        };
        await get().updateThreadItem(updatedParent);
      }

      set((state) => ({
        results: [...state.results, newResult],
      }));

      console.log("[ResultSlice] Result added:", newResult.id);
      return newResult;
    } catch (error) {
      console.error("[ResultSlice] Error adding result:", error);
      return null;
    }
  },

  /**
   * 기존 Result를 업데이트합니다.
   */
  updateResult: async (resultToUpdate) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Results SET content = ?, occurredAt = ? WHERE id = ?;`,
        [
          resultToUpdate.content,
          resultToUpdate.occurredAt?.toISOString() ?? null,
          resultToUpdate.id,
        ]
      );

      set((state) => ({
        results: state.results.map((r) =>
          r.id === resultToUpdate.id ? resultToUpdate : r
        ),
      }));

      console.log("[ResultSlice] Result updated:", resultToUpdate.id);
      return resultToUpdate;
    } catch (error) {
      console.error("[ResultSlice] Error updating result:", error);
      return null;
    }
  },

  /**
   * Result를 삭제하고, 부모 ThreadItem의 resultIds를 업데이트합니다.
   */
  deleteResult: async (resultId) => {
    const resultToDelete = get().getResultById(resultId);
    if (!resultToDelete) return false;

    try {
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Results WHERE id = ?;`, [resultId]);

      // 부모 ThreadItem의 resultIds 배열에서 ID 제거
      const parentThread = get().getThreadItemById(
        resultToDelete.parentThreadId
      );
      if (parentThread) {
        const updatedParent = {
          ...parentThread,
          resultIds: parentThread.resultIds.filter((id) => id !== resultId),
        };
        await get().updateThreadItem(updatedParent);
      }

      set((state) => ({
        results: state.results.filter((r) => r.id !== resultId),
      }));

      console.log("[ResultSlice] Result deleted:", resultId);
      return true;
    } catch (error) {
      console.error("[ResultSlice] Error deleting result:", error);
      return false;
    }
  },

  /**
   * ID로 Result를 동기적으로 조회합니다.
   */
  getResultById: (id: string) => {
    return get().results.find((r) => r.id === id);
  },
});
