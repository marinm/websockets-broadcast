# websockets-broadcast

Connect to this server via WebSocket and specify a channel:

```
ws://localhost:3001/?channel=any-string-here
```

_Aside: Every connection is attached to a channel. If you don't specify a
channel, you will simply be joined to the empty string channel, which acts like
a normal channel._

Send a message in this JSON format

```json
{
  "data": "anything you like here"
}
```

The server will broadcast that message to every client connected to the same
channel, including you.
