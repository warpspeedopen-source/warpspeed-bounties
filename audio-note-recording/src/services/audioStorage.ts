export async function saveAudioNote(uri: string, title: string, tags?: string[]) {
  return { id: Date.now().toString(), uri, title, tags, createdAt: new Date() };
}
export async function getAudioNotes() { return []; }
export async function deleteAudioNote(id: string) { return true; }
