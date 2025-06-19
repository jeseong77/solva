// store/objectiveSlice.ts

import { getDatabase } from "@/lib/db";
// ✅ [변경] Persona -> Objective, ObjectiveType 타입 import
import { Objective, ObjectiveType } from "@/types";
// ✅ [변경] AppState와 Slice 인터페이스 이름 변경을 가정
import type {
  AppState,
  ObjectiveSlice as ObjectiveSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// ✅ [변경] DB에서 읽어온 데이터를 Objective 객체로 파싱하는 함수
const parseObjectiveFromDB = (dbItem: any): Objective => ({
  id: dbItem.id,
  userId: dbItem.userId,
  type: dbItem.type, // ✅ type 필드 추가
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  objectiveGoals:
    dbItem.objectiveGoals === null ? undefined : dbItem.objectiveGoals, // ✅ 이름 변경
  coverImageUri:
    dbItem.coverImageUri === null ? undefined : dbItem.coverImageUri,
  avatarImageUri:
    dbItem.avatarImageUri === null ? undefined : dbItem.avatarImageUri,
  icon: dbItem.icon === null ? undefined : dbItem.icon,
  color: dbItem.color === null ? undefined : dbItem.color,
  createdAt: new Date(dbItem.createdAt),
  order: dbItem.order === null ? undefined : dbItem.order,
});

// ✅ [변경] createPersonaSlice -> createObjectiveSlice
export const createObjectiveSlice: StateCreator<
  AppState,
  [],
  [],
  ObjectiveSliceInterface
> = (set, get) => ({
  objectives: [], // ✅ personas -> objectives
  isLoadingObjectives: false, // ✅ isLoadingPersonas -> isLoadingObjectives

  fetchObjectives: async () => {
    set({ isLoadingObjectives: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM Objectives ORDER BY "order" ASC, createdAt ASC;' // ✅ Personas -> Objectives
      );
      const fetchedObjectives = results.map(parseObjectiveFromDB);
      set({ objectives: fetchedObjectives, isLoadingObjectives: false });
      console.log(
        `[ObjectiveSlice] ${fetchedObjectives.length} objectives fetched.`
      );
    } catch (error) {
      console.error("[ObjectiveSlice] Error fetching objectives:", error);
      set({ isLoadingObjectives: false });
    }
  },

  // ✅ [변경] addPersona -> addObjective
  // Omit을 사용하여 id, problemIds 등 서버에서 생성할 필드를 제외
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
      type: objectiveData.type, // ✅ type 포함
      title: objectiveData.title,
      description: objectiveData.description,
      objectiveGoals: objectiveData.objectiveGoals, // ✅ 이름 변경
      coverImageUri: objectiveData.coverImageUri,
      avatarImageUri: objectiveData.avatarImageUri,
      icon: objectiveData.icon,
      color: objectiveData.color,
      createdAt: new Date(),
      order: objectiveData.order,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Objectives (id, userId, type, title, description, objectiveGoals, coverImageUri, avatarImageUri, icon, color, createdAt, "order")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newObjective.id,
          newObjective.userId,
          newObjective.type,
          newObjective.title,
          newObjective.description ?? null,
          newObjective.objectiveGoals ?? null,
          newObjective.coverImageUri ?? null,
          newObjective.avatarImageUri ?? null,
          newObjective.icon ?? null,
          newObjective.color ?? null,
          newObjective.createdAt.toISOString(),
          newObjective.order ?? null,
        ]
      );

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
    if (!get().objectives.find((p) => p.id === objectiveToUpdate.id)) {
      console.error(
        "[ObjectiveSlice] Objective not found for update:",
        objectiveToUpdate.id
      );
      return null;
    }
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Objectives SET type = ?, title = ?, description = ?, objectiveGoals = ?, coverImageUri = ?, avatarImageUri = ?, icon = ?, color = ?, "order" = ?
           WHERE id = ?;`,
        [
          objectiveToUpdate.type,
          objectiveToUpdate.title,
          objectiveToUpdate.description ?? null,
          objectiveToUpdate.objectiveGoals ?? null,
          objectiveToUpdate.coverImageUri ?? null,
          objectiveToUpdate.avatarImageUri ?? null,
          objectiveToUpdate.icon ?? null,
          objectiveToUpdate.color ?? null,
          objectiveToUpdate.order ?? null,
          objectiveToUpdate.id,
        ]
      );

      const updatedObjectives = get().objectives.map((p) =>
        p.id === objectiveToUpdate.id ? objectiveToUpdate : p
      );
      updatedObjectives.sort(/* ... */);
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
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Objectives WHERE id = ?;`, [objectiveId]);
      console.log("[ObjectiveSlice] Objective deleted from DB:", objectiveId);

      const problemIdsToDelete = get()
        .problems.filter((p) => p.objectiveId === objectiveId)
        .map((p) => p.id);

      set((state) => ({
        objectives: state.objectives.filter((p) => p.id !== objectiveId),
        problems: state.problems.filter((p) => p.objectiveId !== objectiveId), // ✅ personaId -> objectiveId
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.objectiveId !== objectiveId
        ), // ✅ personaId -> objectiveId
        threadItems: state.threadItems.filter(
          (ti) => !problemIdsToDelete.includes(ti.problemId)
        ),
        // ... (나머지 상태 정리) ...
      }));

      // ... (정렬 로직)
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
