import { type FC } from 'react';

interface CallControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  error?: string | null;
}

const CallControls: FC<CallControlsProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  onConnect,
  onDisconnect,
  onToggleMute,
  error,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {/* Main action buttons */}
      <div className="flex items-center gap-3">
        {!isConnected ? (
          <button
            id="btn-activate"
            className="btn-cta px-8 py-3 rounded-full text-sm font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting…
              </span>
            ) : (
              'Activate Jarvis'
            )}
          </button>
        ) : (
          <>
            {/* Mute toggle */}
            <button
              id="btn-mute"
              className={`btn-ghost px-5 py-3 rounded-full text-sm font-medium tracking-wide transition-all ${
                isMuted ? 'bg-red-500/20 border-red-500/40 text-red-300' : ''
              }`}
              onClick={onToggleMute}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  Muted
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 1a3 3 0 00-3 3v4a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  </svg>
                  Mic On
                </span>
              )}
            </button>

            {/* Disconnect */}
            <button
              id="btn-disconnect"
              className="btn-danger px-5 py-3 rounded-full text-sm font-medium tracking-wide"
              onClick={onDisconnect}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                End Call
              </span>
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="animate-fade-in-up glass-panel-subtle px-4 py-2 text-sm text-red-300 max-w-md text-center">
          <span className="font-medium">⚠ </span>
          {error}
        </div>
      )}
    </div>
  );
};

export default CallControls;
