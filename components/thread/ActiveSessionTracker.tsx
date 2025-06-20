// app/components/thread/ActiveSessionTracker.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

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
    if (activeSession) {
      // FIX: Use .getTime() for all date arithmetic
      const initialTotalElapsed =
        activeSession.pausedTime.getTime() +
        (activeSession.isPaused
          ? 0
          : new Date().getTime() - activeSession.startTime.getTime());
      setDisplayTime(formatTime(initialTotalElapsed));
    }

    if (!activeSession || activeSession.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      if (activeSession) {
        // Added check for safety inside interval
        // FIX: Use .getTime() for all date arithmetic
        const elapsedSinceResume =
          new Date().getTime() - activeSession.startTime.getTime();
        const totalElapsed =
          activeSession.pausedTime.getTime() + elapsedSinceResume;
        setDisplayTime(formatTime(totalElapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const handleStop = () => {
    // FIX: Use .getTime() for all date arithmetic
    const finalElapsedTime = activeSession.isPaused
      ? activeSession.pausedTime.getTime()
      : activeSession.pausedTime.getTime() +
        (new Date().getTime() - activeSession.startTime.getTime());
    onStop(finalElapsedTime);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerWrapper}>
        <Feather name="clock" size={16} color="#FFFFFF" />
        <Text style={styles.timerText}>{displayTime}</Text>
      </View>
      <View style={styles.buttonsWrapper}>
        <TouchableOpacity
          style={styles.button}
          onPress={activeSession.isPaused ? resumeSession : pauseSession}
        >
          <Feather
            name={activeSession.isPaused ? "play" : "pause"}
            size={20}
            color="#2f9e44"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop}>
          <Feather name="square" size={20} color="#fa5252" />
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
    // ✅ [수정] 배경색을 검은색 계열로 변경
    backgroundColor: "#212529",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
  },
  timerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    fontSize: 17,
    fontWeight: "bold",
    // ✅ [수정] 텍스트 색상을 흰색으로 변경
    color: "#FFFFFF",
    marginLeft: 10,
    fontVariant: ["tabular-nums"],
  },
  buttonsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    marginLeft: 20,
    padding: 4,
  },
});
