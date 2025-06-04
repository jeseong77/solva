// RequirementInputModal.tsx
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export type RequirementInputModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddRequirement: (requirementText: string) => void;
};

const windowHeight = Dimensions.get("window").height;

export default function RequirementInputModal({
  visible,
  onClose,
  onAddRequirement,
}: RequirementInputModalProps) {
  const [requirementText, setRequirementText] = useState("");

  // Clear text when modal becomes visible (for a fresh input each time)
  useEffect(() => {
    if (visible) {
      setRequirementText("");
    }
  }, [visible]);

  const handleAdd = () => {
    if (requirementText.trim()) {
      onAddRequirement(requirementText.trim());
      onClose(); // Close after adding
    } else {
      // Optionally, show an alert if the input is empty
      alert("Please enter a requirement.");
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide" // Makes it come from the bottom
      onRequestClose={onClose} // For Android back button
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {/* TouchableWithoutFeedback to close modal on overlay tap */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            {/* Inner TouchableWithoutFeedback to prevent touches on content from closing */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Requirement</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter requirement details..."
                  value={requirementText}
                  onChangeText={setRequirementText}
                  multiline
                  autoFocus={true} // Automatically focus the input when modal opens
                  placeholderTextColor="#999"
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={handleAdd}
                  >
                    <Text style={[styles.buttonText, styles.addButtonText]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1, // Important for KeyboardAvoidingView to work correctly with overlay
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "flex-end", // Aligns modal content to the bottom
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20, // Inner padding for content
    paddingBottom: Platform.OS === "ios" ? 30 : 20, // Extra padding for home indicator on iOS
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: windowHeight * 0.6, // Modal takes max 60% of screen height
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2, // Shadow for the top edge
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 60, // Good for a few lines of text
    maxHeight: 120, // Prevents it from growing too large
    textAlignVertical: "top", // For multiline input
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1, // Distribute space equally
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
