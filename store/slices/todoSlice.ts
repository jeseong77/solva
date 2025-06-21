// src/store/slices/todoSlice.ts

import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { Todo } from "@/types";
import type {
  AppState,
  TodoSlice as TodoSliceInterface,
} from "@/types/storeTypes";
import { desc, eq } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

export const createTodoSlice: StateCreator<
  AppState,
  [],
  [],
  TodoSliceInterface
> = (set, get) => ({
  todos: [],
  isLoadingTodos: false,

  /**
   * 모든 Todo 항목을 불러옵니다.
   */
  fetchTodos: async () => {
    set({ isLoadingTodos: true });
    try {
      const fetchedTodos = await db
        .select()
        .from(todos)
        .orderBy(desc(todos.createdAt));

      // --- FIX: Implement the "Smart Merge" logic ---
      const todoMap = new Map(get().todos.map((t) => [t.id, t]));
      fetchedTodos.forEach((t) => todoMap.set(t.id, t));

      const newTodoList = Array.from(todoMap.values()).sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
      );
      // --- End of Fix ---

      set({ todos: newTodoList, isLoadingTodos: false });
      console.log(`[TodoSlice] ${fetchedTodos.length} todos fetched.`);
    } catch (error) {
      console.error("[TodoSlice] Error fetching todos:", error);
      set({ isLoadingTodos: false });
    }
  },

  /**
   * 새로운 Todo 항목을 추가합니다.
   */
  addTodo: async (todoData) => {
    const newTodo: Todo = {
      id: uuidv4(),
      content: todoData.content,
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null, // Explicitly set to null for the DB
    };

    try {
      await db.insert(todos).values(newTodo);

      set((state) => ({ todos: [newTodo, ...state.todos] }));
      console.log("[TodoSlice] Todo added:", newTodo.id);
      return newTodo;
    } catch (error) {
      console.error("[TodoSlice] Error adding todo:", error);
      return null;
    }
  },

  /**
   * 기존 Todo 항목을 업데이트합니다. (주로 완료 상태 변경)
   */
  updateTodo: async (todoToUpdate) => {
    try {
      await db
        .update(todos)
        .set({
          content: todoToUpdate.content,
          isCompleted: todoToUpdate.isCompleted,
          completedAt: todoToUpdate.completedAt,
        })
        .where(eq(todos.id, todoToUpdate.id));

      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoToUpdate.id ? todoToUpdate : t
        ),
      }));
      console.log("[TodoSlice] Todo updated:", todoToUpdate.id);
      return todoToUpdate;
    } catch (error) {
      console.error("[TodoSlice] Error updating todo:", error);
      return null;
    }
  },

  /**
   * Todo 항목을 삭제합니다.
   */
  deleteTodo: async (todoId) => {
    try {
      await db.delete(todos).where(eq(todos.id, todoId));

      set((state) => ({
        todos: state.todos.filter((t) => t.id !== todoId),
      }));
      console.log("[TodoSlice] Todo deleted:", todoId);
      return true;
    } catch (error) {
      console.error("[TodoSlice] Error deleting todo:", error);
      return false;
    }
  },

  /**
   * ID로 Todo를 동기적으로 조회합니다.
   */
  getTodoById: (id: string) => {
    return get().todos.find((t) => t.id === id);
  },
});
