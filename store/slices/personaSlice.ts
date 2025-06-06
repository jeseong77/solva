import { StateCreator } from 'zustand';
import { Persona, Problem } from '@/types'; // Problem은 Persona 삭제 시 관련 데이터 정리용
import type { AppState, PersonaSlice as PersonaSliceInterface } from '@/types/storeTypes';
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// Persona 관련 파서 함수
const parsePersonaFromDB = (dbItem: any): Persona => ({
    id: dbItem.id,
    title: dbItem.title,
    description: dbItem.description === null ? undefined : dbItem.description,
    personaGoals: dbItem.personaGoals === null ? undefined : dbItem.personaGoals,
    avatarImageUri: dbItem.avatarImageUri === null ? undefined : dbItem.avatarImageUri,
    icon: dbItem.icon === null ? undefined : dbItem.icon,
    color: dbItem.color === null ? undefined : dbItem.color,
    problemIds: dbItem.problemIds ? JSON.parse(dbItem.problemIds) : [],
    createdAt: new Date(dbItem.createdAt),
    order: dbItem.order === null ? undefined : dbItem.order,
});

export const createPersonaSlice: StateCreator<AppState, [], [], PersonaSliceInterface> = (set, get) => ({
    personas: [],
    isLoadingPersonas: false,

    fetchPersonas: async () => {
        set({ isLoadingPersonas: true });
        try {
            const db = await getDatabase();
            const results = await db.getAllAsync<any>(
                "SELECT * FROM Personas ORDER BY \"order\" ASC, createdAt ASC;" // order 우선, 그 다음 생성순
            );
            const fetchedPersonas = results.map(parsePersonaFromDB);
            set({ personas: fetchedPersonas, isLoadingPersonas: false });
            console.log("[PersonaSlice] Personas fetched:", fetchedPersonas.length);
        } catch (error) {
            console.error("[PersonaSlice] Error fetching personas:", error);
            set({ isLoadingPersonas: false });
        }
    },

    addPersona: async (personaData) => {
        // personaData 타입은 storeTypes.ts의 PersonaSlice.addPersona 시그니처를 따름
        // Omit<Persona, "id" | "createdAt" | "problemIds" | "order"> & { order?: number }
        // title은 Persona 타입에서 필수이므로, Omit에 없으면 personaData가 가져야 함.
        // storeTypes.ts에서 addPersona의 Omit 타입에 title을 추가하거나, &{} 부분에 title:string을 명시해야 함.
        // 여기서는 title이 personaData에 있다고 가정.
        const newPersona: Persona = {
            id: uuidv4(),
            title: personaData.title, // 필수
            description: personaData.description,
            personaGoals: personaData.personaGoals,
            avatarImageUri: personaData.avatarImageUri,
            icon: personaData.icon,
            color: personaData.color,
            problemIds: [], // 새 페르소나는 빈 problemIds로 시작
            createdAt: new Date(),
            order: personaData.order, // undefined일 수 있음
        };

        const db = await getDatabase();
        try {
            await db.runAsync(
                `INSERT INTO Personas (id, title, description, personaGoals, avatarImageUri, icon, color, problemIds, createdAt, "order")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    newPersona.id,
                    newPersona.title,
                    newPersona.description === undefined ? null : newPersona.description,
                    newPersona.personaGoals === undefined ? null : newPersona.personaGoals,
                    newPersona.avatarImageUri === undefined ? null : newPersona.avatarImageUri,
                    newPersona.icon === undefined ? null : newPersona.icon,
                    newPersona.color === undefined ? null : newPersona.color,
                    JSON.stringify(newPersona.problemIds),
                    newPersona.createdAt.toISOString(),
                    newPersona.order === undefined ? null : newPersona.order,
                ]
            );

            const currentPersonas = get().personas;
            const newPersonasList = [...currentPersonas, newPersona]
                .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
            set({ personas: newPersonasList });
            console.log("[PersonaSlice] Persona added to store:", newPersona.title);
            return newPersona;
        } catch (error) {
            console.error("[PersonaSlice] Error adding persona:", error);
            return null;
        }
    },

    updatePersona: async (personaToUpdate) => {
        const currentPersonas = get().personas;
        const personaIndex = currentPersonas.findIndex(p => p.id === personaToUpdate.id);
        if (personaIndex === -1) {
            console.error("[PersonaSlice] Persona not found for update:", personaToUpdate.id);
            return null;
        }
        // 전달받은 personaToUpdate가 DB에 저장될 최종 모습이라고 가정
        try {
            const db = await getDatabase();
            await db.runAsync(
                // createdAt은 업데이트하지 않음. problemIds는 별도 액션으로 관리하거나, 여기서 업데이트 시 JSON.stringify 필요.
                `UPDATE Personas SET title = ?, description = ?, personaGoals = ?, avatarImageUri = ?, icon = ?, color = ?, problemIds = ?, "order" = ?
         WHERE id = ?;`,
                [
                    personaToUpdate.title,
                    personaToUpdate.description === undefined ? null : personaToUpdate.description,
                    personaToUpdate.personaGoals === undefined ? null : personaToUpdate.personaGoals,
                    personaToUpdate.avatarImageUri === undefined ? null : personaToUpdate.avatarImageUri,
                    personaToUpdate.icon === undefined ? null : personaToUpdate.icon,
                    personaToUpdate.color === undefined ? null : personaToUpdate.color,
                    JSON.stringify(personaToUpdate.problemIds || []), // problemIds 업데이트 포함
                    personaToUpdate.order === undefined ? null : personaToUpdate.order,
                    personaToUpdate.id,
                ]
            );

            const updatedPersonas = currentPersonas.map(p => p.id === personaToUpdate.id ? personaToUpdate : p);
            updatedPersonas.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
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
            // DB에서 Persona 삭제 -> 연결된 Problem들도 DB의 CASCADE 규칙에 의해 삭제될 것임
            await db.runAsync(`DELETE FROM Personas WHERE id = ?;`, [personaId]);
            console.log("[PersonaSlice] Persona deleted from DB:", personaId);

            // 로컬 상태 업데이트: Persona 및 연관된 모든 하위 데이터(Problems, Objectives, Rules, StarReports) 제거
            const problemsToDelete = get().problems.filter(p => p.personaId === personaId);
            const problemIdsToDelete = problemsToDelete.map(p => p.id);

            const objectivesToDelete = get().objectives.filter(o => problemIdsToDelete.includes(o.problemId));
            const objectiveIdsToDelete = objectivesToDelete.map(o => o.id);

            // 주의: Objective의 blockingProblemIds로 연결된 Problem은 여기서 직접 처리하지 않음.
            // 해당 Problem은 다른 Persona에 속하거나 독립적으로 관리될 수 있음.
            // 여기서는 Persona 삭제 시 그 Persona에 직접 속한 Problem과 그 하위 항목들만 정리.

            set(state => ({
                personas: state.personas.filter(p => p.id !== personaId)
                    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime()),
                problems: state.problems.filter(p => p.personaId !== personaId),
                objectives: state.objectives.filter(o => !problemIdsToDelete.includes(o.problemId)),
                rules: state.rules.filter(r => !problemIdsToDelete.includes(r.problemId)),
                starReports: state.starReports.filter(sr => !problemIdsToDelete.includes(sr.problemId)),
                // tasks는 objective로 통합되었으므로 별도 처리 불필요. projects도 problem으로 통합.
            }));
            console.log("[PersonaSlice] Persona and related data cleaned from local store:", personaId);
            return true;
        } catch (error) {
            console.error("[PersonaSlice] Error deleting persona:", error);
            return false;
        }
    },

    getPersonaById: (id: string) => {
        return get().personas.find(p => p.id === id);
    },
});