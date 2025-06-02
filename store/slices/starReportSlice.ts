// store/slices/starReportSlice.ts

import { StateCreator } from "zustand";
import { StarReport } from "@/types"; // Assuming Objective type is not directly needed for updates here
import type {
  AppState,
  StarReportSlice as StarReportSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// StarReport 관련 파서 함수
const parseStarReportFromDB = (dbItem: any): StarReport => ({
  id: dbItem.id,
  objectiveId: dbItem.objectiveId,
  situation: dbItem.situation,
  task: dbItem.task,
  action: dbItem.action,
  result: dbItem.result,
  learnings: dbItem.learnings === null ? undefined : dbItem.learnings,
  timeSpent: dbItem.timeSpent === null ? undefined : dbItem.timeSpent,
  createdAt: new Date(dbItem.createdAt),
});

export const createStarReportSlice: StateCreator<
  AppState,
  [],
  [],
  StarReportSliceInterface
> = (set, get) => ({
  starReports: [],
  isLoadingStarReports: false,

  fetchStarReports: async (objectiveId?: string) => {
    set({ isLoadingStarReports: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM StarReports";
      const params: string[] = [];

      if (objectiveId) {
        query += " WHERE objectiveId = ?";
        params.push(objectiveId);
      }
      query += " ORDER BY createdAt DESC;"; // Most recent reports first

      const results = await db.getAllAsync<any>(query, params);
      const fetchedStarReports = results.map(parseStarReportFromDB);

      if (objectiveId) {
        // Replace reports for the specific objective, keep others
        set((state) => ({
          starReports: [
            ...state.starReports.filter((sr) => sr.objectiveId !== objectiveId),
            ...fetchedStarReports,
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), // Ensure overall sort
          isLoadingStarReports: false,
        }));
      } else {
        // Replace all reports if no specific objective ID
        set({
          starReports: fetchedStarReports.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          ),
          isLoadingStarReports: false,
        });
      }
      console.log(
        `[StarReportSlice] StarReports fetched ${
          objectiveId ? `for objective ${objectiveId}` : "(all)"
        }:`,
        fetchedStarReports.length
      );
    } catch (error) {
      console.error("[StarReportSlice] Error fetching StarReports:", error);
      set({ isLoadingStarReports: false });
    }
  },

  addStarReport: async (reportData) => {
    // reportData structure from storeTypes.ts:
    // Omit<StarReport, "id" | "createdAt">
    const newStarReportId = uuidv4();
    const newStarReport: StarReport = {
      id: newStarReportId,
      objectiveId: reportData.objectiveId,
      situation: reportData.situation,
      task: reportData.task,
      action: reportData.action,
      result: reportData.result,
      learnings: reportData.learnings,
      timeSpent: reportData.timeSpent,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO StarReports (id, objectiveId, situation, task, action, result, learnings, timeSpent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newStarReport.id,
          newStarReport.objectiveId,
          newStarReport.situation,
          newStarReport.task,
          newStarReport.action,
          newStarReport.result,
          newStarReport.learnings === undefined
            ? null
            : newStarReport.learnings,
          newStarReport.timeSpent === undefined
            ? null
            : newStarReport.timeSpent,
          newStarReport.createdAt.toISOString(),
        ]
      );
      console.log(
        "[StarReportSlice] New StarReport inserted into DB for objective:",
        newStarReport.objectiveId
      );

      const currentStarReports = get().starReports;
      const newStarReportList = [...currentStarReports, newStarReport].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ starReports: newStarReportList });
      console.log(
        "[StarReportSlice] StarReport added to store for objective:",
        newStarReport.objectiveId
      );
      return newStarReport;
    } catch (error) {
      console.error("[StarReportSlice] Error adding StarReport:", error);
      return null;
    }
  },

  updateStarReport: async (reportToUpdate) => {
    const currentStarReports = get().starReports;
    const reportIndex = currentStarReports.findIndex(
      (sr) => sr.id === reportToUpdate.id
    );

    if (reportIndex === -1) {
      console.error(
        "[StarReportSlice] StarReport not found for update:",
        reportToUpdate.id
      );
      return null;
    }

    // Preserve original objectiveId and createdAt
    const originalReport = currentStarReports[reportIndex];
    const finalReportToUpdate: StarReport = {
      ...originalReport, // Base with original immutable fields
      ...reportToUpdate, // Apply incoming changes
      objectiveId: originalReport.objectiveId, // Ensure objectiveId is not changed
      createdAt: originalReport.createdAt, // Ensure createdAt is not changed
    };

    try {
      const db = await getDatabase();
      // objectiveId and createdAt are not updated.
      await db.runAsync(
        `UPDATE StarReports SET situation = ?, task = ?, action = ?, result = ?, 
         learnings = ?, timeSpent = ?
         WHERE id = ?;`,
        [
          finalReportToUpdate.situation,
          finalReportToUpdate.task,
          finalReportToUpdate.action,
          finalReportToUpdate.result,
          finalReportToUpdate.learnings === undefined
            ? null
            : finalReportToUpdate.learnings,
          finalReportToUpdate.timeSpent === undefined
            ? null
            : finalReportToUpdate.timeSpent,
          finalReportToUpdate.id,
        ]
      );

      const updatedStarReports = currentStarReports.map((sr) =>
        sr.id === finalReportToUpdate.id ? finalReportToUpdate : sr
      );
      updatedStarReports.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ starReports: updatedStarReports });
      console.log(
        "[StarReportSlice] StarReport updated:",
        finalReportToUpdate.id
      );
      return finalReportToUpdate;
    } catch (error) {
      console.error("[StarReportSlice] Error updating StarReport:", error);
      return null;
    }
  },

  deleteStarReport: async (reportId) => {
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM StarReports WHERE id = ?;`, [reportId]);
      console.log("[StarReportSlice] StarReport deleted from DB:", reportId);

      set((state) => ({
        starReports: state.starReports
          .filter((sr) => sr.id !== reportId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), // Keep sorted
      }));
      console.log("[StarReportSlice] StarReport removed from store:", reportId);
      return true;
    } catch (error) {
      console.error("[StarReportSlice] Error deleting StarReport:", error);
      return false;
    }
  },

  getStarReportById: (id: string) => {
    return get().starReports.find((sr) => sr.id === id);
  },

  getStarReportByObjectiveId: (objectiveId: string) => {
    // Assumes reports are sorted by createdAt DESC in the store,
    // so find will return the most recent one for the objectiveId.
    // If multiple reports per objective are stored and a specific one (not necessarily latest)
    // is needed, or if order isn't guaranteed, this might need adjustment
    // or the calling code might need to handle multiple results.
    // Given the type signature returns StarReport | undefined, finding the first match is standard.
    return get().starReports.find((sr) => sr.objectiveId === objectiveId);
  },
});
