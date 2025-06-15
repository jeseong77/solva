import { Problem, StarReport } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppStore } from "@/store/store";

// 컴포넌트가 받을 Props 정의
interface StarReportListItemProps {
  report: StarReport;
  onPress: (reportId: string) => void;
}

export default function StarReportListItem({
  report,
  onPress,
}: StarReportListItemProps) {
  // 스토어에서 problemId를 이용해 해당 문제의 제목을 가져옵니다.
  const problemTitle = useAppStore(
    (state) => state.getProblemById(report.problemId)?.title
  );

  // 리포트 생성일 포맷팅
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(report.createdAt));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(report.id)}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {problemTitle || "삭제된 문제"}
        </Text>
        <Text style={styles.dateText}>{formattedDate} 작성</Text>
      </View>
      <Feather name="chevron-right" size={22} color="#adb5bd" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: "#868e96",
  },
});
