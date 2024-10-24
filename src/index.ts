import { useEffect, useRef, useState } from "react";

export type UseSocketHookOptions = {
    url: string | URL;
    protocols?: string | string[];
    onMessage?: (msg: string) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: () => void;
    onLog?:(...rest:Array<any>) => void;
}


export function useWebSocket(options: UseSocketHookOptions) {
    const { url, protocols } = options;
    const { onMessage, onOpen, onError, onClose, onLog } = options;

    // const socketRef = useRef<WebSocket | undefined>();
    const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
    const closeFnRef = useRef<() => void|undefined>();
    const reconnectFnRef = useRef<() => void|undefined>();
    const sendFnRef = useRef<(msg:string) => void|undefined>();
    // We use the current timestamp to manually trigger the reconnection
    // It kinda abuse react mechanism, but it's simple and efficient
    const [reconnectTS, setReconnectTS] = useState(Date.now());

    useEffect(() => {
        let state:number = WebSocket.CONNECTING;

        setReadyState(state);

        const newSocket = new WebSocket(url, protocols);
        onLog?.("New socket created");

        closeFnRef.current = () => {
            newSocket.close();
        }

        reconnectFnRef.current = () => {
            onLog?.("Trying to reconnect socket");
            setReconnectTS(Date.now());
        }

        sendFnRef.current = (msg:string) => {
            onLog?.("Sending msg on socket", msg);
            newSocket.send(msg);
        }

        newSocket.onopen = () => {
            onLog?.("Socket opened")
            state = WebSocket.OPEN;
            setReadyState(state);
            onOpen?.();
        }

        newSocket.onmessage = (ev) => {
            onLog?.("Received message on socket", ev.data)
            onMessage?.(ev.data);
        }

        newSocket.onerror = (ev) => {
            onLog?.("Socket error", ev)
            state = WebSocket.CLOSING;
            setReadyState(state);
            onError?.();
        }

        newSocket.onclose = () => {
            onLog?.("Socket closed")
            state = WebSocket.CLOSED;
            setReadyState(state);
            onClose?.();
        }

        return () => {
            console.log("Cleaning up socket", newSocket);

            newSocket.onclose = null;
            newSocket.onmessage = null;
            newSocket.onerror = null;
            newSocket.onopen = null;

            // not open, no need to close
            if(state == WebSocket.OPEN) newSocket.close();

            // appeler manuellement onClose()
            onClose?.()

        }

    }, [url, reconnectTS]);

    return {
        readyState,
        close:closeFnRef.current as () => void,
        reconnect: reconnectFnRef.current as () => void,
        send: sendFnRef.current as (msg:string) => void,
    }
}