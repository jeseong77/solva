import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

// Assuming types might be needed if we were fully integrating Objective
// For now, this page is mostly self-contained for the timer UI
// import { Objective } from '@/types';

// --- Color Palette ---
const COLORS = {
  background: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#555555",
  playButtonBackground: "#000000",
  playButtonText: "#FFFFFF",
  controlButtonBackground: "#E0E0E0", // For stop, change duration
  controlButtonText: "#000000",
  timerText: "#000000",
  durationSelectorText: "#007AFF", // Link-like color for changing duration
  headerIconColor: "#000000",
};

// --- Helper function to format seconds into MM:SS ---
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

interface WorkSessionPageProps {
  // objectiveId?: string; // Would be passed via navigation
  // navigation: any; // Placeholder for navigation
}

const WorkSessionPage: React.FC<WorkSessionPageProps> = (
  {
    // objectiveId,
    // navigation,
  }
) => {
  const DEFAULT_DURATION_MINUTES = 25;
  const [selectedDurationMinutes, setSelectedDurationMinutes] =
    useState<number>(DEFAULT_DURATION_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    selectedDurationMinutes * 60
  );
  const [isActive, setIsActive] = useState<boolean>(false); // Timer is running
  const [isPaused, setIsPaused] = useState<boolean>(false); // Timer is paused (distinct from not started)
  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && !isPaused && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isActive) {
      setIsActive(false);
      setIsSessionFinished(true);
      // In a real app, trigger WorkRecord creation here
      Alert.alert(
        "Session Complete!",
        `${selectedDurationMinutes} minute session finished. Log this work?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Work",
            onPress: () =>
              console.log("Work logged for objectiveId (placeholder)"),
          }, // Replace with actual logging
        ]
      );
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, remainingSeconds, selectedDurationMinutes]);

  // Update remainingSeconds when selectedDurationMinutes changes, if timer not active
  useEffect(() => {
    if (!isActive && !isSessionFinished) {
      // Only reset if timer hasn't started or finished
      setRemainingSeconds(selectedDurationMinutes * 60);
    }
  }, [selectedDurationMinutes, isActive, isSessionFinished]);

  const handlePlayPause = () => {
    if (isSessionFinished) {
      // If finished, pressing play again should reset and start
      resetTimer(selectedDurationMinutes); // Reset with current selected duration
      setIsActive(true);
      setIsPaused(false);
      return;
    }

    if (isActive) {
      // If running, pause it
      setIsPaused(!isPaused);
    } else {
      // If not active (either fresh start or was stopped), start it
      setIsActive(true);
      setIsPaused(false);
      // If it was paused and now playing again, isPaused becomes false.
      // If it was completely stopped and now playing, it starts fresh.
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsSessionFinished(false); // Allow restarting
    setRemainingSeconds(selectedDurationMinutes * 60); // Reset to selected duration
    Alert.alert("Session Stopped", "Timer has been reset.");
  };

  const resetTimer = (durationInMinutes: number) => {
    setIsActive(false);
    setIsPaused(false);
    setIsSessionFinished(false);
    setSelectedDurationMinutes(durationInMinutes);
    setRemainingSeconds(durationInMinutes * 60);
  };

  const handleChangeDuration = () => {
    if (isActive && !isPaused) {
      Alert.alert(
        "Timer Active",
        "Please pause or stop the current session to change duration."
      );
      return;
    }
    const durationOptions = [
      { text: "15 minutes", onPress: () => resetTimer(15) },
      { text: "25 minutes (Default)", onPress: () => resetTimer(25) },
      { text: "30 minutes", onPress: () => resetTimer(30) },
      { text: "45 minutes", onPress: () => resetTimer(45) },
      { text: "50 minutes", onPress: () => resetTimer(50) },
      { text: "60 minutes", onPress: () => resetTimer(60) },
      { text: "Cancel", style: "cancel" as const },
    ];
    Alert.alert("Select Session Duration", undefined, durationOptions);
  };

  const getPlayButtonText = () => {
    if (isSessionFinished) return "↻"; // Restart icon
    if (isActive && !isPaused) return "❚❚"; // Pause icon
    return "▶"; // Play icon
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={
            () =>
              Alert.alert(
                "Navigate Back",
                "Go back to Objective Page."
              )
          }
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Session</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.container}>
        <View style={styles.durationSelectorContainer}>
          <Text style={styles.durationLabel}>Session:</Text>
          <TouchableOpacity onPress={handleChangeDuration}>
            <Text style={styles.durationValueText}>
              {selectedDurationMinutes} minutes
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>

        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={handlePlayPause}
        >
          <Text style={styles.playPauseButtonText}>{getPlayButtonText()}</Text>
        </TouchableOpacity>

        {(isActive || isPaused || isSessionFinished) && (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop & Reset</Text>
          </TouchableOpacity>
        )}

        {isSessionFinished && (
          <Text style={styles.completionMessage}>Session Complete!</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    // borderBottomWidth: 1, // Optional separator
    // borderBottomColor: COLORS.inputBackground,
  },
  headerButton: {
    padding: 8,
    minWidth: 40, // Ensure decent tap area
    alignItems: "center",
  },
  headerButtonText: {
    fontSize: 24,
    color: COLORS.headerIconColor,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  durationSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.controlButtonBackground, // A light background for this control
    borderRadius: 25, // Rounded corners
  },
  durationLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  durationValueText: {
    fontSize: 18,
    color: COLORS.durationSelectorText, // Link-like color
    fontWeight: "600",
  },
  timerText: {
    fontSize: 72, // Large timer display
    fontWeight: "bold",
    color: COLORS.timerText,
    marginBottom: 40,
    fontVariant: ["tabular-nums"], // Ensures numbers don't shift width
  },
  playPauseButton: {
    width: 150,
    height: 150,
    borderRadius: 75, // Perfect circle
    backgroundColor: COLORS.playButtonBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  playPauseButtonText: {
    fontSize: 60,
    color: COLORS.playButtonText,
    // Some icons might need slight position adjustment
    // For Pause "❚❚", you might need two Vertical Lines or an Icon
    // For Restart "↻", you might use a unicode character or an icon
  },
  stopButton: {
    backgroundColor: COLORS.controlButtonBackground,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25, // Consistent rounded corners
  },
  stopButtonText: {
    fontSize: 16,
    color: COLORS.controlButtonText,
    fontWeight: "600",
  },
  completionMessage: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 20,
    fontWeight: "500",
  },
});

export default WorkSessionPage;
