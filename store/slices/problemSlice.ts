import { StateCreator } from "zustand";
import { Problem, ProblemStatus, Project } from "@/types"; // 필요한 타입 import
import type { AppState } from "@/types/storeTypes"; // 전체 AppState 타입 (types 폴더 내로 이동했으므로 경로 수정)
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// Problem 관련 파서 함수
const parseProblemFromDB = (dbItem: any): Problem => ({
  id: dbItem.id,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  parentId: dbItem.parentId === null ? undefined : dbItem.parentId,
  childProblemIds: dbItem.childProblemIds
    ? JSON.parse(dbItem.childProblemIds)
    : [],
  status: dbItem.status as ProblemStatus,
  path: dbItem.path === null ? undefined : dbItem.path,
  projectId: dbItem.projectId === null ? undefined : dbItem.projectId,
  retrospectiveReportId:
    dbItem.retrospectiveReportId === null
      ? undefined
      : dbItem.retrospectiveReportId,
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
});

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: () => Promise<void>;
  addProblem: (
    problemData: Omit<
      Problem,
      "id" | "createdAt" | "childProblemIds" | "status" | "projectId"
    > & { status?: ProblemStatus; projectId?: string }
  ) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
  // 필요하다면 Problem에 직접 Project ID를 연결/해제하는 액션도 추가 가능
  // linkProjectToProblem: (problemId: string, projectId: string | null) => Promise<void>;
}

export const createProblemSlice: StateCreator<
  AppState,
  [],
  [],
  ProblemSlice
