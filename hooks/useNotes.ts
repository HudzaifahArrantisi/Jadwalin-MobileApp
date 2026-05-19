// ============================================
// Jadwalin App — useNotes Hook
// ============================================

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import {
  subscribeToNoteLists,
  createNoteList as createNoteService,
  updateNoteList as updateNoteService,
  deleteNoteList as deleteNoteService,
} from '@/services/note.service';
import {
  NoteList,
  NoteItem,
  CreateNoteListInput,
  UpdateNoteListInput,
} from '@/types/task.types';

export function useNotes() {
  const {
    notes,
    notesLoading,
    user,
    setNotes,
    setNotesLoading,
    setError,
    setOffline,
  } = useTaskStore();

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.uid) return;

    setNotesLoading(true);
    const unsubscribe = subscribeToNoteLists(
      user.uid,
      (updatedNotes) => {
        setNotes(updatedNotes);
        setNotesLoading(false);
        setOffline(false);
        setError(null);
      },
      (subscriptionError, isOffline) => {
        setNotesLoading(false);
        setOffline(isOffline);
        setError(subscriptionError.message);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // ──── Actions ────

  const addNote = useCallback(
    async (input: CreateNoteListInput) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        const note = await createNoteService(user.uid, input);
        return note;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid]
  );

  const editNote = useCallback(
    async (noteId: string, input: UpdateNoteListInput) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        await updateNoteService(user.uid, noteId, input);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid]
  );

  const removeNote = useCallback(
    async (noteId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        await deleteNoteService(user.uid, noteId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid]
  );

  const toggleNoteItem = useCallback(
    async (noteId: string, itemId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const updatedItems = note.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      try {
        await updateNoteService(user.uid, noteId, { items: updatedItems });
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid, notes]
  );

  // ──── Stats ────
  const stats = {
    total: notes.length,
    totalItems: notes.reduce((acc, n) => acc + n.items.length, 0),
    completedItems: notes.reduce(
      (acc, n) => acc + n.items.filter((i) => i.completed).length,
      0
    ),
  };

  return {
    notes,
    notesLoading,
    stats,
    addNote,
    editNote,
    removeNote,
    toggleNoteItem,
  };
}
