// app/ProjectEditorScreen.tsx
import RuleList from '@/components/RuleList';
import TaskList from '@/components/TaskList'; // TaskList import 추가
import { useAppStore } from '@/store/store';
import { Problem, Project } from '@/types'; // Task 타입 import 확인
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';

export default function ProjectEditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ problemId?: string; projectId?: string }>();
    const problemIdFromParams = params.problemId;
    const projectIdToEdit = params.projectId;

    const {
        getProblemById,
        getProjectById,
        addProject,
        updateProject,
        allDoItems,
        fetchDoItems,
        isLoadingDoItems,
        allDontItems,
        fetchDontItems,
        isLoadingDontItems,
        allTasks,         // Task 관련 상태 및 액션 추가
        fetchTasks,       // Task 관련 상태 및 액션 추가
        isLoadingTasks,   // Task 관련 상태 및 액션 추가
    } = useAppStore(
        useShallow((state) => ({
            getProblemById: state.getProblemById,
            getProjectById: state.getProjectById,
            addProject: state.addProject,
            updateProject: state.updateProject,
            allDoItems: state.doItems,
            fetchDoItems: state.fetchDoItems,
            isLoadingDoItems: state.isLoadingDoItems,
            allDontItems: state.dontItems,
            fetchDontItems: state.fetchDontItems,
            isLoadingDontItems: state.isLoadingDontItems,
            allTasks: state.tasks, // 스토어에서 tasks 가져오기
            fetchTasks: state.fetchTasks, // 스토어에서 fetchTasks 가져오기
            isLoadingTasks: state.isLoadingTasks, // 스토어에서 isLoadingTasks 가져오기
        }))
    );

    const [linkedProblem, setLinkedProblem] = useState<Problem | null | undefined>(undefined);
    const [currentProject, setCurrentProject] = useState<Project | null | undefined>(undefined);
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(() => {
        setIsLoading(true);
        let problemForProject: Problem | undefined | null = null;
        let projectToLoad: Project | undefined | null = null;
        let titleForHeader = "";

        if (projectIdToEdit) {
            projectToLoad = getProjectById(projectIdToEdit);
            if (projectToLoad) {
                problemForProject = getProblemById(projectToLoad.problemId);
                titleForHeader = projectToLoad.title || `Edit Project`;
                setProjectTitle(projectToLoad.title);
                setCurrentProject(projectToLoad);
                fetchDoItems(projectToLoad.id);
                fetchDontItems(projectToLoad.id);
                fetchTasks(projectToLoad.id); // Tasks도 로드
            } else {
                Alert.alert("Error", "Project not found.");
                titleForHeader = "Error";
            }
        } else if (problemIdFromParams) {
            problemForProject = getProblemById(problemIdFromParams);
            titleForHeader = `New Project for "${problemForProject?.title || 'Problem'}"`;
            setProjectTitle(titleForHeader);
            setCurrentProject(null);
        } else {
            Alert.alert("Error", "No Problem ID or Project ID provided.");
            titleForHeader = "Error";
        }

        setLinkedProblem(problemForProject || null);
        setIsLoading(false);
    }, [projectIdToEdit, problemIdFromParams, getProblemById, getProjectById, fetchDoItems, fetchDontItems, fetchTasks]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const projectSpecificDoItems = useMemo(() => {
        return currentProject?.id ? allDoItems.filter(di => di.projectId === currentProject.id) : [];
    }, [currentProject, allDoItems]);

    const projectSpecificDontItems = useMemo(() => {
        return currentProject?.id ? allDontItems.filter(di => di.projectId === currentProject.id) : [];
    }, [currentProject, allDontItems]);

    const projectSpecificTasks = useMemo(() => { // Tasks 필터링 추가
        return currentProject?.id ? allTasks.filter(task => task.projectId === currentProject.id) : [];
    }, [currentProject, allTasks]);


    const handleAddRule = () => {
        const targetProjectId = currentProject?.id;
        if (targetProjectId) {
            Alert.alert("Add Rule", `Maps to Rule Editor for Project: ${targetProjectId}`);
        } else {
            Alert.alert("Info", "Please save the project first to add rules.");
        }
    };
    const handleEditDoItem = (doItemId: string) => { Alert.alert("Edit Do Rule", `Maps to Edit Do Rule: ${doItemId}`); };
    const handleEditDontItem = (dontItemId: string) => { Alert.alert("Edit Don't Rule", `Maps to Edit Don't Rule: ${dontItemId}`); };

    const handleAddTask = () => { // Task 추가 핸들러
        const targetProjectId = currentProject?.id;
        if (targetProjectId) {
            Alert.alert("Add Task", `Maps to Task Editor for Project: ${targetProjectId}`);
            // router.push({ pathname: "/TaskEditorScreen", params: { projectId: targetProjectId } });
        } else {
            Alert.alert("Info", "Please save the project first to add tasks.");
        }
    };
    const handleEditTask = (taskId: string) => { // Task 편집 핸들러
        Alert.alert("Edit Task", `Maps to Edit Task: ${taskId}`);
        // router.push({ pathname: "/TaskEditorScreen", params: { taskId: taskId } });
    };
    // onDeleteDoItem, onDeleteDontItem, onDeleteTask 핸들러는 필요시 추가


    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: "Loading Project..." }} />
                <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" /></View>
            </SafeAreaView>
        );
    }

    if ((!currentProject && !problemIdFromParams) || (!linkedProblem && problemIdFromParams && !projectIdToEdit)) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: "Error" }} />
                <View style={styles.content}><Text style={styles.infoText}>Could not load project or linked problem data.</Text></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: projectTitle || (projectIdToEdit ? "Edit Project" : "New Project"),
                    headerRight: () => (
                        <TouchableOpacity onPress={() => Alert.alert("More Options", "More options here.")} style={{ marginRight: 16 }}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView style={styles.scrollViewContainer}>
                <View style={styles.content}>
                    {linkedProblem && (
                        <View style={styles.linkedProblemInfoContainer}>
                            <Text style={styles.linkedProblemLabel}>Linked Problem:</Text>
                            <Text style={styles.linkedProblemTitle} numberOfLines={1} ellipsizeMode="tail">
                                {linkedProblem.title}
                            </Text>
                        </View>
                    )}

                    <TextInput
                        style={styles.projectTitleInput}
                        value={projectTitle}
                        onChangeText={setProjectTitle}
                        placeholder="Enter Project Title"
                    />

                    <View style={styles.sectionContainer}>
                        {(currentProject?.id || problemIdFromParams) ? (
                            <RuleList
                                doItems={projectSpecificDoItems}
                                dontItems={projectSpecificDontItems}
                                onPressDoItem={handleEditDoItem}
                                onPressDontItem={handleEditDontItem}
                                onPressAddRule={handleAddRule}
                            />
                        ) : (
                            <Text style={styles.infoText}>Save the project to add rules.</Text>
                        )}
                    </View>

                    <View style={styles.placeholderSection}>
                        <Text style={styles.placeholderText}>Project Description, Criteria, Target fields will be here.</Text>
                    </View>
                    <View style={styles.sectionContainer}>
                        {(currentProject?.id || problemIdFromParams) ? (
                            <TaskList
                                tasks={projectSpecificTasks}
                                onPressTaskItem={handleEditTask}
                                onPressAddTask={handleAddTask}
                            />
                        ) : (
                            <Text style={styles.infoText}>Save the project to add tasks.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// 스타일 정의는 이전과 동일
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    scrollViewContainer: { flex: 1 },
    content: { flex: 1, padding: 16 },
    centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    linkedProblemInfoContainer: { padding: 12, backgroundColor: "#e9ecef", borderRadius: 8, marginBottom: 16 },
    linkedProblemLabel: { fontSize: 13, color: "#495057", marginBottom: 4, fontWeight: '500' },
    linkedProblemTitle: { fontSize: 16, color: "#212529", fontWeight: 'bold' },
    projectTitleInput: {
        fontSize: 22, fontWeight: 'bold', paddingVertical: 10, paddingHorizontal: 10,
        borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, marginBottom: 16, backgroundColor: '#fff'
    },
    sectionContainer: {
        backgroundColor: '#ffffff', borderRadius: 8,
        // padding: 16, // RuleList/TaskList가 자체 패딩을 가짐
        marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6'
    },
    infoText: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginVertical: 20 },
    placeholderSection: {
        padding: 16, backgroundColor: "#ffffff", borderRadius: 8,
        marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6',
        alignItems: 'center', justifyContent: 'center',
    },
    placeholderText: { fontSize: 14, color: '#6c757d', fontStyle: 'italic' }
});