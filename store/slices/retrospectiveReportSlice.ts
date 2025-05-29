import { getDatabase } from "@/lib/db";
import { Problem, RetrospectiveReport } from "@/types";
import type { AppState } from "@/types/storeTypes"; // 통합 AppState 타입
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// RetrospectiveReport 관련 파서 함수
const parseRetrospectiveReportFromDB = (dbItem: any): RetrospectiveReport => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
  situation: dbItem.situation,
  task: dbItem.task, // 컬럼명이 'task'로 변경된 것 반영
  action: dbItem.action,
  result: dbItem.result,
  learnings: dbItem.learnings === null ? undefined : dbItem.learnings,
  createdAt: new Date(dbItem.createdAt),
});

export interface RetrospectiveReportSlice {
  retrospectiveReports: RetrospectiveReport[];
  isLoadingRetrospectives: boolean;
  fetchRetrospectives: (problemId?: string) => Promise<void>; // 특정 Problem의 회고 또는 전체 회고
  addRetrospective: (
    retroData: Omit<RetrospectiveReport, "id" | "createdAt">
  ) => Promise<RetrospectiveReport | null>;
  updateRetrospective: (
    retroToUpdate: RetrospectiveReport
  ) => Promise<RetrospectiveReport | null>;
  deleteRetrospective: (retrospectiveId: string) => Promise<boolean>;
  getRetrospectiveById: (id: string) => RetrospectiveReport | undefined;
  getRetrospectiveByProblemId: (
    problemId: string
  ) => RetrospectiveReport | undefined;
}

export const createRetrospectiveReportSlice: StateCreator<
  AppState,
  [],
  [],
  RetrospectiveReportSlice
