import { StateCreator } from 'zustand';
import { Objective, ObjectiveStatus, Project } from '@/types'; // Project는 부모/자식 업데이트 시 필요
import type { AppState, ObjectiveSlice as ObjectiveSliceInterface } from '@/types/storeTypes'; // storeTypes.ts의 ObjectiveSlice 인터페이스를 사용
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const parseObjectiveFromDB = (dbItem: any): Objective => ({
  id: dbItem.id,
  title: dbItem.title,
  description: dbItem.description === null ? undefined : dbItem.description,
  isBottleneck: !!dbItem.isBottleneck,
  bottleneckAnalysis: dbItem.bottleneckAnalysis ? JSON.parse(dbItem.bottleneckAnalysis) : undefined,
  parentId: dbItem.parentId === null ? undefined : dbItem.parentId,
  childObjectiveIds: dbItem.childObjectiveIds ? JSON.parse(dbItem.childObjectiveIds) : [],
  status: dbItem.status as ObjectiveStatus,
  deadline: dbItem.deadline ? new Date(dbItem.deadline) : undefined,
  isFeatured: !!dbItem.isFeatured,
  fulfillingProjectId: dbItem.fulfillingProjectId === null ? undefined : dbItem.fulfillingProjectId,
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
  order: dbItem.order === null ? undefined : dbItem.order,
});

