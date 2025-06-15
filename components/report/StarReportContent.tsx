import { StarReport } from "@/types";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// 각 섹션의 제목과 키, 색상을 정의
const sections = [
  { key: "situation", title: "Situation (상황)", color: "#1c7ed6" },
  { key: "task", title: "Task (과제)", color: "#f76707" },
  { key: "action", title: "Action (행동)", color: "#2b8a3e" },
  { key: "result", title: "Result (결과)", color: "#d9480f" },
  { key: "learnings", title: "Learnings (배운 점)", color: "#495057" },
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
      {sections.map((section) => (
        <View key={section.key} style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: section.color }]}>
            {section.title}
          </Text>
          <Text style={styles.sectionBody}>
            {reportData[section.key] || "내용이 없습니다."}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 24 },
  sectionContainer: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  sectionBody: { fontSize: 16, lineHeight: 26, color: "#343a40" },
});
