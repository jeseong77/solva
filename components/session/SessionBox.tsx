import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import SelectThreadModal from "./SelectThreadModal"; // 방금 만든 모달 import

// 초(seconds)를 HH:MM:SS 형식으로 변환
const formatSeconds = (totalSeconds: number): string => {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  if (hours > 0) parts.unshift(String(hours).padStart(2, "0"));
  return parts.join(":");
};

// 밀리초(ms)를 MM:SS 형식으로 변환 (실시간 타이머용)
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export default function SessionBox() {
  const {
    activeSession,
    getMostRecentSession,
    getThreadItemById,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    addThreadItem,
  } = useAppStore(
    useShallow((state) => ({
      activeSession: state.activeSession,
      getMostRecentSession: state.getMostRecentSession,
      getThreadItemById: state.getThreadItemById,
      startSession: state.startSession,
      stopSession: state.stopSession,
      pauseSession: state.pauseSession,
      resumeSession: state.resumeSession,
      addThreadItem: state.addThreadItem,
    }))
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [displayTime, setDisplayTime] = useState("00:00");

  const recentSessionInfo = getMostRecentSession();
  const activeThread = activeSession
    ? getThreadItemById(activeSession.threadId)
    : null;

  // 실시간 타이머 로직
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      const elapsedSinceResume = Date.now() - activeSession.startTime;
      const totalElapsed = activeSession.pausedTime + elapsedSinceResume;
      setDisplayTime(formatTime(totalElapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // 세션 중지 핸들러
  const handleStopSession = () => {
    if (!activeSession || !activeThread) return;
    const finalElapsedTime = activeSession.isPaused
      ? activeSession.pausedTime
      : activeSession.pausedTime + (Date.now() - activeSession.startTime);

    Alert.alert("세션 종료", "이번 세션의 작업 내용을 기록하시겠습니까?", [
      {
        text: "아니요 (시간만 기록)",
        onPress: () => saveSession(""),
        style: "cancel",
      },
      {
        text: "예 (내용 기록)",
        onPress: () => {
          if (Platform.OS === "ios") {
            Alert.prompt("작업 내용 기록", "간단히 기록해주세요.", (text) =>
              saveSession(text || "")
            );
          } else {
            // 안드로이드는 별도 입력 모달 구현 필요. 현재는 내용 없이 저장.
            saveSession("홈 화면에서 세션 종료");
            Alert.alert("알림", "작업 내용이 기록되었습니다.");
          }
        },
      },
    ]);

    const saveSession = async (content: string) => {
      await addThreadItem({
        problemId: activeThread.problemId,
        parentId: activeThread.id,
        type: "Session",
        content,
        timeSpent: Math.round(finalElapsedTime / 1000),
        startTime: new Date(Date.now() - finalElapsedTime),
      });
      stopSession();
    };
  };

  // 세션 시작 핸들러
  const handleStartSession = (threadId: string) => {
    startSession(threadId);
  };

  // UI 렌더링
  return (
    <View style={styles.wrapper}>
      {activeSession && activeThread ? (
        // --- 세션 진행 중 UI ---
        <View style={[styles.container, styles.activeContainer]}>
          <View>
            <Text style={styles.activeTitle}>세션 진행 중</Text>
            <Text style={styles.activeContent} numberOfLines={1}>
              {activeThread.content}
            </Text>
            <View style={styles.timerWrapper}>
              <Feather name="clock" size={16} color="#1971c2" />
              <Text style={styles.timerText}>{displayTime}</Text>
            </View>
          </View>
          <View style={styles.buttonsWrapper}>
            <TouchableOpacity
              style={styles.button}
              onPress={activeSession.isPaused ? resumeSession : pauseSession}
            >
              <Feather
                name={activeSession.isPaused ? "play" : "pause"}
                size={22}
                color="#495057"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleStopSession}>
              <Feather name="square" size={22} color="#d9480f" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // --- 세션 없을 때 UI ---
        <View style={[styles.container, styles.idleContainer]}>
          <View style={styles.idleLeft}>
            <Text style={styles.idleTitle}>현재 진행중인 세션이 없습니다.</Text>
            {recentSessionInfo?.session ? (
              <View style={styles.recentSessionInfo}>
                <Text style={styles.recentLabel}>최근 세션:</Text>
                <Text style={styles.recentContent} numberOfLines={1}>
                  {recentSessionInfo.parentThread?.content}
                </Text>
                <Text style={styles.recentTime}>
                  ({formatSeconds(recentSessionInfo.session.timeSpent)})
                </Text>
              </View>
            ) : (
              <Text style={styles.recentLabel}>최근 세션 기록이 없습니다.</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setModalVisible(true)}
          >
            <Feather name="play-circle" size={36} color="#1971c2" />
          </TouchableOpacity>
        </View>
      )}

      <SelectThreadModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleStartSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#8cc5ed",
  },
  activeContainer: {
    backgroundColor: "#e7f5ff",
  },
  idleContainer: {
    backgroundColor: "#e7f5ff",
  },
  // Active State Styles
  activeTitle: {
    fontSize: 13,
    color: "#495057",
    marginBottom: 4,
  },
  activeContent: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    maxWidth: 200, // 말줄임을 위한 너비 제한
  },
  timerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1971c2",
    marginLeft: 8,
    fontVariant: ["tabular-nums"],
  },
  buttonsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    marginLeft: 16,
    padding: 4,
  },
  // Idle State Styles
  idleLeft: {
    flex: 1,
    marginRight: 16,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  recentSessionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentLabel: {
    fontSize: 13,
    color: "#868e96",
  },
  recentContent: {
    fontSize: 13,
    color: "#495057",
    flexShrink: 1, // 내용이 길면 줄어들도록
    marginHorizontal: 4,
  },
  recentTime: {
    fontSize: 13,
    color: "#868e96",
    fontVariant: ["tabular-nums"],
  },
  playButton: {
    padding: 4,
  },
});
