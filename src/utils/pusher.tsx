import create, { StoreApi } from "zustand/vanilla";
import createContext from "zustand/context";
import PusherJS, { PresenceChannel } from "pusher-js";
import { useEffect, useRef, useState } from "react";

type PusherStore = {
  client: PusherJS;
  channel: PresenceChannel;
};

type UserInfo = {
  id: string;
  name: string;
};

// PusherJS.logToConsole = true;

export const createPusherStore = (roomId: string, userInfo: UserInfo) => {
  const client = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    userAuthentication: {
      endpoint: "/api/pusher/auth-user",
      transport: "ajax",
      headers: {
        user_id: userInfo.id,
        user_name: userInfo.name,
      },
    },
    channelAuthorization: {
      endpoint: "/api/pusher/auth-channel",
      transport: "ajax",
      headers: {
        user_id: userInfo.id,
        user_name: userInfo.name,
      },
    },
  });

  client.signin();
  const channel = client.subscribe(roomId);
  (window as any).c = channel;

  channel.bind("pusher:error", (error: any) => {
    console.error(error);
  });

  return create<PusherStore>(() => ({
    client: client,
    channel: channel as PresenceChannel,
  }));
};

const {
  Provider: PusherZustandStoreProvider,
  useStore: usePusherZustandStore,
} = createContext<StoreApi<PusherStore>>();

export const PusherProvider: React.FC<
  React.PropsWithChildren<{
    roomId: string;
    userInfo: { id: string; name: string };
  }>
> = ({ roomId, children, userInfo }) => {
  const [store, updateStore] = useState<ReturnType<typeof createPusherStore>>();

  useEffect(() => {
    const newStore = createPusherStore(`presence-${roomId}`, userInfo);
    updateStore(newStore);

    return () => {
      const pusher = newStore.getState().client;
      pusher.disconnect();
      newStore.destroy();
    };
  }, [roomId, userInfo]);

  if (!store) return null;

  return (
    <PusherZustandStoreProvider createStore={() => store}>
      {children}
    </PusherZustandStoreProvider>
  );
};

type MessageEvent = {
  name: "message";
  callback: ({ body }: { body: string }) => void;
};

type UserJoinedEvent = {
  name: "user-joined";
  callback: ({ userId }: { userId: string }) => void;
};

type Event = MessageEvent | UserJoinedEvent;

export function useSubscribeToEvent({ name, callback }: Event) {
  const channel = usePusherZustandStore((store) => store.channel);
  const stableCallback = useRef(callback);
  // Keep callback sync'd
  useEffect(() => {
    stableCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    const reference = (data: any) => {
      stableCallback.current(data);
    };
    channel.bind(name, reference);
    return () => {
      channel.unbind(name, reference);
    };
  }, [channel, name]);
}

export const useMembersCount = () => {
  const channel = usePusherZustandStore((store) => store.channel);

  const [members, setMembers] = useState<typeof channel.members>();
  useEffect(() => {
    setMembers(channel.members);
    console.log("upadte");
  }, [channel]);

  return members;
};
