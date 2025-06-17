import { useAppStore } from "@/store/store";
import { ActiveSession, ThreadItem } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

// --- Helper Functions and Components (변경 없음) ---
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

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const ActiveSessionView = ({
  session,
  thread,
}: {
  session: ActiveSession;
  thread: ThreadItem;
}) => {
  const [displayTime, setDisplayTime] = useState("00:00");

  const { pauseSession, resumeSession, stopSession, addThreadItem } =
    useAppStore(
      useShallow((state) => ({
        pauseSession: state.pauseSession,
        resumeSession: state.resumeSession,
        stopSession: state.stopSession,
        addThreadItem: state.addThreadItem,
      }))
    );

  useEffect(() => {
    if (session.isPaused) {
      setDisplayTime(formatTime(session.pausedTime));
      return;
    }
    const interval = setInterval(() => {
      const elapsedSinceResume = Date.now() - session.startTime;
      const totalElapsed = session.pausedTime + elapsedSinceResume;
      setDisplayTime(formatTime(totalElapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleStopSession = () => {
    const finalElapsedTime = session.isPaused
      ? session.pausedTime
      : session.pausedTime + (Date.now() - session.startTime);

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
            saveSession("홈 화면에서 세션 종료");
            Alert.alert("알림", "작업 내용이 기록되었습니다.");
          }
        },
      },
    ]);

    const saveSession = async (content: string) => {
      await addThreadItem({
        problemId: thread.problemId,
        parentId: thread.id,
        type: "Session",
        content,
        timeSpent: Math.round(finalElapsedTime / 1000),
        startTime: new Date(Date.now() - finalElapsedTime),
      });
      stopSession();
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.statusIndicator} />
        <View style={{ flex: 1 }}>
          <Text style={styles.activeTitle} numberOfLines={1}>
            {thread.content}
          </Text>
          <Text style={styles.timerText}>{displayTime}</Text>
        </View>
      </View>
      <View style={styles.buttonsWrapper}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={session.isPaused ? resumeSession : pauseSession}
        >
          <Feather
            name={session.isPaused ? "play" : "pause"}
            size={20}
            color="#f1f3f5"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStopSession}
        >
          <Feather name="square" size={20} color="#181818" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SessionBox() {
  const router = useRouter();
  const { activeSession, getMostRecentSession, getThreadItemById } =
    useAppStore(
      useShallow((state) => ({
        activeSession: state.activeSession,
        getMostRecentSession: state.getMostRecentSession,
        getThreadItemById: state.getThreadItemById,
      }))
    );

  const activeThread = activeSession
    ? getThreadItemById(activeSession.threadId)
    : null;
  const recentSessionInfo = getMostRecentSession();

  return (
    <View style={styles.wrapper}>
      {activeSession && activeThread ? (
        <ActiveSessionView session={activeSession} thread={activeThread} />
      ) : (
        <TouchableOpacity
          style={styles.container}
          onPress={() => router.push("/session/select")}
          activeOpacity={0.8}
        >
          <View style={styles.idleLeft}>
            {recentSessionInfo?.session ? (
              <>
                <Text style={styles.idleTitle}>최근 세션</Text>
                <View style={styles.recentSessionInfo}>
                  <Text style={styles.recentContent} numberOfLines={1}>
                    {recentSessionInfo.parentThread?.content}
                  </Text>
                  <Text style={styles.recentTime}>
                    ({formatSeconds(recentSessionInfo.session.timeSpent)})
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.idleTitle}>탭하여 세션을 시작하세요.</Text>
            )}
          </View>
          {/* ✅ [수정] 플레이 버튼 UI 변경 */}
          <View style={[styles.controlButton, styles.playButtonActive]}>
            <Feather name="play" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#212529",
    minHeight: 92,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#40c057",
    marginRight: 12,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8f9fa",
    marginBottom: 4,
  },
  timerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#40c057",
    fontVariant: ["tabular-nums"],
  },
  buttonsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: "#fa5252",
  },
  idleLeft: {
    flex: 1,
    marginRight: 16,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8f9fa",
  },
  recentSessionInfo: {
    marginTop: 6,
  },
  recentContent: {
    fontSize: 14,
    color: "#adb5bd",
  },
  recentTime: {
    fontSize: 14,
    color: "#adb5bd",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  // ✅ [추가] 시작 버튼에 적용할 포인트 컬러 스타일
  playButtonActive: {
    backgroundColor: "#40c057", // 타이머와 동일한 초록색
  },
});
