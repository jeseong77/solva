// src/lib/objectiveSlice.ts
import { StateCreator } from "zustand";
import { Objective, ObjectiveStatus } from "@/types"; // Project removed
import type {
  AppState,
  ObjectiveSlice as ObjectiveSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

const parseObjectiveFromDB = (dbItem: any): Objective => ({
  id: dbItem.id,
  problemId: dbItem.problemId, // Added
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  // isBottleneck: !!dbItem.isBottleneck, // Removed
  // bottleneckAnalysis: dbItem.bottleneckAnalysis ? JSON.parse(dbItem.bottleneckAnalysis) : undefined, // Removed
  parentId: dbItem.parentId === null ? null : dbItem.parentId, // Changed to null if dbItem.parentId is null
  childObjectiveIds: dbItem.childObjectiveIds
    ? JSON.parse(dbItem.childObjectiveIds)
    : [],
  blockingProblemIds: dbItem.blockingProblemIds
    ? JSON.parse(dbItem.blockingProblemIds)
    : [], // Added
  status: dbItem.status as ObjectiveStatus,
  deadline: dbItem.deadline ? new Date(dbItem.deadline) : undefined,
  // isFeatured: !!dbItem.isFeatured, // Removed
  // fulfillingProjectId: dbItem.fulfillingProjectId === null ? undefined : dbItem.fulfillingProjectId, // Removed
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
  order: dbItem.order === null ? undefined : dbItem.order,
});

export const createObjectiveSlice: StateCreator<
  AppState,
  [],
  [],
  ObjectiveSliceInterface
> = (set, get) => ({
  objectives: [],
  isLoadingObjectives: false,

  fetchObjectives: async (parentId?: string | null) => {
    set({ isLoadingObjectives: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Objectives";
      const params: (string | null)[] = [];

      if (parentId !== undefined) {
        query += " WHERE parentId " + (parentId === null ? "IS NULL" : "= ?");
        if (parentId !== null) {
          params.push(parentId);
        }
      }
      query += ' ORDER BY "order" ASC, createdAt ASC;';

      const results = await db.getAllAsync<any>(query, params);
      const fetchedObjectives = results.map(parseObjectiveFromDB);

      if (parentId !== undefined) {
        const otherObjectives = get().objectives.filter(
          (obj) => obj.parentId !== parentId
        );
        const newObjectiveList = [
          ...otherObjectives,
          ...fetchedObjectives,
        ].sort(
          (a, b) =>
            (a.order ?? Infinity) - (b.order ?? Infinity) ||
            a.createdAt.getTime() - b.createdAt.getTime()
        );
        set({ objectives: newObjectiveList, isLoadingObjectives: false });
      } else {
        set({ objectives: fetchedObjectives, isLoadingObjectives: false });
      }
    } catch (error) {
      console.error("[ObjectiveSlice] Error fetching objectives:", error);
      set({ isLoadingObjectives: false });
    }
  },

  addObjective: async (objectiveData) => {
    // objectiveData already contains problemId and blockingProblemIds from the Omit<> type
    const newObjective: Objective = {
      id: uuidv4(),
      problemId: objectiveData.problemId, // Added from objectiveData
      title: objectiveData.title,
      description: objectiveData.description,
      parentId: objectiveData.parentId || null,
      childObjectiveIds: [], // Default for new objective
      blockingProblemIds: objectiveData.blockingProblemIds || [], // Added from objectiveData, default to empty array
      status: objectiveData.status || "todo", // Default status "todo"
      deadline: objectiveData.deadline,
      timeSpent: 0, // Default for new objective
      createdAt: new Date(),
      completedAt: undefined, // Default for new objective
      order: objectiveData.order,
      // Removed: isBottleneck, bottleneckAnalysis, isFeatured, fulfillingProjectId
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Objectives (id, problemId, title, description, parentId, childObjectiveIds, blockingProblemIds, status, deadline, timeSpent, createdAt, completedAt, "order")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newObjective.id,
          newObjective.problemId,
          newObjective.title,
          newObjective.description === undefined
            ? null
            : newObjective.description,
          newObjective.parentId,
          JSON.stringify(newObjective.childObjectiveIds),
          JSON.stringify(newObjective.blockingProblemIds),
          newObjective.status,
          newObjective.deadline ? newObjective.deadline.toISOString() : null,
          newObjective.timeSpent,
          newObjective.createdAt.toISOString(),
          newObjective.completedAt
            ? newObjective.completedAt.toISOString()
            : null,
          newObjective.order === undefined ? null : newObjective.order,
        ]
      );

      let currentObjectives = get().objectives;
      let objectivesToSet = [newObjective, ...currentObjectives];

      if (newObjective.parentId) {
        const parentObjective = currentObjectives.find(
          (obj) => obj.id === newObjective.parentId
        );
        if (parentObjective) {
          const updatedParent: Objective = {
            ...parentObjective,
            childObjectiveIds: [
              ...parentObjective.childObjectiveIds,
              newObjective.id,
            ],
          };
          await get().updateObjective(updatedParent);
          objectivesToSet = [
            newObjective,
            ...get().objectives.filter((obj) => obj.id !== updatedParent.id),
            updatedParent,
          ];
        } else {
          console.warn(
            `[ObjectiveSlice] Parent objective with ID ${newObjective.parentId} not found in local state during add.`
          );
        }
      }
      objectivesToSet.sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ objectives: objectivesToSet });
      console.log("[ObjectiveSlice] Objective added:", newObjective.title);
      return newObjective;
    } catch (error) {
      console.error("[ObjectiveSlice] Error adding objective:", error);
      return null;
    }
  },

  updateObjective: async (objectiveToUpdate) => {
    const currentObjectives = get().objectives;
    const objectiveIndex = currentObjectives.findIndex(
      (obj) => obj.id === objectiveToUpdate.id
    );
    if (objectiveIndex === -1) {
      console.error(
        "[ObjectiveSlice] Objective not found for update:",
        objectiveToUpdate.id
      );
      return null;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Objectives SET problemId = ?, title = ?, description = ?, parentId = ?, childObjectiveIds = ?, blockingProblemIds = ?, status = ?, deadline = ?, timeSpent = ?, completedAt = ?, "order" = ?
         WHERE id = ?;`,
        [
          objectiveToUpdate.problemId,
          objectiveToUpdate.title,
          objectiveToUpdate.description === undefined
            ? null
            : objectiveToUpdate.description,
          objectiveToUpdate.parentId === undefined
            ? null
            : objectiveToUpdate.parentId,
          JSON.stringify(objectiveToUpdate.childObjectiveIds || []),
          JSON.stringify(objectiveToUpdate.blockingProblemIds || []),
          objectiveToUpdate.status,
          objectiveToUpdate.deadline
            ? objectiveToUpdate.deadline.toISOString()
            : null,
          objectiveToUpdate.timeSpent,
          objectiveToUpdate.completedAt
            ? objectiveToUpdate.completedAt.toISOString()
            : null,
          objectiveToUpdate.order === undefined
            ? null
            : objectiveToUpdate.order,
          objectiveToUpdate.id,
        ]
      );

      const updatedObjectives = currentObjectives.map((obj) =>
        obj.id === objectiveToUpdate.id ? objectiveToUpdate : obj
      );
      updatedObjectives.sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ objectives: updatedObjectives });
      console.log(
        "[ObjectiveSlice] Objective updated:",
        objectiveToUpdate.title
      );
      return objectiveToUpdate;
    } catch (error) {
      console.error("[ObjectiveSlice] Error updating objective:", error);
      return null;
    }
  },

  deleteObjective: async (objectiveId) => {
    const objectivesBeforeDeletion = get().objectives;
    const objectiveToDelete = objectivesBeforeDeletion.find(
      (obj) => obj.id === objectiveId
    );
    if (!objectiveToDelete) return false;

    const parentObjectiveInstance = objectiveToDelete.parentId
      ? objectivesBeforeDeletion.find(
          (p) => p.id === objectiveToDelete.parentId
        )
      : null;

    try {
      const db = await getDatabase();
      if (parentObjectiveInstance) {
        const updatedParent: Objective = {
          ...parentObjectiveInstance,
          childObjectiveIds: parentObjectiveInstance.childObjectiveIds.filter(
            (id) => id !== objectiveId
          ),
        };
        await get().updateObjective(updatedParent);
      }
      // The DB's ON DELETE CASCADE for parentId will handle child objective deletion in the DB.
      await db.runAsync(`DELETE FROM Objectives WHERE id = ?;`, [objectiveId]);

      // Function to recursively find all descendant IDs in the local state
      function getAllDescendantObjectiveIds(
        objId: string,
        allObjs: Objective[]
      ): string[] {
        const directChildren = allObjs.filter((o) => o.parentId === objId);
        let allDescendants = directChildren.map((c) => c.id);
        directChildren.forEach((child) => {
          allDescendants = [
            ...allDescendants,
            ...getAllDescendantObjectiveIds(child.id, allObjs),
          ];
        });
        return allDescendants;
      }
      const descendantIdsToDeleteLocally = getAllDescendantObjectiveIds(
        objectiveId,
        objectivesBeforeDeletion
      );
      const allObjectiveIdsToDeleteLocally = [
        objectiveId,
        ...descendantIdsToDeleteLocally,
      ];

      set((state) => ({
        objectives: state.objectives
          .filter((obj) => !allObjectiveIdsToDeleteLocally.includes(obj.id))
          .sort(
            (a, b) =>
              (a.order ?? Infinity) - (b.order ?? Infinity) ||
              a.createdAt.getTime() - b.createdAt.getTime()
          ),
        // Removed cleanup for projects, tasks, rules, starReports as their linkage and existence have changed.
        // Projects and Tasks slices/types are removed.
        // Rules and StarReports are linked to Problems, and Objective deletion doesn't directly cascade to them in the new model
        // unless the Problem itself is deleted (which is not happening here).
        // DB Foreign Key ON DELETE CASCADE (e.g., StarReports.problemId -> Problems.id) handles DB consistency.
      }));
      console.log(
        "[ObjectiveSlice] Objective and descendant data cleaned from local store:",
        objectiveId
      );
      return true;
    } catch (error) {
      console.error("[ObjectiveSlice] Error deleting objective:", error);
      return false;
    }
  },

  getObjectiveById: (id: string) => {
    return get().objectives.find((obj) => obj.id === id);
  },
});
