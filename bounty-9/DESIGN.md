# Audio Notes — Design Document

## Overview

Audio Notes brings full voice-recording, playback, transcription, and management capabilities to the warpSpeed Notes experience. Users can quickly capture voice memos, view automatic transcriptions, search across audio content, and manage recordings — all from a React Native mobile surface backed by a serverless API.

## Architecture

```
┌──────────────────────────┐     ┌──────────────────────────┐
│    React Native Client    │     │   Cloudflare Workers API │
│  ┌────────────────────┐   │     │  ┌──────────────────┐   │
│  │ AudioRecorder      │───┼─────┼──│ POST /upload      │   │
│  │ AudioPlayer        │   │     │  │ POST /transcribe  │   │
│  │ TranscriptionView  │   │     │  │ GET  /notes       │   │
│  └────────────────────┘   │     │  │ DELETE /notes/:id  │   │
│           │               │     │  └──────────────────┘   │
│           ▼               │     │           │              │
│  ┌────────────────────┐   │     │           ▼              │
│  │ api.ts (client)    │───┼─────┼───►  R2 Storage         │
│  └────────────────────┘   │     │  ┌──────────────────┐   │
│                           │     │  │ audio/*.webm      │   │
│                           │     │  │ transcriptions/*  │   │
│                           │     │  └──────────────────┘   │
│                           │     │           │              │
│                           │     │           ▼              │
│                           │     │  D1 (SQLite)            │
│                           │     │  ┌──────────────────┐   │
│                           │     │  │ audio_notes       │   │
│                           │     │  │ transcripts       │   │
│                           │     │  └──────────────────┘   │
└──────────────────────────┘     └──────────────────────────┘
```

### Data Flow

1. **Recording** → `AudioRecorder` captures PCM/WAV → streams to `POST /upload` → stored in R2 → record inserted into D1.
2. **Transcription** → `POST /transcribe` triggers Whisper (Workers AI) → result stored in D1 → WebSocket push to client.
3. **Playback** → `AudioPlayer` requests signed URL from `GET /notes/:id/url` → streams audio via `expo-av`.
4. **Management** → `GET /notes` (paginated) and `DELETE /notes/:id` (cascades to R2 + D1).

## Data Model

### `audio_notes` table (D1)

| Column       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `id`        | TEXT PK  | UUID v7                                  |
| `title`     | TEXT     | User-facing title (nullable, auto-set)   |
| `duration_ms`| INTEGER | Recording length in ms                   |
| `file_key`  | TEXT     | R2 object key (e.g. `audio/<uuid>.webm`) |
| `file_size` | INTEGER  | Bytes                                    |
| `mime_type` | TEXT     | `audio/webm` or `audio/wav`              |
| `created_at`| TEXT     | ISO-8601 timestamp                       |
| `updated_at`| TEXT     | ISO-8601 timestamp                       |
| `archived`  | INTEGER  | Soft-delete flag (0/1)                   |

### `transcripts` table (D1)

| Column       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `id`        | TEXT PK  | UUID v7                                  |
| `note_id`   | TEXT FK  | References `audio_notes.id`              |
| `text`      | TEXT     | Full transcript                          |
| `segments`  | TEXT     | JSON array of `{start, end, text}`       |
| `model`     | TEXT     | Whisper model variant (`base`, `large`)  |
| `confidence`| REAL     | 0.0–1.0                                  |
| `language`  | TEXT     | Detected language code (e.g. `en`)       |
| `created_at`| TEXT     | ISO-8601 timestamp                       |

## Component Tree

```
<AudioNotesScreen>
  ├── <AudioRecorder />           (record/stop/permissions)
  ├── <FlatList>
  │   └── <AudioNoteCard>
  │       ├── <AudioPlayer />     (play/pause/seek/scrub)
  │       └── <TranscriptionView /> (collapsible transcript)
  └── <FAB>                       (new recording)
```

## Key Decisions

| Decision | Rationale |
|---------|----------|
| **expo-av** for playback | Mature, cross-platform, supports streaming URLs |
| **expo-audio-record** (or Expo Audio API) | Stable recording API with PCM/WAV output |
| **Cloudflare Workers + R2 + D1** | Warpspeed's stack; edge-close, no cold starts for audio |
| **WebSocket for transcription status** | Whisper takes 1–10s; avoid polling |
| **Chunked upload** | Large recordings (>10 MB) streamed in 64 KB chunks |
| **Soft-delete** | Prevents accidental permanent data loss |
| **Signed URLs** | Avoids public R2 buckets; 1-hour expiry |

## Error States

- **Permission denied** → show grant-permission CTA with `Linking.openSettings()`
- **Upload failure** → retry with exponential backoff (3 attempts); save blob locally for later sync
- **Transcription failure** → show "Transcription failed — tap to retry" inline on the card
- **Network offline** → `NetInfo` detection; recordings saved to local filesystem; queued for upload
- **Storage full** → warn user before recording starts
- **Audio decode error** → fallback to "unsupported format" message

## Security & Privacy

- All audio files stored in private R2 bucket.
- Signed URLs expire in 60 minutes.
- Transcriptions never leave the user's org boundary.
- Recording requires explicit microphone permission (iOS `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO`).
- `archived` flag respected in all list queries — no accidental data leaks.

## Performance Targets

- **Record start latency** < 200 ms from button press
- **Upload 1 min audio** < 5 s (on LTE)
- **Transcription (1 min audio)** < 10 s p50
- **Playback start** < 300 ms (signed URL + buffer)
- **List load (50 items)** < 500 ms (D1 query + signed URLs parallelized)
