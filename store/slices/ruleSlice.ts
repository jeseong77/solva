// src/lib/ruleSlice.ts

import { StateCreator } from "zustand";
import { Rule, Problem } from "@/types";
import type {
  AppState,
  RuleSlice as RuleSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// Helper to parse Rule from DB record
const parseRuleFromDB = (dbItem: any): Rule => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
  title: dbItem.title,
  createdAt: new Date(dbItem.createdAt),
});

export const createRuleSlice: StateCreator<
  AppState,
  [],
  [],
  RuleSliceInterface
> = (set, get) => ({
  rules: [],
  isLoadingRules: false,

  fetchRules: async (problemId: string) => {
    set({ isLoadingRules: true });
    try {
      const db = await getDatabase();
      const query =
        "SELECT * FROM Rules WHERE problemId = ? ORDER BY createdAt ASC;";
      const results = await db.getAllAsync<any>(query, [problemId]);
      const fetchedRules = results.map(parseRuleFromDB);
      // Sets the rules state to only the rules for the fetched problemId
      set({ rules: fetchedRules, isLoadingRules: false });
      // console.log(`[RuleSlice] Rules fetched for problem ${problemId}:`, fetchedRules.length);
    } catch (error) {
      console.error(
        `[RuleSlice] Error fetching rules for problem ${problemId}:`,
        error
      );
      set({ isLoadingRules: false });
    }
  },

  // ruleData: Omit<Rule, "id" | "createdAt">
  // Expected to contain: problemId, title
  addRule: async (ruleData) => {
    const newRule: Rule = {
      id: uuidv4(),
      problemId: ruleData.problemId,
      title: ruleData.title,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Rules (id, problemId, title, createdAt)
         VALUES (?, ?, ?, ?);`,
        [
          newRule.id,
          newRule.problemId,
          newRule.title,
          newRule.createdAt.toISOString(),
        ]
      );

      // Update parent Problem's ruleIds
      const parentProblem = get().problems.find(
        (p) => p.id === newRule.problemId
      );
      if (parentProblem) {
        const updatedParentProblem: Problem = {
          ...parentProblem,
          ruleIds: [...(parentProblem.ruleIds || []), newRule.id],
        };
        await get().updateProblem(updatedParentProblem); // Assumes updateProblem in ProblemSlice handles DB and state
      } else {
        console.warn(
          `[RuleSlice] Parent problem with ID ${newRule.problemId} not found in local state during addRule.`
        );
      }

      // Add to local state and sort
      const updatedRules = [...get().rules, newRule].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      set({ rules: updatedRules });
      console.log("[RuleSlice] Rule added:", newRule.title);
      return newRule;
    } catch (error) {
      console.error("[RuleSlice] Error adding rule:", error);
      return null;
    }
  },

  updateRule: async (ruleToUpdate) => {
    const currentRules = get().rules;
    const ruleIndex = currentRules.findIndex((r) => r.id === ruleToUpdate.id);
    if (ruleIndex === -1) {
      console.error("[RuleSlice] Rule not found for update:", ruleToUpdate.id);
      return null;
    }
    const oldRule = currentRules[ruleIndex];

    const db = await getDatabase();
    try {
      // Handle problemId change and update relevant Problem ruleIds
      if (oldRule.problemId !== ruleToUpdate.problemId) {
        // Remove from old parent Problem
        const oldParentProblem = get().problems.find(
          (p) => p.id === oldRule.problemId
        );
        if (oldParentProblem) {
          const updatedOldParent: Problem = {
            ...oldParentProblem,
            ruleIds: (oldParentProblem.ruleIds || []).filter(
              (id) => id !== ruleToUpdate.id
            ),
          };
          await get().updateProblem(updatedOldParent);
        }

        // Add to new parent Problem
        const newParentProblem = get().problems.find(
          (p) => p.id === ruleToUpdate.problemId
        );
        if (newParentProblem) {
          const updatedNewParent: Problem = {
            ...newParentProblem,
            ruleIds: [...(newParentProblem.ruleIds || []), ruleToUpdate.id],
          };
          await get().updateProblem(updatedNewParent);
        }
      }

      await db.runAsync(
        `UPDATE Rules SET title = ?, problemId = ?
         WHERE id = ?;`,
        [ruleToUpdate.title, ruleToUpdate.problemId, ruleToUpdate.id]
      );

      const updatedRules = currentRules
        .map((r) => (r.id === ruleToUpdate.id ? ruleToUpdate : r))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      set({ rules: updatedRules });
      console.log("[RuleSlice] Rule updated:", ruleToUpdate.title);
      return ruleToUpdate;
    } catch (error) {
      console.error("[RuleSlice] Error updating rule:", error);
      return null;
    }
  },

  deleteRule: async (ruleId) => {
    const ruleToDelete = get().rules.find((r) => r.id === ruleId);
    if (!ruleToDelete) {
      console.error("[RuleSlice] Rule not found for deletion:", ruleId);
      return false;
    }

    const db = await getDatabase();
    try {
      // Update parent Problem's ruleIds
      const parentProblem = get().problems.find(
        (p) => p.id === ruleToDelete.problemId
      );
      if (parentProblem) {
        const updatedParentProblem: Problem = {
          ...parentProblem,
          ruleIds: (parentProblem.ruleIds || []).filter((id) => id !== ruleId),
        };
        await get().updateProblem(updatedParentProblem);
      } else {
        console.warn(
          `[RuleSlice] Parent problem with ID ${ruleToDelete.problemId} not found in local state during deleteRule.`
        );
      }

      await db.runAsync(`DELETE FROM Rules WHERE id = ?;`, [ruleId]);

      const updatedRules = get()
        .rules.filter((r) => r.id !== ruleId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      set({ rules: updatedRules });
      console.log("[RuleSlice] Rule deleted:", ruleId);
      return true;
    } catch (error) {
      console.error("[RuleSlice] Error deleting rule:", error);
      return false;
    }
  },

  getRuleById: (id: string) => {
    return get().rules.find((r) => r.id === id);
  },
});
