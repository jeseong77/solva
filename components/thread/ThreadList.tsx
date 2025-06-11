// app/components/thread/ThreadList.tsx

import React from "react";
import { StyleSheet, View } from "react-native";
import ThreadItem from "./ThreadItem";

// 컴포넌트가 받을 Props 정의
interface ThreadListProps {
  threadIds: string[];
  level: number;
  onReply: (threadId: string) => void;
  onStartSession: (threadId: string) => void;
}

export default function ThreadList({
  threadIds,
  level,
  onReply,
  onStartSession,
}: ThreadListProps) {
  return (
    <View style={styles.listContainer}>
      {threadIds.map((id) => (
        <ThreadItem
          key={id}
          threadId={id}
          level={level}
          onReply={onReply}
          onStartSession={onStartSession}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    // 리스트 컨테이너에 필요한 스타일이 있다면 여기에 추가
  },
});
