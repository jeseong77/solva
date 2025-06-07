import { StateCreator } from 'zustand';
import { Objective, ObjectiveStatus, Problem } from '@/types'; // Project 타입 제거
import type { AppState, ObjectiveSlice as ObjectiveSliceInterface } from '@/types/storeTypes';
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const parseObjectiveFromDB = (dbItem: any): Objective => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  parentId: dbItem.parentId === null ? null : dbItem.parentId, // DB null을 TS null로 유지
  childObjectiveIds: dbItem.childObjectiveIds ? JSON.parse(dbItem.childObjectiveIds) : [],
  blockingProblemIds: dbItem.blockingProblemIds ? JSON.parse(dbItem.blockingProblemIds) : [],
  workSessionIds: dbItem.workSessionIds,
  status: dbItem.status as ObjectiveStatus,
  deadline: dbItem.deadline ? new Date(dbItem.deadline) : undefined,
  timeSpent: dbItem.timeSpent || 0,
  completionCriteriaText: dbItem.completionCriteriaText === null ? undefined : dbItem.completionCriteriaText,
  numericalTarget: dbItem.numericalTarget === null ? undefined : dbItem.numericalTarget,
  currentNumericalProgress: dbItem.currentNumericalProgress === null ? undefined : dbItem.currentNumericalProgress,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
  order: dbItem.order === null ? undefined : dbItem.order,
});

// ObjectiveSliceInterface는 types/storeTypes.ts의 정의를 따릅니다.
// addObjective의 Omit 타입은 types/storeTypes.ts에 맞춰져야 합니다.
// 예: Omit<Objective, "id" | "createdAt" | "childObjectiveIds" | "blockingProblemIds" | "status" | "timeSpent" | "completedAt"> &
//                { problemId: string; title: string; parentId?: string | null; status?: ObjectiveStatus; /* 기타 사용자 입력 필드 */ }

