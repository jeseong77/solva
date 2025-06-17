import { StarReport } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppStore } from "@/store/store";

interface StarReportListItemProps {
  report: StarReport;
  onPress: (reportId: string) => void;
}

export default function StarReportListItem({
  report,
  onPress,
}: StarReportListItemProps) {
  const problemTitle = useAppStore(
    (state) => state.getProblemById(report.problemId)?.title
  );
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(report.createdAt));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(report.id)}
      activeOpacity={0.6}
    >
      {/* ✅ [추가] 문서 아이콘 */}
      <Feather name="file-text" size={20} color="#555" style={styles.icon} />

      <View style={styles.contentContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {problemTitle || "삭제된 문제"}
        </Text>
        <Text style={styles.dateText}>{formattedDate} 작성</Text>
      </View>
      <Feather name="chevron-right" size={22} color="#555" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // ✅ [추가] 아이콘 스타일
  icon: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#343a40",
  },
  dateText: {
    fontSize: 13,
    color: "#868e96",
  },
});
