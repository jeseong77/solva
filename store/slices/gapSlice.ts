// store/slices/gapSlice.ts

import { db } from "@/lib/db"; // Import the new Drizzle instance
import { gaps } from "@/lib/db/schema"; // Import the table schema
import { Gap } from "@/types";
import type { AppState, GapSlice } from "@/types/storeTypes";
import { eq, desc } from "drizzle-orm"; // Import Drizzle operators
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// The parseGapFromDB function is NO LONGER NEEDED.
// Drizzle ORM handles mapping database results to typed objects automatically.

export const createGapSlice: StateCreator<AppState, [], [], GapSlice> = (
  set,
  get
) => ({
  gaps: [],
  isLoadingGaps: false,

  fetchGaps: async (objectiveId: string) => {
    set({ isLoadingGaps: true });
    try {
      // Drizzle query replaces raw SQL
      const fetchedGaps = await db
        .select()
        .from(gaps)
        .where(eq(gaps.objectiveId, objectiveId))
        .orderBy(desc(gaps.createdAt));

      // No more manual parsing! fetchedGaps is already of type Gap[]

      set((state) => ({
        gaps: [
          ...state.gaps.filter((g) => g.objectiveId !== objectiveId),
          ...fetchedGaps,
        ],
        isLoadingGaps: false,
      }));
      console.log(
        `[GapSlice] ${fetchedGaps.length} gaps fetched for objective ${objectiveId}.`
      );
    } catch (error) {
      console.error(
        `[GapSlice] Error fetching gaps for objective ${objectiveId}:`,
        error
      );
      set({ isLoadingGaps: false });
    }
  },

  addGap: async (gapData) => {
    const newGap: Gap = {
      id: uuidv4(),
      objectiveId: gapData.objectiveId,
      title: gapData.title,
      idealState: gapData.idealState,
      currentState: gapData.currentState,
      createdAt: new Date(),
    };

    try {
      // Drizzle's insert query is type-safe and concise
      await db.insert(gaps).values(newGap);

      set((state) => ({ gaps: [...state.gaps, newGap] }));
      console.log("[GapSlice] Gap added:", newGap.title);
      return newGap;
    } catch (error) {
      console.error("[GapSlice] Error adding gap:", error);
      return null;
    }
  },

  updateGap: async (gapToUpdate) => {
    try {
      // Drizzle's update query
      await db
        .update(gaps)
        .set({
          title: gapToUpdate.title,
          idealState: gapToUpdate.idealState,
          currentState: gapToUpdate.currentState,
        })
        .where(eq(gaps.id, gapToUpdate.id));

      set((state) => ({
        gaps: state.gaps.map((g) =>
          g.id === gapToUpdate.id ? gapToUpdate : g
        ),
      }));
      console.log("[GapSlice] Gap updated:", gapToUpdate.title);
      return gapToUpdate;
    } catch (error) {
      console.error("[GapSlice] Error updating gap:", error);
      return null;
    }
  },

  deleteGap: async (gapId) => {
    try {
      // Drizzle's delete query
      await db.delete(gaps).where(eq(gaps.id, gapId));

      // This state logic remains the same
      set((state) => ({
        gaps: state.gaps.filter((g) => g.id !== gapId),
        problems: state.problems.map((p) =>
          p.gapId === gapId ? { ...p, gapId: null } : p
        ),
      }));

      console.log("[GapSlice] Gap deleted:", gapId);
      return true;
    } catch (error) {
      console.error("[GapSlice] Error deleting gap:", error);
      return false;
    }
  },

  getGapById: (id: string) => {
    // No changes needed here, as it only interacts with the in-memory state
    return get().gaps.find((g) => g.id === id);
  },
});
