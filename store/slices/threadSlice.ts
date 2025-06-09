// src/store/slices/threadSlice.ts

import { getDatabase } from "@/lib/db";
import {
  ActionStatus,
  ActionThreadItem,
  BaseThreadItem,
  BottleneckThreadItem,
  GeneralThreadItem,
  SessionThreadItem,
  TaskThreadItem,
  ThreadItem,
  ThreadItemType,
} from "@/types";
import type {
  AppState,
  ThreadSlice as ThreadSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

/**
 * DB 데이터를 타입에 맞는 ThreadItem 객체로 변환합니다.
 * Single-Table Inheritance 패턴에 따라 'type' 필드를 기준으로 분기 처리합니다.
 */
const parseThreadItemFromDB = (dbItem: any): ThreadItem => {
  const baseItem: BaseThreadItem = {
    id: dbItem.id,
    problemId: dbItem.problemId,
    parentId: dbItem.parentId,
    childThreadIds: JSON.parse(dbItem.childThreadIds || "[]"),
    type: dbItem.type,
    content: dbItem.content,
    isImportant: !!dbItem.isImportant,
    resultIds: JSON.parse(dbItem.resultIds || "[]"),
    createdAt: new Date(dbItem.createdAt),
    authorId: dbItem.authorId,
  };

  switch (baseItem.type) {
    case "General":
      return baseItem as GeneralThreadItem;
    case "Bottleneck":
      return {
        ...baseItem,
        isResolved: !!dbItem.isResolved,
      } as BottleneckThreadItem;
    case "Task":
      return {
        ...baseItem,
        isCompleted: !!dbItem.isCompleted,
      } as TaskThreadItem;
    case "Action":
      return {
        ...baseItem,
        status: dbItem.status as ActionStatus,
        timeSpent: dbItem.timeSpent || 0,
        deadline: dbItem.deadline ? new Date(dbItem.deadline) : undefined,
        completedAt: dbItem.completedAt
          ? new Date(dbItem.completedAt)
          : undefined,
      } as ActionThreadItem;
    case "Session":
      return {
        ...baseItem,
        timeSpent: dbItem.timeSpent || 0,
        startTime: new Date(dbItem.startTime),
      } as SessionThreadItem;
    default:
      // 기본적으로 General 타입으로 처리하거나 에러를 발생시킬 수 있습니다.
      // 여기서는 General 타입으로 안전하게 처리합니다.
      return { ...baseItem, type: "General" } as GeneralThreadItem;
  }
};

export const createThreadSlice: StateCreator<
  AppState,
  [],
  [],
  ThreadSliceInterface
> = (set, get) => ({
  threadItems: [],
  isLoadingThreads: false,

  /**
   * 특정 Problem 또는 Parent 스레드에 속한 스레드 아이템들을 불러옵니다.
   */
  fetchThreads: async (options) => {
    set({ isLoadingThreads: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM ThreadItems WHERE problemId = ?";
      const params: (string | null)[] = [options.problemId];

      if (options.parentId === null) {
        query += " AND parentId IS NULL";
      } else if (options.parentId) {
        query += " AND parentId = ?";
        params.push(options.parentId);
      }
      query += " ORDER BY createdAt ASC;";

      const results = await db.getAllAsync<any>(query, params);
      const fetchedItems = results.map(parseThreadItemFromDB);

      const existingIds = new Set(fetchedItems.map((item) => item.id));
      const untouchedItems = get().threadItems.filter(
        (item) => !existingIds.has(item.id)
      );

      set({
        threadItems: [...untouchedItems, ...fetchedItems],
        isLoadingThreads: false,
      });

      console.log(`[ThreadSlice] ${fetchedItems.length} thread items fetched.`);
    } catch (error) {
      console.error("[ThreadSlice] Error fetching thread items:", error);
      set({ isLoadingThreads: false });
    }
  },

  /**
   * 새로운 스레드 아이템을 추가합니다.
   */
  addThreadItem: async (itemData) => {
    // itemData를 기반으로 완전한 ThreadItem 객체 생성
    const baseItem: BaseThreadItem = {
      id: uuidv4(),
      ...itemData,
      childThreadIds: [],
      resultIds: [],
      createdAt: new Date(),
    };

    let newThreadItem: ThreadItem;
    switch (baseItem.type) {
      case "Bottleneck":
        newThreadItem = {
          ...baseItem,
          isResolved: false,
        } as BottleneckThreadItem;
        break;
      case "Task":
        newThreadItem = { ...baseItem, isCompleted: false } as TaskThreadItem;
        break;
      case "Action":
        newThreadItem = {
          ...baseItem,
          status: "todo",
          timeSpent: 0,
        } as ActionThreadItem;
        break;
      case "Session":
        newThreadItem = {
          ...baseItem,
          timeSpent: 0,
          startTime: new Date(),
        } as SessionThreadItem;
        break;
      default:
        newThreadItem = baseItem as GeneralThreadItem;
    }

    try {
      const db = await getDatabase();
      // 모든 하위 타입의 필드를 포함하는 포괄적인 INSERT 쿼리
      await db.runAsync(
        `INSERT INTO ThreadItems (
          id, problemId, parentId, childThreadIds, type, content, isImportant, resultIds, createdAt, authorId,
          isResolved, isCompleted, status, timeSpent, deadline, completedAt, startTime
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newThreadItem.id,
          newThreadItem.problemId,
          newThreadItem.parentId,
          JSON.stringify(newThreadItem.childThreadIds),
          newThreadItem.type,
          newThreadItem.content,
          newThreadItem.isImportant ? 1 : 0,
          JSON.stringify(newThreadItem.resultIds),
          newThreadItem.createdAt.toISOString(),
          newThreadItem.authorId ?? null,
          "isResolved" in newThreadItem
            ? newThreadItem.isResolved
              ? 1
              : 0
            : null,
          "isCompleted" in newThreadItem
            ? newThreadItem.isCompleted
              ? 1
              : 0
            : null,
          "status" in newThreadItem ? newThreadItem.status : null,
          "timeSpent" in newThreadItem ? newThreadItem.timeSpent : null,
          "deadline" in newThreadItem
            ? newThreadItem.deadline?.toISOString() ?? null
            : null,
          "completedAt" in newThreadItem
            ? newThreadItem.completedAt?.toISOString() ?? null
            : null,
          "startTime" in newThreadItem
            ? newThreadItem.startTime.toISOString()
            : null,
        ]
      );

      // 부모의 childThreadIds 업데이트
      if (newThreadItem.parentId) {
        const parent = get().threadItems.find(
          (item) => item.id === newThreadItem.parentId
        );
        if (parent) {
          parent.childThreadIds.push(newThreadItem.id);
          await get().updateThreadItem(parent); // updateThreadItem 호출
        }
      } else {
        // 부모가 없으면 Problem이 부모
        const parentProblem = get().problems.find(
          (p) => p.id === newThreadItem.problemId
        );
        if (parentProblem) {
          parentProblem.childThreadIds.push(newThreadItem.id);
          await get().updateProblem(parentProblem); // problemSlice의 액션 호출
        }
      }

      set((state) => ({ threadItems: [...state.threadItems, newThreadItem] }));
      console.log(
        `[ThreadSlice] ${newThreadItem.type} item added:`,
        newThreadItem.id
      );
      return newThreadItem;
    } catch (error) {
      console.error(`[ThreadSlice] Error adding ${itemData.type} item:`, error);
      return null;
    }
  },

  /**
   * 스레드 아이템을 업데이트합니다.
   */
  updateThreadItem: async (itemToUpdate) => {
    try {
      const db = await getDatabase();
      // 포괄적인 UPDATE 쿼리
      await db.runAsync(
        `UPDATE ThreadItems SET 
         content = ?, isImportant = ?, childThreadIds = ?, resultIds = ?, isResolved = ?, isCompleted = ?, status = ?, timeSpent = ?, deadline = ?, completedAt = ?, startTime = ?
         WHERE id = ?;`,
        [
          itemToUpdate.content,
          itemToUpdate.isImportant ? 1 : 0,
          JSON.stringify(itemToUpdate.childThreadIds),
          JSON.stringify(itemToUpdate.resultIds),
          "isResolved" in itemToUpdate
            ? itemToUpdate.isResolved
              ? 1
              : 0
            : null,
          "isCompleted" in itemToUpdate
            ? itemToUpdate.isCompleted
              ? 1
              : 0
            : null,
          "status" in itemToUpdate ? itemToUpdate.status : null,
          "timeSpent" in itemToUpdate ? itemToUpdate.timeSpent : null,
          "deadline" in itemToUpdate
            ? itemToUpdate.deadline?.toISOString() ?? null
            : null,
          "completedAt" in itemToUpdate
            ? itemToUpdate.completedAt?.toISOString() ?? null
            : null,
          "startTime" in itemToUpdate
            ? itemToUpdate.startTime.toISOString()
            : null,
          itemToUpdate.id,
        ]
      );
      set((state) => ({
        threadItems: state.threadItems.map((item) =>
          item.id === itemToUpdate.id ? itemToUpdate : item
        ),
      }));
      console.log(
        `[ThreadSlice] ${itemToUpdate.type} item updated:`,
        itemToUpdate.id
      );
      return itemToUpdate;
    } catch (error) {
      console.error(
        `[ThreadSlice] Error updating ${itemToUpdate.type} item:`,
        error
      );
      return null;
    }
  },

  /**
   * 스레드 아이템과 모든 자손 아이템들을 삭제합니다.
   */
  deleteThreadItem: async (itemId) => {
    const itemToDelete = get().threadItems.find((item) => item.id === itemId);
    if (!itemToDelete) return false;

    try {
      const db = await getDatabase();
      // DB의 ON DELETE CASCADE가 하위 아이템 삭제를 처리
      await db.runAsync("DELETE FROM ThreadItems WHERE id = ?;", [itemId]);

      // 로컬 상태에서 모든 자손 아이템 ID 수집
      const allIdsToDelete = new Set<string>([itemId]);
      const queue = [...itemToDelete.childThreadIds];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId && !allIdsToDelete.has(currentId)) {
          allIdsToDelete.add(currentId);
          const childItem = get().threadItems.find(
            (item) => item.id === currentId
          );
          if (childItem) {
            queue.push(...childItem.childThreadIds);
          }
        }
      }

      // 부모의 childThreadIds 배열에서 삭제
      if (itemToDelete.parentId) {
        const parent = get().threadItems.find(
          (item) => item.id === itemToDelete.parentId
        );
        if (parent) {
          parent.childThreadIds = parent.childThreadIds.filter(
            (id) => id !== itemId
          );
          await get().updateThreadItem(parent);
        }
      } else {
        const parentProblem = get().problems.find(
          (p) => p.id === itemToDelete.problemId
        );
        if (parentProblem) {
          parentProblem.childThreadIds = parentProblem.childThreadIds.filter(
            (id) => id !== itemId
          );
          await get().updateProblem(parentProblem);
        }
      }

      // 로컬 상태 업데이트
      set((state) => ({
        threadItems: state.threadItems.filter(
          (item) => !allIdsToDelete.has(item.id)
        ),
      }));

      console.log(`[ThreadSlice] Item and its descendants deleted:`, itemId);
      return true;
    } catch (error) {
      console.error("[ThreadSlice] Error deleting thread item:", error);
      return false;
    }
  },

  /**
   * ID로 스레드 아이템을 동기적으로 조회합니다.
   */
  getThreadItemById: (id: string) => {
    return get().threadItems.find((item) => item.id === id);
  },

  getThreadItemByType: <T extends ThreadItemType>(options: {
    problemId: string;
    type: T;
  }) => {
    const { problemId, type } = options;
    const allItems = get().threadItems;

    // 문제 ID와 타입으로 필터링 후, 타입스크립트가 정확한 타입을 추론하도록 캐스팅
    return allItems.filter(
      (item) => item.problemId === problemId && item.type === type
    ) as (ThreadItem & { type: T })[];
  },
});
