// store/gapSlice.ts

import { getDatabase } from "@/lib/db";
import { Gap } from "@/types";
import type { AppState, GapSlice } from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// DB에서 읽어온 데이터를 Gap 객체로 파싱하는 헬퍼 함수
const parseGapFromDB = (dbItem: any): Gap => ({
  id: dbItem.id,
  objectiveId: dbItem.objectiveId,
  title: dbItem.title,
  idealState: dbItem.idealState,
  currentState: dbItem.currentState,
  problemIds: dbItem.problemIds ? JSON.parse(dbItem.problemIds) : [],
  createdAt: new Date(dbItem.createdAt),
});

export const createGapSlice: StateCreator<AppState, [], [], GapSlice> = (
  set,
  get
) => ({
  gaps: [],
  isLoadingGaps: false,

  fetchGaps: async (objectiveId: string) => {
    set({ isLoadingGaps: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM Gaps WHERE objectiveId = ? ORDER BY createdAt ASC;",
        [objectiveId]
      );
      const fetchedGaps = results.map(parseGapFromDB);

      // 기존 Gaps 배열에서 해당 objectiveId에 속한 것들만 제외하고, 새로 불러온 데이터로 교체
      set((state) => ({
        gaps: [
          ...state.gaps.filter((g) => g.objectiveId !== objectiveId),
          ...fetchedGaps,
        ],
        isLoadingGaps: false,
      }));
      console.log(
        `[GapSlice] ${fetchedGaps.length} gaps fetched for objective ${objectiveId}.`
      );
    } catch (error) {
      console.error(
        `[GapSlice] Error fetching gaps for objective ${objectiveId}:`,
        error
      );
      set({ isLoadingGaps: false });
    }
  },

  addGap: async (gapData) => {
    const newGap: Gap = {
      id: uuidv4(),
      objectiveId: gapData.objectiveId,
      title: gapData.title,
      idealState: gapData.idealState,
      currentState: gapData.currentState,
      problemIds: [],
      createdAt: new Date(),
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Gaps (id, objectiveId, title, idealState, currentState, problemIds, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          newGap.id,
          newGap.objectiveId,
          newGap.title,
          newGap.idealState,
          newGap.currentState,
          JSON.stringify(newGap.problemIds),
          newGap.createdAt.toISOString(),
        ]
      );

      set((state) => ({ gaps: [...state.gaps, newGap] }));
      console.log("[GapSlice] Gap added:", newGap.title);
      return newGap;
    } catch (error) {
      console.error("[GapSlice] Error adding gap:", error);
      return null;
    }
  },

  updateGap: async (gapToUpdate) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Gaps SET title = ?, idealState = ?, currentState = ?, problemIds = ?
           WHERE id = ?;`,
        [
          gapToUpdate.title,
          gapToUpdate.idealState,
          gapToUpdate.currentState,
          JSON.stringify(gapToUpdate.problemIds || []),
          gapToUpdate.id,
        ]
      );

      set((state) => ({
        gaps: state.gaps.map((g) =>
          g.id === gapToUpdate.id ? gapToUpdate : g
        ),
      }));
      console.log("[GapSlice] Gap updated:", gapToUpdate.title);
      return gapToUpdate;
    } catch (error) {
      console.error("[GapSlice] Error updating gap:", error);
      return null;
    }
  },

  deleteGap: async (gapId) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Gaps WHERE id = ?;`, [gapId]);

      set((state) => ({
        gaps: state.gaps.filter((g) => g.id !== gapId),
      }));
      console.log("[GapSlice] Gap deleted:", gapId);
      return true;
    } catch (error) {
      console.error("[GapSlice] Error deleting gap:", error);
      return false;
    }
  },

  getGapById: (id: string) => {
    return get().gaps.find((g) => g.id === id);
  },
});
