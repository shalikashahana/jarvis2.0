import { useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseConversationLoggerReturn {
  startSession: (roomName: string) => Promise<string | null>;
  logMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  endSession: () => Promise<void>;
  sessionId: string | null;
}

export function useConversationLogger(): UseConversationLoggerReturn {
  const sessionIdRef = useRef<string | null>(null);
  const loggedContentRef = useRef<Set<string>>(new Set());

  const startSession = useCallback(async (roomName: string): Promise<string | null> => {
    if (!supabase) {
      console.warn('[JARVIS] Supabase not configured — skipping session creation');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ room_name: roomName })
        .select('id')
        .single();

      if (error) throw error;

      sessionIdRef.current = data.id;
      loggedContentRef.current = new Set();
      return data.id;
    } catch (err) {
      console.error('[JARVIS] Failed to create session:', err);
      return null;
    }
  }, []);

  const logMessage = useCallback(async (role: 'user' | 'assistant', content: string): Promise<void> => {
    if (!supabase || !sessionIdRef.current) return;

    // Deduplicate: don't re-insert the same content for the same role in the same session
    const dedupeKey = `${role}:${content}`;
    if (loggedContentRef.current.has(dedupeKey)) return;
    loggedContentRef.current.add(dedupeKey);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionIdRef.current,
          role,
          content,
        });

      if (error) throw error;
    } catch (err) {
      console.error('[JARVIS] Failed to log message:', err);
    }
  }, []);

  const endSession = useCallback(async (): Promise<void> => {
    if (!supabase || !sessionIdRef.current) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionIdRef.current);

      if (error) throw error;
    } catch (err) {
      console.error('[JARVIS] Failed to end session:', err);
    } finally {
      sessionIdRef.current = null;
      loggedContentRef.current = new Set();
    }
  }, []);

  return {
    startSession,
    logMessage,
    endSession,
    sessionId: sessionIdRef.current,
  };
}