> = (set, get) => ({
  retrospectiveReports: [],
  isLoadingRetrospectives: false,

  fetchRetrospectives: async (problemId?: string) => {
    set({ isLoadingRetrospectives: true });
    try {
      const db = await getDatabase();
      let results;
      if (problemId) {
        results = await db.getAllAsync<any>(
          "SELECT * FROM RetrospectiveReports WHERE problemId = ? ORDER BY createdAt DESC;",
          [problemId]
        );
      } else {
        results = await db.getAllAsync<any>(
          "SELECT * FROM RetrospectiveReports ORDER BY createdAt DESC;"
        );
      }
      const fetchedRetros = results.map(parseRetrospectiveReportFromDB);

      if (problemId) {
        // 특정 problemId의 회고만 교체 (보통 Problem당 회고는 1개일 수 있지만, 여러 개 허용 시 대비)
        set((state) => ({
          retrospectiveReports: [
            ...state.retrospectiveReports.filter(
              (r) => r.problemId !== problemId
            ),
            ...fetchedRetros,
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), // 최신순 정렬
          isLoadingRetrospectives: false,
        }));
      } else {
        set({
          retrospectiveReports: fetchedRetros,
          isLoadingRetrospectives: false,
        });
      }
      console.log(
        `[RetroSlice] Retrospectives fetched ${
          problemId ? `for problem ${problemId}` : "(all)"
        }:`,
        fetchedRetros.length
      );
    } catch (error) {
      console.error("[RetroSlice] Error fetching retrospectives:", error);
      set({ isLoadingRetrospectives: false });
    }
  },

  addRetrospective: async (retroData) => {
    const newRetro: RetrospectiveReport = {
      id: uuidv4(),
      problemId: retroData.problemId,
      situation: retroData.situation,
      task: retroData.task,
      action: retroData.action,
      result: retroData.result,
      learnings: retroData.learnings,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO RetrospectiveReports (id, problemId, situation, task, action, result, learnings, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newRetro.id,
          newRetro.problemId,
          newRetro.situation,
          newRetro.task,
          newRetro.action,
          newRetro.result,
          newRetro.learnings === undefined ? null : newRetro.learnings,
          newRetro.createdAt.toISOString(),
        ]
      );
      console.log(
        "[RetroSlice] New retrospective inserted into DB:",
        newRetro.id
      );

      // 연결된 Problem의 retrospectiveReportId 업데이트
      const parentProblem = get().problems.find(
        (p) => p.id === newRetro.problemId
      );
      if (parentProblem) {
        const updatedParentProblem: Problem = {
          ...parentProblem,
          retrospectiveReportId: newRetro.id, // 새 회고 ID로 설정
        };
        await get().updateProblem(updatedParentProblem); // ProblemSlice의 액션 호출
        console.log(
          `[RetroSlice] Parent problem ${parentProblem.id} retrospectiveReportId updated.`
        );
      } else {
        console.warn(
          `[RetroSlice] Parent problem with ID ${newRetro.problemId} not found for retrospective linkage.`
        );
      }

      const currentRetros = get().retrospectiveReports;
      const newRetroList = [newRetro, ...currentRetros].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ retrospectiveReports: newRetroList });
      console.log("[RetroSlice] Retrospective added to store:", newRetro.id);
      return newRetro;
    } catch (error) {
      console.error("[RetroSlice] Error adding retrospective:", error);
      return null;
    }
  },

  updateRetrospective: async (retroToUpdate) => {
    const currentRetros = get().retrospectiveReports;
    const retroIndex = currentRetros.findIndex(
      (r) => r.id === retroToUpdate.id
    );
    if (retroIndex === -1) {
      console.error(
        "[RetroSlice] Retrospective not found for update:",
        retroToUpdate.id
      );
      return null;
    }
    const finalRetroToUpdate = {
      ...currentRetros[retroIndex],
      ...retroToUpdate,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE RetrospectiveReports SET situation = ?, task = ?, action = ?, result = ?, learnings = ?
         WHERE id = ?;`, // problemId, createdAt은 보통 업데이트하지 않음
        [
          finalRetroToUpdate.situation,
          finalRetroToUpdate.task,
          finalRetroToUpdate.action,
          finalRetroToUpdate.result,
          finalRetroToUpdate.learnings === undefined
            ? null
            : finalRetroToUpdate.learnings,
          finalRetroToUpdate.id,
        ]
      );

      const updatedRetros = currentRetros.map((r) =>
        r.id === finalRetroToUpdate.id ? finalRetroToUpdate : r
      );
      updatedRetros.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ retrospectiveReports: updatedRetros });
      console.log("[RetroSlice] Retrospective updated:", finalRetroToUpdate.id);
      return finalRetroToUpdate;
    } catch (error) {
      console.error("[RetroSlice] Error updating retrospective:", error);
      return null;
    }
  },

  deleteRetrospective: async (retrospectiveId) => {
    const retroToDelete = get().retrospectiveReports.find(
      (r) => r.id === retrospectiveId
    );

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM RetrospectiveReports WHERE id = ?;`, [
        retrospectiveId,
      ]);
      console.log(
        "[RetroSlice] Retrospective deleted from DB:",
        retrospectiveId
      );

      // 연결된 Problem의 retrospectiveReportId를 null로 업데이트
      if (retroToDelete) {
        const parentProblem = get().problems.find(
          (p) => p.id === retroToDelete.problemId
        );
        if (
          parentProblem &&
          parentProblem.retrospectiveReportId === retrospectiveId
        ) {
          const updatedParentProblem: Problem = {
            ...parentProblem,
            retrospectiveReportId: undefined, // DB에는 NULL로 저장됨
          };
          await get().updateProblem(updatedParentProblem);
          console.log(
            `[RetroSlice] Parent problem ${parentProblem.id} retrospectiveReportId cleared.`
          );
        }
      }

      set((state) => ({
        retrospectiveReports: state.retrospectiveReports
          .filter((r) => r.id !== retrospectiveId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      }));
      console.log(
        "[RetroSlice] Retrospective removed from store:",
        retrospectiveId
      );
      return true;
    } catch (error) {
      console.error("[RetroSlice] Error deleting retrospective:", error);
      return false;
    }
  },

  getRetrospectiveById: (id: string) => {
    return get().retrospectiveReports.find((r) => r.id === id);
  },

  getRetrospectiveByProblemId: (problemId: string) => {
    // Problem 하나당 회고는 하나만 있다고 가정하거나, 여러 개일 경우 첫 번째 또는 최신 것을 반환
    // 여기서는 Problem.retrospectiveReportId를 통해 직접 연결되므로,
    // 보통은 getRetrospectiveById(problem.retrospectiveReportId)를 사용하게 될 것임.
    // 이 함수는 problemId로 직접 회고 목록에서 찾는 예시.
    const allRetros = get().retrospectiveReports;
    return allRetros.find((r) => r.problemId === problemId); // 여러 개일 경우 .filter 사용 후 추가 로직
  },
});
