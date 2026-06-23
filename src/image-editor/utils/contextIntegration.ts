/**
 * Context Integration Helpers
 * 
 * Handles the different behaviors for image editing in Notes vs Messenger contexts.
 * 
 * Notes: Edited image replaces the original within the note context.
 * Messenger: Edited image can be sent as a new message with "(Edited)" label
 *            if edited within 15 minutes of original send.
 */

import {
  EditorContext,
  EditResult,
  MessengerEditOptions,
  MessengerEditResult,
} from '../types';

// ─── Notes Context ─────────────────────────────────────────────

/**
 * Process an edit result for the Notes context.
 * In Notes, the edited image replaces the original in-place.
 */
export function processNotesEditResult(result: EditResult): EditResult {
  // In Notes, we simply return the result as-is.
  // The caller is responsible for replacing the original image reference
  // with the edited image URI in the note data structure.
  return result;
}

/**
 * Build the replacement data for a note image
 */
export function buildNoteImageReplacement(
  result: EditResult,
  noteId: string,
  originalImageIndex: number
): NoteImageReplacement {
  return {
    noteId,
    imageIndex: originalImageIndex,
    newUri: result.editedUri,
    originalUri: result.metadata.originalUri,
    editedAt: result.metadata.editedAt,
    wasModified: result.wasModified,
  };
}

export interface NoteImageReplacement {
  noteId: string;
  imageIndex: number;
  newUri: string;
  originalUri: string;
  editedAt: string;
  wasModified: boolean;
}

// ─── Messenger Context ─────────────────────────────────────────

const DEFAULT_EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Process an edit result for the Messenger context.
 * 
 * Rules:
 * - If edited within 15 minutes of the original send, show "(Edited)" label
 * - If edited after 15 minutes, it's sent as a completely new message
 * - The original message/image is preserved
 */
export function processMessengerEditResult(
  result: EditResult,
  options: MessengerEditOptions
): MessengerEditResult {
  const editWindowMs = options.editWindowMs ?? DEFAULT_EDIT_WINDOW_MS;
  const originalTime = new Date(options.originalSentAt).getTime();
  const editTime = new Date(result.metadata.editedAt).getTime();
  const timeDiff = editTime - originalTime;

  const isWithinEditWindow = options.applyEditWindow && timeDiff <= editWindowMs;

  return {
    ...result,
    showEditedLabel: isWithinEditWindow && result.wasModified,
  };
}

/**
 * Check if a message is still within the edit window
 */
export function isWithinEditWindow(
  originalSentAt: string,
  editWindowMs: number = DEFAULT_EDIT_WINDOW_MS
): boolean {
  const originalTime = new Date(originalSentAt).getTime();
  const now = Date.now();
  return now - originalTime <= editWindowMs;
}

/**
 * Calculate remaining edit window time
 */
export function getRemainingEditTime(
  originalSentAt: string,
  editWindowMs: number = DEFAULT_EDIT_WINDOW_MS
): number {
  const originalTime = new Date(originalSentAt).getTime();
  const elapsed = Date.now() - originalTime;
  return Math.max(0, editWindowMs - elapsed);
}

/**
 * Build a messenger message from an edit result
 */
export function buildMessengerMessage(
  result: MessengerEditResult,
  originalMessageId: string
): MessengerEditedMessage {
  return {
    id: `edited_${originalMessageId}_${Date.now()}`,
    originalMessageId,
    editedImageUri: result.editedUri,
    showEditedLabel: result.showEditedLabel,
    editedAt: result.metadata.editedAt,
    metadata: result.metadata,
  };
}

export interface MessengerEditedMessage {
  id: string;
  originalMessageId: string;
  editedImageUri: string;
  showEditedLabel: boolean;
  editedAt: string;
  metadata: EditResult['metadata'];
}

// ─── Unified Context Processor ─────────────────────────────────

/**
 * Process an edit result based on the context (notes or messenger)
 */
export function processEditResult(
  result: EditResult,
  context: EditorContext,
  messengerOptions?: MessengerEditOptions
): EditResult | MessengerEditResult {
  switch (context) {
    case 'notes':
      return processNotesEditResult(result);
    case 'messenger':
      if (!messengerOptions) {
        throw new Error('Messenger options required for messenger context');
      }
      return processMessengerEditResult(result, messengerOptions);
    default:
      return result;
  }
}

// ─── Original Image Preservation ───────────────────────────────

/**
 * Build the path for the original image backup.
 * Original images are always preserved in a dedicated directory.
 */
export function buildOriginalBackupPath(
  originalUri: string,
  context: EditorContext
): string {
  const timestamp = Date.now();
  const extension = originalUri.split('.').pop() ?? 'jpg';
  return `edited/${context}/${timestamp}_original.${extension}`;
}

/**
 * Build the path for the edited image.
 */
export function buildEditedImagePath(
  originalUri: string,
  context: EditorContext
): string {
  const timestamp = Date.now();
  const extension = originalUri.split('.').pop() ?? 'jpg';
  return `edited/${context}/${timestamp}_edited.${extension}`;
}

/**
 * Verify that the original image is still intact after editing
 */
export async function verifyOriginalIntact(
  originalUri: string,
  originalHash: string,
  hashFn: (uri: string) => Promise<string>
): Promise<boolean> {
  try {
    const currentHash = await hashFn(originalUri);
    return currentHash === originalHash;
  } catch {
    return false;
  }
}
