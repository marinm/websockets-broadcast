"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const PROTOCOL = "ws";
const HOST = "localhost";
const PORT = 3001;
const wss = new ws_1.WebSocketServer({ port: 3001 });
wss.on("listening", () => console.log(`Listening at ${PROTOCOL}://${HOST}:${PORT}...`));
wss.on("error", console.error);
wss.on("connection", (ws, request) => {
    const url = new URL(request.url ?? "", `${PROTOCOL}://${HOST}`);
    ws.channel = url?.searchParams.get("channel") ?? "";
    ws.echo = (url?.searchParams.get("echo") ?? "") !== "false";
    console.log(`new connection on channel "${ws.channel}"`);
    ws.on("message", (data, isBinary) => broadcast(ws, data, isBinary));
    ws.on("error", console.error);
});
function broadcast(sender, data, isBinary) {
    console.log(`channel ${sender.channel}: %s`, data);
    wss.clients.forEach((ws) => {
        if (ws.readyState === ws_1.default.OPEN &&
            ws.channel === sender.channel &&
            !(ws == sender && !ws.echo)) {
            ws.send(data, { binary: isBinary });
        }
    });
}