export const createObjectiveSlice: StateCreator<AppState, [], [], ObjectiveSliceInterface> = (set, get) => ({
  objectives: [],
  isLoadingObjectives: false,

  fetchObjectives: async (optionsOrParentId?: { problemId: string; parentObjectiveId?: string | null } | { parentObjectiveId: string; problemId?: string } | string | null) => {
    set({ isLoadingObjectives: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Objectives";
      const params: string[] = [];
      let logInfo = "(all)";

      if (typeof optionsOrParentId === 'string' || optionsOrParentId === null) { // parentId로만 호출된 경우 (Problem 내 Objective 목록용으로 변경 필요)
        // 이 경우는 특정 Problem의 최상위 Objective를 가져오는 것으로 해석하거나,
        // 또는 특정 Objective의 하위 Objective를 가져오는 것으로 해석해야 함.
        // fetchObjectives: (options: { problemId: string; parentObjectiveId?: string | null } ) 로 시그니처 변경 필요
        // 여기서는 일단 모든 Objective를 가져오는 것으로 단순화 (추후 세분화된 fetch 필요)
        console.warn("[ObjectiveSlice] fetchObjectives: 단순 parentId 호출은 모호함. problemId와 함께 사용 권장. 일단 모든 Objective 로드.");
      } else if (typeof optionsOrParentId === 'object' && optionsOrParentId !== null) {
        const options = optionsOrParentId;
        if (options.problemId && options.parentObjectiveId !== undefined) { // 특정 problem의 특정 parent 하위
          query += " WHERE problemId = ? AND parentId " + (options.parentObjectiveId === null ? "IS NULL" : "= ?");
          params.push(options.problemId);
          if (options.parentObjectiveId !== null) params.push(options.parentObjectiveId);
          logInfo = `for problem ${options.problemId} and parent ${options.parentObjectiveId}`;
        } else if (options.problemId) { // 특정 problem의 모든 (최상위) objective
          query += " WHERE problemId = ? AND parentId IS NULL";
          params.push(options.problemId);
          logInfo = `top-level for problem ${options.problemId}`;
        } else if (options.parentObjectiveId) { // 특정 parent 하위 objective (어떤 problem인지는 모름 - 이 경우는 거의 없을 것)
          query += " WHERE parentId = ?";
          params.push(options.parentObjectiveId);
          logInfo = `for parent ${options.parentObjectiveId}`;
        }
      }

      query += ' ORDER BY "order" ASC, createdAt ASC;';
      const results = await db.getAllAsync<any>(query, params);
      const fetchedObjectives = results.map(parseObjectiveFromDB);

      // 상태 업데이트 로직 (가져온 범위에 따라 다르게)
      if (typeof optionsOrParentId === 'object' && optionsOrParentId !== null && optionsOrParentId.problemId && optionsOrParentId.parentObjectiveId !== undefined) {
        // 특정 parentId의 자식들만 가져온 경우 (기존 자식들 교체)
        set(state => ({
          objectives: [
            ...state.objectives.filter(obj => !(obj.problemId === optionsOrParentId.problemId && obj.parentId === optionsOrParentId.parentObjectiveId)),
            ...fetchedObjectives
          ].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime()),
          isLoadingObjectives: false,
        }));
      } else if (typeof optionsOrParentId === 'object' && optionsOrParentId !== null && optionsOrParentId.problemId) {
        // 특정 problemId의 최상위 objectives만 가져온 경우
        set(state => ({
          objectives: [
            ...state.objectives.filter(obj => !(obj.problemId === optionsOrParentId.problemId && obj.parentId === null)),
            ...fetchedObjectives
          ].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime()),
          isLoadingObjectives: false,
        }));
      }
      else { // 전체 Objectives를 가져온 경우
        set({ objectives: fetchedObjectives, isLoadingObjectives: false });
      }
      console.log(`[ObjectiveSlice] Objectives fetched ${logInfo}:`, fetchedObjectives.length);
    } catch (error) {
      console.error("[ObjectiveSlice] Error fetching objectives:", error);
      set({ isLoadingObjectives: false });
    }
  },

  addObjective: async (objectiveData) => {
    // objectiveData 타입은 storeTypes.ts의 ObjectiveSlice.addObjective 시그니처를 따름
    // 필수: problemId, title. 옵션: description, parentId, deadline, order, completionCriteriaText, numericalTarget, currentNumericalProgress, status
    const newObjective: Objective = {
      id: uuidv4(),
      problemId: objectiveData.problemId,
      title: objectiveData.title,
      description: objectiveData.description,
      parentId: objectiveData.parentId || null,
      childObjectiveIds: [],
      blockingProblemIds: [],
      workSessionIds: [],
      status: objectiveData.status || "todo",
      deadline: objectiveData.deadline,
      timeSpent: 0,
      completionCriteriaText: objectiveData.completionCriteriaText,
      numericalTarget: objectiveData.numericalTarget,
      currentNumericalProgress: objectiveData.currentNumericalProgress || 0,
      createdAt: new Date(),
      completedAt: undefined,
      order: objectiveData.order,
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Objectives (id, problemId, title, description, parentId, childObjectiveIds, blockingProblemIds, status, deadline, timeSpent, completionCriteriaText, numericalTarget, currentNumericalProgress, createdAt, completedAt, "order")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, // 16개 ?
        [
          newObjective.id, newObjective.problemId, newObjective.title,
          newObjective.description === undefined ? null : newObjective.description,
          newObjective.parentId, // 이미 string | null
          JSON.stringify(newObjective.childObjectiveIds),
          JSON.stringify(newObjective.blockingProblemIds),
          newObjective.status,
          newObjective.deadline ? newObjective.deadline.toISOString() : null,
          newObjective.timeSpent,
          newObjective.completionCriteriaText === undefined ? null : newObjective.completionCriteriaText,
          newObjective.numericalTarget === undefined ? null : newObjective.numericalTarget,
          newObjective.currentNumericalProgress === undefined ? null : newObjective.currentNumericalProgress,
          newObjective.createdAt.toISOString(),
          newObjective.completedAt ? newObjective.completedAt.toISOString() : null,
          newObjective.order === undefined ? null : newObjective.order,
        ]
      );

      let currentObjectives = get().objectives;
      let objectivesToSet = [newObjective, ...currentObjectives];

      // 부모 Objective의 childObjectiveIds 업데이트
      if (newObjective.parentId) {
        const parentIdx = currentObjectives.findIndex(obj => obj.id === newObjective.parentId);
        if (parentIdx > -1) {
          const parentObjective = currentObjectives[parentIdx];
          const updatedParent: Objective = {
            ...parentObjective,
            childObjectiveIds: [...parentObjective.childObjectiveIds, newObjective.id],
          };
          // updateObjective를 직접 호출하여 DB와 스토어 모두 업데이트
          await get().updateObjective(updatedParent);
          // get().updateObjective이 스토어를 업데이트하므로, objectivesToSet을 다시 만들어야 함
          objectivesToSet = [newObjective, ...get().objectives.filter(obj => obj.id !== updatedParent.id), updatedParent];
        }
      }
      // 부모 Problem의 objectiveIds 업데이트
      const parentProblem = get().problems.find(p => p.id === newObjective.problemId);
      if (parentProblem && newObjective.parentId === null) { // 최상위 Objective일 경우에만 Problem의 objectiveIds에 추가
        const updatedProblemData: Problem = {
          ...parentProblem,
          objectiveIds: [...parentProblem.objectiveIds, newObjective.id],
        };
        await get().updateProblem(updatedProblemData); // ProblemSlice의 액션 호출
      }

      objectivesToSet = objectivesToSet.filter(obj => obj.id !== newObjective.id); // 중복 방지 후 추가
      objectivesToSet = [newObjective, ...objectivesToSet];
      objectivesToSet.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
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
    const objectiveIndex = currentObjectives.findIndex(obj => obj.id === objectiveToUpdate.id);
    if (objectiveIndex === -1) return null;

    // 전달된 objectiveToUpdate가 DB에 저장될 최종 모습
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Objectives SET problemId = ?, title = ?, description = ?, parentId = ?, childObjectiveIds = ?, blockingProblemIds = ?, 
         status = ?, deadline = ?, timeSpent = ?, completionCriteriaText = ?, numericalTarget = ?, currentNumericalProgress = ?, 
         completedAt = ?, "order" = ?
         WHERE id = ?;`, // createdAt은 업데이트하지 않음
        [
          objectiveToUpdate.problemId, objectiveToUpdate.title,
          objectiveToUpdate.description === undefined ? null : objectiveToUpdate.description,
          objectiveToUpdate.parentId === undefined ? null : objectiveToUpdate.parentId,
          JSON.stringify(objectiveToUpdate.childObjectiveIds || []),
          JSON.stringify(objectiveToUpdate.blockingProblemIds || []),
          objectiveToUpdate.status,
          objectiveToUpdate.deadline ? objectiveToUpdate.deadline.toISOString() : null,
          objectiveToUpdate.timeSpent,
          objectiveToUpdate.completionCriteriaText === undefined ? null : objectiveToUpdate.completionCriteriaText,
          objectiveToUpdate.numericalTarget === undefined ? null : objectiveToUpdate.numericalTarget,
          objectiveToUpdate.currentNumericalProgress === undefined ? null : objectiveToUpdate.currentNumericalProgress,
          objectiveToUpdate.completedAt ? objectiveToUpdate.completedAt.toISOString() : null,
          objectiveToUpdate.order === undefined ? null : objectiveToUpdate.order,
          objectiveToUpdate.id,
        ]
      );

      const updatedObjectives = currentObjectives.map(obj => obj.id === objectiveToUpdate.id ? objectiveToUpdate : obj);
      updatedObjectives.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
      set({ objectives: updatedObjectives });
      return objectiveToUpdate;
    } catch (error) {
      console.error("[ObjectiveSlice] Error updating objective:", error);
      return null;
    }
  },

  deleteObjective: async (objectiveId) => {
    const objectivesBeforeDeletion = get().objectives;
    const objectiveToDelete = objectivesBeforeDeletion.find(obj => obj.id === objectiveId);
    if (!objectiveToDelete) return false;

    const parentObjectiveInstance = objectiveToDelete.parentId
      ? objectivesBeforeDeletion.find(p => p.id === objectiveToDelete.parentId)
      : null;
    const parentProblemInstance = get().problems.find(p => p.id === objectiveToDelete.problemId);

    try {
      const db = await getDatabase();
      // 1. 부모 Objective의 childObjectiveIds 업데이트 (DB 및 로컬)
      if (parentObjectiveInstance) {
        const updatedParent: Objective = {
          ...parentObjectiveInstance,
          childObjectiveIds: parentObjectiveInstance.childObjectiveIds.filter(id => id !== objectiveId),
        };
        await get().updateObjective(updatedParent);
      }
      // 2. 부모 Problem의 objectiveIds 업데이트 (DB 및 로컬, 만약 최상위 Objective였다면)
      else if (parentProblemInstance) { // 최상위 Objective (parentId가 null) 삭제 시
        const updatedProblem: Problem = {
          ...parentProblemInstance,
          objectiveIds: parentProblemInstance.objectiveIds.filter(id => id !== objectiveId),
        };
        await get().updateProblem(updatedProblem);
      }

      // 3. Objective 및 하위 Objective들 삭제 (DB) - CASCADE로 처리됨
      // Objective 삭제 시 blockingProblemIds에 연결된 Problem은 DB에서 자동으로 삭제되지 않음. 별도 처리 필요.
      // Objective에 연결된 WorkSession도 DB에서 CASCADE로 삭제되도록 스키마 수정 필요.
      await db.runAsync(`DELETE FROM Objectives WHERE id = ?;`, [objectiveId]);

      // 4. 로컬 상태에서 Objective 및 모든 하위 Objective, 그리고 이들이 blockingProblemIds로 가졌던 Problem들도 정리 필요.
      // 이 부분은 복잡하므로, fetchObjectives를 다시 호출하여 동기화하는 것이 MVP에서는 더 간단할 수 있음.
      // 여기서는 일단 간단히 삭제된 Objective와 그 직계 자식들 정도만 정리 시도.
      // 더 정확한 하위 Objective 제거 로직은 deleteProblem의 getAllDescendantObjectiveIds 참고.
      // 지금은 fetchObjectives를 호출하여 갱신하는 것을 권장.
      set(state => ({
        objectives: state.objectives.filter(obj => obj.id !== objectiveId && obj.parentId !== objectiveId) // 매우 단순화된 로컬 정리
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime()),
      }));
      // 연결된 blockingProblemIds에 해당하는 Problem들도 삭제 또는 상태 변경 로직 필요 (추후)
      // 이 Objective를 fulfillingProjectId로 가졌던 Problem이 있다면 해당 Problem 업데이트 (이 구조에서는 없음)

      // 데이터 정합성을 위해 관련된 목록들을 다시 fetch 하는 것을 고려
      if (parentProblemInstance) await get().fetchObjectives({ problemId: parentProblemInstance.id, parentObjectiveId: null });
      else if (objectiveToDelete.parentId) await get().fetchObjectives({ problemId: objectiveToDelete.problemId, parentObjectiveId: objectiveToDelete.parentId });
      else await get().fetchObjectives({ problemId: objectiveToDelete.problemId, parentObjectiveId: null });


      console.log("[ObjectiveSlice] Objective deleted and related data cleaned:", objectiveId);
      return true;
    } catch (error) {
      console.error("[ObjectiveSlice] Error deleting objective:", error);
      return false;
    }
  },

  getObjectiveById: (id: string) => {
    return get().objectives.find(obj => obj.id === id);
  },
});