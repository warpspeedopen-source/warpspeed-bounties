import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Transcription, TranscriptionStatus } from '../types';

// ─── Constants ────────────────────────────────────────────────────────

const MAX_PREVIEW_CHARS = 200;

// ─── Props ────────────────────────────────────────────────────────────

interface TranscriptionViewProps {
  /** Full transcription data (null while pending / loading) */
  transcription: Transcription | null;
  /** Current transcription status */
  status: TranscriptionStatus;
  /** Called when user taps "Retry" after a failure */
  onRetry?: () => void;
  /** Called when a segment is tapped (seek-to-time) */
  onSegmentPress?: (startTime: number) => void;
  /** Whether the view starts collapsed */
  initiallyCollapsed?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ─── Segment Row ──────────────────────────────────────────────────────

interface SegmentRowProps {
  segment: { start: number; end: number; text: string };
  onPress?: (start: number) => void;
}

const SegmentRow: React.FC<SegmentRowProps> = React.memo(
  ({ segment, onPress }) => (
    <Pressable
      style={({ pressed }) => [
        styles.segmentRow,
        pressed && styles.segmentRowPressed,
      ]}
      onPress={() => onPress?.(segment.start)}
      accessibilityRole="button"
      accessibilityLabel={`Go to ${formatTimestamp(segment.start)}`}
    >
      <Text style={styles.segmentTimestamp}>
        {formatTimestamp(segment.start)}
      </Text>
      <Text style={styles.segmentText}>{segment.text}</Text>
    </Pressable>
  ),
);

// ─── Loading / Processing States ──────────────────────────────────────

const ProcessingIndicator: React.FC<{ status: TranscriptionStatus }> = ({
  status,
}) => (
  <View style={styles.statusContainer}>
    {status === 'processing' ? (
      <>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.statusText}>Transcribing audio…</Text>
      </>
    ) : (
      <Text style={styles.statusText}>Transcription pending</Text>
    )}
  </View>
);

// ─── Error State ──────────────────────────────────────────────────────

const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <View style={styles.statusContainer}>
    <Text style={styles.errorText}>Transcription failed</Text>
    {onRetry && (
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry transcription"
      >
        <Text style={styles.retryButtonText}>Tap to retry</Text>
      </Pressable>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <View style={styles.statusContainer}>
    <Text style={styles.statusText}>No transcription available</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  transcription,
  status,
  onRetry,
  onSegmentPress,
  initiallyCollapsed = true,
}) => {
  const [expanded, setExpanded] = useState(!initiallyCollapsed);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Stable segments reference for memo
  const segments = useMemo(
    () => transcription?.segments ?? [],
    [transcription?.segments],
  );

  const fullText = transcription?.text ?? '';

  const previewText = useMemo(
    () =>
      fullText.length > MAX_PREVIEW_CHARS
        ? fullText.slice(0, MAX_PREVIEW_CHARS) + '…'
        : fullText,
    [fullText],
  );

  // ── Determine what to render ────────────────────────────────────

  if (status === 'pending' || status === 'processing') {
    return <ProcessingIndicator status={status} />;
  }

  if (status === 'failed') {
    return <ErrorState onRetry={onRetry} />;
  }

  if (status === 'completed' && !transcription) {
    return <EmptyState />;
  }

  // ── Completed transcription ─────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header with confidence + language badge */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transcription</Text>
        <View style={styles.badgeRow}>
          {transcription?.language && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {transcription.language.toUpperCase()}
              </Text>
            </View>
          )}
          {transcription?.confidence != null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {Math.round(transcription.confidence * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Collapsible preview */}
      <Pressable
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse transcription' : 'Expand transcription'}
      >
        <Text style={styles.fullText}>
          {expanded ? fullText : previewText}
        </Text>
        {fullText.length > MAX_PREVIEW_CHARS && (
          <Text style={styles.expandToggle}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        )}
      </Pressable>

      {/* Segmented view (only when expanded) */}
      {expanded && segments.length > 0 && (
        <ScrollView
          style={styles.segmentsContainer}
          nestedScrollEnabled
          accessibilityLabel="Transcription segments"
        >
          {segments.map((seg, idx) => (
            <SegmentRow
              key={`${seg.start}-${idx}`}
              segment={seg}
              onPress={onSegmentPress}
            />
          ))}
        </ScrollView>
      )}

      {/* Confidence disclaimer for low-confidence transcripts */}
      {transcription?.confidence != null && transcription.confidence < 0.6 && (
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Low confidence transcription — accuracy may be reduced.
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '600',
  },
  fullText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 22,
  },
  expandToggle: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  segmentsContainer: {
    maxHeight: 240,
  },
  segmentRow: {
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  segmentRowPressed: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  segmentTimestamp: {
    color: '#6B7280',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 11,
    lineHeight: 20,
    minWidth: 32,
  },
  segmentText: {
    color: '#1F2937',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  statusText: {
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimer: {
    backgroundColor: '#FEF3CD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disclaimerText: {
    color: '#856404',
    fontSize: 12,
  },
});
