// src/lib/problemSlice.ts

import { getDatabase } from "@/lib/db";
import { Priority, Problem, ProblemStatus } from "@/types"; // Assuming ProblemStatus and Priority are in @/types
import type {
  AppState,
  ProblemSlice as ProblemSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// Helper to parse Problem from DB record
const parseProblemFromDB = (dbItem: any): Problem => ({
  id: dbItem.id,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  status: dbItem.status as ProblemStatus,
  priority: dbItem.priority as Priority,
  resolutionCriteriaText:
    dbItem.resolutionCriteriaText === null
      ? undefined
      : dbItem.resolutionCriteriaText,
  resolutionNumericalTarget:
    dbItem.resolutionNumericalTarget === null
      ? undefined
      : dbItem.resolutionNumericalTarget,
  currentNumericalProgress:
    dbItem.currentNumericalProgress === null
      ? undefined
      : dbItem.currentNumericalProgress,
  objectiveIds: dbItem.objectiveIds ? JSON.parse(dbItem.objectiveIds) : [],
  ruleIds: dbItem.ruleIds ? JSON.parse(dbItem.ruleIds) : [],
  tagIds: dbItem.tagIds ? JSON.parse(dbItem.tagIds) : [],
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  resolvedAt: dbItem.resolvedAt ? new Date(dbItem.resolvedAt) : undefined,
  archivedAt: dbItem.archivedAt ? new Date(dbItem.archivedAt) : undefined,
  starReportId: dbItem.starReportId === null ? undefined : dbItem.starReportId,
});

export const createProblemSlice: StateCreator<
  AppState,
  [],
  [],
  ProblemSliceInterface
> = (set, get) => ({
  problems: [],
  isLoadingProblems: false,

  fetchProblems: async () => {
    set({ isLoadingProblems: true });
    try {
      const db = await getDatabase();
      const query = "SELECT * FROM Problems ORDER BY createdAt ASC;";
      const results = await db.getAllAsync<any>(query);
      const fetchedProblems = results.map(parseProblemFromDB);
      set({ problems: fetchedProblems, isLoadingProblems: false });
    } catch (error) {
      console.error("[ProblemSlice] Error fetching problems:", error);
      set({ isLoadingProblems: false });
    }
  },

  // problemData is of type:
  // Omit<Problem, "id" | "createdAt" | "objectiveIds" | "ruleIds" | "timeSpent" | "resolvedAt" | "archivedAt" | "starReportId" | "currentNumericalProgress">
  // & { currentNumericalProgress?: number }
  // This means problemData is expected to have:
  // - title: string
  // - status: ProblemStatus
  // - priority: Priority
  // - description?: string
  // - resolutionCriteriaText?: string
  // - resolutionNumericalTarget?: number
  // - tagIds?: string[]
  // - currentNumericalProgress?: number (optional override)
  addProblem: async (problemData) => {
    const newProblem: Problem = {
      id: uuidv4(),
      title: problemData.title,
      description: problemData.description,
      status: problemData.status,
      priority: problemData.priority,
      resolutionCriteriaText: problemData.resolutionCriteriaText,
      resolutionNumericalTarget: problemData.resolutionNumericalTarget, // This would be number | undefined
      tagIds: problemData.tagIds || [],

      objectiveIds: [],
      ruleIds: [],
      timeSpent: 0,
      createdAt: new Date(),
      resolvedAt: undefined,
      archivedAt: undefined,
      starReportId: undefined,

      // Assign directly from problemData, making newProblem.currentNumericalProgress potentially undefined
      currentNumericalProgress: problemData.currentNumericalProgress,
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Problems (id, title, description, status, priority, resolutionCriteriaText, resolutionNumericalTarget, currentNumericalProgress, objectiveIds, ruleIds, tagIds, timeSpent, createdAt, resolvedAt, archivedAt, starReportId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProblem.id,
          newProblem.title,
          newProblem.description === undefined ? null : newProblem.description,
          newProblem.status,
          newProblem.priority,
          newProblem.resolutionCriteriaText === undefined
            ? null
            : newProblem.resolutionCriteriaText,
          // Consistently handle resolutionNumericalTarget (which is also number | undefined on newProblem)
          newProblem.resolutionNumericalTarget === undefined
            ? null
            : newProblem.resolutionNumericalTarget,
          // User's confirmed resolution for currentNumericalProgress:
          newProblem.currentNumericalProgress === undefined
            ? null
            : newProblem.currentNumericalProgress,
          JSON.stringify(newProblem.objectiveIds),
          JSON.stringify(newProblem.ruleIds),
          JSON.stringify(newProblem.tagIds),
          newProblem.timeSpent,
          newProblem.createdAt.toISOString(),
          newProblem.resolvedAt ? newProblem.resolvedAt.toISOString() : null,
          newProblem.archivedAt ? newProblem.archivedAt.toISOString() : null,
          newProblem.starReportId === undefined
            ? null
            : newProblem.starReportId,
        ]
      );

      const updatedProblems = [newProblem, ...get().problems].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      set({ problems: updatedProblems });
      console.log("[ProblemSlice] Problem added:", newProblem.title);
      return newProblem;
    } catch (error) {
      console.error("[ProblemSlice] Error adding problem:", error);
      return null;
    }
  },

  updateProblem: async (problemToUpdate) => {
    const currentProblems = get().problems;
    const problemIndex = currentProblems.findIndex(
      (p) => p.id === problemToUpdate.id
    );
    if (problemIndex === -1) {
      console.error(
        "[ProblemSlice] Problem not found for update:",
        problemToUpdate.id
      );
      return null;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Problems SET title = ?, description = ?, status = ?, priority = ?, resolutionCriteriaText = ?, resolutionNumericalTarget = ?, currentNumericalProgress = ?, objectiveIds = ?, ruleIds = ?, tagIds = ?, timeSpent = ?, resolvedAt = ?, archivedAt = ?, starReportId = ?
         WHERE id = ?;`,
        [
          problemToUpdate.title,
          problemToUpdate.description === undefined
            ? null
            : problemToUpdate.description,
          problemToUpdate.status,
          problemToUpdate.priority,
          problemToUpdate.resolutionCriteriaText === undefined
            ? null
            : problemToUpdate.resolutionCriteriaText,
          problemToUpdate.resolutionNumericalTarget === undefined
            ? null
            : problemToUpdate.resolutionNumericalTarget,
          problemToUpdate.currentNumericalProgress === undefined
            ? null
            : problemToUpdate.currentNumericalProgress,
          JSON.stringify(problemToUpdate.objectiveIds || []),
          JSON.stringify(problemToUpdate.ruleIds || []),
          JSON.stringify(problemToUpdate.tagIds || []),
          problemToUpdate.timeSpent,
          problemToUpdate.resolvedAt
            ? problemToUpdate.resolvedAt.toISOString()
            : null,
          problemToUpdate.archivedAt
            ? problemToUpdate.archivedAt.toISOString()
            : null,
          problemToUpdate.starReportId === undefined
            ? null
            : problemToUpdate.starReportId,
          problemToUpdate.id,
        ]
      );

      const updatedProblems = currentProblems
        .map((p) => (p.id === problemToUpdate.id ? problemToUpdate : p))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
      const db = await getDatabase();
      await db.runAsync(`DELETE FROM Problems WHERE id = ?;`, [problemId]);

      set((state) => ({
        problems: state.problems
          .filter((p) => p.id !== problemId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        // Assuming DB `ON DELETE CASCADE` handles related Objectives, Rules, StarReports in the DB.
        // This cleans them from local state.
        objectives: state.objectives.filter((o) => o.problemId !== problemId),
        rules: state.rules.filter((r) => r.problemId !== problemId),
        starReports: state.starReports.filter(
          (sr) => sr.problemId !== problemId
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
