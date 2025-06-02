// store/slices/taskSlice.ts

import { StateCreator } from "zustand";
import { Task, Project, TaskStatus } from "@/types";
import type {
  AppState,
  TaskSlice as TaskSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// Task 관련 파서 함수
const parseTaskFromDB = (dbItem: any): Task => ({
  id: dbItem.id,
  projectId: dbItem.projectId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  isRepeatable: !!dbItem.isRepeatable, // INTEGER (0 or 1) to boolean
  status: dbItem.status as TaskStatus,
  isLocked: !!dbItem.isLocked, // INTEGER (0 or 1) to boolean
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

export const createTaskSlice: StateCreator<
  AppState,
  [],
  [],
  TaskSliceInterface
> = (set, get) => ({
  tasks: [],
  isLoadingTasks: false,

  fetchTasks: async (projectId?: string) => {
    set({ isLoadingTasks: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Tasks";
      const params: string[] = [];

      if (projectId) {
        query += " WHERE projectId = ?";
        params.push(projectId);
      }
      query += " ORDER BY createdAt ASC;"; // Tasks often viewed in creation order

      const results = await db.getAllAsync<any>(query, params);
      const fetchedTasks = results.map(parseTaskFromDB);

      if (projectId) {
        // Replace tasks for the specific project, keep others
        set((state) => ({
          tasks: [
            ...state.tasks.filter((t) => t.projectId !== projectId),
            ...fetchedTasks,
          ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          isLoadingTasks: false,
        }));
      } else {
        // Replace all tasks if no specific project ID
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
      console.error("[TaskSlice] Error fetching Tasks:", error);
      set({ isLoadingTasks: false });
    }
  },

  addTask: async (taskData) => {
    // taskData structure from storeTypes.ts:
    // Omit<Task, "id" | "createdAt" | "status" | "isLocked" | "timeSpent" | "completedAt">
    // & { projectId: string; status?: TaskStatus; isLocked?: boolean; timeSpent?: number; }
    const newTaskId = uuidv4();
    const newTask: Task = {
      id: newTaskId,
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      isRepeatable: taskData.isRepeatable,
      status: taskData.status || "todo", // Default status
      isLocked: taskData.isLocked || false, // Default lock status
      timeSpent: taskData.timeSpent || 0, // Default timeSpent
      createdAt: new Date(),
      completedAt: undefined, // Not completed on creation
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Tasks (id, projectId, title, description, isRepeatable, status, isLocked, timeSpent, createdAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newTask.id,
          newTask.projectId,
          newTask.title,
          newTask.description === undefined ? null : newTask.description,
          newTask.isRepeatable ? 1 : 0,
          newTask.status,
          newTask.isLocked ? 1 : 0,
          newTask.timeSpent,
          newTask.createdAt.toISOString(),
          newTask.completedAt ? newTask.completedAt.toISOString() : null,
        ]
      );
      console.log("[TaskSlice] New Task inserted into DB:", newTask.title);

      // Update parent Project's taskIds array
      const parentProject = get().projects.find(
        (p) => p.id === newTask.projectId
      );
      if (parentProject) {
        const updatedParentProject: Project = {
          ...parentProject,
          taskIds: [...parentProject.taskIds, newTask.id].sort(), // Keep taskIds sorted if desired, or just append
        };
        // Assuming projectSlice.updateProject handles DB update for project
        await get().updateProject(updatedParentProject);
        console.log(
          `[TaskSlice] Parent project ${parentProject.id} taskIds updated for new task.`
        );
      } else {
        console.warn(
          `[TaskSlice] Parent project with ID ${newTask.projectId} not found for Task linkage.`
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
      console.error("[TaskSlice] Error adding Task:", error);
      return null;
    }
  },

  updateTask: async (taskToUpdate) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex((t) => t.id === taskToUpdate.id);

    if (taskIndex === -1) {
      console.error("[TaskSlice] Task not found for update:", taskToUpdate.id);
      return null;
    }

    // Ensure `createdAt` is not modified from original, and `completedAt` is handled
    const originalTask = currentTasks[taskIndex];
    const finalTaskToUpdate: Task = {
      ...originalTask, // Preserve original creation timestamp and other potentially non-updated fields
      ...taskToUpdate, // Apply incoming changes
      createdAt: originalTask.createdAt, // Explicitly keep original createdAt
      completedAt:
        taskToUpdate.status === "completed" && !originalTask.completedAt
          ? new Date() // Set completedAt if task is marked completed now and wasn't before
          : taskToUpdate.status !== "completed" && originalTask.completedAt
          ? undefined // Clear completedAt if task is moved from completed to non-completed
          : taskToUpdate.completedAt, // Otherwise, respect incoming completedAt (or keep original if taskToUpdate.completedAt is undefined)
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Tasks SET title = ?, description = ?, isRepeatable = ?, status = ?, 
         isLocked = ?, timeSpent = ?, completedAt = ?
         WHERE id = ?;`,
        [
          finalTaskToUpdate.title,
          finalTaskToUpdate.description === undefined
            ? null
            : finalTaskToUpdate.description,
          finalTaskToUpdate.isRepeatable ? 1 : 0,
          finalTaskToUpdate.status,
          finalTaskToUpdate.isLocked ? 1 : 0,
          finalTaskToUpdate.timeSpent,
          finalTaskToUpdate.completedAt
            ? finalTaskToUpdate.completedAt.toISOString()
            : null,
          finalTaskToUpdate.id,
        ]
      );

      const updatedTasks = currentTasks.map((t) =>
        t.id === finalTaskToUpdate.id ? finalTaskToUpdate : t
      );
      updatedTasks.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ tasks: updatedTasks });
      console.log("[TaskSlice] Task updated:", finalTaskToUpdate.title);
      return finalTaskToUpdate;
    } catch (error) {
      console.error("[TaskSlice] Error updating Task:", error);
      return null;
    }
  },

  deleteTask: async (taskId) => {
    const taskToDelete = get().tasks.find((t) => t.id === taskId);

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Tasks WHERE id = ?;`, [taskId]);
      console.log("[TaskSlice] Task deleted from DB:", taskId);

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
            `[TaskSlice] Parent project ${parentProject.id} taskIds updated after Task deletion.`
          );
        }
      }

      set((state) => ({
        tasks: state.tasks
          .filter((t) => t.id !== taskId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()), // Keep sorted
      }));
      console.log("[TaskSlice] Task removed from store:", taskId);
      return true;
    } catch (error) {
      console.error("[TaskSlice] Error deleting Task:", error);
      return false;
    }
  },

  getTaskById: (id: string) => {
    return get().tasks.find((t) => t.id === id);
  },
});
