import type {
  AudioNote,
  CreateNoteRequest,
  GetTranscriptionResponse,
  ListNotesResponse,
  TranscribeResponse,
  Transcription,
  UploadResponse,
} from './types';

// ─── Configuration ────────────────────────────────────────────────────

export interface ApiConfig {
  /** Base URL for the warpSpeed Notes API (e.g. `https://api.example.com`) */
  baseUrl: string;
  /** Auth token (JWT for Warpspeed Auth) */
  token: string;
  /** Optional fetch implementation (for testing / Node environments) */
  fetch?: typeof globalThis.fetch;
  /** Request timeout in milliseconds (default 30s) */
  timeoutMs?: number;
}

// ─── API Error ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const buildHeaders = (config: ApiConfig): Record<string, string> => ({
  Authorization: `Bearer ${config.token}`,
  'Content-Type': 'application/json',
  'User-Agent': 'warpspeed-audio-notes/1.0',
});

const buildUrl = (base: string, path: string): string => {
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}${path.startsWith('/') ? path : `/${path}`}`;
};

async function request<T>(
  config: ApiConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = buildUrl(config.baseUrl, path);
  const fetcher = config.fetch ?? globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? 30_000,
  );

  try {
    const response = await fetcher(url, {
      ...init,
      headers: {
        ...buildHeaders(config),
        ...(init.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
      throw new ApiError(
        response.status,
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as Record<string, unknown>).message)
          : `Request failed with status ${response.status}`,
        body,
      );
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── API Client ───────────────────────────────────────────────────────

export const createApiClient = (config: ApiConfig) => {
  // ── Notes ──────────────────────────────────────────────────────

  const listNotes = async (
    options?: { cursor?: string; limit?: number; includeArchived?: boolean },
  ): Promise<ListNotesResponse> => {
    const params = new URLSearchParams();
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.includeArchived) params.set('includeArchived', 'true');

    const qs = params.toString();
    return request<ListNotesResponse>(config, `/notes${qs ? `?${qs}` : ''}`);
  };

  const getNote = async (id: string): Promise<AudioNote> => {
    return request<AudioNote>(config, `/notes/${id}`);
  };

  /**
   * Create a note record and get a pre-signed upload URL.
   * After calling this, upload the audio file to `uploadUrl` via PUT.
   */
  const createNote = async (
    data: CreateNoteRequest,
  ): Promise<UploadResponse> => {
    return request<UploadResponse>(config, '/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  /**
   * Upload audio file bytes to the pre-signed URL returned from `createNote`.
   * This is a raw binary PUT — not JSON.
   */
  const uploadAudio = async (
    uploadUrl: string,
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> => {
    const fetcher = config.fetch ?? globalThis.fetch;

    // Read file as blob
    const response = await fetcher(fileUri);
    const blob = await response.blob();

    // For progress reporting, we chunk the upload
    const CHUNK_SIZE = 64 * 1024; // 64 KB
    const totalSize = blob.size;
    let uploadedBytes = 0;

    if (totalSize <= CHUNK_SIZE || !blob.stream) {
      // Small file or no streaming support — single PUT
      const uploadResponse = await fetcher(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': mimeType },
      });
      if (!uploadResponse.ok) {
        throw new ApiError(
          uploadResponse.status,
          'Audio upload failed',
        );
      }
      onProgress?.(1);
      return;
    }

    // Chunked upload for large files
    const reader = blob.stream().getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      uploadedBytes += value.length;
      onProgress?.(uploadedBytes / totalSize);
    }

    // Concatenate chunks and upload
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const finalResponse = await fetcher(uploadUrl, {
      method: 'PUT',
      body: new Blob([combined], { type: mimeType }),
      headers: { 'Content-Type': mimeType },
    });

    if (!finalResponse.ok) {
      throw new ApiError(
        finalResponse.status,
        'Audio upload failed after chunking',
      );
    }
    onProgress?.(1);
  };

  /**
   * High-level helper: create note + upload audio in one call.
   */
  const createAndUpload = async (
    data: CreateNoteRequest,
    fileUri: string,
    onProgress?: (progress: number) => void,
  ): Promise<AudioNote> => {
    const { note, uploadUrl } = await createNote(data);
    await uploadAudio(uploadUrl, fileUri, data.mimeType, onProgress);
    return note;
  };

  const deleteNote = async (id: string): Promise<void> => {
    return request<void>(config, `/notes/${id}`, { method: 'DELETE' });
  };

  const archiveNote = async (id: string): Promise<AudioNote> => {
    return request<AudioNote>(config, `/notes/${id}/archive`, {
      method: 'PATCH',
    });
  };

  const restoreNote = async (id: string): Promise<AudioNote> => {
    return request<AudioNote>(config, `/notes/${id}/restore`, {
      method: 'PATCH',
    });
  };

  // ── Transcription ──────────────────────────────────────────────

  /** Request transcription for a note. Returns immediately; transcription is async. */
  const transcribeNote = async (
    noteId: string,
  ): Promise<TranscribeResponse> => {
    return request<TranscribeResponse>(
      config,
      `/notes/${noteId}/transcribe`,
      { method: 'POST' },
    );
  };

  const getTranscription = async (
    noteId: string,
  ): Promise<GetTranscriptionResponse> => {
    return request<GetTranscriptionResponse>(
      config,
      `/notes/${noteId}/transcription`,
    );
  };

  /**
   * Poll for transcription completion.
   * Useful when WebSocket is unavailable. Polls every 2s, up to `maxAttempts`.
   */
  const pollTranscription = async (
    noteId: string,
    maxAttempts = 30,
    intervalMs = 2000,
  ): Promise<Transcription> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { transcription } = await getTranscription(noteId);
      if (transcription && transcription.status === 'completed') {
        return transcription;
      }
      if (transcription && transcription.status === 'failed') {
        throw new Error(
          `Transcription failed for note ${noteId}`,
        );
      }
      await sleep(intervalMs);
    }
    throw new Error(
      `Transcription polling timed out for note ${noteId} after ${maxAttempts} attempts`,
    );
  };

  // ── Signed URL ────────────────────────────────────────────────

  const getPlaybackUrl = async (
    noteId: string,
  ): Promise<{ url: string; expiresAt: string }> => {
    return request<{ url: string; expiresAt: string }>(
      config,
      `/notes/${noteId}/playback-url`,
    );
  };

  // ── WebSocket (transcription streaming) ───────────────────────

  /**
   * Connect to the transcription WebSocket for real-time status updates.
   * Returns an unsubscribe function.
   */
  const subscribeTranscription = (
    noteId: string,
    onEvent: (event: {
      type: string;
      noteId: string;
      progress?: number;
      transcription?: Transcription;
      error?: string;
    }) => void,
  ): (() => void) => {
    const protocol = config.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${config.baseUrl.replace(/^https?:\/\//, '')}/notes/${noteId}/transcribe/ws`;

    const ws = new WebSocket(wsUrl);
    let closed = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: config.token }));
    };

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        onEvent(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      if (!closed) {
        onEvent({
          type: 'transcription.failed',
          noteId,
          error: 'WebSocket connection error',
        });
      }
    };

    ws.onclose = () => {
      closed = true;
    };

    return () => {
      closed = true;
      ws.close();
    };
  };

  return {
    listNotes,
    getNote,
    createNote,
    uploadAudio,
    createAndUpload,
    deleteNote,
    archiveNote,
    restoreNote,
    transcribeNote,
    getTranscription,
    pollTranscription,
    getPlaybackUrl,
    subscribeTranscription,
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;

// ─── Default instance (singleton) ─────────────────────────────────────

let defaultClient: ApiClient | null = null;

/** Initialize the default API client (call once at app startup). */
export const initApi = (config: ApiConfig): ApiClient => {
  defaultClient = createApiClient(config);
  return defaultClient;
};

/** Get the default API client. Throws if `initApi` was not called. */
export const getApi = (): ApiClient => {
  if (!defaultClient) {
    throw new Error(
      'API client not initialized. Call `initApi(config)` first.',
    );
  }
  return defaultClient;
};
