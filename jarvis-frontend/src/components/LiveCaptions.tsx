import { useEffect, useRef, type FC } from 'react';

export interface CaptionLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
  timestamp: number;
}

interface LiveCaptionsProps {
  captions: CaptionLine[];
  isConnected: boolean;
}

const LiveCaptions: FC<LiveCaptionsProps> = ({ captions, isConnected }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions]);

  if (!isConnected && captions.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel w-full max-w-xl mx-auto mt-6 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-jarvis-core/60" />
        <span
          className="text-xs font-semibold tracking-widest uppercase text-jarvis-text-secondary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Live Transcript
        </span>
      </div>

      {/* Captions area */}
      <div
        ref={scrollRef}
        className="px-4 py-3 max-h-48 overflow-y-auto space-y-2"
      >
        {captions.length === 0 && isConnected && (
          <p className="text-jarvis-text-secondary text-sm italic text-center py-4 opacity-60">
            Waiting for conversation…
          </p>
        )}

        {captions.map((caption, idx) => (
          <div
            key={caption.id}
            className="animate-fade-in-up flex gap-2 text-sm leading-relaxed"
            style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
          >
            <span
              className={`font-semibold shrink-0 ${
                caption.role === 'user'
                  ? 'text-jarvis-accent'
                  : 'text-jarvis-core'
              }`}
              style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', marginTop: '2px' }}
            >
              {caption.role === 'user' ? 'YOU' : 'JARVIS'}
            </span>
            <span
              className={`${
                caption.isFinal
                  ? 'text-jarvis-text-primary'
                  : 'text-jarvis-text-secondary italic'
              }`}
            >
              {caption.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveCaptions;
