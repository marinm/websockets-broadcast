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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ws_1 = __importStar(require("ws"));
require("dotenv/config");
const zod_1 = require("zod");
exports.env = zod_1.z
    .object({
    PROTOCOL: zod_1.z.coerce.string(),
    HOST: zod_1.z.coerce.string(),
    PORT: zod_1.z.coerce.number(),
})
    .parse(process.env);
const server = new ws_1.WebSocketServer({ port: exports.env.PORT });
server.on("listening", () => console.log(`Listening at ${exports.env.PROTOCOL}://${exports.env.HOST}:${exports.env.PORT}...`));
server.on("error", console.error);
server.on("connection", (ws, request) => {
    // Assign a unique connection ID
    ws.connectionId = crypto_1.default.randomUUID();
    // Set the channel they want to join.
    const url = new URL(request.url ?? "", `${exports.env.PROTOCOL}://${exports.env.HOST}`);
    const channel = url?.searchParams.get("channel") ?? "";
    ws.channel = channel;
    console.log(`new connection on channel "${ws.channel}"`);
    // Announce to the channel when a connection opens...
    broadcastPresentList(channel);
    // ...and closes
    ws.on("close", () => broadcastPresentList(channel));
    ws.on("message", (rawData) => {
        if (ws.channel === undefined || ws.connectionId === undefined) {
            return;
        }
        const clientMessage = parseClientMessage(rawData);
        if (clientMessage == null) {
            return;
        }
        const broadcastMessage = {
            from: ws.connectionId,
            data: clientMessage.data,
        };
        broadcast(ws.channel, broadcastMessage);
    });
    ws.on("error", console.error);
});
function broadcastPresentList(channel) {
    console.log("broadcastPresentList");
    broadcast(channel, {
        from: "server",
        data: {
            present: getChannelConnectionIds(channel),
        },
    });
}
function getChannelConnectionIds(channel) {
    const list = [];
    server.clients.forEach((ws) => {
        if (ws.readyState === ws_1.default.OPEN &&
            ws.channel === channel &&
            ws.connectionId !== undefined) {
            list.push(ws.connectionId);
        }
    });
    return list;
}
function broadcast(channel, message) {
    console.log("Broadcast: ", `channel ${channel}`, `from ${message.from}`, `data ${message.data}`);
    server.clients.forEach((ws) => {
        if (ws.readyState === ws_1.default.OPEN &&
            ws.channel === channel &&
            ws.connectionId) {
            const serverMessage = {
                connectionId: ws.connectionId,
                ...message,
            };
            ws.send(JSON.stringify(serverMessage), { binary: false });
        }
    });
}
function parseClientMessage(data) {
    try {
        return zod_1.z
            .object({
            data: zod_1.z.any(),
        })
            .parse(JSON.parse(data.toString()));
    }
    catch {
        return null;
    }
}
