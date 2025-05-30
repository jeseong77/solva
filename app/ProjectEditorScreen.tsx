// app/ProjectEditorScreen.tsx
import DoItemList from '@/components/DoItemList';
import DontItemList from '@/components/DontItemList';
import { useAppStore } from '@/store/store';
import { Problem, Project } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react'; // useMemo 추가
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
        allDontItems,
        fetchDoItems,
        isLoadingDoItems // 로딩 상태 추가
    } = useAppStore(
        useShallow((state) => ({
            getProblemById: state.getProblemById,
            getProjectById: state.getProjectById,
            addProject: state.addProject,
            updateProject: state.updateProject,
            allDoItems: state.doItems,
            allDontItems: state.dontItems,
            fetchDoItems: state.fetchDoItems,
            isLoadingDoItems: state.isLoadingDoItems, // 추가
        }))
    );

    const [linkedProblem, setLinkedProblem] = useState<Problem | null | undefined>(undefined);
    const [currentProject, setCurrentProject] = useState<Project | null | undefined>(undefined);
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true); // 화면 전체 로딩 상태

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
                fetchDoItems(projectToLoad.id); // 해당 프로젝트의 DoItem 로드
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
    }, [projectIdToEdit, problemIdFromParams, getProblemById, getProjectById, fetchDoItems]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    // useFocusEffect(useCallback(() => { loadData(); return () => {}; }, [loadData]));


    // 현재 프로젝트에 해당하는 DoItem들만 필터링
    const projectSpecificDoItems = useMemo(() => {
        if (currentProject?.id) {
            return allDoItems.filter(di => di.projectId === currentProject.id);
        }
        return [];
    }, [currentProject, allDoItems]);

    const projectSpecificDontItems = useMemo(() => {
        if (currentProject?.id) {
            return allDontItems.filter(di => di.projectId === currentProject.id);
        }
        return [];
    }
        , [currentProject, allDontItems]);


    const handleAddDoItem = (pId: string) => {
        Alert.alert("Add Do Rule", `Maps to screen for adding 'Do' rule to project: ${pId}`);
        // router.push({ pathname: "/DoItemEditorScreen", params: { projectId: pId } });
    };

    const handleEditDoItem = (doItemId: string) => {
        Alert.alert("Edit Do Rule", `Maps to screen for editing 'Do' rule: ${doItemId}`);
        // router.push({ pathname: "/DoItemEditorScreen", params: { doItemId } });
    };

    const handleDeleteDoItem = async (doItemId: string) => {
        Alert.alert("Delete Do Rule", `DoItem ${doItemId} deletion initiated (placeholder).`);
    };


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
                            <DoItemList
                                doItems={projectSpecificDoItems}
                                // 새 프로젝트이고 아직 ID가 없다면 problemIdFromParams를 사용, 아니면 currentProject.id
                                projectId={currentProject?.id || problemIdFromParams!}
                                isLoading={isLoadingDoItems}
                                onPressDoItem={handleEditDoItem}
                                onPressAddDoItem={handleAddDoItem}
                                onDeleteDoItem={handleDeleteDoItem}
                            />
                            <DontItemList
                                dontItems={projectSpecificDontItems}
                                projectId={currentProject?.id || problemIdFromParams!}
                                isLoading={isLoadingDoItems}
                                onPressDontItem={handleEditDoItem}
                                onPressAddDontItem={handleAddDoItem}
                                onDeleteDontItem={handleDeleteDoItem}
                            />
                    </View>

                    <View style={styles.placeholderSection}>
                        <Text style={styles.placeholderText}>Project Description, Criteria, Target fields will be here.</Text>
                    </View>
                    <View style={styles.placeholderSection}>
                        <Text style={styles.placeholderText}>Tasks (One-off) management will be here.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    scrollViewContainer: { flex: 1 },
    content: { flex: 1, padding: 16 },
    centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    linkedProblemInfoContainer: { padding: 12, backgroundColor: "#e9ecef", borderRadius: 8, marginBottom: 16 },
    linkedProblemLabel: { fontSize: 13, color: "#495057", marginBottom: 4, fontWeight: '500' },
    linkedProblemTitle: { fontSize: 16, color: "#212529", fontWeight: 'bold' },
    projectTitleInput: { fontSize: 22, fontWeight: 'bold', padding: 10, borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, marginBottom: 16, backgroundColor: '#fff' },
    sectionContainer: { backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6' },
    infoText: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginVertical: 20 },
    placeholderSection: { padding: 12, backgroundColor: "#ffffff", borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6' },
    placeholderText: { fontSize: 16, color: '#adb5bd', textAlign: 'center' }
});