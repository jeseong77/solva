// app/components/thread/ActiveSessionTracker.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

// 밀리초를 MM:SS 형식의 문자열로 변환하는 헬퍼 함수
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

interface ActiveSessionTrackerProps {
  onStop: (elapsedTime: number) => void;
}

export default function ActiveSessionTracker({
  onStop,
}: ActiveSessionTrackerProps) {
  const { activeSession, pauseSession, resumeSession } = useAppStore(
    useShallow((state) => ({
      activeSession: state.activeSession,
      pauseSession: state.pauseSession,
      resumeSession: state.resumeSession,
    }))
  );

  const [displayTime, setDisplayTime] = useState("00:00");

  useEffect(() => {
    if (!activeSession || activeSession.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const elapsedSinceResume = Date.now() - activeSession.startTime;
      const totalElapsed = activeSession.pausedTime + elapsedSinceResume;
      setDisplayTime(formatTime(totalElapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const handleStop = () => {
    const finalElapsedTime = activeSession.isPaused
      ? activeSession.pausedTime
      : activeSession.pausedTime + (Date.now() - activeSession.startTime);
    onStop(finalElapsedTime);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerWrapper}>
        <Feather name="clock" size={16} color="#1971c2" />
        <Text style={styles.timerText}>{displayTime}</Text>
      </View>
      <View style={styles.buttonsWrapper}>
        <TouchableOpacity
          style={styles.button}
          onPress={activeSession.isPaused ? resumeSession : pauseSession}
        >
          <Feather
            name={activeSession.isPaused ? "play" : "pause"}
            size={18}
            color="#495057"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop}>
          <Feather name="square" size={18} color="#d9480f" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e7f5ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  timerWrapper: { flexDirection: "row", alignItems: "center" },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1971c2",
    marginLeft: 8,
    fontVariant: ["tabular-nums"],
  },
  buttonsWrapper: { flexDirection: "row", alignItems: "center" },
  button: { marginLeft: 16, padding: 4 },
});
