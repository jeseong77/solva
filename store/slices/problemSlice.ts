// src/store/slices/problemSlice.ts

import { getDatabase } from "@/lib/db";
import {
  Priority,
  Problem,
  ProblemStatus,
  StarReport,
  ThreadItem,
  WeeklyProblem,
} from "@/types"; // 새로운 타입 구조에 맞게 임포트 수정
import type {
  AppState,
  ProblemSlice as ProblemSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// 변경된 Problem 타입에 맞춰 DB 데이터 파싱
const parseProblemFromDB = (dbItem: any): Problem => ({
  id: dbItem.id,
  personaId: dbItem.personaId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  status: dbItem.status as ProblemStatus,
  priority: dbItem.priority as Priority,
  urgency: dbItem.urgency === null ? undefined : dbItem.urgency,
  importance: dbItem.importance === null ? undefined : dbItem.importance,
  tags: dbItem.tags ? JSON.parse(dbItem.tags) : [], // tagIds -> tags
  childThreadIds: dbItem.childThreadIds
    ? JSON.parse(dbItem.childThreadIds)
    : [], // objectiveIds/ruleIds -> childThreadIds
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
  starReportId: dbItem.starReportId === null ? undefined : dbItem.starReportId,
});

// 우선순위 정렬을 위한 헬퍼 객체
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

  fetchProblems: async (personaId?: string) => {
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Problems";
      const params: string[] = [];
      if (personaId) {
        query += " WHERE personaId = ?";
        params.push(personaId);
      }

      const results = await db.getAllAsync<any>(query, params);
      const fetchedProblems = results.map(parseProblemFromDB);

      // fetch한 데이터를 기존 상태와 병합하고 정렬
      const allProblems = [...get().problems, ...fetchedProblems];
      const problemMap = new Map<string, Problem>();
      allProblems.forEach((p) => {
        problemMap.set(p.id, p); // id가 같으면 나중에 들어온 값으로 덮어씀
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
          personaId ? `for persona ${personaId}` : "(all)"
        }: ${fetchedProblems.length}`
      );
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  addProblem: async (problemData) => {
    // 새로운 Problem 타입에 맞춰 객체 생성
    const newProblem: Problem = {
      id: uuidv4(),
      personaId: problemData.personaId,
      title: problemData.title,
      description: problemData.description,
      status: problemData.status || "active",
      priority: problemData.priority || "none",
      urgency: problemData.urgency,
      importance: problemData.importance,
      tags: problemData.tags || [],
      childThreadIds: [], // 새로 생성 시 빈 배열
      timeSpent: 0,
      createdAt: new Date(),
    };

    try {
      const db = await getDatabase();
      // 새로운 스키마에 맞춰 INSERT 쿼리 수정
      await db.runAsync(
        `INSERT INTO Problems (id, personaId, title, description, status, priority, urgency, importance, tags, childThreadIds, timeSpent, createdAt, resolvedAt, archivedAt, starReportId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProblem.id,
          newProblem.personaId,
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
        ]
      );

      // 부모 Persona의 problemIds 배열에 새 Problem ID 추가
      const parentPersona = get().personas.find(
        (ps) => ps.id === newProblem.personaId
      );
      if (parentPersona) {
        const updatedParentPersona = {
          ...parentPersona,
          problemIds: [...parentPersona.problemIds, newProblem.id],
        };
        await get().updatePersona(updatedParentPersona);
      }

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
      // 새로운 스키마에 맞춰 UPDATE 쿼리 수정
      await db.runAsync(
        `UPDATE Problems 
         SET title = ?, description = ?, status = ?, priority = ?, urgency = ?, importance = ?, tags = ?, childThreadIds = ?, timeSpent = ?, resolvedAt = ?, archivedAt = ?, starReportId = ?
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
      // 부모 Persona에서 problemId 제거
      const parentPersona = get().personas.find(
        (ps) => ps.id === problemToDelete.personaId
      );
      if (parentPersona) {
        const updatedParentPersona = {
          ...parentPersona,
          problemIds: parentPersona.problemIds.filter((id) => id !== problemId),
        };
        await get().updatePersona(updatedParentPersona);
      }

      // DB에서 Problem 삭제 (연관된 데이터는 ON DELETE CASCADE로 처리됨)
      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);

      // 로컬 상태에서 Problem 및 모든 관련 하위 데이터 정리
      set((state) => ({
        problems: state.problems.filter((p) => p.id !== problemId),
        // 이 Problem을 참조하는 모든 ThreadItem 제거
        threadItems: state.threadItems.filter(
          (ti) => ti.problemId !== problemId
        ),
        // 이 Problem을 참조하는 모든 StarReport 제거
        starReports: state.starReports.filter(
          (sr) => sr.problemId !== problemId
        ),
        // 이 Problem을 참조하는 모든 WeeklyProblem 제거
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
