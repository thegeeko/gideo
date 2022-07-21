import { NextPage } from "next";
import NoSSR from "../../components/NoSSR";
import { useRouter } from "next/router";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useEffect, useState } from "react";
import { PusherProvider, useSubscribeToEvent } from "../../utils/pusher";

const RoomView: React.FC<{
  roomId: string;
  isOwner: boolean;
}> = ({ isOwner, roomId }) => {
  const [msgs, setMsgs] = useState<string[]>([]);
  useSubscribeToEvent<{ body: string }>("message", (msg) => {
    console.log(msg);
    setMsgs([...msgs, msg.body]);
  });

  return (
    <div className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
      {isOwner && <div> {msgs.map((msg) => msg)}</div>}
      {!isOwner && <div> </div>}
    </div>
  );
};

const Room: NextPage = () => {
  const { query } = useRouter();
  const id = query.id as string;

  const { data: room, status: roomStatus } = trpc.useQuery([
    "room.get-by-id",
    { id },
  ]);

  return (
    <>
      <Head>
        <title>{room?.room?.name}</title>
        <meta name="description" content="a video chat room" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
        {roomStatus == "loading" && <div>Loading ...</div>}
        {roomStatus == "success" && room.room && (
          <NoSSR>
            <PusherProvider roomId={room.room.id}>
              <RoomView isOwner={room.isOwner} roomId={room.room.id} />
            </PusherProvider>
          </NoSSR>
        )}
      </main>
    </>
  );
};

export default Room;
