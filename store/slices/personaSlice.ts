import { StateCreator } from "zustand";
import { Persona } from "@/types";
import type {
  AppState,
  PersonaSlice as PersonaSliceInterface,
} from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";

// Persona DB 데이터를 앱 상태 객체로 변환하는 파서
const parsePersonaFromDB = (dbItem: any): Persona => ({
  id: dbItem.id,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  personaGoals: dbItem.personaGoals === null ? undefined : dbItem.personaGoals,
  coverImageUri:
    dbItem.coverImageUri === null ? undefined : dbItem.coverImageUri,
  avatarImageUri:
    dbItem.avatarImageUri === null ? undefined : dbItem.avatarImageUri,
  icon: dbItem.icon === null ? undefined : dbItem.icon,
  color: dbItem.color === null ? undefined : dbItem.color,
  problemIds: dbItem.problemIds ? JSON.parse(dbItem.problemIds) : [],
  createdAt: new Date(dbItem.createdAt),
  order: dbItem.order === null ? undefined : dbItem.order,
});

export const createPersonaSlice: StateCreator<
  AppState,
  [],
  [],
  PersonaSliceInterface
> = (set, get) => ({
  personas: [],
  isLoadingPersonas: false,

  fetchPersonas: async () => {
    set({ isLoadingPersonas: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM Personas ORDER BY "order" ASC, createdAt ASC;'
      );
      const fetchedPersonas = results.map(parsePersonaFromDB);
      set({ personas: fetchedPersonas, isLoadingPersonas: false });
      console.log(`[PersonaSlice] ${fetchedPersonas.length} personas fetched.`);
    } catch (error) {
      console.error("[PersonaSlice] Error fetching personas:", error);
      set({ isLoadingPersonas: false });
    }
  },

  addPersona: async (personaData) => {
    const newPersona: Persona = {
      id: uuidv4(),
      title: personaData.title,
      description: personaData.description,
      personaGoals: personaData.personaGoals,
      coverImageUri: personaData.coverImageUri,
      avatarImageUri: personaData.avatarImageUri,
      icon: personaData.icon,
      color: personaData.color,
      problemIds: [],
      createdAt: new Date(),
      order: personaData.order,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Personas (id, title, description, personaGoals, coverImageUri, avatarImageUri, icon, color, problemIds, createdAt, "order")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newPersona.id,
          newPersona.title,
          newPersona.description ?? null,
          newPersona.personaGoals ?? null,
          newPersona.coverImageUri ?? null,
          newPersona.avatarImageUri ?? null,
          newPersona.icon ?? null,
          newPersona.color ?? null,
          JSON.stringify(newPersona.problemIds),
          newPersona.createdAt.toISOString(),
          newPersona.order ?? null,
        ]
      );

      const newPersonasList = [...get().personas, newPersona].sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ personas: newPersonasList });

      console.log("[PersonaSlice] Persona added:", newPersona.title);
      return newPersona;
    } catch (error) {
      console.error("[PersonaSlice] Error adding persona:", error);
      return null;
    }
  },

  updatePersona: async (personaToUpdate) => {
    if (!get().personas.find((p) => p.id === personaToUpdate.id)) {
      console.error(
        "[PersonaSlice] Persona not found for update:",
        personaToUpdate.id
      );
      return null;
    }
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Personas SET title = ?, description = ?, personaGoals = ?, coverImageUri = ?, avatarImageUri = ?, icon = ?, color = ?, problemIds = ?, "order" = ?
           WHERE id = ?;`,
        [
          personaToUpdate.title,
          personaToUpdate.description ?? null,
          personaToUpdate.personaGoals ?? null,
          personaToUpdate.coverImageUri ?? null,
          personaToUpdate.avatarImageUri ?? null,
          personaToUpdate.icon ?? null,
          personaToUpdate.color ?? null,
          JSON.stringify(personaToUpdate.problemIds || []),
          personaToUpdate.order ?? null,
          personaToUpdate.id,
        ]
      );

      const updatedPersonas = get().personas.map((p) =>
        p.id === personaToUpdate.id ? personaToUpdate : p
      );
      updatedPersonas.sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ personas: updatedPersonas });

      console.log("[PersonaSlice] Persona updated:", personaToUpdate.title);
      return personaToUpdate;
    } catch (error) {
      console.error("[PersonaSlice] Error updating persona:", error);
      return null;
    }
  },

  deletePersona: async (personaId) => {
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Personas WHERE id = ?;`, [personaId]);
      console.log("[PersonaSlice] Persona deleted from DB:", personaId);

      const problemIdsToDelete = get()
        .problems.filter((p) => p.personaId === personaId)
        .map((p) => p.id);

      set((state) => ({
        personas: state.personas.filter((p) => p.id !== personaId),
        problems: state.problems.filter((p) => p.personaId !== personaId),
        weeklyProblems: state.weeklyProblems.filter(
          (wp) => wp.personaId !== personaId
        ),
        threadItems: state.threadItems.filter(
          (ti) => !problemIdsToDelete.includes(ti.problemId)
        ),
        starReports: state.starReports.filter(
          (sr) => !problemIdsToDelete.includes(sr.problemId)
        ),
      }));

      const sortedPersonas = get().personas.sort(
        (a, b) =>
          (a.order ?? Infinity) - (b.order ?? Infinity) ||
          a.createdAt.getTime() - b.createdAt.getTime()
      );
      set({ personas: sortedPersonas });

      console.log(
        "[PersonaSlice] Persona and related data cleaned from local store:",
        personaId
      );
      return true;
    } catch (error) {
      console.error("[PersonaSlice] Error deleting persona:", error);
      return false;
    }
  },

  getPersonaById: (id: string) => {
    return get().personas.find((p) => p.id === id);
  },
});
