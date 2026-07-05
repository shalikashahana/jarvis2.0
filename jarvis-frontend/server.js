import express from 'express';
import cors from 'cors';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';

const app = express();
app.use(cors());
app.use(express.json());

// Load credentials from my-agent/.env.local or hardcode them since it's just for local running
const apiKey = "APIyMGW6U7XgCHs";
const apiSecret = "hJZZfy2hIcvFJnjNH0n5aiiXlIyGQFzj14iZ40pRdXQ";
const livekitUrl = "wss://jarvis-2-0-kxsyg5a4.livekit.cloud";

app.post('/getToken', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: "roomName and participantName are required" });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: "10m",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    // Dispatch the "my-agent" agent to the room automatically
    at.roomConfig = new RoomConfiguration({
      agents: [new RoomAgentDispatch({ agentName: "my-agent" })],
    });

    const token = await at.toJwt();

    res.json({ token, url: livekitUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

app.listen(3000, () => {
  console.log('Token server listening on port 3000');
});
