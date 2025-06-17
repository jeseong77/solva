// src/store/slices/threadSlice.ts

import { getDatabase } from "@/lib/db";
import {
  ActionStatus,
  ActionThreadItem,
  BaseThreadItem,
  BottleneckThreadItem,
  GeneralThreadItem,
  InsightThreadItem,
  Problem,
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
    // ✅ [수정] Insight 타입 처리 케이스 추가
    case "Insight":
      return baseItem as InsightThreadItem;
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
      return { ...baseItem, type: "General" } as GeneralThreadItem;
  }
};

/**
 * 헬퍼 함수: 스레드 아이템을 DB에만 업데이트합니다. (set 호출 없음)
 * 슬라이스 내부에서만 사용됩니다.
 */
const _updateThreadItemInDB = async (itemToUpdate: ThreadItem) => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ThreadItems SET 
       content = ?, isImportant = ?, childThreadIds = ?, resultIds = ?, isResolved = ?, isCompleted = ?, status = ?, timeSpent = ?, deadline = ?, completedAt = ?, startTime = ?
       WHERE id = ?;`,
      [
        itemToUpdate.content,
        itemToUpdate.isImportant ? 1 : 0,
        JSON.stringify(itemToUpdate.childThreadIds),
        JSON.stringify(itemToUpdate.resultIds),
        "isResolved" in itemToUpdate ? (itemToUpdate.isResolved ? 1 : 0) : null,
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
  } catch (error) {
    console.error(`[DB Helper] Error updating thread item:`, error);
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
   * 특정 Problem 또는 Parent 스레드에 속한 스레드 아이템들을 불러옵니다. (기존과 동일)
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
   * 새로운 스레드 아이템을 추가합니다. (수정된 버전)
   */
  addThreadItem: async (itemData) => {
    const baseItem: BaseThreadItem = {
      id: uuidv4(),
      ...itemData,
      childThreadIds: [],
      resultIds: [],
      createdAt: new Date(),
    };

    let newThreadItem: ThreadItem;
    switch (baseItem.type) {
      case "Insight":
        newThreadItem = baseItem as InsightThreadItem;
        break;
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
        } as SessionThreadItem;
        break;
      default:
        newThreadItem = baseItem as GeneralThreadItem;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO ThreadItems (id, problemId, parentId, childThreadIds, type, content, isImportant, resultIds, createdAt, authorId, isResolved, isCompleted, status, timeSpent, deadline, completedAt, startTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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

      let parentThreadToUpdate: ThreadItem | null = null;
      let parentProblemToUpdate: Problem | null = null;

      set((state) => {
        let nextProblems = state.problems;
        let nextThreadItems = state.threadItems;

        if (newThreadItem.parentId) {
          const parent = state.threadItems.find(
            (t) => t.id === newThreadItem.parentId
          );
          if (parent) {
            const updatedParent = {
              ...parent,
              childThreadIds: [...parent.childThreadIds, newThreadItem.id],
            };
            parentThreadToUpdate = updatedParent;
            nextThreadItems = state.threadItems.map((t) =>
              t.id === updatedParent.id ? updatedParent : t
            );
          }
        } else {
          const parent = state.problems.find(
            (p) => p.id === newThreadItem.problemId
          );
          if (parent) {
            const updatedParent = {
              ...parent,
              childThreadIds: [...parent.childThreadIds, newThreadItem.id],
            };
            parentProblemToUpdate = updatedParent;
            nextProblems = state.problems.map((p) =>
              p.id === updatedParent.id ? updatedParent : p
            );
          }
        }

        return {
          problems: nextProblems,
          threadItems: [...nextThreadItems, newThreadItem],
        };
      });

      if (parentThreadToUpdate) {
        await _updateThreadItemInDB(parentThreadToUpdate);
      }
      if (parentProblemToUpdate) {
        // problemSlice에도 _updateProblemInDB와 같은 DB 헬퍼 함수를 만들어 호출하는 것을 권장합니다.
        // 여기서는 기존 updateProblem을 호출하되, 그 함수가 set을 호출하지 않도록 수정하거나
        // 문제가 없다면 그대로 사용합니다.
        await get().updateProblem(parentProblemToUpdate);
      }

      // --- 상태 확인용 console.log 시작 ---
      const problemTitle = get().getProblemById(newThreadItem.problemId)?.title;
      console.log(
        `--- [상태 확인] Problem: "${problemTitle}"의 모든 스레드 ---`
      );
      const allThreadsForProblem = get().threadItems.filter(
        (t) => t.problemId === newThreadItem.problemId
      );
      // 전체 스레드 목록을 보기 좋게 출력합니다.
      console.log(JSON.stringify(allThreadsForProblem, null, 2));
      console.log(`--------------------------------------------------`);
      // --- 상태 확인용 console.log 끝 ---
      return newThreadItem;
    } catch (error) {
      console.error(`[ThreadSlice] Error adding ${itemData.type} item:`, error);
      return null;
    }
  },

  /**
   * 스레드 아이템을 업데이트합니다. (기존과 동일)
   */
  updateThreadItem: async (itemToUpdate) => {
    try {
      const db = await getDatabase();
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
   * 스레드 아이템과 모든 자손 아이템들을 삭제합니다. (기존과 동일)
   */
  deleteThreadItem: async (itemId) => {
    const itemToDelete = get().threadItems.find((item) => item.id === itemId);
    if (!itemToDelete) return false;

    try {
      const db = await getDatabase();
      await db.runAsync("DELETE FROM ThreadItems WHERE id = ?;", [itemId]);

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

      if (itemToDelete.parentId) {
        const parent = get().threadItems.find(
          (item) => item.id === itemToDelete.parentId
        );
        if (parent) {
          // 이 부분도 직접 수정 대신 새 객체를 만들어야 합니다.
          const updatedParent = {
            ...parent,
            childThreadIds: parent.childThreadIds.filter((id) => id !== itemId),
          };
          await get().updateThreadItem(updatedParent);
        }
      } else {
        const parentProblem = get().problems.find(
          (p) => p.id === itemToDelete.problemId
        );
        if (parentProblem) {
          const updatedProblem = {
            ...parentProblem,
            childThreadIds: parentProblem.childThreadIds.filter(
              (id) => id !== itemId
            ),
          };
          await get().updateProblem(updatedProblem);
        }
      }

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
   * ID로 스레드 아이템을 동기적으로 조회합니다. (기존과 동일)
   */
  getThreadItemById: (id: string) => {
    return get().threadItems.find((item) => item.id === id);
  },

  /**
   * 타입으로 스레드 아이템을 조회합니다. (기존과 동일)
   */
  getThreadItemByType: <T extends ThreadItemType>(options: {
    problemId: string;
    type: T;
  }) => {
    const { problemId, type } = options;
    const allItems = get().threadItems;

    return allItems.filter(
      (item) => item.problemId === problemId && item.type === type
    ) as (ThreadItem & { type: T })[];
  },
  /**
   * ✅ [추가] 가장 최근에 완료된 세션과 그 부모 스레드 정보를 가져옵니다.
   */
  getMostRecentSession: () => {
    const { threadItems } = get();

    // 1. 모든 스레드 중 'Session' 타입만 필터링합니다.
    const sessions = threadItems.filter(
      (item): item is SessionThreadItem => item.type === "Session"
    );

    // 2. 세션이 없으면 null을 반환합니다.
    if (sessions.length === 0) {
      return null;
    }

    // 3. 생성일(createdAt) 기준으로 내림차순 정렬하여 가장 최신 세션을 찾습니다.
    sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const mostRecentSession = sessions[0];

    // 4. 최신 세션의 부모 스레드를 찾습니다.
    const parentThread = mostRecentSession.parentId
      ? get().getThreadItemById(mostRecentSession.parentId)
      : undefined;

    // 5. 최신 세션 정보와 부모 스레드 정보를 함께 반환합니다.
    return {
      session: mostRecentSession,
      parentThread: parentThread,
    };
  },
});
