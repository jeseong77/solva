// src/store/slices/starReportSlice.ts

import { getDatabase } from "@/lib/db";
import { StarReport } from "@/types";
import type {
  AppState,
  StarReportSlice as StarReportSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * 데이터베이스에서 가져온 데이터를 StarReport 타입으로 변환합니다.
 * @param dbItem - 데이터베이스의 row 아이템
 * @returns StarReport 타입 객체
 */
const parseStarReportFromDB = (dbItem: any): StarReport => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
  situation: dbItem.situation,
  task: dbItem.task,
  action: dbItem.action,
  result: dbItem.result,
  learnings: dbItem.learnings === null ? undefined : dbItem.learnings,
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

  /**
   * StarReport를 불러옵니다. problemId를 지정하여 특정 보고서만 가져올 수 있습니다.
   */
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
      const dbResults = await db.getAllAsync<any>(query, params);
      const fetchedReports = dbResults.map(parseStarReportFromDB);

      // 기존 상태와 병합
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
    const newStarReport: StarReport = {
      id: uuidv4(),
      createdAt: new Date(),
      ...reportData,
    };

    // 한 Problem에 하나의 StarReport만 존재하도록 보장
    const existingReport = get().getStarReportByProblemId(
      newStarReport.problemId
    );
    if (existingReport) {
      console.warn(
        `[StarReportSlice] StarReport already exists for problem ${newStarReport.problemId}. Aborting.`
      );
      return null;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO StarReports (id, problemId, situation, task, action, result, learnings, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newStarReport.id,
          newStarReport.problemId,
          newStarReport.situation,
          newStarReport.task,
          newStarReport.action,
          newStarReport.result,
          newStarReport.learnings ?? null,
          newStarReport.createdAt.toISOString(),
        ]
      );

      // 부모 Problem의 starReportId 필드 업데이트
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
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE StarReports SET situation = ?, task = ?, action = ?, result = ?, learnings = ?
         WHERE id = ?;`,
        [
          reportToUpdate.situation,
          reportToUpdate.task,
          reportToUpdate.action,
          reportToUpdate.result,
          reportToUpdate.learnings ?? null,
          reportToUpdate.id,
        ]
      );

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
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM StarReports WHERE id = ?;`, [reportId]);

      // 부모 Problem의 starReportId 필드를 null로 업데이트
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
    return get().starReports.find((sr) => sr.id === id);
  },

  /**
   * Problem ID로 StarReport를 동기적으로 조회합니다.
   */
  getStarReportByProblemId: (problemId: string) => {
    return get().starReports.find((sr) => sr.problemId === problemId);
  },
});
