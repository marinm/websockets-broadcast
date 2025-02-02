import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8987, encoding: "utf-8" });

wss.on("error", console.error);
wss.on("connection", (ws, request) => {
    const url = new URL(request.url, "wss://marinm.net");
    ws.$channel = url?.searchParams.get("channel") ?? "";
    console.log(`new connection on channel "${ws.$channel}"`);
    ws.on("message", (data, isBinary) => broadcast(ws, data, isBinary));
    ws.on("error", console.error);
});

function broadcast(sender, data, isBinary) {
    console.log(`channel ${sender.$channel}: %s`, data);
    wss.clients.forEach((ws) => {
        if (
            ws.readyState === WebSocket.OPEN &&
            ws.$channel === sender.$channel
        ) {
            ws.send(data, { binary: isBinary });
        }
    });
}
