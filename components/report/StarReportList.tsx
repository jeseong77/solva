import { StarReport } from "@/types";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import StarReportListItem from "./StarReportListItem";

// 컴포넌트가 받을 Props 정의
interface StarReportListProps {
  reports: StarReport[];
  onPressItem: (reportId: string) => void;
}

export default function StarReportList({
  reports,
  onPressItem,
}: StarReportListProps) {
  // 리스트가 비어있을 때 보여줄 컴포넌트
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>아직 작성한 리포트가 없습니다.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>작성한 STAR 리포트</Text>
      </View>
      <FlatList
        data={reports}
        renderItem={({ item }) => (
          <StarReportListItem report={item} onPress={onPressItem} />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={false} // 부모 스크롤을 사용
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: "#e9ecef",
    overflow: "hidden", // 자식 컴포넌트의 모서리가 삐져나오지 않도록
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  titleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  emptyText: {
    fontSize: 15,
    color: "#868e96",
  },
});
