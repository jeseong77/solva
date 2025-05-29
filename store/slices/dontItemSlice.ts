import { getDatabase } from "@/lib/db";
import { DontItem, Project } from "@/types";
import type { AppState } from "@/types/storeTypes"; // 통합 AppState 타입
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// DontItem 관련 파서 함수
const parseDontItemFromDB = (dbItem: any): DontItem => ({
  id: dbItem.id,
  projectId: dbItem.projectId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  observancePeriod: dbItem.observancePeriod,
  lastUpdatedDate: dbItem.lastUpdatedDate
    ? new Date(dbItem.lastUpdatedDate)
    : undefined,
  successCount: dbItem.successCount || 0,
  failureCount: dbItem.failureCount || 0,
  isLocked: !!dbItem.isLocked,
  createdAt: new Date(dbItem.createdAt),
});

export interface DontItemSlice {
  dontItems: DontItem[];
  isLoadingDontItems: boolean;
  fetchDontItems: (projectId: string) => Promise<void>;
  addDontItem: (
    dontItemData: Omit<
      DontItem,
      "id" | "createdAt" | "successCount" | "failureCount" | "isLocked"
    > & { projectId: string; isLocked?: boolean }
  ) => Promise<DontItem | null>;
  updateDontItem: (dontItemToUpdate: DontItem) => Promise<DontItem | null>;
  deleteDontItem: (dontItemId: string) => Promise<boolean>;
  getDontItemById: (id: string) => DontItem | undefined;
  recordDontItemObservance: (
    dontItemId: string,
    wasObserved: boolean,
    observanceDate?: Date
  ) => Promise<DontItem | null>;
}

export const createDontItemSlice: StateCreator<
  AppState,
  [],
  [],
  DontItemSlice
