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
  data: object;
};

type BroadcastMessage = {
  from: string;
  data: object;
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
  const channel = url?.searchParams.get("channel") ?? "";

  ws.channel = channel;

  console.log(`new connection on channel "${ws.channel}"`);

  // Announce to the channel when a connection opens...
  broadcastPresentList(channel);

  // ...and closes
  ws.on("close", () => broadcastPresentList(channel));

  // Let the client know their own ID.
  const serverMessage: ServerMessage = {
    from: "server",
    data: { connectionId: ws.connectionId },
  };
  ws.send(JSON.stringify(serverMessage));

  ws.on("message", (rawData) => {
    if (ws.channel === undefined || ws.connectionId === undefined) {
      return;
    }
    const clientMessage = parseClientMessage(rawData);
    if (clientMessage == null) {
      return;
    }
    const broadcastMessage: BroadcastMessage = {
      from: ws.connectionId,
      data: clientMessage.data,
    };
    broadcast(ws.channel, broadcastMessage);
  });
  ws.on("error", console.error);
});

function broadcastPresentList(channel: string): void {
  console.log("broadcastPresentList");
  broadcast(channel, {
    from: "server",
    data: {
      present: getChannelConnectionIds(channel),
    },
  });
}

function getChannelConnectionIds(channel: string): string[] {
  const list: string[] = [];
  server.clients.forEach((ws: BroadcastWebSocket) => {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.channel === channel &&
      ws.connectionId !== undefined
    ) {
      list.push(ws.connectionId);
    }
  });
  return list;
}

function broadcast(channel: string, message: BroadcastMessage) {
  console.log(
    "Broadcast: ",
    `channel ${channel}`,
    `from ${message.from}`,
    `data ${message.data}`,
  );

  server.clients.forEach((ws: BroadcastWebSocket) => {
    if (ws.readyState === WebSocket.OPEN && ws.channel === channel) {
      ws.send(JSON.stringify(message), { binary: false });
    }
  });
}

function parseClientMessage(data: WebSocket.RawData): null | ClientMessage {
  try {
    return z
      .object({
        data: z.any(),
      })
      .parse(JSON.parse(data.toString()));
  } catch {
    return null;
  }
}
