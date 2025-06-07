import { StateCreator } from 'zustand';
import { WeeklyProblem } from '@/types';
import type { AppState, WeeklyProblemSlice as WeeklyProblemSliceInterface } from '@/types/storeTypes';
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const parseWeeklyProblemFromDB = (dbItem: any): WeeklyProblem => ({
  id: dbItem.id,
  personaId: dbItem.personaId,
  problemId: dbItem.problemId,
  weekIdentifier: dbItem.weekIdentifier,
  notes: dbItem.notes === null ? undefined : dbItem.notes,
  createdAt: new Date(dbItem.createdAt),
});

export const createWeeklyProblemSlice: StateCreator<AppState, [], [], WeeklyProblemSliceInterface> = (set, get) => ({
  weeklyProblems: [],
  isLoadingWeeklyProblems: false,

  fetchWeeklyProblems: async (options?: { personaId?: string; weekIdentifier?: string; }) => {
    set({ isLoadingWeeklyProblems: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM WeeklyProblems";
      const params: string[] = [];
      const conditions: string[] = [];

      if (options?.personaId) {
        conditions.push("personaId = ?");
        params.push(options.personaId);
      }
      if (options?.weekIdentifier) {
        conditions.push("weekIdentifier = ?");
        params.push(options.weekIdentifier);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY createdAt DESC;";

      const results = await db.getAllAsync<any>(query, params);
      const fetchedWeeklyProblems = results.map(parseWeeklyProblemFromDB);

      // fetch는 보통 전체 또는 일부를 교체하는 방식으로 작동
      // 여기서는 가져온 데이터를 기존 데이터와 병합하여 중복을 제거하고 업데이트
      set(state => {
          const existingIds = new Set(fetchedWeeklyProblems.map(wp => wp.id));
          const otherWeeklyProblems = state.weeklyProblems.filter(wp => !existingIds.has(wp.id));
          const newWeeklyProblemList = [...otherWeeklyProblems, ...fetchedWeeklyProblems]
            .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
          return { weeklyProblems: newWeeklyProblemList, isLoadingWeeklyProblems: false };
      });
      console.log(`[WeeklyProblemSlice] WeeklyProblems fetched with options: ${JSON.stringify(options)}`);
    } catch (error) {
      console.error("[WeeklyProblemSlice] Error fetching weekly problems:", error);
      set({ isLoadingWeeklyProblems: false });
    }
  },

  addWeeklyProblem: async (data) => {
    // 이 액션은 사실상 "해당 주의 문제 설정/변경(Set or Update)"의 역할을 함
    const { personaId, problemId, weekIdentifier, notes } = data;
    const db = await getDatabase();

    try {
      // 해당 페르소나의 해당 주에 이미 설정된 문제가 있는지 확인
      const existingEntry = await db.getFirstAsync<any>(
        `SELECT * FROM WeeklyProblems WHERE personaId = ? AND weekIdentifier = ?;`,
        [personaId, weekIdentifier]
      );

      if (existingEntry) {
        // 이미 있으면, problemId와 notes를 업데이트
        const updatedEntry: WeeklyProblem = {
          ...parseWeeklyProblemFromDB(existingEntry),
          problemId: problemId, // 새 Problem ID로 교체
          notes: notes,
        };
        await db.runAsync(
          `UPDATE WeeklyProblems SET problemId = ?, notes = ? WHERE id = ?;`,
          [
            updatedEntry.problemId,
            updatedEntry.notes === undefined ? null : updatedEntry.notes,
            updatedEntry.id
          ]
        );
        set(state => ({
          weeklyProblems: state.weeklyProblems.map(wp => wp.id === updatedEntry.id ? updatedEntry : wp)
        }));
        console.log(`[WeeklyProblemSlice] WeeklyProblem for ${weekIdentifier} updated.`);
        return updatedEntry;
      } else {
        // 없으면, 새로 추가
        const newEntry: WeeklyProblem = {
          id: uuidv4(),
          createdAt: new Date(),
          ...data,
        };
        await db.runAsync(
          `INSERT INTO WeeklyProblems (id, personaId, problemId, weekIdentifier, notes, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            newEntry.id, newEntry.personaId, newEntry.problemId,
            newEntry.weekIdentifier,
            newEntry.notes === undefined ? null : newEntry.notes,
            newEntry.createdAt.toISOString()
          ]
        );
        set(state => ({ weeklyProblems: [...state.weeklyProblems, newEntry] }));
        console.log(`[WeeklyProblemSlice] WeeklyProblem for ${weekIdentifier} added.`);
        return newEntry;
      }
    } catch (error) {
      console.error("[WeeklyProblemSlice] Error in add/update weekly problem:", error);
      return null;
    }
  },

  updateWeeklyProblem: async (itemToUpdate) => {
    const currentItems = get().weeklyProblems;
    const itemIndex = currentItems.findIndex(i => i.id === itemToUpdate.id);
    if (itemIndex === -1) return null;
    
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE WeeklyProblems SET problemId = ?, weekIdentifier = ?, notes = ? WHERE id = ?;`,
        [
          itemToUpdate.problemId,
          itemToUpdate.weekIdentifier,
          itemToUpdate.notes === undefined ? null : itemToUpdate.notes,
          itemToUpdate.id
        ]
      );
      const updatedItems = currentItems.map(i => i.id === itemToUpdate.id ? itemToUpdate : i);
      set({ weeklyProblems: updatedItems });
      console.log("[WeeklyProblemSlice] WeeklyProblem updated:", itemToUpdate.id);
      return itemToUpdate;
    } catch (error) {
      console.error("[WeeklyProblemSlice] Error updating weekly problem:", error);
      return null;
    }
  },

  deleteWeeklyProblem: async (id) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM WeeklyProblems WHERE id = ?;`, [id]);
      set(state => ({
        weeklyProblems: state.weeklyProblems.filter(wp => wp.id !== id)
      }));
      console.log("[WeeklyProblemSlice] WeeklyProblem deleted:", id);
      return true;
    } catch (error) {
      console.error("[WeeklyProblemSlice] Error deleting weekly problem:", error);
      return false;
    }
  },

  getWeeklyProblemById: (id: string) => {
    return get().weeklyProblems.find(wp => wp.id === id);
  },
});