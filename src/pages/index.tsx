import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import Router from "next/router";

const Home: NextPage = () => {
  const { data: session, status: authStatus } = useSession();
  const roomNameRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: createRoom } = trpc.useMutation("room.create", {
    onSuccess(room) {
      localStorage.setItem("roomName", room.name);
      Router.push(`/room/${room.id}`);
    },
  });

  useEffect(() => {
    if (authStatus === "authenticated" && roomNameRef.current) {
      roomNameRef.current.value = localStorage.getItem("roomName") || "";
    }
  }, [authStatus]);

  const handleNewRoom = async () => {
    if (roomNameRef.current) {
      const roomName = roomNameRef.current.value;
      if (roomName.trim().length > 0) {
        await createRoom({
          name: roomName,
        });
      }
    }
  };

  return (
    <>
      <Head>
        <title>Gideo</title>
        <meta name="description" content="video chat app created by geeko" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
        {authStatus === "loading" && <div>Loading...</div>}

        {authStatus === "unauthenticated" && (
          <button className="btn" onClick={() => signIn()}>
            login
          </button>
        )}

        {authStatus === "authenticated" && (
          <div>
            <input
              className="input"
              ref={roomNameRef}
              placeholder="Room Name"
            ></input>
            <button className="btn" onClick={handleNewRoom}>
              create room
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
