// src/store/slices/starReportSlice.ts

import { db } from "@/lib/db";
import { starReports } from "@/lib/db/schema";
import { StarReport } from "@/types";
import type {
  AppState,
  StarReportSlice as StarReportSliceInterface,
} from "@/types/storeTypes";
import { eq } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// The parseStarReportFromDB function is NO LONGER NEEDED.
// Drizzle and our inferred types handle this automatically.

export const createStarReportSlice: StateCreator<
  AppState,
  [],
  [],
  StarReportSliceInterface
> = (set, get) => ({
  starReports: [],
  isLoadingStarReports: false,

  /**
   * StarReport를 불러옵니다. problemId를 지정하여 특정 보고서만 가져올 수 있습니다.
   */
  fetchStarReports: async (problemId?: string) => {
    set({ isLoadingStarReports: true });
    try {
      let fetchedReports: StarReport[];

      if (problemId) {
        // Drizzle query to fetch by problemId
        fetchedReports = await db
          .select()
          .from(starReports)
          .where(eq(starReports.problemId, problemId));
      } else {
        // Drizzle query to fetch all reports
        fetchedReports = await db.select().from(starReports);
      }

      // Client-side logic for merging state without duplicates is preserved.
      const existingIds = new Set(fetchedReports.map((r) => r.id));
      const untouchedReports = get().starReports.filter(
        (r) => !existingIds.has(r.id)
      );

      set({
        starReports: [...untouchedReports, ...fetchedReports],
        isLoadingStarReports: false,
      });

      console.log(
        `[StarReportSlice] ${fetchedReports.length} star reports fetched.`
      );
    } catch (error) {
      console.error("[StarReportSlice] Error fetching star reports:", error);
      set({ isLoadingStarReports: false });
    }
  },

  /**
   * 새로운 StarReport를 추가하고, 부모 Problem의 starReportId를 업데이트합니다.
   */
  addStarReport: async (reportData) => {
    // CRITICAL: This application logic to ensure a 1-to-1 relationship is preserved.
    const existingReport = get().getStarReportByProblemId(reportData.problemId);
    if (existingReport) {
      console.warn(
        `[StarReportSlice] StarReport already exists for problem ${reportData.problemId}. Aborting.`
      );
      return null;
    }

    const newStarReport: StarReport = {
      id: uuidv4(),
      createdAt: new Date(),
      ...reportData,
      // Ensure optional learnings is null, not undefined, for the database
      learnings: reportData.learnings ?? null,
    };

    try {
      // Drizzle's insert query is type-safe.
      await db.insert(starReports).values(newStarReport);

      // CRITICAL: The logic to update the parent Problem is preserved exactly.
      const parentProblem = get().getProblemById(newStarReport.problemId);
      if (parentProblem) {
        const updatedProblem = {
          ...parentProblem,
          starReportId: newStarReport.id,
        };
        await get().updateProblem(updatedProblem);
      }

      set((state) => ({
        starReports: [...state.starReports, newStarReport],
      }));

      console.log(
        "[StarReportSlice] Star report added for problem:",
        newStarReport.problemId
      );
      return newStarReport;
    } catch (error) {
      console.error("[StarReportSlice] Error adding star report:", error);
      return null;
    }
  },

  /**
   * 기존 StarReport를 업데이트합니다.
   */
  updateStarReport: async (reportToUpdate) => {
    try {
      // Drizzle's update query.
      await db
        .update(starReports)
        .set({
          situation: reportToUpdate.situation,
          task: reportToUpdate.task,
          action: reportToUpdate.action,
          result: reportToUpdate.result,
          learnings: reportToUpdate.learnings,
        })
        .where(eq(starReports.id, reportToUpdate.id));

      set((state) => ({
        starReports: state.starReports.map((sr) =>
          sr.id === reportToUpdate.id ? reportToUpdate : sr
        ),
      }));

      console.log("[StarReportSlice] Star report updated:", reportToUpdate.id);
      return reportToUpdate;
    } catch (error) {
      console.error("[StarReportSlice] Error updating star report:", error);
      return null;
    }
  },

  /**
   * StarReport를 삭제하고, 부모 Problem의 starReportId를 null로 되돌립니다.
   */
  deleteStarReport: async (reportId) => {
    const reportToDelete = get().getStarReportById(reportId);
    if (!reportToDelete) return false;

    try {
      // Drizzle's delete query.
      await db.delete(starReports).where(eq(starReports.id, reportId));

      // CRITICAL: The logic to update the parent Problem is preserved exactly.
      const parentProblem = get().getProblemById(reportToDelete.problemId);
      if (parentProblem) {
        const updatedProblem = { ...parentProblem, starReportId: null };
        await get().updateProblem(updatedProblem);
      }

      set((state) => ({
        starReports: state.starReports.filter((sr) => sr.id !== reportId),
      }));

      console.log("[StarReportSlice] Star report deleted:", reportId);
      return true;
    } catch (error) {
      console.error("[StarReportSlice] Error deleting star report:", error);
      return false;
    }
  },

  /**
   * ID로 StarReport를 동기적으로 조회합니다.
   */
  getStarReportById: (id: string) => {
    // No changes needed.
    return get().starReports.find((sr) => sr.id === id);
  },

  /**
   * Problem ID로 StarReport를 동기적으로 조회합니다.
   */
  getStarReportByProblemId: (problemId: string) => {
    // No changes needed.
    return get().starReports.find((sr) => sr.problemId === problemId);
  },
});
