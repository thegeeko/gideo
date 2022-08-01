import React, { useState } from "react";
import { trpc } from "../utils/trpc";
import {
  EventsNames,
  useCurrentMembers,
  useSubscribeToEvent,
} from "../utils/pusher";

type Message = {
  body: string;
  sender?: string;
};

const MessageView: React.FC<{ roomId: string }> = ({ roomId }) => {
  const currentMembers = useCurrentMembers();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currMsg, setCurrMsg] = useState<string>("");
  const { mutate: sendMessage } = trpc.useMutation("room.message");

  useSubscribeToEvent({
    name: EventsNames.Message,
    callback: (msg) => {
      const senderName =
        msg.senderId == currentMembers.myID
          ? "You"
          : currentMembers.members[msg.senderId].name;
      setMessages((prev) => [
        ...prev,
        {
          body: msg.body,
          sender: senderName,
        },
      ]);
    },
  });

  useSubscribeToEvent({
    name: EventsNames.UserJoined,
    callback: ({ user_id }) => {
      setMessages((prev) => [
        ...prev,
        {
          body: `${currentMembers.members[user_id].name} joined the room`,
        },
      ]);
    },
  });

  return (
    <div className="w-full h-full rounded-lg bg-white flex flex-col">
      <div className="h-5/6 flex items-center flex-col-reverse overflow-y-auto s py-4">
        {messages.map((msg, i) => (
          <div className="max-w-[80%] mt-4 mb-6" key={i}>
            <div className="bg-black  rounded-md text-white text-lg px-4 py-2">
              {msg.body}
            </div>
            {msg.sender && <div className="text-sm"> {msg.sender} </div>}
          </div>
        ))}
      </div>
      <div className="h-1/6 flex items-center justify-around">
        <textarea
          className="textarea textarea-bordered w-9/12 h-5/6 resize-none my-auto "
          placeholder="New message"
          value={currMsg}
          onChange={(e) => setCurrMsg(e.target.value)}
        ></textarea>
        <button
          className="btn bg-black font-bold"
          onClick={() => {
            sendMessage({ message: currMsg, roomId });
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageView;
