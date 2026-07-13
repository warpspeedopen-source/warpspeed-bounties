# Audio Notes — warpSpeed Bounty #9

[![Status](https://img.shields.io/badge/status-reference%20implementation-blue)]()

Full audio-note recording, playback, transcription, and management support for the warpSpeed Notes experience.

**Bounty:** $750  
**Type:** Reference Implementation  
**Stack:** React Native (Expo) + Cloudflare Workers + R2 + D1 + Workers AI (Whisper)

---

## What's Included

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full architecture, data model, component tree, security/privacy, performance targets |
| `types.ts` | All TypeScript types: `AudioNote`, `RecordingState`, `PlaybackState`, `Transcription`, API DTOs, WebSocket events |
| `components/AudioRecorder.tsx` | Reusable recording component with permissions, timer, error handling, discard flow |
| `components/AudioPlayer.tsx` | Playback component with play/pause, seek ±15s, variable speed, mute, progress bar |
| `components/TranscriptionView.tsx` | Collapsible transcription display with segment list, language/confidence badges, low-confidence warning |
| `api.ts` | Full API client: CRUD notes, chunked upload, transcription (polling + WebSocket), signed URLs |

---

## Quick Start

```bash
# Install dependencies
npm install expo-av expo-file-system

# Copy the files into your project:
#   cp -r components/ types.ts api.ts src/audio-notes/

# Initialize the API client (app entry point)
import { initApi } from './api';

initApi({
  baseUrl: 'https://api.warpspeed.dev',
  token: 'your-jwt-token',
});
```

## Usage

### Record an audio note

```tsx
import { AudioRecorder } from './components/AudioRecorder';
import { useApi } from './api';

function RecordScreen() {
  const api = useApi();

  return (
    <AudioRecorder
      onRecordingComplete={async (uri, durationMs, mimeType) => {
        await api.createAndUpload(
          { durationMs, mimeType, fileSize: 0 },
          uri,
          (progress) => console.log('Upload:', progress),
        );
      }}
    />
  );
}
```

### Play back an audio note

```tsx
import { AudioPlayer } from './components/AudioPlayer';

<AudioPlayer
  source={playbackUrl}
  initialRate={1}
  onPlaybackComplete={() => console.log('Done')}
/>
```

### Display transcription

```tsx
import { TranscriptionView } from './components/TranscriptionView';

<TranscriptionView
  transcription={transcription}
  status={transcription?.status ?? 'pending'}
  onRetry={() => api.transcribeNote(noteId)}
  onSegmentPress={(start) => player.seek(start * 1000)}
/>
```

---

## API Endpoints (Server-Side stubs needed)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notes` | List notes (paginated, ?cursor, ?limit, ?includeArchived) |
| `POST` | `/notes` | Create note + return signed upload URL |
| `GET` | `/notes/:id` | Get single note |
| `DELETE` | `/notes/:id` | Soft-delete (archive) note |
| `PATCH` | `/notes/:id/archive` | Set archived flag |
| `PATCH` | `/notes/:id/restore` | Clear archived flag |
| `POST` | `/notes/:id/transcribe` | Trigger Whisper transcription |
| `GET` | `/notes/:id/transcription` | Get transcription result |
| `GET` | `/notes/:id/playback-url` | Get signed playback URL (1hr expiry) |
| `WS` | `/notes/:id/transcribe/ws` | WebSocket for real-time transcription updates |

### Worker Implementation Guidance

Refer to `DESIGN.md` for the D1 schema and R2 object layout. The server should:

1. Generate pre-signed R2 PUT URLs on `POST /notes`
2. Run Workers AI `@cf/openai/whisper` on `POST /notes/:id/transcribe`
3. Push transcription progress via WebSocket (Durable Objects or `ws` channel)
4. Generate pre-signed R2 GET URLs for `GET /notes/:id/playback-url`
5. List with cursor-based pagination from D1

---

## Testing

```bash
# Unit tests (add Jest + Testing Library)
npm test

# Lint
npx eslint components/ types.ts api.ts
```

---

## License

MIT — part of the warpSpeed Bounty Program.
