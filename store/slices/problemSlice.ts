// src/store/slices/problemSlice.ts

import { getDatabase } from "@/lib/db";
import { Priority, Problem, ProblemStatus, Objective, Rule, StarReport } from "@/types"; // Objective, Rule, StarReport 추가 (delete 시 정리용)
import type {
  AppState,
  ProblemSlice as ProblemSliceInterface,
} from "@/types/storeTypes"; // storeTypes.ts 경로 확인
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

const parseProblemFromDB = (dbItem: any): Problem => ({
  id: dbItem.id,
  personaId: dbItem.personaId, // personaId 파싱 추가
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  status: dbItem.status as ProblemStatus,
  priority: dbItem.priority as Priority,
  // resolutionCriteriaText, resolutionNumericalTarget, currentNumericalProgress는 Problem 타입에서 제거됨
  objectiveIds: dbItem.objectiveIds ? JSON.parse(dbItem.objectiveIds) : [],
  ruleIds: dbItem.ruleIds ? JSON.parse(dbItem.ruleIds) : [],
  tagIds: dbItem.tagIds ? JSON.parse(dbItem.tagIds) : [],
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
  starReportId: dbItem.starReportId === null ? undefined : dbItem.starReportId,
});

export const createProblemSlice: StateCreator<
  AppState,
  [],
  [],
  ProblemSliceInterface
