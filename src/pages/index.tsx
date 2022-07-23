import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { GhLogo, GoogleLogo } from "../components/logos";
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
      </Head>

      <main className="w-screen h-screen flex flex-col items-center text-2xl font-semibold">
        <div className="mt-48 mb-40">
          <h1 className="text-8xl font-bold text-center">Gideo</h1>
          <div className="mt-4 text-4xl font-semibold text-center">
            video and text Chat with one person
          </div>
        </div>

        {authStatus === "loading" && <div>Loading...</div>}

        {authStatus === "unauthenticated" && (
          <div className="text-center">
            <div className=""> You need to login using: </div>
            <div className="pt-3" />
            <button
              className="btn bg-black font-bold text-xl"
              onClick={() => signIn("github")}
            >
              <GhLogo />
              <span className="pr-2" />
              Github
            </button>
            <span className="divider">Or</span>
            <button
              className="btn bg-black font-bold text-xl"
              onClick={() => signIn("google")}
            >
              <GoogleLogo />
              <span className="pr-2" />
              Google
            </button>
          </div>
        )}

        {authStatus === "authenticated" && (
          <div className="text-center w-4/12">
            <div className="font-normal text-xl text-left ">
              Welcome {session.user?.name}
            </div>
            <div className="pt-3" />
            <input
              className="input text-xl block w-full bg-white border-solid border-2 border-black "
              ref={roomNameRef}
              placeholder="Room Name"
            ></input>
            <div className="pt-3" />
            <button
              className="btn bg-black font-bold text-xl"
              onClick={handleNewRoom}
            >
              create room
            </button>
            <span className="pr-3" />
            <button
              className="btn bg-black font-bold text-xl"
              onClick={() => signOut()}
            >
              Logout
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
