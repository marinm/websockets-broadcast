# websockets-broadcast

Connect to this server via WebSocket

```
ws://localhost:3001/
```

optionally joining a specific channel

```
ws://localhost:3001/?channel=use-any-string-you-like-here
```

and send a message in this JSON format

```json
{
  "data": "anything you like here"
}
```

The server will forward that message to every client connected to the same
channel (including yourself).

Aside: every connection is attached to a channel. If you don't specify a
channel, you will simply be joined to the empty string channel, which acts like
a normal channel.

If you don't want to receive your own messages echoed back to you, you must opt
out with the `echo=false` query param.

```
ws://localhost:3001/?channel=anything&echo=false
```