> = (set, get) => ({
  dontItems: [],
  isLoadingDontItems: false,

  fetchDontItems: async (projectId: string) => {
    set({ isLoadingDontItems: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM DontItems WHERE projectId = ? ORDER BY createdAt ASC;",
        [projectId]
      );
      const fetchedDontItems = results.map(parseDontItemFromDB);
      // 특정 projectId의 DontItem들만 교체하고, 나머지는 유지 후 정렬
      set((state) => ({
        dontItems: [
          ...state.dontItems.filter((d) => d.projectId !== projectId),
          ...fetchedDontItems,
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        isLoadingDontItems: false,
      }));
      console.log(
        `[DontItemSlice] DontItems fetched for project ${projectId}:`,
        fetchedDontItems.length
      );
    } catch (error) {
      console.error("[DontItemSlice] Error fetching DontItems:", error);
      set({ isLoadingDontItems: false });
    }
  },

  addDontItem: async (dontItemData) => {
    const newDontItem: DontItem = {
      id: uuidv4(),
      projectId: dontItemData.projectId,
      title: dontItemData.title,
      description: dontItemData.description,
      observancePeriod: dontItemData.observancePeriod,
      lastUpdatedDate: dontItemData.lastUpdatedDate,
      successCount: 0,
      failureCount: 0,
      isLocked: dontItemData.isLocked || false,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO DontItems (id, projectId, title, description, observancePeriod, lastUpdatedDate, successCount, failureCount, isLocked, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newDontItem.id,
          newDontItem.projectId,
          newDontItem.title,
          newDontItem.description === undefined
            ? null
            : newDontItem.description,
          newDontItem.observancePeriod,
          newDontItem.lastUpdatedDate
            ? newDontItem.lastUpdatedDate.toISOString()
            : null,
          newDontItem.successCount,
          newDontItem.failureCount,
          newDontItem.isLocked ? 1 : 0,
          newDontItem.createdAt.toISOString(),
        ]
      );
      console.log(
        "[DontItemSlice] New DontItem inserted into DB:",
        newDontItem.title
      );

      const parentProject = get().projects.find(
        (p) => p.id === newDontItem.projectId
      );
      if (parentProject) {
        const updatedParentProject: Project = {
          ...parentProject,
          dontItemIds: [...parentProject.dontItemIds, newDontItem.id],
        };
        await get().updateProject(updatedParentProject);
        console.log(
          `[DontItemSlice] Parent project ${parentProject.id} dontItemIds updated.`
        );
      } else {
        console.warn(
          `[DontItemSlice] Parent project with ID ${newDontItem.projectId} not found for DontItem linkage.`
        );
      }

      const currentDontItems = get().dontItems;
      const newDontItemList = [...currentDontItems, newDontItem].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ dontItems: newDontItemList });
      console.log(
        "[DontItemSlice] DontItem added to store:",
        newDontItem.title
      );
      return newDontItem;
    } catch (error) {
      console.error("[DontItemSlice] Error adding DontItem:", error);
      return null;
    }
  },

  updateDontItem: async (dontItemToUpdate) => {
    const currentDontItems = get().dontItems;
    const itemIndex = currentDontItems.findIndex(
      (d) => d.id === dontItemToUpdate.id
    );
    if (itemIndex === -1) {
      console.error(
        "[DontItemSlice] DontItem not found for update:",
        dontItemToUpdate.id
      );
      return null;
    }
    const finalDontItemToUpdate = {
      ...currentDontItems[itemIndex],
      ...dontItemToUpdate,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE DontItems SET title = ?, description = ?, observancePeriod = ?, lastUpdatedDate = ?, successCount = ?, failureCount = ?, isLocked = ?
         WHERE id = ?;`,
        [
          finalDontItemToUpdate.title,
          finalDontItemToUpdate.description === undefined
            ? null
            : finalDontItemToUpdate.description,
          finalDontItemToUpdate.observancePeriod,
          finalDontItemToUpdate.lastUpdatedDate
            ? finalDontItemToUpdate.lastUpdatedDate.toISOString()
            : null,
          finalDontItemToUpdate.successCount,
          finalDontItemToUpdate.failureCount,
          finalDontItemToUpdate.isLocked ? 1 : 0,
          finalDontItemToUpdate.id,
        ]
      );

      const updatedDontItems = currentDontItems.map((d) =>
        d.id === finalDontItemToUpdate.id ? finalDontItemToUpdate : d
      );
      updatedDontItems.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ dontItems: updatedDontItems });
      console.log(
        "[DontItemSlice] DontItem updated:",
        finalDontItemToUpdate.title
      );
      return finalDontItemToUpdate;
    } catch (error) {
      console.error("[DontItemSlice] Error updating DontItem:", error);
      return null;
    }
  },

  deleteDontItem: async (dontItemId) => {
    const dontItemToDelete = get().dontItems.find((d) => d.id === dontItemId);

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM DontItems WHERE id = ?;`, [dontItemId]);
      console.log("[DontItemSlice] DontItem deleted from DB:", dontItemId);

      if (dontItemToDelete) {
        const parentProject = get().projects.find(
          (p) => p.id === dontItemToDelete.projectId
        );
        if (parentProject) {
          const updatedParentProject: Project = {
            ...parentProject,
            dontItemIds: parentProject.dontItemIds.filter(
              (id) => id !== dontItemId
            ),
          };
          await get().updateProject(updatedParentProject);
          console.log(
            `[DontItemSlice] Parent project ${parentProject.id} dontItemIds updated after DontItem deletion.`
          );
        }
      }

      set((state) => ({
        dontItems: state.dontItems
          .filter((d) => d.id !== dontItemId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      }));
      console.log("[DontItemSlice] DontItem removed from store:", dontItemId);
      return true;
    } catch (error) {
      console.error("[DontItemSlice] Error deleting DontItem:", error);
      return false;
    }
  },

  getDontItemById: (id: string) => {
    return get().dontItems.find((d) => d.id === id);
  },

  recordDontItemObservance: async (
    dontItemId,
    wasObserved,
    observanceDate = new Date()
  ) => {
    const currentItem = get().getDontItemById(dontItemId);
    if (!currentItem) {
      console.error(
        "[DontItemSlice] DontItem not found for recording observance:",
        dontItemId
      );
      return null;
    }

    const updatedItem: DontItem = {
      ...currentItem,
      successCount: wasObserved
        ? currentItem.successCount + 1
        : currentItem.successCount,
      failureCount: !wasObserved
        ? currentItem.failureCount + 1
        : currentItem.failureCount,
      lastUpdatedDate: observanceDate,
    };

    return get().updateDontItem(updatedItem); // updateDontItem 액션 재사용
  },
});
