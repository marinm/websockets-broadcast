import WebSocket, { WebSocketServer } from "ws";

const PROTOCOL = "ws";
const HOST = "localhost";
const PORT = 3001;

const wss = new WebSocketServer({ port: 3001 });

interface BroadcastWebSocket extends WebSocket {
  channel?: string;
  echo?: boolean;
}

wss.on("listening", () =>
  console.log(`Listening at ${PROTOCOL}://${HOST}:${PORT}...`),
);

wss.on("error", console.error);
wss.on("connection", (ws: BroadcastWebSocket, request) => {
  const url = new URL(request.url ?? "", `${PROTOCOL}://${HOST}`);
  ws.channel = url?.searchParams.get("channel") ?? "";
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
  console.log(`channel ${sender.channel}: %s`, data);
  wss.clients.forEach((ws: BroadcastWebSocket) => {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.channel === sender.channel &&
      !(ws == sender && !ws.echo)
    ) {
      ws.send(data, { binary: isBinary });
    }
  });
}
