// src/store/slices/resultSlice.ts

import { db } from "@/lib/db";
import { results } from "@/lib/db/schema";
import { Result } from "@/types";
import type {
  AppState,
  ResultSlice as ResultSliceInterface,
} from "@/types/storeTypes";
import { asc, eq } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// The parseResultFromDB function is NO LONGER NEEDED.
// Drizzle ORM handles this automatically.

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
      const fetchedResults = await db
        .select()
        .from(results)
        .where(eq(results.parentThreadId, parentThreadId))
        .orderBy(asc(results.createdAt));

      // Client-side logic for merging state without duplicates is preserved.
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
      // Ensure optional date is null, not undefined, for the database
      occurredAt: resultData.occurredAt ?? null,
    };

    try {
      // Drizzle's insert query is type-safe.
      await db.insert(results).values(newResult);

      // CRITICAL: The logic to update the parent ThreadItem is preserved exactly.
      const parentThread = get().getThreadItemById(newResult.parentThreadId);
      if (parentThread) {
        const updatedParent = {
          ...parentThread,
          resultIds: [...(parentThread.resultIds || []), newResult.id],
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
      // Drizzle's update query
      await db
        .update(results)
        .set({
          content: resultToUpdate.content,
          // Ensure optional date is null, not undefined
          occurredAt: resultToUpdate.occurredAt ?? null,
        })
        .where(eq(results.id, resultToUpdate.id));

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
      // Drizzle's delete query
      await db.delete(results).where(eq(results.id, resultId));

      // CRITICAL: The logic to update the parent ThreadItem is preserved exactly.
      const parentThread = get().getThreadItemById(
        resultToDelete.parentThreadId
      );
      if (parentThread && parentThread.resultIds) {
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
    // No changes needed.
    return get().results.find((r) => r.id === id);
  },
});