export const createObjectiveSlice: StateCreator<AppState, [], [], ObjectiveSliceInterface> = (set, get) => ({
  objectives: [],
  isLoadingObjectives: false,

  fetchObjectives: async (parentId?: string | null) => {
    set({ isLoadingObjectives: true });
    try {
      const db = await getDatabase();
      let query = "SELECT * FROM Objectives";
      const params: (string | null)[] = [];

      if (parentId !== undefined) {
        query += " WHERE parentId " + (parentId === null ? "IS NULL" : "= ?");
        if (parentId !== null) {
          params.push(parentId);
        }
      }
      query += " ORDER BY \"order\" ASC, createdAt ASC;";
      
      const results = await db.getAllAsync<any>(query, params);
      const fetchedObjectives = results.map(parseObjectiveFromDB);
      
      if (parentId !== undefined) {
        const otherObjectives = get().objectives.filter(obj => obj.parentId !== parentId);
        const newObjectiveList = [...otherObjectives, ...fetchedObjectives]
            .sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
        set({ objectives: newObjectiveList, isLoadingObjectives: false });
      } else {
        set({ objectives: fetchedObjectives, isLoadingObjectives: false });
      }
      // console.log(`[ObjectiveSlice] Objectives fetched ${parentId !== undefined ? `for parent ${parentId}` : '(all)'}:`, fetchedObjectives.length);
    } catch (error) {
      console.error("[ObjectiveSlice] Error fetching objectives:", error);
      set({ isLoadingObjectives: false });
    }
  },

  addObjective: async (objectiveData) => {
    const newObjective: Objective = {
      id: uuidv4(),
      title: objectiveData.title,
      description: objectiveData.description,
      isBottleneck: objectiveData.isBottleneck || false,
      bottleneckAnalysis: objectiveData.bottleneckAnalysis,
      parentId: objectiveData.parentId || null,
      childObjectiveIds: [],
      status: objectiveData.status || "pending",
      deadline: objectiveData.deadline,
      isFeatured: objectiveData.isFeatured || false,
      fulfillingProjectId: null, // 새 Objective 생성 시 이 필드는 null 또는 undefined로 시작
      timeSpent: 0,
      createdAt: new Date(),
      completedAt: undefined,
      order: objectiveData.order,
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Objectives (id, title, description, isBottleneck, bottleneckAnalysis, parentId, childObjectiveIds, status, deadline, isFeatured, fulfillingProjectId, timeSpent, createdAt, completedAt, "order")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newObjective.id, newObjective.title,
          newObjective.description === undefined ? null : newObjective.description,
          newObjective.isBottleneck ? 1 : 0,
          newObjective.bottleneckAnalysis ? JSON.stringify(newObjective.bottleneckAnalysis) : null,
          newObjective.parentId, 
          JSON.stringify(newObjective.childObjectiveIds),
          newObjective.status,
          newObjective.deadline ? newObjective.deadline.toISOString() : null,
          newObjective.isFeatured ? 1 : 0,
          newObjective.fulfillingProjectId === undefined ? null : newObjective.fulfillingProjectId, // 명시적 변환
          newObjective.timeSpent,
          newObjective.createdAt.toISOString(),
          newObjective.completedAt ? newObjective.completedAt.toISOString() : null,
          newObjective.order === undefined ? null : newObjective.order,
        ]
      );
      
      let currentObjectives = get().objectives;
      let objectivesToSet = [newObjective, ...currentObjectives];

      if (newObjective.parentId) {
        const parentIndex = currentObjectives.findIndex(obj => obj.id === newObjective.parentId);
        if (parentIndex > -1) {
          const parentObjective = currentObjectives[parentIndex];
          const updatedParent: Objective = {
            ...parentObjective,
            childObjectiveIds: [...parentObjective.childObjectiveIds, newObjective.id],
          };
          // 부모의 DB 업데이트는 updateObjective 액션을 통해 일관되게 처리
          await get().updateObjective(updatedParent); // 스토어의 updateObjective 사용
          // updateObjective가 로컬 상태도 업데이트하므로, 여기서 다시 map 할 필요 없이 최신 상태를 가져와 newObjective 추가
          objectivesToSet = [newObjective, ...get().objectives.filter(obj => obj.id !== updatedParent.id), updatedParent];
        } else {
            console.warn(`[ObjectiveSlice] Parent objective with ID ${newObjective.parentId} not found.`);
        }
      }
      objectivesToSet.sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
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
    if (objectiveIndex === -1) {
      console.error("[ObjectiveSlice] Objective not found for update:", objectiveToUpdate.id);
      return null;
    }
    // 전달받은 objectiveToUpdate가 DB에 저장될 최종 모습이라고 가정
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Objectives SET title = ?, description = ?, isBottleneck = ?, bottleneckAnalysis = ?, parentId = ?, childObjectiveIds = ?, status = ?, deadline = ?, isFeatured = ?, fulfillingProjectId = ?, timeSpent = ?, completedAt = ?, "order" = ?
         WHERE id = ?;`,
        [
          objectiveToUpdate.title,
          objectiveToUpdate.description === undefined ? null : objectiveToUpdate.description,
          objectiveToUpdate.isBottleneck ? 1 : 0,
          objectiveToUpdate.bottleneckAnalysis ? JSON.stringify(objectiveToUpdate.bottleneckAnalysis) : null,
          objectiveToUpdate.parentId === undefined ? null : objectiveToUpdate.parentId,
          JSON.stringify(objectiveToUpdate.childObjectiveIds || []),
          objectiveToUpdate.status,
          objectiveToUpdate.deadline ? objectiveToUpdate.deadline.toISOString() : null,
          objectiveToUpdate.isFeatured ? 1 : 0,
          objectiveToUpdate.fulfillingProjectId === undefined ? null : objectiveToUpdate.fulfillingProjectId,
          objectiveToUpdate.timeSpent,
          objectiveToUpdate.completedAt ? objectiveToUpdate.completedAt.toISOString() : null,
          objectiveToUpdate.order === undefined ? null : objectiveToUpdate.order,
          objectiveToUpdate.id,
        ]
      );
      
      const updatedObjectives = currentObjectives.map(obj => obj.id === objectiveToUpdate.id ? objectiveToUpdate : obj);
      updatedObjectives.sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime());
      set({ objectives: updatedObjectives });
      console.log("[ObjectiveSlice] Objective updated:", objectiveToUpdate.title);
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

    try {
      const db = await getDatabase();
      if (parentObjectiveInstance) {
        const updatedParent: Objective = {
            ...parentObjectiveInstance,
            childObjectiveIds: parentObjectiveInstance.childObjectiveIds.filter(id => id !== objectiveId),
        };
        await get().updateObjective(updatedParent); // 스토어의 updateObjective 사용
      }
      await db.runAsync(`DELETE FROM Objectives WHERE id = ?;`, [objectiveId]);
      
      const Rget = get;
      function getAllDescendantObjectiveIds(objId: string, allObjs: Objective[]): string[] {
        const directChildren = allObjs.filter(o => o.parentId === objId);
        let allDescendants = directChildren.map(c => c.id);
        directChildren.forEach(child => {
          allDescendants = [...allDescendants, ...getAllDescendantObjectiveIds(child.id, allObjs)];
        });
        return allDescendants;
      }
      const descendantIdsToDelete = getAllDescendantObjectiveIds(objectiveId, objectivesBeforeDeletion);
      const allObjectiveIdsToDelete = [objectiveId, ...descendantIdsToDelete];

      // 로컬 상태에서 Objective 및 연관된 Project, Task, Rule, StarReport 제거
      const projectsOfDeletedObjectives = get().projects.filter(proj => allObjectiveIdsToDelete.includes(proj.objectiveId));
      const projectIdsToDelete = projectsOfDeletedObjectives.map(p => p.id);

      set(state => ({
        objectives: state.objectives.filter(obj => !allObjectiveIdsToDelete.includes(obj.id))
            .sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime()),
        projects: state.projects.filter(proj => !allObjectiveIdsToDelete.includes(proj.objectiveId)),
        tasks: state.tasks.filter(t => !projectIdsToDelete.includes(t.projectId)),
        rules: state.rules.filter(r => !projectIdsToDelete.includes(r.projectId)),
        starReports: state.starReports.filter(sr => !allObjectiveIdsToDelete.includes(sr.objectiveId)),
      }));
      console.log("[ObjectiveSlice] Objective and descendant data cleaned from local store:", objectiveId);
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