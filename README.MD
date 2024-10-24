# Description
React hook to communicate with a websocket. Uses the browser native implementation.

# Warnings
For now it's :
- not really tested,
- not sure it's stable,
- not that documented,
- not sure it will be maintained

Use at your own risk.<br>
Really.

Or better, use a well maintained package like [react-use-websocket](https://www.npmjs.com/package/react-use-websocket), which has more features than this one.

This is actually the motivation for this hook, to offer a more "bare" experience.

## Features
- Written in TypeScript
- Can connect, send and receive message
- Does **NOT** handles reconnect logic
- Multiple components can **NOT** use a single WebSocket. To each its own.
- **NO** Socket.io support
- **NO** Heartbeat support (you can add it).
- Does **NOT** work with server-sent-events and the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

# Installation

```sh
npm i --save @sebastienf/use-websocket
```

# Usage
```js
function App() {
    const { send } = useWebSocket({
        url:"wss://yoururl/ws",
        onMessage(msg) {
            console.log(msg);
        }
    });

    useEffect(() => {
        send("Hello");
    }, []);

    return (
        <></>
    )
}
```

# API

```ts
type UseSocketHookOptions = {
    url: string | URL;
    protocols?: string | string[];
    onMessage?: (msg: string) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: () => void;
    onLog?: (...rest: Array<any>) => void;
};

function useWebSocket(options: UseSocketHookOptions): {
    readyState: number;
    close: () => void;
    reconnect: () => void;
    send: (msg: string) => void;
};
```

## UseSocketHookOptions
### url
Websocket url. Will recreate the socket and connection if it changes.

### protocols
Protocols passed to the new WebSocket(url, protocols). Can be null, just passed through.

### onMessage
Callback called when a message is received by the socket. `msg` is a string, so if you receive JSON, you need to `JSON.parse(msg);`.

### onOpen
Callback called when the connection with the socket is established. This callback can be called multiple times, but only if the socket changes (for example, if the socket get disconnected, then reconnects, it will trigger again).

### onClose
Calllback called when the connection with the websocket is lost. Note that it might not be called in every scenario. Probably will, but can't guarantee.

### onError
Callback called when the socket receive an error, pure passthrough with `WebSocket.onerror`.

### onLog
Callback that allows the hook to send you debug information on what is going on.

```js
    const { send } = useWebSocket({
        url:"wss://yoururl/ws",
        onMessage(msg) {
            console.log(msg);
        },
        onLog: (...args:Array<any>) => {console.log(...args)}
    });
```

# Examples

## Minimal example

```js
    const { send } = useWebSocket({
        url:"wss://yoururl/ws",
        onMessage(msg) {
            console.log(msg);
        }
    });

    useEffect(() => {
        send("Hello");
    }, [])
```

## Handling reconnection
```js
    const timeoutBetweenRetries = 5000;
    const [retries, setRetries] = useState<number>(0);
    const [maxRetries, setMaxRetries] = useState<number>(0);
    let timeout:number = 0;

    const { send, reconnect } = useWebSocket({
        url:"wss://yoururl/ws",
        onMessage(msg) {
            console.log(msg);
        },
        onOpen() {
            setRetries(0);
            setMaxRetries(5);
            clearTimeout(timeout);
        },
    });

    useEffect(() => {
        // if the state is not closed, we don't try to reconnect yet
        if(readyState != WebSocket.CLOSED) return;
        // limit the number of possible retry
        if(retries >= maxRetries) return;

        // only do it every timeoutBetweenRetries
        timeout = setTimeout(() => {
            setRetries(retries + 1);
            reconnect();
        }, timeoutBetweenRetries);

    }, [readyState, retries, maxRetries]);
```

### Manually disconnecting from server
```js
    const { close } = useWebSocket({
        url:"wss://yoururl/ws",
    });

    const onClose = () => {
        close();
    }

    return (
        <div>
            <button onClick={onClose}>Close</button>
        </div>
    )

```

