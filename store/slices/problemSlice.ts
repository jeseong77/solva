// src/store/slices/problemSlice.ts

import { db } from "@/lib/db"; // Import Drizzle instance
import { problems } from "@/lib/db/schema"; // Import problems table schema
import { Priority, Problem } from "@/types";
import type {
  AppState,
  ProblemSlice as ProblemSliceInterface,
} from "@/types/storeTypes";
import { eq, desc } from "drizzle-orm"; // Import Drizzle operators
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

const priorityOrder: { [key in Priority]: number } = {
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

const sortProblems = (a: Problem, b: Problem) => {
  if (
    a.priority &&
    b.priority &&
    priorityOrder[a.priority] !== priorityOrder[b.priority]
  ) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
};

export const createProblemSlice: StateCreator<
  AppState,
  [],
  [],
  ProblemSliceInterface
> = (set, get) => ({
  problems: [],
  isLoadingProblems: false,

  fetchProblems: async (objectiveId?: string) => {
    set({ isLoadingProblems: true });
    try {
      let fetchedProblems: Problem[];

      if (objectiveId) {
        fetchedProblems = await db
          .select()
          .from(problems)
          .where(eq(problems.objectiveId, objectiveId))
          .orderBy(desc(problems.createdAt)); // Added sorting for consistency
      } else {
        fetchedProblems = await db
          .select()
          .from(problems)
          .orderBy(desc(problems.createdAt));
      }

      const allProblems = [...get().problems, ...fetchedProblems];
      const problemMap = new Map<string, Problem>();
      allProblems.forEach((p) => {
        problemMap.set(p.id, p);
      });

      const uniqueProblemList = Array.from(problemMap.values()).sort(
        sortProblems
      );

      set({
        problems: uniqueProblemList,
        isLoadingProblems: false,
      });

      console.log(
        `[ProblemSlice] Problems fetched ${
          objectiveId ? `for objective ${objectiveId}` : "(all)"
        }: ${fetchedProblems.length}`
      );
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  addProblem: async (problemData) => {
    const newProblem: Problem = {
      id: uuidv4(),
      objectiveId: problemData.objectiveId,
      gapId: problemData.gapId ?? null,
      title: problemData.title,
      description: problemData.description ?? null,
      status: problemData.status || "active",
      priority: problemData.priority || "none",
      urgency: problemData.urgency ?? null,
      importance: problemData.importance ?? null,
      tags: problemData.tags || [],
      childThreadIds: [],
      timeSpent: 0,
      createdAt: new Date(),
      resolvedAt: null,
      archivedAt: null,
      starReportId: null,
      // FIX: Add the new imageUrls property, defaulting to null.
      imageUrls: problemData.imageUrls ?? null,
    };

    try {
      await db.insert(problems).values(newProblem);

      const newProblemList = [...get().problems, newProblem].sort(sortProblems);
      set({ problems: newProblemList });
      console.log("[ProblemSlice] Problem added:", newProblem.title);
      return newProblem;
    } catch (error) {
      console.error("[ProblemSlice] Error adding problem:", error);
      return null;
    }
  },

  updateProblem: async (problemToUpdate) => {
    try {
      await db
        .update(problems)
        .set({
          title: problemToUpdate.title,
          description: problemToUpdate.description,
          status: problemToUpdate.status,
          priority: problemToUpdate.priority,
          urgency: problemToUpdate.urgency,
          importance: problemToUpdate.importance,
          tags: problemToUpdate.tags,
          childThreadIds: problemToUpdate.childThreadIds,
          timeSpent: problemToUpdate.timeSpent,
          resolvedAt: problemToUpdate.resolvedAt,
          archivedAt: problemToUpdate.archivedAt,
          starReportId: problemToUpdate.starReportId,
          gapId: problemToUpdate.gapId,
          // FIX: Add the new imageUrls property to the update set.
          imageUrls: problemToUpdate.imageUrls,
        })
        .where(eq(problems.id, problemToUpdate.id));

      const updatedProblems = get()
        .problems.map((p) =>
          p.id === problemToUpdate.id ? problemToUpdate : p
        )
        .sort(sortProblems);
      set({ problems: updatedProblems });
      console.log("[ProblemSlice] Problem updated:", problemToUpdate.title);
      return problemToUpdate;
    } catch (error) {
      console.error("[ProblemSlice] Error updating problem:", error);
      return null;
    }
  },

  deleteProblem: async (problemId) => {
    try {
      await db.delete(problems).where(eq(problems.id, problemId));

      set((state) => ({
        problems: state.problems.filter((p) => p.id !== problemId),
        threadItems: state.threadItems.filter(
          (ti) => ti.problemId !== problemId
        ),
        starReports: state.starReports.filter(
          (sr) => sr.problemId !== problemId
        ),
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.problemId !== problemId
        ),
      }));

      console.log(
        "[ProblemSlice] Problem and related data cleaned from local store:",
        problemId
      );
      return true;
    } catch (error) {
      console.error("[ProblemSlice] Error deleting problem:", error);
      return false;
    }
  },

  getProblemById: (id: string) => {
    return get().problems.find((p) => p.id === id);
  },
});
