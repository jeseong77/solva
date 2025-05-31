// ProjectEditor.Screen.tsx
import RuleList from '@/components/RuleList';
import TaskList from '@/components/TaskList';
import { useAppStore } from '@/store/store';
import { Problem, Project } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { styles } from './ProjectEditor.Style'; // 스타일 import

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
        allTasks,
        fetchTasks,
        isLoadingTasks,
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
            allTasks: state.tasks,
            fetchTasks: state.fetchTasks,
            isLoadingTasks: state.isLoadingTasks,
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
                fetchTasks(projectToLoad.id);
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

    const projectSpecificTasks = useMemo(() => {
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

    const handleAddTask = () => {
        const targetProjectId = currentProject?.id;
        if (targetProjectId) {
            Alert.alert("Add Task", `Maps to Task Editor for Project: ${targetProjectId}`);
            // router.push({ pathname: "/TaskEditorScreen", params: { projectId: targetProjectId } });
        } else {
            Alert.alert("Info", "Please save the project first to add tasks.");
        }
    };
    const handleEditTask = (taskId: string) => {
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
                        {(currentProject?.id || problemIdFromParams) ? ( // 프로젝트가 저장되었거나, 생성 중인 상태(problemIdFromParams가 있을 때)
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