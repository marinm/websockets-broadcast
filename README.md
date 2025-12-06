# websockets-broadcast

## Startup

```bash
npm install
npm run build
node ./dist/index.js
```

## Channels

Connect to this server via WebSocket:

```
ws://localhost:3001/?channel=any-string-here
```

All clients connected to the same channel will receive each other's messages.

### Default channel

If you don't specify a channel, e.g.:

- `ws://localhost:3001/`
- `ws://localhost:3001/?channel=`

you will be joined to the empty string channel, which is a normal channel.

All connections belong to one channel. There is no way to broadcast to all clients on the server.

### Send

Send a message in this JSON format

```json
{
  "data": "anything you like here"
}
```

The server will broadcast your message to every client connected to the same channel, including you.

## `connectionId`

Every WebSocket connection is assigned a public random UUID. Every message that the client receives on that connection will have that `connectionId`.

WebSocket connections can time out and close automatically. If you reconnect, you will be assigned a new `connectionId`. There is no way to reconnect using an old `connectionId`.

## Presence

When a new connection opens or closes on a channel, the server will broadcast a list of all `connectionId`s that are currently open on that channel.

```json
{
  "connection_id": "2f8e5a6c-8baa-44b9-8967-b91e00fe9450",
  "message_id": "10ce094b-4165-4f1d-b13f-08409214d35d",
  "broadcast_at": "2025-12-06T13:55:23.710Z",
  "from": "server",
  "data": {
    "present": [
      "2f8e5a6c-8baa-44b9-8967-b91e00fe9450",
      "0f7dac24-fb1d-490d-bbf1-6bc014dcdecf",
      "695ba3f0-5f30-4904-91a3-0900423db780"
    ]
  }
}
```

This way, all connections are made aware of all other connections on the same channel.

Race condition: When a new client connects to an active channel, it may receive broadcast messages from other clients before it receives the `present` list. It's up to the clients to decide what to do in this case.