> = (set, get) => ({
  problems: [],
  isLoadingProblems: false,

  fetchProblems: async (personaId?: string) => { // personaId를 기준으로 fetch 할 수 있도록 변경
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Problems";
      const params: string[] = [];
      if (personaId) {
        query += " WHERE personaId = ?";
        params.push(personaId);
      }
      query += " ORDER BY priority ASC, createdAt DESC;"; // 중요도 높은 것, 최신순 정렬

      const results = await db.getAllAsync<any>(query, params);
      const fetchedProblems = results.map(parseProblemFromDB);

      if (personaId) {
        set(state => ({
          problems: [
            ...state.problems.filter(p => p.personaId !== personaId),
            ...fetchedProblems,
          ].sort((a, b) => { // 정렬 로직 (우선순위 -> 생성일)
            const priorityOrder = { high: 1, medium: 2, low: 3, none: 4 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          }),
          isLoadingProblems: false,
        }));
      } else {
        set({ problems: fetchedProblems, isLoadingProblems: false });
      }
      // console.log(`[ProblemSlice] Problems fetched ${personaId ? `for persona ${personaId}` : '(all)'}:`, fetchedProblems.length);
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  addProblem: async (problemData) => {
    // problemData 타입은 storeTypes.ts의 ProblemSlice.addProblem 시그니처를 따름
    // Omit<Problem, "id"| "createdAt"| "objectiveIds"| "ruleIds"| "tagIds"| "timeSpent"| "currentNumericalProgress"| "resolvedAt"| "archivedAt"| "starReportId" | "status" | "priority"> 
    // & { personaId: string; title: string; status?: ProblemStatus; priority?: Priority; }
    // 즉, personaId와 title은 필수, 나머지는 옵션 또는 Problem 타입의 옵셔널 필드들

    const newProblem: Problem = {
      id: uuidv4(),
      personaId: problemData.personaId, // 필수
      title: problemData.title,         // 필수
      description: problemData.description,
      status: problemData.status || "active", // 기본값
      priority: problemData.priority || "medium", // 기본값
      objectiveIds: [], // 새로 생성 시 빈 배열
      ruleIds: [],      // 새로 생성 시 빈 배열
      tagIds: [],
      timeSpent: 0,     // 새로 생성 시 0
      createdAt: new Date(),
      resolvedAt: undefined,
      archivedAt: undefined,
      starReportId: null, // 명시적으로 null 초기화
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        // resolutionCriteriaText, resolutionNumericalTarget, currentNumericalProgress 컬럼 제거
        // personaId 컬럼 추가
        `INSERT INTO Problems (id, personaId, title, description, status, priority, objectiveIds, ruleIds, tagIds, timeSpent, createdAt, resolvedAt, archivedAt, starReportId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProblem.id,
          newProblem.personaId,
          newProblem.title,
          newProblem.description === undefined ? null : newProblem.description,
          newProblem.status,
          newProblem.priority,
          // resolution Criteria/Target/Progress 파라미터 제거
          JSON.stringify(newProblem.objectiveIds),
          JSON.stringify(newProblem.ruleIds),
          JSON.stringify(newProblem.tagIds),
          newProblem.timeSpent,
          newProblem.createdAt.toISOString(),
          newProblem.resolvedAt ? newProblem.resolvedAt.toISOString() : null,
          newProblem.archivedAt ? newProblem.archivedAt.toISOString() : null,
          newProblem.starReportId === undefined ? null : newProblem.starReportId, // undefined면 null 처리
        ]
      );

      // Persona의 problemIds 업데이트 로직 (PersonaSlice에 해당 액션이 있다면 호출)
      const parentPersona = get().personas.find(ps => ps.id === newProblem.personaId);
      if (parentPersona) {
        const updatedParentPersona = {
          ...parentPersona,
          problemIds: [...parentPersona.problemIds, newProblem.id]
        };
        await get().updatePersona(updatedParentPersona); // updatePersona가 AppState를 통해 접근 가능해야 함
      }

      const currentProblems = get().problems;
      const newProblemList = [newProblem, ...currentProblems].sort(
        (a, b) => {
          const priorityOrder = { high: 1, medium: 2, low: 3, none: 4 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
      );
      set({ problems: newProblemList });
      console.log("[ProblemSlice] Problem added:", newProblem.title);
      return newProblem;
    } catch (error) {
      console.error("[ProblemSlice] Error adding problem:", error);
      return null;
    }
  },

  updateProblem: async (problemToUpdate) => {
    const currentProblems = get().problems;
    const problemIndex = currentProblems.findIndex(p => p.id === problemToUpdate.id);
    if (problemIndex === -1) {
      console.error("[ProblemSlice] Problem not found for update:", problemToUpdate.id);
      return null;
    }
    // 전달된 problemToUpdate가 DB에 저장될 최종 모습이라고 가정
    try {
      const db = await getDatabase();
      await db.runAsync(
        // resolutionCriteriaText, resolutionNumericalTarget, currentNumericalProgress 컬럼 제거
        // personaId 컬럼 추가 (보통 Problem의 Persona는 변경되지 않지만, 타입상 포함)
        `UPDATE Problems SET personaId = ?, title = ?, description = ?, status = ?, priority = ?, 
         objectiveIds = ?, ruleIds = ?, tagIds = ?, 
         timeSpent = ?, resolvedAt = ?, archivedAt = ?, starReportId = ?
         WHERE id = ?;`, // 13개 SET 필드
        [
          problemToUpdate.personaId,
          problemToUpdate.title,
          problemToUpdate.description === undefined ? null : problemToUpdate.description,
          problemToUpdate.status,
          problemToUpdate.priority,
          // resolution Criteria/Target/Progress 파라미터 제거
          JSON.stringify(problemToUpdate.objectiveIds || []),
          JSON.stringify(problemToUpdate.ruleIds || []),
          JSON.stringify(problemToUpdate.tagIds || []),
          problemToUpdate.timeSpent,
          problemToUpdate.resolvedAt ? problemToUpdate.resolvedAt.toISOString() : null,
          problemToUpdate.archivedAt ? problemToUpdate.archivedAt.toISOString() : null,
          problemToUpdate.starReportId === undefined ? null : problemToUpdate.starReportId,
          problemToUpdate.id,
        ]
      );

      const updatedProblems = currentProblems.map(p => p.id === problemToUpdate.id ? problemToUpdate : p);
      updatedProblems.sort(
        (a, b) => {
          const priorityOrder = { high: 1, medium: 2, low: 3, none: 4 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
      );
      set({ problems: updatedProblems });
      console.log("[ProblemSlice] Problem updated:", problemToUpdate.title);
      return problemToUpdate;
    } catch (error) {
      console.error("[ProblemSlice] Error updating problem:", error);
      return null;
    }
  },

  deleteProblem: async (problemId) => {
    const problemToDelete = get().problems.find(p => p.id === problemId);
    if (!problemToDelete) return false;

    const db = await getDatabase();
    try {
      // 연결된 Persona의 problemIds 업데이트
      const parentPersona = get().personas.find(ps => ps.id === problemToDelete.personaId);
      if (parentPersona) {
        const updatedParentPersona = {
          ...parentPersona,
          problemIds: parentPersona.problemIds.filter(id => id !== problemId)
        };
        await get().updatePersona(updatedParentPersona); // PersonaSlice의 액션 호출
      }

      // Problem 삭제 (DB에서 ON DELETE CASCADE로 Objectives, Rules, StarReports도 삭제됨)
      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);

      // 로컬 상태 업데이트
      set(state => {
        const remainingProblems = state.problems.filter(p => p.id !== problemId)
          .sort((a, b) => { /* 정렬 로직 */
            const priorityOrder = { high: 1, medium: 2, low: 3, none: 4 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

        // Problem 삭제에 따른 하위 데이터 로컬 상태 정리
        const objectivesToDelete = state.objectives.filter(o => o.problemId === problemId);
        const objectiveIdsToDelete = objectivesToDelete.map(o => o.id);
        // Objective에 연결된 blockingProblemIds 내의 Problem은 여기서 직접 삭제하지 않음 (별도 Problem)

        return {
          problems: remainingProblems,
          objectives: state.objectives.filter(o => o.problemId !== problemId),
          rules: state.rules.filter(r => r.problemId !== problemId),
          starReports: state.starReports.filter(sr => sr.problemId !== problemId),
          // Tasks는 Objectives에 통합됨
        };
      });
      console.log("[ProblemSlice] Problem and related data cleaned from local store:", problemId);
      return true;
    } catch (error) {
      console.error("[ProblemSlice] Error deleting problem:", error);
      return false;
    }
  },

  getProblemById: (id: string) => {
    return get().problems.find(p => p.id === id);
  },
});