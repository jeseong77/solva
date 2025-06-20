// store/slices/objectiveSlice.ts

import { db } from "@/lib/db"; // Import the Drizzle instance
import { objectives } from "@/lib/db/schema"; // Import the objectives table schema
import { Objective } from "@/types";
import type {
  AppState,
  ObjectiveSlice as ObjectiveSliceInterface,
} from "@/types/storeTypes";
import { asc, eq } from "drizzle-orm"; // Import Drizzle operators
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

export const createObjectiveSlice: StateCreator<
  AppState,
  [],
  [],
  ObjectiveSliceInterface
> = (set, get) => ({
  objectives: [],
  isLoadingObjectives: false,

  fetchObjectives: async () => {
    set({ isLoadingObjectives: true });
    try {
      const fetchedObjectives = await db
        .select()
        .from(objectives)
        .orderBy(asc(objectives.order), asc(objectives.createdAt));

      // This line will no longer cause an error after you update the Objective type
      set({ objectives: fetchedObjectives, isLoadingObjectives: false });
      console.log(
        `[ObjectiveSlice] ${fetchedObjectives.length} objectives fetched.`
      );
    } catch (error) {
      console.error("[ObjectiveSlice] Error fetching objectives:", error);
      set({ isLoadingObjectives: false });
    }
  },

  addObjective: async (
    objectiveData: Omit<Objective, "id" | "userId" | "createdAt">
  ) => {
    const currentUser = get().user;
    if (!currentUser) {
      console.error("[ObjectiveSlice] Cannot add objective. User not found.");
      return null;
    }

    const newObjective: Objective = {
      id: uuidv4(),
      userId: currentUser.id,
      ...objectiveData,
      createdAt: new Date(),
    };

    try {
      await db.insert(objectives).values(newObjective);

      const newObjectivesList = [...get().objectives, newObjective].sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ objectives: newObjectivesList });

      console.log("[ObjectiveSlice] Objective added:", newObjective.title);
      return newObjective;
    } catch (error) {
      console.error("[ObjectiveSlice] Error adding objective:", error);
      return null;
    }
  },

  updateObjective: async (objectiveToUpdate) => {
    try {
      await db
        .update(objectives)
        .set({
          type: objectiveToUpdate.type,
          title: objectiveToUpdate.title,
          description: objectiveToUpdate.description,
          objectiveGoals: objectiveToUpdate.objectiveGoals,
          coverImageUri: objectiveToUpdate.coverImageUri,
          avatarImageUri: objectiveToUpdate.avatarImageUri,
          icon: objectiveToUpdate.icon,
          color: objectiveToUpdate.color,
          order: objectiveToUpdate.order,
        })
        .where(eq(objectives.id, objectiveToUpdate.id));

      const updatedObjectives = get().objectives.map((p) =>
        p.id === objectiveToUpdate.id ? objectiveToUpdate : p
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
    try {
      await db.delete(objectives).where(eq(objectives.id, objectiveId));

      console.log("[ObjectiveSlice] Objective deleted from DB:", objectiveId);

      const problemIdsToDelete = get()
        .problems.filter((p) => p.objectiveId === objectiveId)
        .map((p) => p.id);

      set((state) => ({
        objectives: state.objectives.filter((p) => p.id !== objectiveId),
        problems: state.problems.filter((p) => p.objectiveId !== objectiveId),
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.objectiveId !== objectiveId
        ),
        threadItems: state.threadItems.filter(
          (ti) => !problemIdsToDelete.includes(ti.problemId)
        ),
      }));

      return true;
    } catch (error) {
      console.error("[ObjectiveSlice] Error deleting objective:", error);
      return false;
    }
  },

  getObjectiveById: (id: string) => {
    return get().objectives.find((p) => p.id === id);
  },
});
