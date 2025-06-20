import { StarReport } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// 각 섹션의 제목과 키, 색상을 정의
const sections = [
  { key: "situation", title: "Situation (상황)", icon: "map-pin" },
  { key: "task", title: "Task (과제)", icon: "check-square" },
  { key: "action", title: "Action (행동)", icon: "tool" },
  { key: "result", title: "Result (결과)", icon: "award" },
  { key: "learnings", title: "Learnings (배운 점)", icon: "star" },
] as const;

// 컴포넌트가 받을 Props 정의
interface StarReportContentProps {
  reportData: Partial<StarReport>;
}

export default function StarReportContent({
  reportData,
}: StarReportContentProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {sections.map((section) => {
        const bodyText = reportData[section.key];
        return (
          <View key={section.key} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Feather
                name={section.icon}
                size={20}
                color="#2b8a3e"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text
              style={bodyText ? styles.sectionBody : styles.placeholderText}
            >
              {bodyText || "작성된 내용이 없습니다."}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sectionContainer: {
    marginBottom: 32, // ✅ 섹션 간의 여백을 늘려 가독성 확보
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529", // ✅ 제목은 가독성 좋은 어두운 색으로
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 28, // ✅ 줄 간격을 넓혀 읽기 편하게
    color: "#495057",
    paddingLeft: 30, // ✅ 아이콘 너비만큼 들여쓰기하여 본문 정렬
  },
  placeholderText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#adb5bd", // ✅ 내용이 없을 때의 안내 텍스트 스타일
    fontStyle: "italic",
    paddingLeft: 30,
  },
});
