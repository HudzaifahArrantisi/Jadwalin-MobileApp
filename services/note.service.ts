// ============================================
// Jadwalin App — Note (Daftar Saya) Service
// ============================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  NoteList,
  NoteItem,
  CreateNoteListInput,
  UpdateNoteListInput,
} from '@/types/task.types';

// ──── Helpers ────

function notesRef(userId: string) {
  return collection(db, 'users', userId, 'notes');
}

function docToNote(docSnap: any): NoteList {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || '',
    emoji: data.emoji || '📝',
    color: data.color || '#7C3AED',
    type: data.type || 'list',
    content: data.content || '',
    items: (data.items || []).map((item: any, idx: number) => ({
      id: item.id || `item-${idx}`,
      text: item.text || '',
      completed: item.completed ?? false,
      order: item.order ?? idx,
    })),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// ──── CRUD Operations ────

/** Create a new note list */
export async function createNoteList(
  userId: string,
  input: CreateNoteListInput
): Promise<NoteList> {
  const now = serverTimestamp();
  const noteData: any = {
    title: input.title.trim(),
    emoji: input.emoji,
    color: input.color,
    type: input.type || 'list',
    items: input.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      text: item.text,
      completed: item.completed,
      order: item.order,
    })),
    createdAt: now,
    updatedAt: now,
  };

  if (input.content !== undefined) noteData.content = input.content;

  const docRef = await addDoc(notesRef(userId), noteData);

  return {
    ...noteData,
    id: docRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as NoteList;
}

/** Update a note list */
export async function updateNoteList(
  userId: string,
  noteId: string,
  input: UpdateNoteListInput
): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.emoji !== undefined) updateData.emoji = input.emoji;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.items !== undefined) updateData.items = input.items;

  await updateDoc(noteRef, updateData);
}

/** Delete a note list */
export async function deleteNoteList(
  userId: string,
  noteId: string
): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await deleteDoc(noteRef);
}

/** Fetch all note lists (one-time) */
export async function fetchNoteLists(userId: string): Promise<NoteList[]> {
  const q = query(notesRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToNote);
}

/** Subscribe to realtime note list updates */
export function subscribeToNoteLists(
  userId: string,
  callback: (notes: NoteList[]) => void
): () => void {
  const q = query(notesRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(docToNote);
    callback(notes);
  });
}
