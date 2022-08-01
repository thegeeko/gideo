import { NextPage } from "next";
import NoSSR from "../../components/NoSSR";
import { useRouter } from "next/router";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { GhLogo, GoogleLogo } from "../../components/logos";
import { PusherProvider } from "../../utils/pusher";
import { useSession, signIn } from "next-auth/react";
import RoomView from "../../components/RoomView";

const Room: NextPage = () => {
  const { query, push: routerPush } = useRouter();
  const id = query.id as string;
  const { data: session, status: authStatus } = useSession();
  const { data: room, status: roomStatus } = trpc.useQuery(
    ["room.get-by-id", { id }],
    {
      onError(err) {
        if (err.data?.code === "NOT_FOUND") {
          routerPush("/");
        }
      },
    }
  );

  return (
    <>
      <Head>
        <title>{room?.name || "Room"}</title>
        <meta name="description" content="a video chat room" />
      </Head>

      <main>
        {authStatus === "loading" && (
          <div className="animate-pulse"> Loading... </div>
        )}

        {authStatus === "unauthenticated" && (
          <div className="text-center">
            <div className="text-3xl">You need to login to access the room</div>
            <div className="pt-10" />
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

        {authStatus === "authenticated" && roomStatus === "loading" && (
          <div className="animate-pulse"> Loading room... </div>
        )}

        {authStatus === "authenticated" && room && (
          <NoSSR>
            <PusherProvider
              roomId={room.id}
              userInfo={{
                id: session!.user!.id!,
                name: session.user!.name!,
              }}
            >
              <RoomView isOwner={room.isOwner} roomId={room.id} />
            </PusherProvider>
          </NoSSR>
        )}
      </main>
    </>
  );
};

export default Room;
