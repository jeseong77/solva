// components/problem/ResolvedProblemList.tsx

import { Objective, Problem, ProblemStatus } from "@/types";
import { Feather } from "@expo/vector-icons";
// REMOVED: useRouter is no longer needed in this component
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- ResolvedProblemItem (Child Component) ---
const ResolvedProblemItem = ({
  problem,
  onPress,
}: {
  problem: Problem;
  onPress: (problemId: string) => void;
  // REMOVED: onPressReport prop is no longer needed
}) => {
  const statusInfo = {
    resolved: {
      name: "Resolved",
      icon: "check-circle" as const,
      color: "#1971c2",
      backgroundColor: "#e7f5ff",
    },
    archived: {
      name: "Archived",
      icon: "archive" as const,
      color: "#495057",
      backgroundColor: "#f1f3f5",
    },
  };

  if (problem.status !== "resolved" && problem.status !== "archived") {
    return null;
  }
  const currentStatus = statusInfo[problem.status];
  const date =
    problem.status === "resolved" ? problem.resolvedAt : problem.archivedAt;

  const formattedDate = date
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(new Date(date))
    : "";

  return (
    // FIX: The entire item is now a single touchable area again.
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(problem.id)}
      activeOpacity={0.7}
    >
      <View style={styles.titleDateContainer}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {problem.title}
        </Text>
        <Text style={styles.itemDate}>{formattedDate}</Text>
      </View>

      <View
        style={[
          styles.statusChip,
          { backgroundColor: currentStatus.backgroundColor },
        ]}
      >
        <Feather
          name={currentStatus.icon}
          size={14}
          color={currentStatus.color}
        />
        <Text style={[styles.statusChipText, { color: currentStatus.color }]}>
          {currentStatus.name}
        </Text>
      </View>
    </TouchableOpacity>
    // REMOVED: The entire JSX block for the report button has been deleted.
  );
};

// --- ResolvedProblemList (Parent Component) ---
export default function ResolvedProblemList({
  problems,
  onPressProblem,
}: {
  problems: Problem[];
  // REMOVED: The objective prop was unused and has been removed for cleanup
  onPressProblem: (problemId: string) => void;
}) {
  // REMOVED: useRouter and handlePressReport are no longer needed here.

  const Separator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>해결된 문제들</Text>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={problems}
          renderItem={({ item }) => (
            <ResolvedProblemItem
              problem={item}
              onPress={onPressProblem}
              // REMOVED: The onPressReport prop is no longer passed
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={Separator}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16, paddingBottom: 24, marginHorizontal: 16 },
  listContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  titleContainer: { paddingBottom: 12 },
  titleText: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  separator: { height: 1, backgroundColor: "#f1f3f5" },

  // --- ResolvedProblemItem styles ---
  // FIX: Reverted to a simpler, single-line layout
  itemContainer: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // REMOVED: mainContent style is merged into itemContainer
  titleDateContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: "#868e96",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusChipText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "bold",
  },
});
