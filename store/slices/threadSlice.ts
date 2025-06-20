// src/store/slices/threadSlice.ts

import { db } from "@/lib/db";
import { problems, threadItems } from "@/lib/db/schema";
import {
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
import { and, asc, eq, isNull } from "drizzle-orm";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

export const createThreadSlice: StateCreator<
  AppState,
  [],
  [],
  ThreadSliceInterface
> = (set, get) => ({
  threadItems: [],
  isLoadingThreads: false,

  fetchThreads: async (options) => {
    set({ isLoadingThreads: true });
    try {
      const conditions = [eq(threadItems.problemId, options.problemId)];
      if (options.parentId === null) {
        conditions.push(isNull(threadItems.parentId));
      } else if (options.parentId) {
        conditions.push(eq(threadItems.parentId, options.parentId));
      }

      const fetchedItems = await db
        .select()
        .from(threadItems)
        .where(and(...conditions))
        .orderBy(asc(threadItems.createdAt));

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

  addThreadItem: async (itemData) => {
    const baseItem: BaseThreadItem = {
      id: uuidv4(),
      problemId: itemData.problemId,
      parentId: itemData.parentId,
      type: itemData.type,
      content: itemData.content,
      isImportant: itemData.isImportant ?? false,
      authorId: itemData.authorId ?? null,
      imageUrls: itemData.imageUrls ?? null,
      childThreadIds: [],
      resultIds: [],
      createdAt: new Date(),
      isResolved: null,
      isCompleted: null,
      status: null,
      timeSpent: itemData.timeSpent ?? null,
      deadline: itemData.deadline ?? null,
      completedAt: null,
      startTime: itemData.startTime ?? null,
    };

    // This switch statement logic for creating the final newThreadItem remains correct.
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
      default:
        newThreadItem = baseItem as
          | GeneralThreadItem
          | InsightThreadItem
          | SessionThreadItem;
    }

    try {
      await db.insert(threadItems).values(newThreadItem);

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
            const finalUpdatedParent: ThreadItem = {
              ...parent,
              childThreadIds: [
                ...(parent.childThreadIds || []),
                newThreadItem.id,
              ],
            };
            parentThreadToUpdate = finalUpdatedParent;
            nextThreadItems = state.threadItems.map((t) =>
              t.id === finalUpdatedParent.id ? finalUpdatedParent : t
            );
          }
        } else {
          const parent = state.problems.find(
            (p) => p.id === newThreadItem.problemId
          );
          if (parent) {
            const finalUpdatedParent: Problem = {
              ...parent,
              childThreadIds: [
                ...(parent.childThreadIds || []),
                newThreadItem.id,
              ],
            };
            parentProblemToUpdate = finalUpdatedParent;
            nextProblems = state.problems.map((p) =>
              p.id === finalUpdatedParent.id ? finalUpdatedParent : p
            );
          }
        }
        return {
          problems: nextProblems,
          threadItems: [...nextThreadItems, newThreadItem],
        };
      });

      if (parentThreadToUpdate) {
        await get().updateThreadItem(parentThreadToUpdate);
      }
      if (parentProblemToUpdate) {
        await get().updateProblem(parentProblemToUpdate);
      }

      return newThreadItem;
    } catch (error) {
      console.error(`[ThreadSlice] Error adding ${itemData.type} item:`, error);
      return null;
    }
  },

  updateThreadItem: async (itemToUpdate) => {
    try {
      await db
        .update(threadItems)
        .set({
          content: itemToUpdate.content,
          isImportant: itemToUpdate.isImportant,
          childThreadIds: itemToUpdate.childThreadIds,
          resultIds: itemToUpdate.resultIds,
          isResolved: itemToUpdate.isResolved,
          isCompleted: itemToUpdate.isCompleted,
          status: itemToUpdate.status,
          timeSpent: itemToUpdate.timeSpent,
          deadline: itemToUpdate.deadline,
          completedAt: itemToUpdate.completedAt,
          startTime: itemToUpdate.startTime,
          // FIX: Add the new imageUrls property to the update set.
          imageUrls: itemToUpdate.imageUrls,
        })
        .where(eq(threadItems.id, itemToUpdate.id));
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

  deleteThreadItem: async (itemId) => {
    // Note: To delete the actual image files from the device, you would first
    // need to fetch the item and its descendants, get all their imageUrls,
    // and then loop through them calling a file system delete function
    // before deleting the database records.
    const itemToDelete = get().threadItems.find((item) => item.id === itemId);
    if (!itemToDelete) return false;
    try {
      await db.delete(threadItems).where(eq(threadItems.id, itemId));

      const allIdsToDelete = new Set<string>([itemId]);
      const queue = itemToDelete.childThreadIds
        ? [...itemToDelete.childThreadIds]
        : [];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId && !allIdsToDelete.has(currentId)) {
          allIdsToDelete.add(currentId);
          // Also delete descendants from the database
          await db.delete(threadItems).where(eq(threadItems.id, currentId));
          const childItem = get().threadItems.find(
            (item) => item.id === currentId
          );
          if (childItem && childItem.childThreadIds) {
            queue.push(...childItem.childThreadIds);
          }
        }
      }

      if (itemToDelete.parentId) {
        const parent = get().threadItems.find(
          (item) => item.id === itemToDelete.parentId
        );
        if (parent && parent.childThreadIds) {
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
        if (parentProblem && parentProblem.childThreadIds) {
          const updatedParent = {
            ...parentProblem,
            childThreadIds: parentProblem.childThreadIds.filter(
              (id) => id !== itemId
            ),
          };
          await get().updateProblem(updatedParent);
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

  // ... (rest of the slice is unchanged)
  getThreadItemById: (id: string) =>
    get().threadItems.find((item) => item.id === id),
  getThreadItemByType: <T extends ThreadItemType>(options: {
    problemId: string;
    type: T;
  }) => {
    return get().threadItems.filter(
      (item) =>
        item.problemId === options.problemId && item.type === options.type
    ) as (ThreadItem & { type: T })[];
  },
  getMostRecentSession: () => {
    const sessions = get().threadItems.filter(
      (item): item is SessionThreadItem => item.type === "Session"
    );
    if (sessions.length === 0) return null;
    sessions.sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
    const mostRecentSession = sessions[0];
    const parentThread = mostRecentSession.parentId
      ? get().getThreadItemById(mostRecentSession.parentId)
      : undefined;
    return { session: mostRecentSession, parentThread };
  },
});
