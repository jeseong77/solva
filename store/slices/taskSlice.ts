import { getDatabase } from "@/lib/db";
import { Project, Task, TaskStatus } from "@/types";
import type { AppState } from "@/types/storeTypes"; // 통합 AppState 타입
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// Task 관련 파서 함수
const parseTaskFromDB = (dbItem: any): Task => ({
  id: dbItem.id,
  projectId: dbItem.projectId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  isRepeatable: !!dbItem.isRepeatable, // INTEGER (0 or 1) to boolean
  status: dbItem.status as TaskStatus,
  isLocked: !!dbItem.isLocked, // INTEGER (0 or 1) to boolean
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

export interface TaskSlice {
  tasks: Task[];
  isLoadingTasks: boolean;
  fetchTasks: (projectId?: string) => Promise<void>; // 특정 프로젝트의 Task 또는 전체 Task
  addTask: (
    taskData: Omit<Task, "id" | "createdAt" | "status" | "isLocked"> & {
      status?: TaskStatus;
      isLocked?: boolean;
    } // projectId는 Omit에 의해 포함됨
  ) => Promise<Task | null>;
  updateTask: (
    updatedTaskData: Partial<Task> & { id: string }
  ) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTaskById: (id: string) => Task | undefined;
}

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (
  set,
  get
) => ({
  tasks: [],
  isLoadingTasks: false,

  fetchTasks: async (projectId?: string) => {
    set({ isLoadingTasks: true });
    try {
      const db = await getDatabase();
      let results;
      if (projectId) {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Tasks WHERE projectId = ? ORDER BY createdAt ASC;",
          [projectId]
        );
      } else {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Tasks ORDER BY createdAt ASC;"
        );
      }
      const fetchedTasks = results.map(parseTaskFromDB);

      if (projectId) {
        set((state) => ({
          tasks: [
            ...state.tasks.filter((t) => t.projectId !== projectId), // 해당 프로젝트의 기존 Task 제거
            ...fetchedTasks, // 새로 가져온 Task 추가
          ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()), // 생성일 오름차순 정렬
          isLoadingTasks: false,
        }));
      } else {
        set({
          tasks: fetchedTasks.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          ),
          isLoadingTasks: false,
        });
      }
      console.log(
        `[TaskSlice] Tasks fetched ${
          projectId ? `for project ${projectId}` : "(all)"
        }:`,
        fetchedTasks.length
      );
    } catch (error) {
      console.error("[TaskSlice] Error fetching tasks:", error);
      set({ isLoadingTasks: false });
    }
  },

  addTask: async (taskData) => {
    const newTask: Task = {
      id: uuidv4(),
      projectId: taskData.projectId, // taskData에 projectId가 반드시 포함되어야 함
      title: taskData.title,
      description: taskData.description,
      isRepeatable: taskData.isRepeatable,
      status: taskData.status || "todo", // 기본 상태 'todo'
      isLocked: taskData.isLocked || false, // 기본 잠금 상태 false
      createdAt: new Date(),
      completedAt: taskData.completedAt,
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Tasks (id, projectId, title, description, isRepeatable, status, isLocked, createdAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newTask.id,
          newTask.projectId,
          newTask.title,
          newTask.description === undefined ? null : newTask.description,
          newTask.isRepeatable ? 1 : 0,
          newTask.status,
          newTask.isLocked ? 1 : 0,
          newTask.createdAt.toISOString(),
          newTask.completedAt ? newTask.completedAt.toISOString() : null,
        ]
      );
      console.log("[TaskSlice] New task inserted into DB:", newTask.title);

      // 연결된 Project의 taskIds 업데이트
      const parentProject = get().projects.find(
        (p) => p.id === newTask.projectId
      );
      if (parentProject) {
        const updatedParentProject: Project = {
          ...parentProject,
          taskIds: [...parentProject.taskIds, newTask.id],
        };
        // ProjectSlice의 updateProject 액션 호출 (AppState를 통해)
        await get().updateProject(updatedParentProject);
        console.log(
          `[TaskSlice] Parent project ${parentProject.id} taskIds updated.`
        );
      } else {
        console.warn(
          `[TaskSlice] Parent project with ID ${newTask.projectId} not found in local store for task linkage.`
        );
      }

      const currentTasks = get().tasks;
      const newTaskList = [...currentTasks, newTask].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ tasks: newTaskList });
      console.log("[TaskSlice] Task added to store:", newTask.title);
      return newTask;
    } catch (error) {
      console.error("[TaskSlice] Error adding task:", error);
      return null;
    }
  },

  updateTask: async (updatedTaskData) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex(
      (t) => t.id === updatedTaskData.id
    );
    if (taskIndex === -1) {
      console.error(
        "[TaskSlice] Task not found for update:",
        updatedTaskData.id
      );
      return null;
    }

    const taskToUpdate: Task = {
      ...currentTasks[taskIndex],
      ...updatedTaskData,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Tasks SET title = ?, description = ?, isRepeatable = ?, status = ?, isLocked = ?, completedAt = ?
         WHERE id = ?;`,
        [
          taskToUpdate.title,
          taskToUpdate.description === undefined
            ? null
            : taskToUpdate.description,
          taskToUpdate.isRepeatable ? 1 : 0,
          taskToUpdate.status,
          taskToUpdate.isLocked ? 1 : 0,
          taskToUpdate.completedAt
            ? taskToUpdate.completedAt.toISOString()
            : null,
          taskToUpdate.id,
        ]
      );

      const updatedTasks = currentTasks.map((t) =>
        t.id === taskToUpdate.id ? taskToUpdate : t
      );
      updatedTasks.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ tasks: updatedTasks });
      console.log("[TaskSlice] Task updated:", taskToUpdate.title);
      return taskToUpdate;
    } catch (error) {
      console.error("[TaskSlice] Error updating task:", error);
      return null;
    }
  },

  deleteTask: async (taskId) => {
    const taskToDelete = get().tasks.find((t) => t.id === taskId);
    if (!taskToDelete) {
      console.warn(
        `[TaskSlice] Task with ID ${taskId} not found in local store for deletion.`
      );
      // DB에서만 삭제 시도 가능
    }

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Tasks WHERE id = ?;`, [taskId]);
      console.log("[TaskSlice] Task deleted from DB:", taskId);

      // 연결된 Project의 taskIds 업데이트
      if (taskToDelete) {
        const parentProject = get().projects.find(
          (p) => p.id === taskToDelete.projectId
        );
        if (parentProject) {
          const updatedParentProject: Project = {
            ...parentProject,
            taskIds: parentProject.taskIds.filter((id) => id !== taskId),
          };
          await get().updateProject(updatedParentProject);
          console.log(
            `[TaskSlice] Parent project ${parentProject.id} taskIds updated after task deletion.`
          );
        }
      }

      set((state) => ({
        tasks: state.tasks
          .filter((t) => t.id !== taskId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      }));
      console.log("[TaskSlice] Task removed from store:", taskId);
      return true;
    } catch (error) {
      console.error("[TaskSlice] Error deleting task:", error);
      return false;
    }
  },

  getTaskById: (id: string) => {
    return get().tasks.find((t) => t.id === id);
  },
});
