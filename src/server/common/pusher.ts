import PusherServer from "pusher";
import { env } from "process";

export const pusherServerClient = new PusherServer({
  appId: env.PUSHER_APP_ID!,
  key: env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: env.PUSHER_SECRET!,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});
