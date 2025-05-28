// src/store/store.ts
import { getDatabase } from "@/lib/db";
import { Problem, ProblemStatus, RetrospectiveReport, Task } from "@/types";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

// --- Helper Parsers ---
const parseProblemFromDB = (dbItem: any): Problem => ({
  ...dbItem,
  childProblemIds: dbItem.childProblemIds
    ? JSON.parse(dbItem.childProblemIds)
    : [],
  associatedTaskIds: dbItem.associatedTaskIds
    ? JSON.parse(dbItem.associatedTaskIds)
    : [],
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
});

const parseTaskFromDB = (dbItem: any): Task => ({
  ...dbItem,
  isRepeatable: !!dbItem.isRepeatable,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

// --- Store State and Actions Interface ---
interface AppState {
  problems: Problem[];
  tasks: Task[];
  retrospectiveReports: RetrospectiveReport[];
  isLoadingProblems: boolean;
  isLoadingTasks: boolean;

  fetchProblems: () => Promise<void>;
  addProblem: (
    problemData: Omit<
      Problem,
      "id" | "createdAt" | "childProblemIds" | "associatedTaskIds" // status도 자동 관리되므로 제외 가능
    > // status는 내부에서 default 처리 또는 명시적 전달
  ) => Promise<Problem | null>;
  updateProblem: (
    // Problem 객체 전체를 받거나, id와 함께 업데이트할 부분만 받을 수 있음
    problemToUpdate: Problem
  ) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;

  fetchTasks: (problemId?: string) => Promise<void>;
  addTask: (taskData: Omit<Task, "id" | "createdAt">) => Promise<Task | null>;
  updateTask: (
    updatedTaskData: Partial<Task> & { id: string }
  ) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTaskById: (id: string) => Task | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  problems: [],
  tasks: [],
  retrospectiveReports: [],
  isLoadingProblems: false,
  isLoadingTasks: false,

  fetchProblems: async () => {
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM Problems ORDER BY createdAt DESC;"
      );
      const fetchedProblems = results.map(parseProblemFromDB);
      set({ problems: fetchedProblems, isLoadingProblems: false });
      console.log("[DBStore] Problems fetched:", fetchedProblems.length);
    } catch (error) {
      console.error("[DBStore] Error fetching problems:", error);
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
      status: problemData.status || "active", // 명시적 status 없으면 active
      path: problemData.path,
      associatedTaskIds: [], // 새 문제는 항상 빈 associatedTaskIds로 시작
      retrospectiveReportId: problemData.retrospectiveReportId,
      createdAt: new Date(),
      resolvedAt: problemData.resolvedAt, // 일반적으로 새 문제는 null 또는 undefined
      archivedAt: problemData.archivedAt, // 일반적으로 새 문제는 null 또는 undefined
    };

    const db = await getDatabase();
    try {
      // 1. 새 문제(하위 문제)를 DB에 삽입
      await db.runAsync(
        `INSERT INTO Problems (id, title, description, parentId, childProblemIds, status, path, associatedTaskIds, retrospectiveReportId, createdAt, resolvedAt, archivedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProblem.id,
          newProblem.title,
          newProblem.description || null,
          newProblem.parentId || null,
          JSON.stringify(newProblem.childProblemIds),
          newProblem.status,
          newProblem.path || null,
          JSON.stringify(newProblem.associatedTaskIds),
          newProblem.retrospectiveReportId || null,
          newProblem.createdAt.toISOString(),
          newProblem.resolvedAt ? newProblem.resolvedAt.toISOString() : null,
          newProblem.archivedAt ? newProblem.archivedAt.toISOString() : null,
        ]
      );
      console.log("[DBStore] New problem inserted into DB:", newProblem.title);

      let problemsToSet = [newProblem, ...get().problems]; // 새 문제를 스토어에 우선 추가 (정렬은 나중에)

      // 2. 만약 부모 ID가 있다면, 부모 문제를 업데이트
      if (newProblem.parentId) {
        const parentProblem = get().problems.find(
          (p) => p.id === newProblem.parentId
        );
        if (parentProblem) {
          const updatedParent: Problem = {
            ...parentProblem,
            childProblemIds: [...parentProblem.childProblemIds, newProblem.id],
          };
          // 부모 문제를 DB에 업데이트 (updateProblem 액션 재사용 또는 직접 DB 호출)
          // 여기서는 updateProblem 액션을 호출한다고 가정 (순환 참조 가능성 있으므로 주의 또는 별도 함수화)
          // 직접 DB 업데이트 후, 로컬 상태도 업데이트
          await db.runAsync(
            `UPDATE Problems SET childProblemIds = ? WHERE id = ?;`,
            [JSON.stringify(updatedParent.childProblemIds), updatedParent.id]
          );
          console.log(
            `[DBStore] Parent problem ${updatedParent.id} childProblemIds updated in DB.`
          );

          // 스토어의 problems 배열에서 부모 문제도 업데이트
          problemsToSet = problemsToSet.map((p) =>
            p.id === updatedParent.id ? updatedParent : p
          );
        } else {
          console.warn(
            `[DBStore] Parent problem with ID ${newProblem.parentId} not found in local store to update childProblemIds.`
          );
        }
      }

      // 최종적으로 정렬된 문제 목록으로 상태 업데이트
      problemsToSet.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ); // 최신순 정렬 (fetch와 동일하게)
      set({ problems: problemsToSet });

      console.log("[DBStore] Problem added/parent updated:", newProblem.title);
      return newProblem;
    } catch (error) {
      console.error(
        "[DBStore] Error in addProblem (adding new problem or updating parent):",
        error
      );
      return null;
    }
  },

  updateProblem: async (problemToUpdateFull) => {
    // Problem 전체 객체를 받는 것으로 변경 (또는 Partial 유지)
    // 만약 Partial<Problem> & { id: string }을 유지한다면, 기존 데이터를 먼저 가져와 병합해야 함
    // 여기서는 problemToUpdateFull이 업데이트될 완전한 Problem 객체라고 가정
    const currentProblems = get().problems;
    const problemIndex = currentProblems.findIndex(
      (p) => p.id === problemToUpdateFull.id
    );

    if (problemIndex === -1) {
      console.error(
        "[DBStore] Problem not found for update:",
        problemToUpdateFull.id
      );
      return null;
    }

    // DB에 저장하기 전에 상태가 최신인지 확인 (선택적이지만, 동시성 문제 방지)
    // const problemFromDb = await db.getFirstAsync<any>(`SELECT * FROM Problems WHERE id = ?;`, [problemToUpdateFull.id]);
    // if (!problemFromDb) { /* 오류 처리 */ }
    // const trulyCurrentProblem = parseProblemFromDB(problemFromDb);
    // const finalProblemToUpdate = { ...trulyCurrentProblem, ...problemToUpdateFull };
    // 여기서는 전달된 problemToUpdateFull을 그대로 사용

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Problems SET title = ?, description = ?, parentId = ?, childProblemIds = ?, status = ?, path = ?, associatedTaskIds = ?, retrospectiveReportId = ?, resolvedAt = ?, archivedAt = ?
         WHERE id = ?;`,
        [
          problemToUpdateFull.title,
          problemToUpdateFull.description || null,
          problemToUpdateFull.parentId || null,
          JSON.stringify(problemToUpdateFull.childProblemIds),
          problemToUpdateFull.status,
          problemToUpdateFull.path || null,
          JSON.stringify(problemToUpdateFull.associatedTaskIds),
          problemToUpdateFull.retrospectiveReportId || null,
          problemToUpdateFull.resolvedAt
            ? problemToUpdateFull.resolvedAt.toISOString()
            : null,
          problemToUpdateFull.archivedAt
            ? problemToUpdateFull.archivedAt.toISOString()
            : null,
          problemToUpdateFull.id,
        ]
      );

      const updatedProblems = [...currentProblems];
      updatedProblems[problemIndex] = problemToUpdateFull; // problemToUpdateFull로 교체
      updatedProblems.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ); // 정렬 유지
      set({ problems: updatedProblems });

      console.log("[DBStore] Problem updated:", problemToUpdateFull.title);
      return problemToUpdateFull;
    } catch (error) {
      console.error("[DBStore] Error updating problem:", error);
      return null;
    }
  },

  // deleteProblem, getProblemById, Task 관련 액션들은 이전과 동일하게 유지
  // ... (이전 답변의 deleteProblem, getProblemById, Task CRUD 코드) ...
  deleteProblem: async (problemId) => {
    const problemsBeforeDeletion = get().problems;
    const parentProblemInstance = problemsBeforeDeletion.find((p) =>
      p.childProblemIds.includes(problemId)
    );

    try {
      const db = await getDatabase();
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
          `[DBStore] Parent problem ${parentProblemInstance.id} childProblemIds updated in DB.`
        );
      }
      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);
      console.log("[DBStore] Problem deleted from DB:", problemId);

      set((state) => {
        let updatedProblems = state.problems.filter((p) => p.id !== problemId);
        if (parentProblemInstance) {
          updatedProblems = updatedProblems.map((p) => {
            if (p.id === parentProblemInstance.id) {
              return {
                ...p,
                childProblemIds: p.childProblemIds.filter(
                  (id) => id !== problemId
                ),
              };
            }
            return p;
          });
        }
        updatedProblems.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        return {
          problems: updatedProblems,
          tasks: state.tasks.filter((t) => t.problemId !== problemId),
        };
      });
      console.log(
        "[DBStore] Problem and related data updated in local store after deletion of:",
        problemId
      );
      return true;
    } catch (error) {
      console.error(
        "[DBStore] Error deleting problem and updating parent:",
        error
      );
      return false;
    }
  },

  getProblemById: (id: string) => {
    const problems = get().problems;
    return problems.find((p) => p.id === id);
  },

  fetchTasks: async (problemId?: string) => {
    set({ isLoadingTasks: true });
    try {
      const db = await getDatabase();
      let results;
      if (problemId) {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Tasks WHERE problemId = ? ORDER BY createdAt ASC;",
          [problemId]
        );
      } else {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Tasks ORDER BY createdAt ASC;"
        );
      }
      const fetchedTasks = results.map(parseTaskFromDB);

      if (problemId) {
        set((state) => {
          const otherTasks = state.tasks.filter(
            (t) => t.problemId !== problemId
          );
          const newTaskList = [...otherTasks, ...fetchedTasks];
          newTaskList.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          return {
            tasks: newTaskList,
            isLoadingTasks: false,
          };
        });
      } else {
        set({ tasks: fetchedTasks, isLoadingTasks: false });
      }
      console.log(
        `[DBStore] Tasks fetched ${
          problemId ? `for problem ${problemId}` : "(all)"
        }:`,
        fetchedTasks.length
      );
    } catch (error) {
      console.error("[DBStore] Error fetching tasks:", error);
      set({ isLoadingTasks: false });
    }
  },

  addTask: async (taskData) => {
    const newTask: Task = {
      id: uuidv4(),
      problemId: taskData.problemId,
      title: taskData.title,
      isRepeatable: taskData.isRepeatable,
      status: taskData.status || "todo",
      createdAt: new Date(),
      completedAt: taskData.completedAt,
    };
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Tasks (id, problemId, title, isRepeatable, status, createdAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          newTask.id,
          newTask.problemId,
          newTask.title,
          newTask.isRepeatable ? 1 : 0,
          newTask.status,
          newTask.createdAt.toISOString(),
          newTask.completedAt ? newTask.completedAt.toISOString() : null,
        ]
      );
      set((state) => ({
        tasks: [...state.tasks, newTask].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        ),
      }));
      console.log("[DBStore] Task added:", newTask.title);
      return newTask;
    } catch (error) {
      console.error("[DBStore] Error adding task:", error);
      return null;
    }
  },

  updateTask: async (updatedTaskData) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex(
      (t) => t.id === updatedTaskData.id
    );
    if (taskIndex === -1) {
      console.error("[DBStore] Task not found for update:", updatedTaskData.id);
      return null;
    }
    const taskToUpdate = { ...currentTasks[taskIndex], ...updatedTaskData };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Tasks SET title = ?, isRepeatable = ?, status = ?, completedAt = ?
         WHERE id = ?;`,
        [
          taskToUpdate.title,
          taskToUpdate.isRepeatable ? 1 : 0,
          taskToUpdate.status,
          taskToUpdate.completedAt
            ? taskToUpdate.completedAt.toISOString()
            : null,
          taskToUpdate.id,
        ]
      );
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = taskToUpdate;
      updatedTasks.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ tasks: updatedTasks });
      console.log("[DBStore] Task updated:", taskToUpdate.title);
      return taskToUpdate;
    } catch (error) {
      console.error("[DBStore] Error updating task:", error);
      return null;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Tasks WHERE id = ?;`, [taskId]);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      console.log("[DBStore] Task deleted:", taskId);
      return true;
    } catch (error) {
      console.error("[DBStore] Error deleting task:", error);
      return false;
    }
  },

  getTaskById: (id: string) => {
    const tasks = get().tasks;
    return tasks.find((t) => t.id === id);
  },
}));
