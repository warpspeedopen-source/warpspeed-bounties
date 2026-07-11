Based on the issue description, this is a React Native + TypeScript project. The repository listing shows only documentation files, but the bounty requires building actual UI components. I'll create the necessary files for the poll creation and voting feature.

```diff
--- /dev/null
+++ b/src/components/Poll/PollCreationModal.tsx
@@ -0,0 +1,312 @@
+import React, { useState, useCallback } from 'react';
+import {
+  View,
+  Text,
+  TextInput,
+  TouchableOpacity,
+  Modal,
+  ScrollView,
+  StyleSheet,
+  KeyboardAvoidingView,
+  Platform,
+  Switch,
+} from 'react-native';
+import { Ionicons } from '@expo/vector-icons';
+
+const MAX_OPTIONS = 12;
+const MAX_QUESTION_LENGTH = 255;
+const MIN_OPTIONS = 2;
+
+interface PollOption {
+  id: string;
+  text: string;
+}
+
+interface PollCreationModalProps {
+  visible: boolean;
+  onClose: () => void;
+  onCreatePoll: (poll: {
+    question: string;
+    options: PollOption[];
+    allowMultipleChoices: boolean;
+  }) => void;
+}
+
+export const PollCreationModal: React.FC<PollCreationModalProps> = ({
+  visible,
+  onClose,
+  onCreatePoll,
+}) => {
+  const [question, setQuestion] = useState('');
+  const [options, setOptions] = useState<PollOption[]>([
+    { id: '1', text: '' },
+    { id: '2', text: '' },
+  ]);
+  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
+  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
+
+  const addOption = useCallback(() => {
+    if (options.length < MAX_OPTIONS) {
+      setOptions((prev) => [
+        ...prev,
+        { id: String(Date.now()), text: '' },
+      ]);
+    }
+  }, [options.length]);
+
+  const removeOption = useCallback(
+    (id: string) => {
+      if (options.length > MIN_OPTIONS) {
+        setOptions((prev) => prev.filter((opt) => opt.id !== id));
+      }
+    },
+    [options.length]
+  );
+
+  const updateOptionText = useCallback((id: string, text: string) => {
+    setOptions((prev) =>
+      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
+    );
+  }, []);
+
+  const isValid = (): boolean => {
+    const trimmedQuestion = question.trim();
+    if (!trimmedQuestion || trimmedQuestion.length > MAX_QUESTION_LENGTH) {
+      return false;
+    }
+    const filledOptions = options.filter((opt) => opt.text.trim().length > 0);
+    return filledOptions.length >= MIN_OPTIONS;
+  };
+
+  const handleCreate = useCallback(() => {
+    if (!isValid()) return;
+    const filledOptions = options.filter((opt) => opt.text.trim().length > 0);
+    onCreatePoll({
+      question: question.trim(),
+      options: filledOptions,
+      allowMultipleChoices,
+    });
+    setQuestion('');
+    setOptions([
+      { id: '1', text: '' },
+      { id: '2', text: '' },
+    ]);
+    setAllowMultipleChoices(false);
+    onClose();
+  }, [question, options, allowMultipleChoices, isValid, onCreatePoll, onClose]);
+
+  const handleClose = useCallback(() => {
+    setQuestion('');
+    setOptions([
+      { id: '1', text: '' },
+      { id: '2', text: '' },
+    ]);
+    setAllowMultipleChoices(false);
+    onClose();
+  }, [onClose]);
+
+  return (
+    <Modal
+      visible={visible}
+      animationType="slide"
+      presentationStyle="pageSheet"
+      onRequestClose={handleClose}
+    >
+      <KeyboardAvoidingView
+        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
+        style={styles.container}
+      >
+        <View style={styles.header}>
+          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
+            <Ionicons name="close" size={24} color="#007AFF" />
+          </TouchableOpacity>
+          <Text style={styles.headerTitle}>Create Poll</Text>
+          <TouchableOpacity
+            onPress={handleCreate}
+            disabled={!isValid()}
+            style={[
+              styles.createButton,
+              !isValid() && styles.createButtonDisabled,
+            ]}
+          >
+            <Text
+              style={[
+                styles.createButtonText,
+                !isValid() && styles.createButtonTextDisabled,
+              ]}
+            >
+              Send
+            </Text>
+          </TouchableOpacity>
+        </View>
+
+        <ScrollView
+          style={styles.content}
+          keyboardShouldPersistTaps="handled"
+          showsVerticalScrollIndicator={false}
+        >
+          <View style={styles.questionSection}>
+            <Text style={styles.label}>Question</Text>
+            <TextInput
+              style={styles.questionInput}
+              placeholder="Ask a question..."
+              placeholderTextColor="#8E8E93"
+              value={question}
+              onChangeText={setQuestion}
+              maxLength={MAX_QUESTION_LENGTH}
+              multiline
+              textAlignVertical="top"
+            />
+            <Text style={styles.charCount}>
+              {question.length}/{MAX_QUESTION_LENGTH}
+            </Text>
+          </View>
+
+          <View style={styles.optionsSection}>
+            <Text style={styles.label}>Options</Text>
+            {options.map((option, index) => (
+              <View key={option.id} style={styles.optionRow}>
+                <View style={styles.optionBullet}>
+                  <Text style={styles.optionBulletText}>{index + 1}</Text>
+                </View>
+                <TextInput
+                  style={[
+                    styles.optionInput,
+                    focusedOptionIndex === index && styles.optionInputFocused,
+                  ]}
+                  placeholder={`Option ${index + 1}`}
+                  placeholderTextColor="#8E8E93"
+                  value={option.text}
+                  onChangeText={(text) => updateOptionText(