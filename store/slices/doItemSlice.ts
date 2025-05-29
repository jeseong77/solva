import { getDatabase } from "@/lib/db";
import { DoItem, Project } from "@/types";
import type { AppState } from "@/types/storeTypes"; // 통합 AppState 타입
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// DoItem 관련 파서 함수
const parseDoItemFromDB = (dbItem: any): DoItem => ({
  id: dbItem.id,
  projectId: dbItem.projectId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  recurrenceRule: dbItem.recurrenceRule,
  lastUpdatedDate: dbItem.lastUpdatedDate
    ? new Date(dbItem.lastUpdatedDate)
    : undefined,
  successCount: dbItem.successCount || 0, // DB 기본값(0) 또는 null일 경우 대비
  failureCount: dbItem.failureCount || 0, // DB 기본값(0) 또는 null일 경우 대비
  isLocked: !!dbItem.isLocked, // INTEGER (0 or 1) to boolean
  createdAt: new Date(dbItem.createdAt),
});

export interface DoItemSlice {
  doItems: DoItem[];
  isLoadingDoItems: boolean;
  fetchDoItems: (projectId: string) => Promise<void>;
  addDoItem: (
    doItemData: Omit<
      DoItem,
      "id" | "createdAt" | "successCount" | "failureCount" | "isLocked"
    > & { projectId: string; isLocked?: boolean }
  ) => Promise<DoItem | null>;
  updateDoItem: (doItemToUpdate: DoItem) => Promise<DoItem | null>;
  deleteDoItem: (doItemId: string) => Promise<boolean>;
  getDoItemById: (id: string) => DoItem | undefined;
  recordDoItemAttempt: (
    doItemId: string,
    wasSuccessful: boolean,
    attemptDate?: Date
  ) => Promise<DoItem | null>;
}

