import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { signIn, useSession } from "next-auth/react";
import { FormEvent } from "react";

const Home: NextPage = () => {
  const { data: session, status: authStatus } = useSession();

  console.log(session);

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
      </main>
    </>
  );
};

export default Home;
