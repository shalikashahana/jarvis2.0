import { useState, useCallback } from 'react';

interface TokenResponse {
  token: string;
  url: string;
}

interface UseLiveKitTokenReturn {
  token: string | null;
  url: string | null;
  roomName: string | null;
  isLoading: boolean;
  error: string | null;
  fetchToken: (customRoomName?: string) => Promise<TokenResponse | null>;
  reset: () => void;
}

function generateRoomName(): string {
  return `jarvis-${crypto.randomUUID()}`;
}

export function useLiveKitToken(): UseLiveKitTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (customRoomName?: string): Promise<TokenResponse | null> => {
    const endpoint = import.meta.env.VITE_TOKEN_ENDPOINT_URL;
    if (!endpoint) {
      setError('Token endpoint not configured. Set VITE_TOKEN_ENDPOINT_URL in your .env.local file.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    const newRoomName = customRoomName || generateRoomName();
    setRoomName(newRoomName);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: newRoomName,
          participantName: `user-${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Token request failed (${res.status})`);
      }

      const data: TokenResponse = await res.json();
      
      // Allow overriding URL with env var (useful when edge function returns internal URL)
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || data.url;
      
      setToken(data.token);
      setUrl(livekitUrl);
      setIsLoading(false);

      return { token: data.token, url: livekitUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get access token';
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setUrl(null);
    setRoomName(null);
    setError(null);
  }, []);

  return { token, url, roomName, isLoading, error, fetchToken, reset };
}
