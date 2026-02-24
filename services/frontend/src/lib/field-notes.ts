/**
 * Field-level note persistence — localStorage-backed per-member notes keyed by
 * memberId:stageId:fieldLabel composite key.
 * Consumed by: FieldNote.tsx, AnnotatedField.tsx
 * Depends on: Nothing (pure utility)
 */

function storageKey(memberId: string): string {
  return `noui:notes:${memberId}`
}

function noteKey(stageId: string, fieldLabel: string): string {
  return `${stageId}:${fieldLabel}`
}

interface NotesMap {
  [compositeKey: string]: string
}

function readNotes(memberId: string): NotesMap {
  try {
    const raw = localStorage.getItem(storageKey(memberId))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveNotes(memberId: string, notes: NotesMap) {
  localStorage.setItem(storageKey(memberId), JSON.stringify(notes))
}

export function getNote(memberId: string, stageId: string, fieldLabel: string): string | null {
  const notes = readNotes(memberId)
  return notes[noteKey(stageId, fieldLabel)] ?? null
}

export function setNote(memberId: string, stageId: string, fieldLabel: string, text: string) {
  const notes = readNotes(memberId)
  notes[noteKey(stageId, fieldLabel)] = text
  saveNotes(memberId, notes)
}

export function deleteNote(memberId: string, stageId: string, fieldLabel: string) {
  const notes = readNotes(memberId)
  delete notes[noteKey(stageId, fieldLabel)]
  saveNotes(memberId, notes)
}

export function getNotesForMember(memberId: string): NotesMap {
  return readNotes(memberId)
}
