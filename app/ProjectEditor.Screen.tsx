// ProjectEditor.Screen.tsx
import RuleList from "@/components/RuleList";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/store/store";
import { Problem, Project } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router"; // Added useFocusEffect
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"; // Added useRef
import {
  ActivityIndicator,
  Alert,
  Platform, // Added Platform for headerRight spacing
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { styles } from "@/styles/ProjectEditor.Style";

export default function ProjectEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    problemId?: string;
    projectId?: string;
  }>();
  const problemIdFromParams = params.problemId;
  const projectIdToEdit = params.projectId;

  const {
    getProblemById,
    getProjectById,
    addProject,
    updateProject,
    allDoItems,
    fetchDoItems,
    // isLoadingDoItems, // Removed as per instruction (not in original RuleList use)
    allDontItems,
    fetchDontItems,
    // isLoadingDontItems, // Removed
    allTasks,
    fetchTasks,
    // isLoadingTasks, // Removed
  } = useAppStore(
    useShallow((state) => ({
      getProblemById: state.getProblemById,
      getProjectById: state.getProjectById,
      addProject: state.addProject,
      updateProject: state.updateProject,
      allDoItems: state.doItems,
      fetchDoItems: state.fetchDoItems,
      // isLoadingDoItems: state.isLoadingDoItems,
      allDontItems: state.dontItems,
      fetchDontItems: state.fetchDontItems,
      // isLoadingDontItems: state.isLoadingDontItems,
      allTasks: state.tasks,
      fetchTasks: state.fetchTasks,
      // isLoadingTasks: state.isLoadingTasks,
    }))
  );

  const [linkedProblem, setLinkedProblem] = useState<
    Problem | null | undefined
  >(undefined);
  const [currentProject, setCurrentProject] = useState<
    Project | null | undefined
  >(undefined);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedChanges = useRef(false);
  const isEditingInitially = !!params.projectId;

  const loadData = useCallback(() => {
    setIsLoading(true);
    let problemForProject: Problem | undefined | null = null;
    let projectToLoad: Project | undefined | null = null;

    if (projectIdToEdit) {
      projectToLoad = getProjectById(projectIdToEdit);
      if (projectToLoad) {
        problemForProject = getProblemById(projectToLoad.problemId);
        setProjectTitle(projectToLoad.title);
        setCurrentProject(projectToLoad);
        fetchDoItems(projectToLoad.id);
        fetchDontItems(projectToLoad.id);
        fetchTasks(projectToLoad.id);
      } else {
        Alert.alert("Error", "Project not found.");
        setProjectTitle("Error: Project Not Found");
        setCurrentProject(null);
      }
    } else if (problemIdFromParams) {
      problemForProject = getProblemById(problemIdFromParams);
      if (problemForProject) {
        setProjectTitle(""); // Changed: Set to blank value
      } else {
        Alert.alert(
          "Error",
          "Associated problem not found. Cannot create new project."
        );
        setProjectTitle("Error: Linked Problem Not Found");
      }
      setCurrentProject(null);
    } else {
      Alert.alert("Error", "No Problem ID or Project ID provided.");
      setProjectTitle("Error: Invalid Parameters");
      setCurrentProject(null);
    }

    setLinkedProblem(problemForProject || null);
    setIsLoading(false);
    hasUnsavedChanges.current = false;
  }, [
    projectIdToEdit,
    problemIdFromParams,
    getProblemById,
    getProjectById,
    fetchDoItems,
    fetchDontItems,
    fetchTasks,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(); // Reload data on focus, as in reference
      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [loadData])
  );

  const autoSaveProject = useCallback(
    async (newTitle: string): Promise<Project | null> => {
      const trimmedTitle = newTitle.trim();

      if (!currentProject?.id && !trimmedTitle && problemIdFromParams) {
        setIsSaving(false);
        return null;
      }
      if (currentProject?.id && !trimmedTitle) {
        Alert.alert("Info", "Project title cannot be empty.");
        setProjectTitle(currentProject.title);
        setIsSaving(false);
        return null;
      }

      setIsSaving(true);
      hasUnsavedChanges.current = false;
      let resultProject: Project | null = null;

      if (currentProject?.id) {
        if (trimmedTitle === currentProject.title) {
          setIsSaving(false);
          return currentProject;
        }
        const projectToUpdate: Project = {
          ...currentProject,
          title: trimmedTitle,
        };
        resultProject = await updateProject(projectToUpdate);
        if (resultProject) {
          setCurrentProject(resultProject);
        } else {
          hasUnsavedChanges.current = true;
          Alert.alert("Error", "Failed to update project.");
        }
      } else if (problemIdFromParams && linkedProblem) {
        // const defaultNewTitle = `New Project for "${linkedProblem.title}"`; // This check might need adjustment if title starts blank
        // if (trimmedTitle === defaultNewTitle && !hasUnsavedChanges.current && !isEditingInitially) {
        // setIsSaving(false);
        // return null;
        // }
        // If initial title is blank, any non-blank title for a new project should trigger a save.
        if (
          !trimmedTitle &&
          !hasUnsavedChanges.current &&
          !isEditingInitially
        ) {
          // If title is still blank and no other changes, don't auto-save yet.
          setIsSaving(false);
          return null;
        }
        const projectData = {
          problemId: problemIdFromParams,
          title: trimmedTitle,
        };
        resultProject = await addProject(projectData);
        if (resultProject) {
          setCurrentProject(resultProject);
          setProjectTitle(resultProject.title); // Ensure UI reflects the saved title
          fetchDoItems(resultProject.id);
          fetchDontItems(resultProject.id);
          fetchTasks(resultProject.id);
        } else {
          hasUnsavedChanges.current = true;
          Alert.alert("Error", "Failed to create project.");
        }
      } else if (!linkedProblem && problemIdFromParams) {
        Alert.alert(
          "Error",
          "Cannot save project: Linked problem data is missing."
        );
        hasUnsavedChanges.current = true;
      }
      setIsSaving(false);
      return resultProject;
    },
    [
      currentProject,
      problemIdFromParams,
      linkedProblem,
      addProject,
      updateProject,
      fetchDoItems,
      fetchDontItems,
      fetchTasks,
      isEditingInitially,
    ]
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isEditingInitially && problemIdFromParams && !linkedProblem) {
      return;
    }

    // For new projects, if the title is still blank (its initial state) and no other changes indicated, don't trigger auto-save.
    if (
      !currentProject?.id &&
      !projectTitle.trim() &&
      !hasUnsavedChanges.current &&
      !isEditingInitially
    ) {
      return;
    }

    // If editing existing project and title is cleared, don't auto-save to an empty title.
    if (currentProject?.id && !projectTitle.trim()) {
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const titleChangedFromPersisted =
        projectTitle.trim() !== (currentProject?.title || "");
      const shouldSaveExisting =
        currentProject?.id &&
        (hasUnsavedChanges.current || titleChangedFromPersisted);

      let shouldSaveNew = false;
      if (!currentProject?.id && problemIdFromParams && linkedProblem) {
        // For new projects, save if the title is no longer blank or other changes have occurred.
        if (projectTitle.trim() || hasUnsavedChanges.current) {
          shouldSaveNew = true;
        }
      }

      if (shouldSaveExisting || shouldSaveNew) {
        autoSaveProject(projectTitle);
      }
    }, 1200);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [
    projectTitle,
    autoSaveProject,
    isLoading,
    currentProject,
    isEditingInitially,
    problemIdFromParams,
    linkedProblem,
  ]);

  const handleProjectTitleChange = (newText: string) => {
    setProjectTitle(newText);
    hasUnsavedChanges.current = true;
  };

  const projectSpecificDoItems = useMemo(() => {
    return currentProject?.id
      ? allDoItems.filter((di) => di.projectId === currentProject.id)
      : [];
  }, [currentProject?.id, allDoItems]);

  const projectSpecificDontItems = useMemo(() => {
    return currentProject?.id
      ? allDontItems.filter((di) => di.projectId === currentProject.id)
      : [];
  }, [currentProject?.id, allDontItems]);

  const projectSpecificTasks = useMemo(() => {
    return currentProject?.id
      ? allTasks.filter((task) => task.projectId === currentProject.id)
      : [];
  }, [currentProject?.id, allTasks]);

  const ensureProjectSaved = async (): Promise<Project | null> => {
    if (currentProject?.id) return currentProject;

    if (projectTitle.trim() && problemIdFromParams && linkedProblem) {
      if (isSaving) {
        Alert.alert(
          "Info",
          "Saving in progress. Please wait a moment and try again."
        );
        return null;
      }
      // Alert.alert("Info", "Project needs to be saved first. Attempting to save now...");
      const savedProject = await autoSaveProject(projectTitle);
      if (!savedProject?.id) {
        Alert.alert(
          "Save Failed",
          "Could not save the project. Please ensure the title is valid and try again."
        );
        return null;
      }
      return savedProject;
    } else {
      Alert.alert(
        "Info",
        "Please enter a project title. The project will be saved automatically when you type."
      );
      return null;
    }
  };

  const handleAddRule = async () => {
    const projectForAction = await ensureProjectSaved();
    if (projectForAction?.id) {
      router.push({
        pathname: "/RuleEditor.Screen",
        params: { projectId: projectForAction.id, ruleTypeInitial: "Do" },
      });
    }
  };

  const handleEditDoItem = (doItemId: string) => {
    Alert.alert("Edit Do Rule", `Maps to Edit Do Rule: ${doItemId}`);
  };
  const handleEditDontItem = (dontItemId: string) => {
    Alert.alert("Edit Don't Rule", `Maps to Edit Don't Rule: ${dontItemId}`);
  };

  const handleAddTask = async () => {
    const projectForAction = await ensureProjectSaved();
    if (projectForAction?.id) {
      Alert.alert(
        "Add Task",
        `Maps to Task Editor for Project: ${projectForAction.id}`
      );
      // router.push({ pathname: "/TaskEditorScreen", params: { projectId: projectForAction.id } });
    }
  };
  const handleEditTask = (taskId: string) => {
    Alert.alert("Edit Task", `Maps to Edit Task: ${taskId}`);
    // router.push({ pathname: "/TaskEditorScreen", params: { taskId: taskId } });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Loading Project..." }} />
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state: if we expected to load a project/problem but didn't find one (after loading is complete)
  if (
    (projectIdToEdit && !currentProject && !isLoading) ||
    (problemIdFromParams && !linkedProblem && !isLoading)
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.content}>
          <Text style={styles.infoText}>
            Could not load project or linked problem data. Please go back and
            try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getHeaderTitle = () => {
    if (isSaving) return "Saving...";
    // If it's a new project and the title is still blank (initial state), display "New Project"
    if (!isEditingInitially && !currentProject?.title && !projectTitle.trim())
      return "New Project";
    return (
      currentProject?.title ||
      projectTitle ||
      (isEditingInitially ? "Edit Project" : "New Project")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: getHeaderTitle(),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isSaving && (
                <ActivityIndicator
                  size="small"
                  color="#007AFF"
                  style={{ marginRight: 10 }}
                />
              )}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("More Options", "More options here.")
                }
                style={{ marginRight: Platform.OS === "ios" ? 0 : 16 }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled" // Added from reference for better UX with inputs
      >
        <View style={styles.content}>
          {linkedProblem && (
            <View style={styles.linkedProblemInfoContainer}>
              <Text style={styles.linkedProblemLabel}>
                This project solves the problem:
              </Text>
              <Text
                style={styles.linkedProblemTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {linkedProblem.title}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.projectTitleInput}
            value={projectTitle}
            onChangeText={handleProjectTitleChange}
            placeholder="Enter Project Title"
            placeholderTextColor="#999" // Added for consistency with reference
          />

          <View style={styles.sectionContainer}>
            {currentProject?.id || problemIdFromParams ? (
              <RuleList
                doItems={projectSpecificDoItems}
                dontItems={projectSpecificDontItems}
                onPressDoItem={handleEditDoItem}
                onPressDontItem={handleEditDontItem}
                onPressAddRule={handleAddRule}
                // No isLoading prop as it wasn't in original
              />
            ) : (
              <Text style={styles.infoText}>
                Save the project to add rules.
              </Text>
            )}
            {/* Guidance text removed as requested */}
          </View>

          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderText}>
              Project Description, Criteria, Target fields will be here.
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            {currentProject?.id || problemIdFromParams ? (
              <TaskList
                tasks={projectSpecificTasks}
                onPressTaskItem={handleEditTask}
                onPressAddTask={handleAddTask}
              />
            ) : (
              <Text style={styles.infoText}>
                Save the project to add tasks.
              </Text>
            )}
            {!currentProject?.id && problemIdFromParams && linkedProblem && (
              <Text style={styles.infoText}>
                Type a project title above. It will auto-save, enabling task
                additions.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
