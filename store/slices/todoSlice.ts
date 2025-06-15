import { getDatabase } from "@/lib/db";
import { Todo } from "@/types";
import type {
  AppState,
  TodoSlice as TodoSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * 데이터베이스에서 가져온 데이터를 Todo 타입으로 변환합니다.
 */
const parseTodoFromDB = (dbItem: any): Todo => ({
  id: dbItem.id,
  content: dbItem.content,
  isCompleted: !!dbItem.isCompleted,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

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
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM Todos ORDER BY createdAt DESC;"
      );
      const fetchedTodos = results.map(parseTodoFromDB);
      set({ todos: fetchedTodos, isLoadingTodos: false });
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
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Todos (id, content, isCompleted, createdAt) VALUES (?, ?, ?, ?);`,
        [
          newTodo.id,
          newTodo.content,
          newTodo.isCompleted ? 1 : 0,
          newTodo.createdAt.toISOString(),
        ]
      );

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
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Todos SET content = ?, isCompleted = ?, completedAt = ? WHERE id = ?;`,
        [
          todoToUpdate.content,
          todoToUpdate.isCompleted ? 1 : 0,
          todoToUpdate.completedAt?.toISOString() ?? null,
          todoToUpdate.id,
        ]
      );

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
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Todos WHERE id = ?;`, [todoId]);
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
