// src/store/slices/problemSlice.ts

import { getDatabase } from "@/lib/db";
import { Priority, Problem, ProblemStatus } from "@/types";
import type {
  AppState,
  ProblemSlice as ProblemSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// ✅ [변경] Problem 타입에 맞춰 DB 데이터 파싱
const parseProblemFromDB = (dbItem: any): Problem => ({
  id: dbItem.id,
  objectiveId: dbItem.objectiveId,
  gapId: dbItem.gapId === null ? undefined : dbItem.gapId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  status: dbItem.status as ProblemStatus,
  priority: dbItem.priority as Priority,
  urgency: dbItem.urgency === null ? undefined : dbItem.urgency,
  importance: dbItem.importance === null ? undefined : dbItem.importance,
  tags: dbItem.tags ? JSON.parse(dbItem.tags) : [],
  childThreadIds: dbItem.childThreadIds
    ? JSON.parse(dbItem.childThreadIds)
    : [],
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
  starReportId: dbItem.starReportId === null ? undefined : dbItem.starReportId,
});

const priorityOrder: { [key in Priority]: number } = {
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};
const sortProblems = (a: Problem, b: Problem) => {
  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  return b.createdAt.getTime() - a.createdAt.getTime();
};

export const createProblemSlice: StateCreator<
  AppState,
  [],
  [],
  ProblemSliceInterface
> = (set, get) => ({
  problems: [],
  isLoadingProblems: false,

  // ✅ [변경] personaId -> objectiveId
  fetchProblems: async (objectiveId?: string) => {
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Problems";
      const params: string[] = [];
      if (objectiveId) {
        query += " WHERE objectiveId = ?"; // ✅ personaId -> objectiveId
        params.push(objectiveId);
      }

      const results = await db.getAllAsync<any>(query, params);
      const fetchedProblems = results.map(parseProblemFromDB);

      const allProblems = [...get().problems, ...fetchedProblems];
      const problemMap = new Map<string, Problem>();
      allProblems.forEach((p) => {
        problemMap.set(p.id, p);
      });

      const uniqueProblemList = Array.from(problemMap.values()).sort(
        sortProblems
      );

      set({
        problems: uniqueProblemList,
        isLoadingProblems: false,
      });

      console.log(
        `[ProblemSlice] Problems fetched ${
          objectiveId ? `for objective ${objectiveId}` : "(all)" // ✅ personaId -> objectiveId
        }: ${fetchedProblems.length}`
      );
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  addProblem: async (problemData) => {
    const newProblem: Problem = {
      id: uuidv4(),
      objectiveId: problemData.objectiveId,
      gapId: problemData.gapId,
      title: problemData.title,
      description: problemData.description,
      status: problemData.status || "active",
      priority: problemData.priority || "none",
      urgency: problemData.urgency,
      importance: problemData.importance,
      tags: problemData.tags || [],
      childThreadIds: [],
      timeSpent: 0,
      createdAt: new Date(),
    };

    // ✅ 디버깅을 위한 SQL 로그 추가
    const sql = `INSERT INTO Problems (id, objectiveId, gapId, title, description, status, priority, urgency, importance, tags, childThreadIds, timeSpent, createdAt, resolvedAt, archivedAt, starReportId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    console.log("[ProblemSlice] EXECUTING SQL:", sql);

    try {
      const db = await getDatabase();
      // ✅ 변수로 받은 sql을 실행
      await db.runAsync(sql, [
        newProblem.id,
        newProblem.objectiveId,
        newProblem.gapId ?? null,
        newProblem.title,
        newProblem.description ?? null,
        newProblem.status,
        newProblem.priority,
        newProblem.urgency ?? null,
        newProblem.importance ?? null,
        JSON.stringify(newProblem.tags),
        JSON.stringify(newProblem.childThreadIds),
        newProblem.timeSpent,
        newProblem.createdAt.toISOString(),
        newProblem.resolvedAt?.toISOString() ?? null,
        newProblem.archivedAt?.toISOString() ?? null,
        newProblem.starReportId ?? null,
      ]);

      const newProblemList = [...get().problems, newProblem].sort(sortProblems);
      set({ problems: newProblemList });
      console.log("[ProblemSlice] Problem added:", newProblem.title);
      return newProblem;
    } catch (error) {
      console.error("[ProblemSlice] Error adding problem:", error);
      return null;
    }
  },

  updateProblem: async (problemToUpdate) => {
    if (!get().problems.find((p) => p.id === problemToUpdate.id)) {
      console.error(
        "[ProblemSlice] Problem not found for update:",
        problemToUpdate.id
      );
      return null;
    }
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Problems 
          SET title = ?, description = ?, status = ?, priority = ?, urgency = ?, importance = ?, tags = ?, childThreadIds = ?, timeSpent = ?, resolvedAt = ?, archivedAt = ?, starReportId = ?, gapId = ?
          WHERE id = ?;`,
        [
          problemToUpdate.title,
          problemToUpdate.description ?? null,
          problemToUpdate.status,
          problemToUpdate.priority,
          problemToUpdate.urgency ?? null,
          problemToUpdate.importance ?? null,
          JSON.stringify(problemToUpdate.tags || []),
          JSON.stringify(problemToUpdate.childThreadIds || []),
          problemToUpdate.timeSpent,
          problemToUpdate.resolvedAt?.toISOString() ?? null,
          problemToUpdate.archivedAt?.toISOString() ?? null,
          problemToUpdate.starReportId ?? null,
          problemToUpdate.gapId ?? null, // ✅ 올바른 위치로 이동
          problemToUpdate.id,
        ]
      );

      const updatedProblems = get()
        .problems.map((p) =>
          p.id === problemToUpdate.id ? problemToUpdate : p
        )
        .sort(sortProblems);
      set({ problems: updatedProblems });
      console.log("[ProblemSlice] Problem updated:", problemToUpdate.title);
      return problemToUpdate;
    } catch (error) {
      console.error("[ProblemSlice] Error updating problem:", error);
      return null;
    }
  },

  deleteProblem: async (problemId) => {
    const problemToDelete = get().problems.find((p) => p.id === problemId);
    if (!problemToDelete) return false;

    try {
      const db = await getDatabase();

      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);

      set((state) => ({
        problems: state.problems.filter((p) => p.id !== problemId),
        threadItems: state.threadItems.filter(
          (ti) => ti.problemId !== problemId
        ),
        starReports: state.starReports.filter(
          (sr) => sr.problemId !== problemId
        ),
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.problemId !== problemId
        ),
      }));

      console.log(
        "[ProblemSlice] Problem and related data cleaned from local store:",
        problemId
      );
      return true;
    } catch (error) {
      console.error("[ProblemSlice] Error deleting problem:", error);
      return false;
    }
  },

  getProblemById: (id: string) => {
    return get().problems.find((p) => p.id === id);
  },
});
