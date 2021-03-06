import createVanilla, { StoreApi } from "zustand/vanilla";
import createReactStore from "zustand/react";
import createContext from "zustand/context";
import PusherJS, { Members, PresenceChannel } from "pusher-js";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type PusherStore = {
  client: PusherJS;
  channel: PresenceChannel;
  members: Members;
};

type UserInfo = {
  id: string;
  name: string;
};

PusherJS.logToConsole = true;

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
  const channel = client.subscribe(roomId) as PresenceChannel;

  channel.bind("pusher:error", (error: any) => {
    console.error(error);
  });

  const store = createVanilla<PusherStore>(() => ({
    client: client,
    channel: channel,
    members: channel.members,
  }));

  // Update helper that sets 'members' to contents of presence channel's current members
  const updateMembers = () => {
    store.setState(() => ({
      members: channel.members,
    }));
  };

  // Bind all "present users changed" events to trigger updateMembers
  channel.bind("pusher:subscription_succeeded", updateMembers);
  channel.bind("pusher:member_added", updateMembers);
  channel.bind("pusher:member_removed", updateMembers);

  return store;
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
  const [store, setStore] = useState<StoreApi<PusherStore>>();

  useEffect(() => {
    const str = createPusherStore(`presence-${roomId}`, userInfo);
    setStore(str);

    return () => {
      console.log(str);
      const pusher = str.getState().client;
      pusher.disconnect();
      str.destroy();
    };
  }, []);

  if (!store) return null;

  return (
    <PusherZustandStoreProvider createStore={() => store}>
      {children}
    </PusherZustandStoreProvider>
  );
};

export enum EventsNames {
  UserJoined = "user-joined",
  UserLeft = "user-left",
  Message = "message",
  CHUNKED_Answer = "answer",
  CHUNKED_Offer = "chunked-offer",
}

type MessageEvent = {
  name: EventsNames.Message;
  callback: ({ body, senderId }: { body: string; senderId: string }) => void;
};

type UserJoinedEvent = {
  name: EventsNames.UserJoined;
  callback: ({ user_id }: { user_id: string }) => void;
};

type UserLeftEvent = {
  name: EventsNames.UserLeft;
  callback: ({ user_id }: { user_id: string }) => void;
};

type Offer = {
  name: EventsNames.CHUNKED_Offer;
  callback: ({
    offer,
    senderId,
  }: {
    senderId: string;
    offer: RTCSessionDescriptionInit;
  }) => void;
};

type Answer = {
  name: EventsNames.CHUNKED_Answer;
  callback: ({
    answer,
    senderId,
  }: {
    senderId: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
};

type Event = MessageEvent | UserJoinedEvent | UserLeftEvent | Offer | Answer;

export function useSubscribeToEvent({ name, callback }: Event) {
  const channel = usePusherZustandStore((store) => store.channel);
  const stableCallback = useRef(callback);

  (window as any).channel = channel;

  // Keep callback sync'd
  useLayoutEffect(() => {
    stableCallback.current = callback;
  }, [callback]);
  useLayoutEffect(() => {
    const reference = (data: any) => {
      console.log(`Received event ${name}`);
      stableCallback.current(data);
    };
    channel.bind(name, reference);
    return () => {
      channel.unbind(name, reference);
    };
  }, [channel, name]);
}

export function useSubscribeToChunkedEvent({ name, callback }: Event) {
  const channel = usePusherZustandStore((store) => store.channel);
  const stableCallback = useRef(callback);

  type Chunk = { index: number; data: string; isLast: boolean };

  const ChunksRef = useRef<Chunk[]>([]);

  const allChunksHere = () => {
    const sorted = ChunksRef.current.sort((a, b) => a.index - b.index);

    const last = sorted[sorted.length - 1];
    const first = sorted[0];

    if (last && last.isLast && first && first.index === 0) {
      console.log(sorted);
      const body = sorted.map((c) => c.data).join("");
      stableCallback.current(JSON.parse(body));
      ChunksRef.current = [];
    } else {
      console.log("Not all chunks here");
    }
  };

  // Keep callback sync'd
  useLayoutEffect(() => {
    stableCallback.current = callback;
  }, [callback]);

  useLayoutEffect(() => {
    const chunksHandler = (chunk: Chunk) => {
      const currChunks = ChunksRef.current;

      const duplicateChunk = currChunks.findIndex(
        (c) => c.index === chunk.index
      );

      // ignore if we already have this chunk
      if (duplicateChunk === -1) {
        ChunksRef.current.push(chunk);
        if (chunk.isLast) allChunksHere();
      }
    };

    channel.bind(name, chunksHandler);

    return () => {
      channel.unbind(name, chunksHandler);
    };
  }, [channel, name]);
}

export const useCurrentMembers = () => {
  const membersStore = usePusherZustandStore((store) => store.members);
  const [members, setMembers] = useState(membersStore);

  useEffect(() => {
    setMembers(membersStore);
    console.log("members updated");
  }, [membersStore, membersStore.count]);

  return members;
};
