// PriorityPickerModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback, // Import this
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Priority } from "@/types";

export type PriorityPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onPrioritySelect: (priority: Priority) => void;
  currentPriority?: Priority;
};

const priorityOptions: Priority[] = ["high", "medium", "low"];

export default function PriorityPickerModal({
  visible,
  onClose,
  onPrioritySelect,
  currentPriority,
}: PriorityPickerModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<Priority>(
    currentPriority || "medium"
  );

  useEffect(() => {
    if (currentPriority) {
      setSelectedPriority(currentPriority);
    }
  }, [currentPriority]);

  const handleConfirm = () => {
    onPrioritySelect(selectedPriority);
    onClose(); // Modal closes itself after selection
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose} // Handles Android back button
    >
      {/* TouchableWithoutFeedback for the overlay to detect outside clicks */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          {/* This inner TouchableWithoutFeedback prevents touches on the pickerBox from closing the modal */}
          <TouchableWithoutFeedback
            onPress={() => {
              /* Do nothing, consume touch */
            }}
          >
            <View style={styles.pickerBox}>
              <Text style={styles.modalTitle}>Select Priority</Text>
              <Picker
                selectedValue={selectedPriority}
                onValueChange={(itemValue) =>
                  setSelectedPriority(itemValue as Priority)
                }
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {priorityOptions.map((priorityValue) => (
                  <Picker.Item
                    key={priorityValue}
                    label={
                      priorityValue.charAt(0).toUpperCase() +
                      priorityValue.slice(1)
                    }
                    value={priorityValue}
                  />
                ))}
              </Picker>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerBox: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  picker: {
    width: "100%",
    marginBottom: 20,
  },
  pickerItem: {
    // For iOS item styling
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 5,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    marginLeft: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
