// components/problem/ResolvedProblemList.tsx

import { Objective, Problem, ProblemStatus } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  onPressReport,
}: {
  problem: Problem;
  onPress: (problemId: string) => void;
  onPressReport: (reportId: string) => void;
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
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={() => onPress(problem.id)}
        activeOpacity={0.7}
      >
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
        <Text style={styles.itemTitle} numberOfLines={1}>
          {problem.title}
        </Text>
        <Text style={styles.itemDate}>{formattedDate}</Text>
      </TouchableOpacity>

      {problem.status === "resolved" && problem.starReportId && (
        <>
          {/* ADD: New short, indented separator view */}
          <View style={styles.internalSeparator} />
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => onPressReport(problem.starReportId as string)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="star" size={16} color="#495057" />
              <Text style={styles.reportButtonText}>리포트</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#adb5bd" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// --- ResolvedProblemList (Parent Component) ---
export default function ResolvedProblemList({
  problems,
  onPressProblem,
}: {
  problems: Problem[];
  objective: Objective;
  onPressProblem: (problemId: string) => void;
}) {
  const router = useRouter();

  const handlePressReport = (reportId: string) => {
    router.push(`/report/${reportId}`);
  };

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
              onPressReport={handlePressReport}
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
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  titleContainer: { paddingBottom: 12 },
  titleText: { fontSize: 18, fontWeight: "bold", color: "#212529" },

  // FIX: This separator between items is now full-width (no margin).
  separator: {
    height: 1,
    backgroundColor: "#f1f3f5",
  },

  // --- ResolvedProblemItem styles ---
  itemContainer: {
    // FIX: Set background to white to match the report button area
    backgroundColor: "#ffffff",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  itemTitle: { flex: 1, fontSize: 15, color: "#495057", marginLeft: 12 },
  itemDate: { fontSize: 13, color: "#adb5bd", fontVariant: ["tabular-nums"] },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusChipText: { marginLeft: 5, fontSize: 12, fontWeight: "bold" },

  // ADD: New style for the short separator WITHIN an item
  internalSeparator: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginHorizontal: 78, // This creates the shorter, indented look
  },

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // FIX: Set background to white and remove border
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginLeft: 10,
  },
});
