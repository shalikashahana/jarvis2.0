import { useEffect, useState, type FC } from 'react';
import { supabase, type Session } from '../lib/supabaseClient';

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (session: Session) => void;
  selectedSessionId?: string | null;
}

interface SessionWithCount extends Session {
  message_count?: number;
}

const HistorySidebar: FC<HistorySidebarProps> = ({
  isOpen,
  onToggle,
  onSelectSession,
  selectedSessionId,
}) => {
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch sessions from Supabase
  useEffect(() => {
    if (!supabase) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase!
          .from('sessions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Fetch message counts for each session
        if (data && data.length > 0) {
          const sessionsWithCounts = await Promise.all(
            data.map(async (session) => {
              const { count } = await supabase!
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session.id);
              return { ...session, message_count: count ?? 0 };
            })
          );
          setSessions(sessionsWithCounts);
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.error('[JARVIS] Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return '<1 min';
    return `${mins} min`;
  };

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        id="btn-history-toggle"
        className="fixed left-4 top-4 z-50 btn-ghost p-2 rounded-lg md:hidden"
        onClick={onToggle}
        title="Toggle history"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 glass-panel rounded-none border-l-0 border-t-0 border-b-0 
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative md:z-auto`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2
            className="text-sm font-semibold tracking-widest uppercase text-jarvis-text-secondary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            History
          </h2>
          <button
            className="btn-ghost p-1 rounded-md text-xs md:hidden"
            onClick={onToggle}
          >
            ✕
          </button>
        </div>

        {/* Sessions List */}
        <div className="overflow-y-auto h-[calc(100%-56px)] p-2">
          {!supabase && (
            <p className="text-jarvis-text-secondary text-xs p-3 text-center">
              Supabase not configured.
              <br />History is unavailable.
            </p>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-jarvis-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {!loading && sessions.length === 0 && supabase && (
            <p className="text-jarvis-text-secondary text-xs p-3 text-center italic">
              No conversations yet.
            </p>
          )}

          {sessions.map((session) => (
            <button
              key={session.id}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-200 hover:bg-white/5 ${
                selectedSessionId === session.id
                  ? 'bg-jarvis-accent/10 border border-jarvis-accent/30'
                  : 'border border-transparent'
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-jarvis-text-secondary">
                  {formatDate(session.started_at)}
                </span>
                <span className="text-xs text-jarvis-text-secondary">
                  {formatDuration(session.started_at, session.ended_at)}
                </span>
              </div>
              <p className="text-sm text-jarvis-text-primary truncate">
                {session.title || session.room_name}
              </p>
              {session.message_count !== undefined && (
                <span className="text-xs text-jarvis-text-secondary mt-1 block">
                  {session.message_count} messages
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;
