// src/store/slices/weeklyProblemSlice.ts

import { getDatabase } from "@/lib/db";
import { WeeklyProblem } from "@/types";
import type {
  AppState,
  WeeklyProblemSlice as WeeklyProblemSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * 데이터베이스에서 가져온 데이터를 WeeklyProblem 타입으로 변환합니다.
 * @param dbItem - 데이터베이스의 row 아이템
 * @returns WeeklyProblem 타입 객체
 */
const parseWeeklyProblemFromDB = (dbItem: any): WeeklyProblem => ({
  id: dbItem.id,
  personaId: dbItem.personaId,
  problemId: dbItem.problemId,
  weekIdentifier: dbItem.weekIdentifier,
  notes: dbItem.notes === null ? undefined : dbItem.notes,
  createdAt: new Date(dbItem.createdAt),
});

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
   * 페르소나 ID 또는 주간 식별자로 필터링할 수 있습니다.
   */
  fetchWeeklyProblems: async (options) => {
    set({ isLoadingWeeklyProblems: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM WeeklyProblems";
      const params: string[] = [];
      const conditions: string[] = [];

      if (options.personaId) {
        conditions.push("personaId = ?");
        params.push(options.personaId);
      }
      if (options.weekIdentifier) {
        conditions.push("weekIdentifier = ?");
        params.push(options.weekIdentifier);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
      query += " ORDER BY createdAt DESC;";

      const results = await db.getAllAsync<any>(query, params);
      const fetchedProblems = results.map(parseWeeklyProblemFromDB);

      // 기존 상태와 병합하여 중복 방지
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
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO WeeklyProblems (id, personaId, problemId, weekIdentifier, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          newWeeklyProblem.id,
          newWeeklyProblem.personaId,
          newWeeklyProblem.problemId,
          newWeeklyProblem.weekIdentifier,
          newWeeklyProblem.notes ?? null, // undefined를 null로 변환
          newWeeklyProblem.createdAt.toISOString(),
        ]
      );

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
      const db = await getDatabase();
      await db.runAsync(`UPDATE WeeklyProblems SET notes = ? WHERE id = ?;`, [
        weeklyProblemToUpdate.notes ?? null,
        weeklyProblemToUpdate.id,
      ]);

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
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM WeeklyProblems WHERE id = ?;`, [
        weeklyProblemId,
      ]);

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
    return get().weeklyProblems.find((wp) => wp.id === id);
  },
});
