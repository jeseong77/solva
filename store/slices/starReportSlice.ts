// src/lib/starReportSlice.ts

import { getDatabase } from "@/lib/db";
import { Problem, StarReport } from "@/types";
import type {
  AppState,
  StarReportSlice as StarReportSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// Helper to parse StarReport from DB record
const parseStarReportFromDB = (dbItem: any): StarReport => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
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

  fetchStarReports: async (problemId?: string) => {
    set({ isLoadingStarReports: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM StarReports";
      const params: string[] = [];
      if (problemId) {
        query += " WHERE problemId = ?";
        params.push(problemId);
      }
      query += " ORDER BY createdAt DESC;"; // Newest reports first

      const results = await db.getAllAsync<any>(query, params);
      const fetchedStarReports = results.map(parseStarReportFromDB);
      set({ starReports: fetchedStarReports, isLoadingStarReports: false });
    } catch (error) {
      console.error(
        `[StarReportSlice] Error fetching star reports${
          problemId ? ` for problem ${problemId}` : ""
        }:`,
        error
      );
      set({ isLoadingStarReports: false });
    }
  },

  // reportData: Omit<StarReport, "id" | "createdAt">
  // Expected to contain: problemId, situation, task, action, result
  // Optional: learnings, timeSpent
  addStarReport: async (reportData) => {
    const newStarReport: StarReport = {
      id: uuidv4(),
      problemId: reportData.problemId,
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
        `INSERT INTO StarReports (id, problemId, situation, task, action, result, learnings, timeSpent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newStarReport.id,
          newStarReport.problemId,
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

      // Update parent Problem's starReportId
      const parentProblem = get().problems.find(
        (p) => p.id === newStarReport.problemId
      );
      if (parentProblem) {
        const updatedParentProblem: Problem = {
          ...parentProblem,
          starReportId: newStarReport.id, // Link this new report
        };
        await get().updateProblem(updatedParentProblem); // Assumes updateProblem in ProblemSlice handles DB and state
      } else {
        console.warn(
          `[StarReportSlice] Parent problem with ID ${newStarReport.problemId} not found in local state during addStarReport.`
        );
      }

      const updatedStarReports = [...get().starReports, newStarReport].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ); // Keep sorted newest first
      set({ starReports: updatedStarReports });
      console.log(
        "[StarReportSlice] StarReport added for problem:",
        newStarReport.problemId
      );
      return newStarReport;
    } catch (error) {
      console.error("[StarReportSlice] Error adding star report:", error);
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
    const oldStarReport = currentStarReports[reportIndex];

    const db = await getDatabase();
    try {
      // Handle problemId change and update relevant Problem.starReportId
      if (oldStarReport.problemId !== reportToUpdate.problemId) {
        // 1. Clear starReportId from old parent Problem if it was this report
        const oldParentProblem = get().problems.find(
          (p) => p.id === oldStarReport.problemId
        );
        if (
          oldParentProblem &&
          oldParentProblem.starReportId === reportToUpdate.id
        ) {
          const updatedOldParent: Problem = {
            ...oldParentProblem,
            starReportId: null,
          };
          await get().updateProblem(updatedOldParent);
        }

        // 2. Set starReportId on new parent Problem
        const newParentProblem = get().problems.find(
          (p) => p.id === reportToUpdate.problemId
        );
        if (newParentProblem) {
          const updatedNewParent: Problem = {
            ...newParentProblem,
            starReportId: reportToUpdate.id,
          };
          await get().updateProblem(updatedNewParent);
        }
      } else {
        // If problemId hasn't changed, ensure the parent problem's starReportId still points to this report
        // This handles cases where it might have been null and now this updated report is being explicitly linked,
        // or ensures the link remains if it was already set.
        const parentProblem = get().problems.find(
          (p) => p.id === reportToUpdate.problemId
        );
        if (parentProblem && parentProblem.starReportId !== reportToUpdate.id) {
          // If this report is being made THE report for the problem
          const updatedParentProblem: Problem = {
            ...parentProblem,
            starReportId: reportToUpdate.id,
          };
          await get().updateProblem(updatedParentProblem);
        }
      }

      await db.runAsync(
        `UPDATE StarReports SET problemId = ?, situation = ?, task = ?, action = ?, result = ?, learnings = ?, timeSpent = ?
         WHERE id = ?;`,
        [
          reportToUpdate.problemId,
          reportToUpdate.situation,
          reportToUpdate.task,
          reportToUpdate.action,
          reportToUpdate.result,
          reportToUpdate.learnings === undefined
            ? null
            : reportToUpdate.learnings,
          reportToUpdate.timeSpent === undefined
            ? null
            : reportToUpdate.timeSpent,
          reportToUpdate.id,
        ]
      );

      const updatedStarReports = currentStarReports
        .map((sr) => (sr.id === reportToUpdate.id ? reportToUpdate : sr))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      set({ starReports: updatedStarReports });
      console.log("[StarReportSlice] StarReport updated:", reportToUpdate.id);
      return reportToUpdate;
    } catch (error) {
      console.error("[StarReportSlice] Error updating star report:", error);
      return null;
    }
  },

  deleteStarReport: async (reportId) => {
    const reportToDelete = get().starReports.find((sr) => sr.id === reportId);
    if (!reportToDelete) {
      console.error(
        "[StarReportSlice] StarReport not found for deletion:",
        reportId
      );
      return false;
    }

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM StarReports WHERE id = ?;`, [reportId]);

      // Update parent Problem's starReportId if it was linked to this report
      // The DB FOREIGN KEY with ON DELETE SET NULL handles this on the DB side.
      // This client-side update keeps the Zustand state consistent.
      const parentProblem = get().problems.find(
        (p) => p.id === reportToDelete.problemId
      );
      if (parentProblem && parentProblem.starReportId === reportId) {
        const updatedParentProblem: Problem = {
          ...parentProblem,
          starReportId: null,
        };
        await get().updateProblem(updatedParentProblem);
      }

      const updatedStarReports = get()
        .starReports.filter((sr) => sr.id !== reportId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      set({ starReports: updatedStarReports });
      console.log("[StarReportSlice] StarReport deleted:", reportId);
      return true;
    } catch (error) {
      console.error("[StarReportSlice] Error deleting star report:", error);
      return false;
    }
  },

  getStarReportById: (id: string) => {
    return get().starReports.find((sr) => sr.id === id);
  },

  getStarReportByProblemId: (problemId: string) => {
    // This will return the first report found for the problemId, or the one linked via Problem.starReportId if desired.
    // Given Problem.starReportId is a direct link, it might be better to fetch based on that if available.
    // However, this implementation simply finds any report matching the problemId from the local list.
    // If a problem is only meant to have one StarReport (the one in Problem.starReportId),
    // this getter could be refined to look up the Problem and then its starReportId.
    // For now, following the simple find pattern:
    return get().starReports.find((sr) => sr.problemId === problemId);
  },
});
