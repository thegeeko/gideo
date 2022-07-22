import { NextApiRequest, NextApiResponse } from "next";
import { pusherServerClient } from "../../../server/common/pusher";

export default function pusherAuthUserEndpoint(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { socket_id } = req.body;
  const { user_id, user_name } = req.headers;

  if (!user_id || typeof user_id !== "string") {
    res.status(401).send("UNAUTHORIZED");
    return;
  }

  if (!user_name || typeof user_name !== "string") {
    res.status(401).send("UNAUTHORIZED");
    return;
  }

  const auth = pusherServerClient.authenticateUser(socket_id, {
    id: user_id,
    name: user_name,
  });

  res.send(auth);
}
