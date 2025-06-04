// ProblemList.tsx
import React, { useEffect } from "react"; // Added useEffect
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Problem } from "@/types";
import { useAppStore } from "@/store/store"; // Ensure this path is correct for your store

export default function ProblemList() {
  // Get problems and the fetch action from your Zustand store
  const problems = useAppStore((state) => state.problems);
  const fetchProblems = useAppStore((state) => state.fetchProblems);
  // const isLoadingProblems = useAppStore((state) => state.isLoadingProblems); // Optional for loading state

  useEffect(() => {
    // Fetch problems when the component mounts
    fetchProblems();
  }, [fetchProblems]); // Dependency array ensures this runs when fetchProblems reference changes (typically once)

  const handleAddProblem = () => {
    // Navigate to the add problem screen
    router.push("/problem"); // Navigates to app/problem/index.tsx (or app/problem.tsx)
  };

  const handleProblemPress = (problem: Problem) => {
    // Navigate to the problem details screen using the type-safe object syntax
    router.push({
      pathname: "/problem/[problemId]", // Navigates to app/problem/[problemId].tsx
      params: { problemId: problem.id },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Problems</Text>

      {/* Optional: Loading state display
      {isLoadingProblems && problems.length === 0 && (
        <Text style={styles.loadingText}>Loading problems...</Text>
      )}
      */}

      <FlatList
        data={problems} // Use problems from the store
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProblemPress(item)}
            style={styles.listItem}
          >
            <Text style={styles.listItemText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          // Enhanced empty component message
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No problems yet.</Text>
            <Text style={styles.emptySubText}>
              Tap "Add Problem" to create your first one!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
        scrollEnabled={false} // Scrolling disabled as requested for parent ScrollView
      />

      <TouchableOpacity onPress={handleAddProblem} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Problem</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Removed flex: 1 as it might be better for parent ScrollView to manage height
    padding: 16,
    backgroundColor: "#fff", // Or 'transparent' if parent has background
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  listItemText: {
    fontSize: 18,
  },
  loadingText: {
    // Optional style for loading
    textAlign: "center",
    fontSize: 16,
    paddingVertical: 20,
    color: "#555",
  },
  emptyContainer: {
    // Styles for the enhanced empty component
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: "#777",
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
