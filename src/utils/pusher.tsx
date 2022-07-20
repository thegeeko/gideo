import create, { StoreApi } from "zustand/vanilla";
import createContext from "zustand/context";
import PusherJS, { Channel } from "pusher-js";
import { useEffect, useRef, useState } from "react";

type PusherStore = {
  client: PusherJS;
  channel: Channel;
};

const createPusherStore = (roomId: string) => {
  const client = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
  });

  const channel = client.subscribe(roomId);

  return create<PusherStore>(() => ({
    client: client,
    channel,
  }));
};

const {
  Provider: PusherZustandStoreProvider,
  useStore: usePusherZustandStore,
} = createContext<StoreApi<PusherStore>>();

export const PusherProvider: React.FC<
  React.PropsWithChildren<{ roomId: string }>
> = ({ roomId, children }) => {
  const [store, updateStore] = useState<ReturnType<typeof createPusherStore>>();

  useEffect(() => {
    const newStore = createPusherStore(roomId);
    updateStore(newStore);

    return () => {
      const pusher = newStore.getState().client;
      console.log("disconnecting pusher and destroying store", pusher);
      console.log(
        "(Expect a warning in terminal after this, React Dev Mode and all)"
      );
      pusher.disconnect();
      newStore.destroy();
    };
  }, [roomId]);

  if (!store) return null;

  return (
    <PusherZustandStoreProvider createStore={() => store}>
      {children}
    </PusherZustandStoreProvider>
  );
};

export function useSubscribeToEvent<MessageType>(
  eventName: string,
  callback: (data: MessageType) => void
) {
  const channel = usePusherZustandStore((state) => state.channel);

  const stableCallback = useRef(callback);

  // Keep callback sync'd
  useEffect(() => {
    stableCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const reference = (data: MessageType) => {
      stableCallback.current(data);
    };
    channel.bind(eventName, reference);
    return () => {
      channel.unbind(eventName, reference);
    };
  }, [channel, eventName]);
}