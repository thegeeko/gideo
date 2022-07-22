import { NextApiRequest, NextApiResponse } from "next";
import { pusherServerClient } from "../../../server/common/pusher";

export default function pusherAuthUserEndpoint(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { socket_id, channel_name } = req.body;
  const { user_id, user_name } = req.headers;

  if (!user_id || typeof user_id !== "string") {
    res.status(401).send("UNAUTHORIZED");
    return;
  }

  if (!user_name || typeof user_name !== "string") {
    res.status(401).send("UNAUTHORIZED");
    return;
  }

  if (!channel_name || typeof channel_name !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  console.log(req.body, "\n", req.headers);

  const auth = pusherServerClient.authorizeChannel(socket_id, channel_name, {
    user_id,
    user_info: {
      name: user_name,
    },
  });
  res.send(auth);
}
