import crypto from "crypto";
import WebSocket, { WebSocketServer } from "ws";
import "dotenv/config";
import { z } from "zod";

interface BroadcastWebSocket extends WebSocket {
  connectionId?: string;
  channel?: string;
}

type ServerMessage = {
  from: "server";
  data: {
    connectionId: string;
  };
};

type ClientMessage = {
  data: string;
};

type BroadcastMessage = {
  data: string;
  from: string;
};

export const env = z
  .object({
    PROTOCOL: z.coerce.string(),
    HOST: z.coerce.string(),
    PORT: z.coerce.number(),
  })
  .parse(process.env);

const server = new WebSocketServer({ port: env.PORT });

server.on("listening", () =>
  console.log(`Listening at ${env.PROTOCOL}://${env.HOST}:${env.PORT}...`),
);

server.on("error", console.error);

server.on("connection", (ws: BroadcastWebSocket, request) => {
  // Assign a unique connection ID
  ws.connectionId = crypto.randomUUID();

  // Set the channel they want to join.
  const url = new URL(request.url ?? "", `${env.PROTOCOL}://${env.HOST}`);
  ws.channel = url?.searchParams.get("channel") ?? "";

  console.log(`new connection on channel "${ws.channel}"`);

  // Let the client know their own ID.
  const serverMessage: ServerMessage = {
    from: "server",
    data: { connectionId: ws.connectionId },
  };
  ws.send(JSON.stringify(serverMessage));

  ws.on("message", (rawData) => broadcast(ws, rawData));
  ws.on("error", console.error);
});

function broadcast(sender: BroadcastWebSocket, rawData: WebSocket.RawData) {
  const clientMessage = validMessage(rawData);
  console.log(
    `connectionId ${sender.connectionId}`,
    `channel ${sender.channel ?? ""}`,
    `message ${clientMessage ? clientMessage.data : " Invalid message"}`,
  );

  if (!clientMessage || !sender.connectionId || sender.channel === undefined) {
    return;
  }

  const broadcastMessage: BroadcastMessage = {
    data: clientMessage.data,
    from: sender.connectionId,
  };
  server.clients.forEach((ws: BroadcastWebSocket) => {
    if (ws.readyState === WebSocket.OPEN && ws.channel === sender.channel) {
      ws.send(JSON.stringify(broadcastMessage), { binary: false });
    }
  });
}

function validMessage(data: WebSocket.RawData): null | ClientMessage {
  try {
    return z
      .object({
        data: z.coerce.string(),
      })
      .parse(JSON.parse(data.toString()));
  } catch {
    return null;
  }
}
