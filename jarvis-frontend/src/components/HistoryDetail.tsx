import { useEffect, useState, type FC } from 'react';
import { supabase, type Session, type Message } from '../lib/supabaseClient';

interface HistoryDetailProps {
  session: Session;
  onClose: () => void;
}

const HistoryDetail: FC<HistoryDetailProps> = ({ session, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase!
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('[JARVIS] Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [session.id]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2
              className="text-lg font-semibold text-jarvis-text-primary"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {session.title || 'Conversation'}
            </h2>
            <p className="text-xs text-jarvis-text-secondary mt-1">
              {formatDate(session.started_at)}
              {session.ended_at && ` · ${formatTime(session.started_at)} – ${formatTime(session.ended_at)}`}
            </p>
          </div>
          <button
            className="btn-ghost px-3 py-1.5 rounded-lg text-sm"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-jarvis-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <p className="text-jarvis-text-secondary text-sm text-center py-8 italic">
              No messages in this conversation.
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-jarvis-accent/15 border border-jarvis-accent/20 rounded-br-md'
                    : 'bg-jarvis-core/10 border border-jarvis-core/15 rounded-bl-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[0.65rem] font-bold tracking-wider uppercase ${
                      msg.role === 'user' ? 'text-jarvis-accent' : 'text-jarvis-core'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {msg.role === 'user' ? 'You' : 'Jarvis'}
                  </span>
                  <span className="text-[0.6rem] text-jarvis-text-secondary">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm text-jarvis-text-primary leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;
