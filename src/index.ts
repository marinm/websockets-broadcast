import crypto from "crypto";
import WebSocket, { WebSocketServer } from "ws";
import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    PROTOCOL: z.coerce.string(),
    HOST: z.coerce.string(),
    PORT: z.coerce.number(),
  })
  .parse(process.env);

const server = new WebSocketServer({ port: env.PORT });

interface BroadcastWebSocket extends WebSocket {
  connectionId?: string;
  channel?: string;
  echo?: boolean;
}

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

  // The client must specifically connect with a ?echo=false query param to opt
  // out of echoes. Otherwise, they will get all of their own messages echoed
  // back to them.
  ws.echo = (url?.searchParams.get("echo") ?? "") !== "false";

  console.log(`new connection on channel "${ws.channel}"`);

  ws.on("message", (data, isBinary) => broadcast(ws, data, isBinary));
  ws.on("error", console.error);
});

function broadcast(
  sender: BroadcastWebSocket,
  data: WebSocket.RawData,
  isBinary: boolean,
) {
  console.log(`connectionId ${sender.connectionId} channel ${sender.channel}: %s`, data);
  server.clients.forEach((ws: BroadcastWebSocket) => {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.channel === sender.channel &&
      !(ws == sender && !ws.echo)
    ) {
      ws.send(data, { binary: isBinary });
    }
  });
}
