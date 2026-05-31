import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PollCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], allowMultiple: boolean) => void;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  visible,
  onClose,
  onCreatePoll,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options
  const [allowMultiple, setAllowMultiple] = useState(false);

  // Animated values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current; // 0 for Single, 1 for Multiple

  // Keep track of animations for individual options
  const optionScaleAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    // Sync option scale animations array length with options length
    while (optionScaleAnims.current.length < options.length) {
      optionScaleAnims.current.push(new Animated.Value(0));
    }
    // Animate newly added options
    options.forEach((_, idx) => {
      if (optionScaleAnims.current[idx]) {
        Animated.spring(optionScaleAnims.current[idx], {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    });
  }, [options.length]);

  // Handle Modal transitions
  useEffect(() => {
    if (visible) {
      // Reset state on open
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      toggleAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(overlayOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start();
    }
  }, [visible]);

  // Toggle animation
  const handleToggle = (value: boolean) => {
    setAllowMultiple(value);
    Animated.timing(toggleAnim, {
      toValue: value ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: false, // Layout animations on width/left require false or use interpolate
    }).start();
  };

  const handleAddOption = () => {
    if (options.length < 12) {
      // Append a new animated value and add empty string
      optionScaleAnims.current.push(new Animated.Value(0));
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Keep at least 2 options
    
    // Animate item exit before removing
    Animated.timing(optionScaleAnims.current[index], {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      const updatedOptions = options.filter((_, idx) => idx !== index);
      optionScaleAnims.current.splice(index, 1);
      setOptions(updatedOptions);
    });
  };

  const handleOptionChange = (text: string, index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = text.slice(0, 255); // Absolute 255-char ceiling validation
    setOptions(updatedOptions);
  };

  const isFormValid = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0 || trimmedQuestion.length > 255) return false;

    // Filter non-empty valid options
    const validOptions = options.filter(opt => opt.trim().length > 0);
    // Standard poll requires at least 2 options
    if (validOptions.length < 2) return false;

    // Verify all non-empty options fit character validation
    const hasInvalidOption = options.some(opt => opt.length > 255);
    if (hasInvalidOption) return false;

    return true;
  };

  const handleCreate = () => {
    if (!isFormValid()) return;
    const finalOptions = options.filter(opt => opt.trim().length > 0).map(opt => opt.trim());
    
    // Smooth animate out and then call onCreatePoll
    Animated.parallel([
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCreatePoll(question.trim(), finalOptions, allowMultiple);
      onClose();
    });
  };

  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Interpolate slide offset for the custom selection background toggle
  const toggleLeft = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Backdrop overlay */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: overlayOpacityAnim,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={handleCancel} />
        </Animated.View>

        {/* Modal content body */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View
            style={[
              styles.modalSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Grab Handle indicator */}
            <View style={styles.handleContainer}>
              <View style={styles.grabHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Poll</Text>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={!isFormValid()}
                activeOpacity={0.7}
                style={[
                  styles.createBtnHeader,
                  !isFormValid() && styles.createBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.createBtnText,
                    !isFormValid() && styles.createBtnTextDisabled,
                  ]}
                >
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Question Text Input Box */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>QUESTION</Text>
                  <Text
                    style={[
                      styles.charCount,
                      question.length > 240 && styles.charCountWarning,
                    ]}
                  >
                    {question.length}/255
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.questionInput}
                    placeholder="Ask a question..."
                    placeholderTextColor="#64748B"
                    value={question}
                    onChangeText={(text) => setQuestion(text.slice(0, 255))}
                    maxLength={255}
                    multiline
                    numberOfLines={2}
                    keyboardAppearance="dark"
                  />
                </View>
              </View>

              {/* Selection Mode Toggle Option */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>VOTING SYSTEM</Text>
                <View style={styles.toggleTrack}>
                  {/* Sliding highlight indicator */}
                  <Animated.View
                    style={[
                      styles.toggleHighlight,
                      {
                        left: toggleLeft,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.toggleTab}
                    onPress={() => handleToggle(false)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.toggleTabText,
                        !allowMultiple && styles.toggleTabTextActive,
                      ]}
                    >
                      Single Choice
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toggleTab}
                    onPress={() => handleToggle(true)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.toggleTabText,
                        allowMultiple && styles.toggleTabTextActive,
                      ]}
                    >
                      Multiple Choice
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Option Fields List */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>OPTIONS ({options.length}/12)</Text>
                  {options.length >= 12 && (
                    <Text style={styles.limitWarningText}>Limit reached (max 12)</Text>
                  )}
                </View>

                {options.map((option, index) => {
                  const scaleVal = optionScaleAnims.current[index] || new Animated.Value(1);
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.optionRow,
                        {
                          transform: [{ scale: scaleVal }],
                          opacity: scaleVal,
                        },
                      ]}
                    >
                      <View style={styles.optionInputContainer}>
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor="#64748B"
                          value={option}
                          onChangeText={(text) => handleOptionChange(text, index)}
                          maxLength={255}
                          keyboardAppearance="dark"
                        />
                        {option.length > 200 && (
                          <Text style={styles.optionCharCount}>{option.length}/255</Text>
                        )}
                      </View>
                      
                      {options.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveOption(index)}
                          style={styles.removeButton}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  );
                })}

                {/* Add Option Trigger button */}
                {options.length < 12 && (
                  <TouchableOpacity
                    style={styles.addOptionBtn}
                    onPress={handleAddOption}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addOptionBtnSymbol}>+</Text>
                    <Text style={styles.addOptionBtnText}>Add option</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 18, 0.75)',
  },
  backdropPressable: {
    flex: 1,
  },
  keyboardContainer: {
    maxHeight: '93%',
  },
  modalSheet: {
    backgroundColor: '#0F172A', // Sleek dark slate
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.1,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  createBtnHeader: {
    backgroundColor: '#6366F1', // Premium Indigo
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  createBtnDisabled: {
    backgroundColor: '#1E293B',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  createBtnTextDisabled: {
    color: '#64748B',
  },
  scrollContent: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  charCountWarning: {
    color: '#F43F5E',
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  questionInput: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 50,
    textAlignVertical: 'top',
    padding: 0,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    paddingHorizontal: 2,
    position: 'relative',
  },
  toggleHighlight: {
    position: 'absolute',
    height: 36,
    width: '48%',
    borderRadius: 9,
    backgroundColor: '#6366F1', // Solid indigo fill on selection
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toggleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleTabTextActive: {
    color: '#FFFFFF',
  },
  limitWarningText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F43F5E',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInputContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  optionInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    padding: 0,
  },
  optionCharCount: {
    fontSize: 10,
    color: '#F43F5E',
    marginLeft: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  removeButtonText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    justifyContent: 'center',
    marginTop: 4,
  },
  addOptionBtnSymbol: {
    fontSize: 20,
    color: '#38BDF8', // Cyan plus sign
    fontWeight: '400',
    marginRight: 6,
  },
  addOptionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
});
