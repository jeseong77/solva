// store/PersonaSlice.ts

import { getDatabase } from "@/lib/db";
import { Persona } from "@/types";
import type {
  AppState,
  PersonaSlice as PersonaSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

const parsePersonaFromDB = (dbItem: any): Persona => ({
  id: dbItem.id,
  userId: dbItem.userId, // ✅ userId 필드 추가
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  personaGoals: dbItem.personaGoals === null ? undefined : dbItem.personaGoals,
  // ✅ coverImageUri 필드 추가
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
      // 참고: 현재는 단일 유저 환경이므로 모든 페르소나를 가져옵니다.
      // 다중 유저를 지원하게 되면 "WHERE userId = ?" 조건이 필요합니다.
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
    const currentUser = get().user;
    if (!currentUser) {
      console.error("[PersonaSlice] Cannot add persona. User not found.");
      return null;
    }

    const newPersona: Persona = {
      id: uuidv4(),
      userId: currentUser.id, // ✅ userId 설정
      title: personaData.title,
      description: personaData.description,
      personaGoals: personaData.personaGoals,
      coverImageUri: personaData.coverImageUri, // ✅ coverImageUri 설정
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
        // ✅ SQL 쿼리 및 파라미터 개수 수정
        `INSERT INTO Personas (id, userId, title, description, personaGoals, coverImageUri, avatarImageUri, icon, color, problemIds, createdAt, "order")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newPersona.id,
          newPersona.userId,
          newPersona.title,
          newPersona.description ?? null,
          newPersona.personaGoals ?? null,
          newPersona.coverImageUri ?? null, // ✅ 파라미터 추가
          newPersona.avatarImageUri ?? null,
          newPersona.icon ?? null,
          newPersona.color ?? null,
          JSON.stringify(newPersona.problemIds),
          newPersona.createdAt.toISOString(),
          newPersona.order ?? null,
        ]
      );

      // 상태 업데이트 로직은 이전과 동일하게 유지
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

  // ✅ updatePersona는 id를 기준으로 업데이트하므로 SQL 쿼리 변경은 불필요.
  //    넘겨받는 personaToUpdate 객체는 이미 userId를 포함하고 있음.
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

  // ✅ deletePersona는 personaId로 동작하므로 변경 불필요.
  //    연관 데이터 삭제 로직도 personaId를 기반으로 하므로 올바르게 동작함.
  deletePersona: async (personaId) => {
    const db = await getDatabase();
    try {
      // ON DELETE CASCADE 제약 조건에 의해 하위 데이터(Problems 등)는 DB에서 자동 삭제됨.
      await db.runAsync(`DELETE FROM Personas WHERE id = ?;`, [personaId]);
      console.log("[PersonaSlice] Persona deleted from DB:", personaId);

      // 로컬 Zustand 상태에서 페르소나와 관련된 모든 데이터를 정리합니다.
      // 이 로직은 DB의 CASCADE와 별개로 클라이언트 상태를 동기화하기 위해 필요합니다.
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

      // 재정렬 로직은 불필요해 보이지만, 혹시 모를 의존성을 위해 유지
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
