import React, { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import {
  EventsNames,
  useCurrentMembers,
  useSubscribeToChannelEvent,
} from "../utils/pusher";
import { useRouter } from "next/router";

const VideoPlayer: React.FC<{ stream: MediaStream; muted: boolean }> = ({
  stream,
  muted,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream.id]);

  return (
    <>
      <video
        autoPlay
        playsInline
        muted={muted}
        ref={videoRef}
        className="w-full h-full"
      />
    </>
  );
};

const MessageView: React.FC<{ roomId: string }> = ({ roomId }) => {
  // limited to this component
  type Message = {
    body: string;
    sender?: string;
  };

  const currentMembers = useCurrentMembers();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currMsg, setCurrMsg] = useState<string>("");
  const { mutate: sendMessage } = trpc.useMutation("room.message");

  useSubscribeToChannelEvent({
    name: EventsNames.Message,
    callback: (msg) => {
      const senderName =
        msg.senderId == currentMembers.myID
          ? "You"
          : (currentMembers.get(msg.senderId)?.name as string);
      setMessages((prev) => [
        ...prev,
        {
          body: msg.body,
          sender: senderName,
        },
      ]);
    },
  });

  return (
    <div className="w-4/12 h-full rounded-lg bg-white flex flex-col">
      <div className="h-5/6 flex items-center flex-col-reverse overflow-y-scroll py-4">
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

const RoomView: React.FC<{
  roomId: string;
  isOwner: boolean;
}> = ({ isOwner, roomId }) => {
  const router = useRouter();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const { mutate: joinRoom } = trpc.useMutation("room.join", {
    onError() {
      router.push("/");
    },
  });
  const { mutate: leaveRoom } = trpc.useMutation("room.leave");

  useSubscribeToChannelEvent({
    name: EventsNames.UserJoined,
    callback: (data) => {
      // console.log(currentMembers.get(data.user_id));
    },
  });

  useEffect(() => {
    joinRoom({ roomId });
    return () => leaveRoom({ roomId });
  }, []);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    })();

    return () => {};
  }, []);

  // create local player and play video
  // maybe a component for this?
  return (
    <div className="mx-auto flex justify-around h-screen py-4">
      {isOwner && localStream && (
        <>
          <div className="w-7/12">
            <div className="aspect-video  rounded-md overflow-hidden">
              <VideoPlayer muted={true} stream={localStream} />
            </div>
          </div>
          <MessageView roomId={roomId} />
        </>
      )}
      {!isOwner && (
        <div>
          <button>Msg</button>
        </div>
      )}
    </div>
  );
};

export default RoomView;