> = (set, get) => ({
  problems: [],
  isLoadingProblems: false,

  fetchProblems: async () => {
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM Problems ORDER BY createdAt DESC;"
      );
      const fetchedProblems = results.map(parseProblemFromDB);
      set({ problems: fetchedProblems, isLoadingProblems: false });
      console.log("[ProblemSlice] Problems fetched:", fetchedProblems.length);
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  addProblem: async (problemData) => {
    const newProblem: Problem = {
      id: uuidv4(),
      title: problemData.title,
      description: problemData.description,
      parentId: problemData.parentId,
      childProblemIds: [], // 새 문제는 항상 빈 childProblemIds로 시작
      status: problemData.status || "active",
      path: problemData.path,
      projectId: problemData.projectId, // 전달받은 projectId 사용 또는 undefined
      retrospectiveReportId: problemData.retrospectiveReportId,
      createdAt: new Date(),
      resolvedAt: problemData.resolvedAt,
      archivedAt: problemData.archivedAt,
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Problems (id, title, description, parentId, childProblemIds, status, path, projectId, retrospectiveReportId, createdAt, resolvedAt, archivedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProblem.id,
          newProblem.title,
          newProblem.description || null,
          newProblem.parentId || null,
          JSON.stringify(newProblem.childProblemIds),
          newProblem.status,
          newProblem.path || null,
          newProblem.projectId || null,
          newProblem.retrospectiveReportId || null,
          newProblem.createdAt.toISOString(),
          newProblem.resolvedAt ? newProblem.resolvedAt.toISOString() : null,
          newProblem.archivedAt ? newProblem.archivedAt.toISOString() : null,
        ]
      );
      console.log(
        "[ProblemSlice] New problem inserted into DB:",
        newProblem.title
      );

      let problemsToSet = [newProblem, ...get().problems];

      // 만약 부모 ID가 있다면, 부모 문제를 찾아서 childProblemIds를 업데이트하고 DB에도 반영
      if (newProblem.parentId) {
        const parentProblem = get().problems.find(
          (p) => p.id === newProblem.parentId
        );
        if (parentProblem) {
          const updatedParentData: Problem = {
            ...parentProblem,
            childProblemIds: [...parentProblem.childProblemIds, newProblem.id],
          };
          // 부모 문제를 DB에 업데이트 (이 슬라이스 내의 updateProblem을 직접 호출하기보다 DB 직접 업데이트)
          await db.runAsync(
            `UPDATE Problems SET childProblemIds = ? WHERE id = ?;`,
            [
              JSON.stringify(updatedParentData.childProblemIds),
              updatedParentData.id,
            ]
          );
          console.log(
            `[ProblemSlice] Parent problem ${updatedParentData.id} childProblemIds updated in DB.`
          );
          // 로컬 상태 업데이트
          problemsToSet = problemsToSet.map((p) =>
            p.id === updatedParentData.id ? updatedParentData : p
          );
        } else {
          console.warn(
            `[ProblemSlice] Parent problem with ID ${newProblem.parentId} not found in local store to update.`
          );
        }
      }

      problemsToSet.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ problems: problemsToSet });
      console.log(
        "[ProblemSlice] Problem added/parent updated in store:",
        newProblem.title
      );
      return newProblem;
    } catch (error) {
      console.error("[ProblemSlice] Error in addProblem:", error);
      return null;
    }
  },

  updateProblem: async (problemToUpdate) => {
    const currentProblems = get().problems;
    const problemIndex = currentProblems.findIndex(
      (p) => p.id === problemToUpdate.id
    );
    if (problemIndex === -1) {
      console.error(
        "[ProblemSlice] Problem not found for update:",
        problemToUpdate.id
      );
      return null;
    }

    // DB에 업데이트할 객체 (기존 객체와 병합된 완전한 형태)
    const finalProblemToUpdate = {
      ...currentProblems[problemIndex],
      ...problemToUpdate,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Problems SET title = ?, description = ?, parentId = ?, childProblemIds = ?, status = ?, path = ?, projectId = ?, retrospectiveReportId = ?, resolvedAt = ?, archivedAt = ?
         WHERE id = ?;`,
        [
          finalProblemToUpdate.title,
          finalProblemToUpdate.description === undefined
            ? null
            : finalProblemToUpdate.description,
          finalProblemToUpdate.parentId === undefined
            ? null
            : finalProblemToUpdate.parentId,
          JSON.stringify(finalProblemToUpdate.childProblemIds || []),
          finalProblemToUpdate.status,
          finalProblemToUpdate.path === undefined
            ? null
            : finalProblemToUpdate.path,
          finalProblemToUpdate.projectId === undefined
            ? null
            : finalProblemToUpdate.projectId,
          finalProblemToUpdate.retrospectiveReportId === undefined
            ? null
            : finalProblemToUpdate.retrospectiveReportId,
          finalProblemToUpdate.resolvedAt
            ? finalProblemToUpdate.resolvedAt.toISOString()
            : null,
          finalProblemToUpdate.archivedAt
            ? finalProblemToUpdate.archivedAt.toISOString()
            : null,
          finalProblemToUpdate.id,
        ]
      );

      const updatedProblems = currentProblems.map((p) =>
        p.id === finalProblemToUpdate.id ? finalProblemToUpdate : p
      );
      updatedProblems.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ problems: updatedProblems });
      console.log(
        "[ProblemSlice] Problem updated:",
        finalProblemToUpdate.title
      );
      return finalProblemToUpdate;
    } catch (error) {
      console.error("[ProblemSlice] Error updating problem:", error);
      return null;
    }
  },

  deleteProblem: async (problemId) => {
    const problemsBeforeDeletion = get().problems;
    const problemToDelete = problemsBeforeDeletion.find(
      (p) => p.id === problemId
    );
    const parentProblemInstance = problemsBeforeDeletion.find((p) =>
      p.childProblemIds.includes(problemId)
    );

    if (!problemToDelete) {
      console.warn(
        "[ProblemSlice] Problem to delete not found in state:",
        problemId
      );
      return false; // Or attempt DB deletion anyway if desired
    }

    try {
      const db = await getDatabase();
      // 1. 부모 문제의 childProblemIds 업데이트 (DB)
      if (parentProblemInstance) {
        const updatedParentChildProblemIds =
          parentProblemInstance.childProblemIds.filter(
            (id) => id !== problemId
          );
        await db.runAsync(
          `UPDATE Problems SET childProblemIds = ? WHERE id = ?;`,
          [
            JSON.stringify(updatedParentChildProblemIds),
            parentProblemInstance.id,
          ]
        );
        console.log(
          `[ProblemSlice] Parent problem ${parentProblemInstance.id} childProblemIds updated in DB before deleting child.`
        );
      }

      // 2. Problem 삭제 (DB) -> 연결된 Project 등은 DB의 CASCADE 규칙에 의해 처리될 것임
      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);
      console.log("[ProblemSlice] Problem deleted from DB:", problemId);

      // 3. 로컬 상태 업데이트
      // Problem 삭제, 부모 Problem의 childProblemIds 업데이트
      let updatedProblems = problemsBeforeDeletion.filter(
        (p) => p.id !== problemId
      );
      if (parentProblemInstance) {
        updatedProblems = updatedProblems.map((p) =>
          p.id === parentProblemInstance.id
            ? {
                ...p,
                childProblemIds: p.childProblemIds.filter(
                  (id) => id !== problemId
                ),
              }
            : p
        );
      }
      updatedProblems.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // 연결된 Project 및 그 하위 항목들 (Do, Dont, Task) 로컬 상태에서 제거
      const projectsOfDeletedProblem = get().projects.filter(
        (proj) => proj.problemId === problemId
      );
      const projectIdsToDelete = projectsOfDeletedProblem.map((p) => p.id);

      const remainingProjects = get().projects.filter(
        (proj) => proj.problemId !== problemId
      );
      const remainingTasks = get().tasks.filter(
        (t) => !projectIdsToDelete.includes(t.projectId)
      );
      const remainingDoItems = get().doItems.filter(
        (d) => !projectIdsToDelete.includes(d.projectId)
      );
      const remainingDontItems = get().dontItems.filter(
        (d) => !projectIdsToDelete.includes(d.projectId)
      );
      const remainingRetrospectives = get().retrospectiveReports.filter(
        (r) => r.problemId !== problemId
      );

      set({
        problems: updatedProblems,
        projects: remainingProjects,
        tasks: remainingTasks,
        doItems: remainingDoItems,
        dontItems: remainingDontItems,
        retrospectiveReports: remainingRetrospectives,
      });

      console.log(
        "[ProblemSlice] Problem and related entities cleaned from local store:",
        problemId
      );
      return true;
    } catch (error) {
      console.error(
        "[ProblemSlice] Error deleting problem and related data:",
        error
      );
      return false;
    }
  },

  getProblemById: (id: string) => {
    return get().problems.find((p) => p.id === id);
  },
});