export const createDoItemSlice: StateCreator<AppState, [], [], DoItemSlice> = (
  set,
  get
) => ({
  doItems: [],
  isLoadingDoItems: false,

  fetchDoItems: async (projectId: string) => {
    set({ isLoadingDoItems: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM DoItems WHERE projectId = ? ORDER BY createdAt ASC;",
        [projectId]
      );
      const fetchedDoItems = results.map(parseDoItemFromDB);
      // 특정 projectId의 DoItem들만 교체하고, 나머지는 유지 후 정렬
      set((state) => ({
        doItems: [
          ...state.doItems.filter((d) => d.projectId !== projectId),
          ...fetchedDoItems,
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        isLoadingDoItems: false,
      }));
      console.log(
        `[DoItemSlice] DoItems fetched for project ${projectId}:`,
        fetchedDoItems.length
      );
    } catch (error) {
      console.error("[DoItemSlice] Error fetching DoItems:", error);
      set({ isLoadingDoItems: false });
    }
  },

  addDoItem: async (doItemData) => {
    const newDoItem: DoItem = {
      id: uuidv4(),
      projectId: doItemData.projectId,
      title: doItemData.title,
      description: doItemData.description,
      recurrenceRule: doItemData.recurrenceRule,
      lastUpdatedDate: doItemData.lastUpdatedDate, // 초기값은 보통 undefined
      successCount: 0, // 새로 추가 시 0
      failureCount: 0, // 새로 추가 시 0
      isLocked: doItemData.isLocked || false,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO DoItems (id, projectId, title, description, recurrenceRule, lastUpdatedDate, successCount, failureCount, isLocked, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newDoItem.id,
          newDoItem.projectId,
          newDoItem.title,
          newDoItem.description === undefined ? null : newDoItem.description,
          newDoItem.recurrenceRule,
          newDoItem.lastUpdatedDate
            ? newDoItem.lastUpdatedDate.toISOString()
            : null,
          newDoItem.successCount,
          newDoItem.failureCount,
          newDoItem.isLocked ? 1 : 0,
          newDoItem.createdAt.toISOString(),
        ]
      );
      console.log(
        "[DoItemSlice] New DoItem inserted into DB:",
        newDoItem.title
      );

      // 연결된 Project의 doItemIds 업데이트
      const parentProject = get().projects.find(
        (p) => p.id === newDoItem.projectId
      );
      if (parentProject) {
        const updatedParentProject: Project = {
          ...parentProject,
          doItemIds: [...parentProject.doItemIds, newDoItem.id],
        };
        await get().updateProject(updatedParentProject); // ProjectSlice의 액션 호출
        console.log(
          `[DoItemSlice] Parent project ${parentProject.id} doItemIds updated.`
        );
      } else {
        console.warn(
          `[DoItemSlice] Parent project with ID ${newDoItem.projectId} not found for DoItem linkage.`
        );
      }

      const currentDoItems = get().doItems;
      const newDoItemList = [...currentDoItems, newDoItem].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ doItems: newDoItemList });
      console.log("[DoItemSlice] DoItem added to store:", newDoItem.title);
      return newDoItem;
    } catch (error) {
      console.error("[DoItemSlice] Error adding DoItem:", error);
      return null;
    }
  },

  updateDoItem: async (doItemToUpdate) => {
    const currentDoItems = get().doItems;
    const itemIndex = currentDoItems.findIndex(
      (d) => d.id === doItemToUpdate.id
    );
    if (itemIndex === -1) {
      console.error(
        "[DoItemSlice] DoItem not found for update:",
        doItemToUpdate.id
      );
      return null;
    }

    // DB에 저장하기 전에 타입에 맞게 변환
    const finalDoItemToUpdate = {
      ...currentDoItems[itemIndex],
      ...doItemToUpdate,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE DoItems SET title = ?, description = ?, recurrenceRule = ?, lastUpdatedDate = ?, successCount = ?, failureCount = ?, isLocked = ?
         WHERE id = ?;`, // createdAt, projectId는 보통 업데이트하지 않음
        [
          finalDoItemToUpdate.title,
          finalDoItemToUpdate.description === undefined
            ? null
            : finalDoItemToUpdate.description,
          finalDoItemToUpdate.recurrenceRule,
          finalDoItemToUpdate.lastUpdatedDate
            ? finalDoItemToUpdate.lastUpdatedDate.toISOString()
            : null,
          finalDoItemToUpdate.successCount,
          finalDoItemToUpdate.failureCount,
          finalDoItemToUpdate.isLocked ? 1 : 0,
          finalDoItemToUpdate.id,
        ]
      );

      const updatedDoItems = currentDoItems.map((d) =>
        d.id === finalDoItemToUpdate.id ? finalDoItemToUpdate : d
      );
      updatedDoItems.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ doItems: updatedDoItems });
      console.log("[DoItemSlice] DoItem updated:", finalDoItemToUpdate.title);
      return finalDoItemToUpdate;
    } catch (error) {
      console.error("[DoItemSlice] Error updating DoItem:", error);
      return null;
    }
  },

  deleteDoItem: async (doItemId) => {
    const doItemToDelete = get().doItems.find((d) => d.id === doItemId);
    if (!doItemToDelete) {
      console.warn(
        `[DoItemSlice] DoItem with ID ${doItemId} not found in local store for deletion.`
      );
    }

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM DoItems WHERE id = ?;`, [doItemId]);
      console.log("[DoItemSlice] DoItem deleted from DB:", doItemId);

      if (doItemToDelete) {
        const parentProject = get().projects.find(
          (p) => p.id === doItemToDelete.projectId
        );
        if (parentProject) {
          const updatedParentProject: Project = {
            ...parentProject,
            doItemIds: parentProject.doItemIds.filter((id) => id !== doItemId),
          };
          await get().updateProject(updatedParentProject);
          console.log(
            `[DoItemSlice] Parent project ${parentProject.id} doItemIds updated after DoItem deletion.`
          );
        }
      }

      set((state) => ({
        doItems: state.doItems
          .filter((d) => d.id !== doItemId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      }));
      console.log("[DoItemSlice] DoItem removed from store:", doItemId);
      return true;
    } catch (error) {
      console.error("[DoItemSlice] Error deleting DoItem:", error);
      return false;
    }
  },

  getDoItemById: (id: string) => {
    return get().doItems.find((d) => d.id === id);
  },

  recordDoItemAttempt: async (
    doItemId,
    wasSuccessful,
    attemptDate = new Date()
  ) => {
    const currentItem = get().getDoItemById(doItemId); // 스토어 내 셀렉터 사용
    if (!currentItem) {
      console.error(
        "[DoItemSlice] DoItem not found for recording attempt:",
        doItemId
      );
      return null;
    }

    const updatedItem: DoItem = {
      ...currentItem,
      successCount: wasSuccessful
        ? currentItem.successCount + 1
        : currentItem.successCount,
      failureCount: !wasSuccessful
        ? currentItem.failureCount + 1
        : currentItem.failureCount,
      lastUpdatedDate: attemptDate,
    };

    // updateDoItem 액션을 호출하여 DB 및 상태 업데이트
    return get().updateDoItem(updatedItem);
  },
});
