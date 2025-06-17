// components/report/StarReportList.tsx

import { StarReport } from "@/types";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import StarReportListItem from "./StarReportListItem";

interface StarReportListProps {
  reports: StarReport[];
  onPressItem: (reportId: string) => void;
}

export default function StarReportList({
  reports,
  onPressItem,
}: StarReportListProps) {
  // --- 기존 로직은 변경하지 않습니다 ---
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>아직 작성한 리포트가 없습니다.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>작성한 STAR 리포트</Text>
      <FlatList
        data={reports}
        renderItem={({ item }) => (
          <StarReportListItem report={item} onPress={onPressItem} />
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={false}
      />
    </View>
  );
}

// ✅ [스타일 수정] 플랫 디자인에 맞게 변경
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  emptyContainer: {
    paddingVertical: 60, // 높이감 확보
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#868e96",
  },
  // ✅ 구분선 스타일 추가
  divider: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginHorizontal: 20, // 좌우 여백
  },
});
