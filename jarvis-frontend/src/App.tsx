import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  RoomEvent,
  type TranscriptionSegment,
  ConnectionState,
} from 'livekit-client';
import { useState, useCallback, useEffect, useRef } from 'react';

import ArcReactor, { type ReactorState } from './components/ArcReactor';
import CallControls from './components/CallControls';
import LiveCaptions, { type CaptionLine } from './components/LiveCaptions';
import HistorySidebar from './components/HistorySidebar';
import HistoryDetail from './components/HistoryDetail';
import { useLiveKitToken } from './hooks/useLiveKitToken';
import { useConversationLogger } from './hooks/useConversationLogger';
import { type Session } from './lib/supabaseClient';

/* ═══════════════════════════════════════════════════════════════
   Top-level App — manages connection lifecycle
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const { token, url, roomName, isLoading, error, fetchToken, reset } = useLiveKitToken();
  const logger = useConversationLogger();

  const [shouldConnect, setShouldConnect] = useState(false);
  const [captions, setCaptions] = useState<CaptionLine[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Handle connect
  const handleConnect = useCallback(async () => {
    setConnectionError(null);
    setCaptions([]);
    const result = await fetchToken();
    if (result) {
      setShouldConnect(true);
    }
  }, [fetchToken]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    setShouldConnect(false);
    await logger.endSession();
    reset();
  }, [logger, reset]);

  // Handle room connection
  const handleConnected = useCallback(async () => {
    if (roomName) {
      await logger.startSession(roomName);
    }
  }, [roomName, logger]);

  // Handle disconnection events
  const handleRoomDisconnected = useCallback(() => {
    setShouldConnect(false);
    logger.endSession();
  }, [logger]);

  // Handle errors
  const displayError = connectionError || error;

  return (
    <div className="min-h-screen flex">
      {/* History Sidebar */}
      <HistorySidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectSession={(session) => {
          setSelectedSession(session);
          setSidebarOpen(false);
        }}
        selectedSessionId={selectedSession?.id}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center relative">
        {/* Top Bar */}
        <header className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile history toggle */}
            <button
              className="btn-ghost p-2 rounded-lg md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Desktop history toggle */}
            <button
              className="btn-ghost p-2 rounded-lg hidden md:block"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle history"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* JARVIS Wordmark */}
          <div className="flex items-center gap-3">
            <h1
              className="text-xl font-bold tracking-[0.3em] text-glow"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              JARVIS
            </h1>
            <span
              className={`status-dot ${
                shouldConnect && token ? 'connected' : isLoading ? 'connecting' : 'disconnected'
              }`}
            />
          </div>

          {/* Spacer for centering */}
          <div className="w-12" />
        </header>

        {/* LiveKit Room Provider */}
        {token && url ? (
          <LiveKitRoom
            serverUrl={url}
            token={token}
            connect={shouldConnect}
            audio={true}
            video={false}
            onConnected={handleConnected}
            onDisconnected={handleRoomDisconnected}
            onError={(err) => {
              console.error('[JARVIS] Room error:', err);
              setConnectionError(err?.message || 'Connection lost');
            }}
          >
            <RoomAudioRenderer />
            <RoomContent
              captions={captions}
              setCaptions={setCaptions}
              onDisconnect={handleDisconnect}
              logMessage={logger.logMessage}
              error={displayError}
            />
          </LiveKitRoom>
        ) : (
          /* Not connected — show idle state */
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
            <ArcReactor state="disconnected" size={360} />
            <CallControls
              isConnected={false}
              isConnecting={isLoading}
              isMuted={false}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onToggleMute={() => {}}
              error={displayError}
            />
          </div>
        )}
      </main>

      {/* History Detail Modal */}
      {selectedSession && (
        <HistoryDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RoomContent — Lives inside <LiveKitRoom>, has access to hooks
   ═══════════════════════════════════════════════════════════════ */
interface RoomContentProps {
  captions: CaptionLine[];
  setCaptions: React.Dispatch<React.SetStateAction<CaptionLine[]>>;
  onDisconnect: () => void;
  logMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  error?: string | null;
}

function RoomContent({ captions, setCaptions, onDisconnect, logMessage, error }: RoomContentProps) {
  const voiceAssistant = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);

  // Derive reactor state from agent state
  const reactorState: ReactorState = (() => {
    if (room.state !== ConnectionState.Connected) return 'disconnected';
    const agentState = voiceAssistant.state;
    if (agentState === 'speaking') return 'speaking';
    if (agentState === 'thinking') return 'thinking';
    if (agentState === 'listening') return 'listening';
    return 'idle';
  })();

  // Audio volume analysis for reactor animation (via refs, not state re-renders)
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Monitor agent's audio track for volume
    const agentAudioTrack = voiceAssistant.audioTrack;
    if (!agentAudioTrack?.publication?.track?.mediaStreamTrack) {
      setVolume(0);
      return;
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const mediaStreamTrack = agentAudioTrack.publication?.track?.mediaStreamTrack;
    if (!mediaStreamTrack) return;
    
    const source = audioContext.createMediaStreamSource(
      new MediaStream([mediaStreamTrack])
    );
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let rafId: number;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      setVolume(Math.min(avg / 128, 1)); // Normalize 0–1
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      audioContext.close();
      analyserRef.current = null;
      audioContextRef.current = null;
    };
  }, [voiceAssistant.audioTrack]);

  // Subscribe to transcription events for both user and agent
  useEffect(() => {
    if (!room) return;

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: any,
      _publication?: any
    ) => {
      for (const segment of segments) {
        if (!segment.text.trim()) continue;

        // Determine if this is from the agent or the user
        const isAgent = participant?.identity !== localParticipant.identity;
        const role: 'user' | 'assistant' = isAgent ? 'assistant' : 'user';

        setCaptions((prev) => {
          const existingIdx = prev.findIndex((c) => c.id === segment.id);
          const newLine: CaptionLine = {
            id: segment.id,
            role,
            text: segment.text,
            isFinal: segment.final,
            timestamp: Date.now(),
          };

          if (existingIdx !== -1) {
            // Update existing (interim → final)
            const updated = [...prev];
            updated[existingIdx] = newLine;
            return updated;
          }

          // Add new caption, keep last 50
          return [...prev.slice(-49), newLine];
        });

        // Log finalized segments to Supabase
        if (segment.final && segment.text.trim()) {
          logMessage(role, segment.text.trim());
        }
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room, localParticipant.identity, setCaptions, logMessage]);

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localParticipant.setMicrophoneEnabled(!newMuted);
  }, [isMuted, localParticipant]);

  const isConnected = room.state === ConnectionState.Connected;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
      <ArcReactor state={reactorState} volume={volume} size={360} />
      <CallControls
        isConnected={isConnected}
        isConnecting={room.state === ConnectionState.Connecting}
        isMuted={isMuted}
        onConnect={() => {}}
        onDisconnect={onDisconnect}
        onToggleMute={handleToggleMute}
        error={error}
      />
      <LiveCaptions captions={captions} isConnected={isConnected} />
    </div>
  );
}
