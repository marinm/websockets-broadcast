# websockets-broadcast

## Broadcast channels

Connect to this server via WebSocket and specify a channel:

```
ws://localhost:3001/?channel=any-string-here
```

_Aside: Every connection is attached to a channel. If you don't specify a channel, you will simply be joined to the empty string channel, which acts like a normal channel._

You will receive all messages from all clients connected to the same channel.

Send a message in this JSON format

```json
{
  "data": "anything you like here"
}
```

The server will broadcast your message to every client connected to the same channel, including you.

## Server messages

The server sends special messages to clients in this format

```json
{
  "from": "server",
  "data": {
    // ...
  }
}
```

When your connection starts, the server will send this message only to you:

```
{
  "from": "server",
  "data": {
    "connectionId": "2f8e5a6c-8baa-44b9-8967-b91e00fe9450"
  }
}
```

where `connectionId` is a random UUID, which is public and remains the same for the duration of the WebSocket connection.

Note that WebSocket connections can time out and close automatically. If you reconnect, you will be assigned a new `connectionId`. There is no way to reconnect using an old `connectionId`.

## Presence

When a new connection opens or closes on a channel, the server will broadcast a list of all `connectionId`s that are currently open on that channel.

```json
{
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
