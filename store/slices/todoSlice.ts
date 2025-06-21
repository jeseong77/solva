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

export const createTodoSlice: StateCreator<AppState, [], [], TodoSliceInterface> = (
  set,
  get
) => ({
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
   * 기존 Todo 항목을 업데이트합니다.
   */
  updateTodo: async (updates: Partial<Todo> & { id: string }) => {
    const { id, ...fieldsToUpdate } = updates;

    // 업데이트할 필드가 없으면 아무것도 하지 않음
    if (Object.keys(fieldsToUpdate).length === 0) {
      console.log("[TodoSlice] No fields to update for todo:", id);
      return get().todos.find((t) => t.id === id) || null;
    }

    try {
      // 1. DB 업데이트
      await db.update(todos).set(fieldsToUpdate).where(eq(todos.id, id));

      // 2. 클라이언트 상태 업데이트
      let mergedTodo: Todo | null = null;
      set((state) => ({
        todos: state.todos.map((originalTodo) => {
          if (originalTodo.id === id) {
            // 기존 객체와 업데이트된 필드를 병합
            mergedTodo = { ...originalTodo, ...updates };
            return mergedTodo;
          }
          return originalTodo;
        }),
      }));

      console.log("[TodoSlice] Todo updated:", id, "with", fieldsToUpdate);
      return mergedTodo;
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
