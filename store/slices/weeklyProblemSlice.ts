// src/store/slices/weeklyProblemSlice.ts

import { db } from "@/lib/db";
import { weeklyProblems } from "@/lib/db/schema";
import { WeeklyProblem } from "@/types";
import type {
  AppState,
  WeeklyProblemSlice as WeeklyProblemSliceInterface,
} from "@/types/storeTypes";
import { and, desc, eq, SQL } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// The parseWeeklyProblemFromDB function is NO LONGER NEEDED.

export const createWeeklyProblemSlice: StateCreator<
  AppState,
  [],
  [],
  WeeklyProblemSliceInterface
> = (set, get) => ({
  weeklyProblems: [],
  isLoadingWeeklyProblems: false,

  /**
   * 데이터베이스에서 주간 문제 목록을 가져옵니다.
   * Objective ID 또는 주간 식별자로 필터링할 수 있습니다.
   */
  fetchWeeklyProblems: async (options) => {
    set({ isLoadingWeeklyProblems: true });
    try {
      // Drizzle handles dynamic WHERE clauses cleanly.
      const conditions: (SQL | undefined)[] = [];
      if (options.objectiveId) {
        conditions.push(eq(weeklyProblems.objectiveId, options.objectiveId));
      }
      if (options.weekIdentifier) {
        conditions.push(
          eq(weeklyProblems.weekIdentifier, options.weekIdentifier)
        );
      }

      const fetchedProblems = await db
        .select()
        .from(weeklyProblems)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(weeklyProblems.createdAt));

      // Client-side logic for merging state without duplicates is preserved.
      const existingIds = new Set(fetchedProblems.map((p) => p.id));
      const filteredOldProblems = get().weeklyProblems.filter(
        (p) => !existingIds.has(p.id)
      );

      set({
        weeklyProblems: [...filteredOldProblems, ...fetchedProblems],
        isLoadingWeeklyProblems: false,
      });

      console.log(
        `[WeeklyProblemSlice] ${fetchedProblems.length} weekly problems fetched.`
      );
    } catch (error) {
      console.error(
        "[WeeklyProblemSlice] Error fetching weekly problems:",
        error
      );
      set({ isLoadingWeeklyProblems: false });
    }
  },

  /**
   * 새로운 주간 문제를 추가합니다.
   */
  addWeeklyProblem: async (weeklyProblemData) => {
    const newWeeklyProblem: WeeklyProblem = {
      id: uuidv4(),
      createdAt: new Date(),
      ...weeklyProblemData,
      // Ensure optional notes is null, not undefined, for the database
      notes: weeklyProblemData.notes ?? null,
    };

    try {
      // Drizzle's type-safe insert
      await db.insert(weeklyProblems).values(newWeeklyProblem);

      set((state) => ({
        weeklyProblems: [...state.weeklyProblems, newWeeklyProblem],
      }));

      console.log(
        "[WeeklyProblemSlice] Weekly problem added:",
        newWeeklyProblem.id
      );
      return newWeeklyProblem;
    } catch (error) {
      console.error("[WeeklyProblemSlice] Error adding weekly problem:", error);
      return null;
    }
  },

  /**
   * 기존 주간 문제를 업데이트합니다. (주로 notes 필드 수정에 사용)
   */
  updateWeeklyProblem: async (weeklyProblemToUpdate) => {
    try {
      // Drizzle's type-safe update
      await db
        .update(weeklyProblems)
        .set({
          notes: weeklyProblemToUpdate.notes,
        })
        .where(eq(weeklyProblems.id, weeklyProblemToUpdate.id));

      set((state) => ({
        weeklyProblems: state.weeklyProblems.map((wp) =>
          wp.id === weeklyProblemToUpdate.id ? weeklyProblemToUpdate : wp
        ),
      }));

      console.log(
        "[WeeklyProblemSlice] Weekly problem updated:",
        weeklyProblemToUpdate.id
      );
      return weeklyProblemToUpdate;
    } catch (error) {
      console.error(
        "[WeeklyProblemSlice] Error updating weekly problem:",
        error
      );
      return null;
    }
  },

  /**
   * 특정 주간 문제를 ID로 삭제합니다.
   */
  deleteWeeklyProblem: async (weeklyProblemId) => {
    try {
      // Drizzle's type-safe delete
      await db
        .delete(weeklyProblems)
        .where(eq(weeklyProblems.id, weeklyProblemId));

      set((state) => ({
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.id !== weeklyProblemId
        ),
      }));

      console.log(
        "[WeeklyProblemSlice] Weekly problem deleted:",
        weeklyProblemId
      );
      return true;
    } catch (error) {
      console.error(
        "[WeeklyProblemSlice] Error deleting weekly problem:",
        error
      );
      return false;
    }
  },

  /**
   * ID로 특정 주간 문제를 동기적으로 조회합니다.
   */
  getWeeklyProblemById: (id: string) => {
    // No changes needed
    return get().weeklyProblems.find((wp) => wp.id === id);
  },
});
