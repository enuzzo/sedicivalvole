// Local research notes: stable source codes plus hashes prevent silent reassignment.
export const STORAGE_KEY = 'sedicivalvole.engine-listening-room.v1';
export const RATINGS = ['', 'Keep', 'Maybe', 'Reject'];

export function readNotes(storage, catalog) {
  const source = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  const result = {};
  for (const item of catalog) {
    const note = source[item.code];
    if (note && note.sha256 === item.sha256 && typeof note.comment === 'string' && RATINGS.includes(note.rating)) {
      result[item.code] = {
        sha256: item.sha256, comment: note.comment.slice(0, 2000), rating: note.rating,
        updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : '',
      };
    }
  }
  return result;
}

export function exportNotes(catalog, notes) {
  return {
    schema: 'sedicivalvole.engine-listening-notes.v1',
    exportedAt: new Date().toISOString(),
    playbackSpeed: 1,
    notes: catalog.filter(item => notes[item.code]?.comment || notes[item.code]?.rating).map(item => ({
      code: item.code, title: item.title, sourceSha256: item.sha256,
      sourceUrl: item.sourceUrl, preparation: item.note, ...notes[item.code],
    })),
  };
}
