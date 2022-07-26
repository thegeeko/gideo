import React, { useCallback, useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import {
  EventsNames,
  useCurrentMembers,
  useSubscribeToChunkedEvent,
  useSubscribeToEvent,
} from "../utils/pusher";
import { useRouter } from "next/router";
import { useRTC } from "../utils/webRTC";

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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const { mutate: sendOffer } = trpc.useMutation("room.offer");
  const { mutate: sendAnswer } = trpc.useMutation("room.answer");
  const { mutate: leaveRoom } = trpc.useMutation("room.leave");
  const { mutate: joinRoom } = trpc.useMutation("room.join", {
    onError() {
      router.push("/");
    },
  });

  const onIceCandidateCb = useCallback((e: RTCPeerConnectionIceEvent) => {
    console.log(e);
  }, []);

  const onTrackCb = useCallback((e: RTCTrackEvent) => {
    // console.log(e);
    e.streams[0]?.getTracks().forEach((track) => {
      remoteStream?.addTrack(track);
    });
  }, []);

  const { createOffer, createAnswer, setAnswer, setLocalTracs } = useRTC({
    onIceCandidateCb: onIceCandidateCb,
    onTrackCb: onTrackCb,
  });

  useSubscribeToEvent({
    name: EventsNames.UserJoined,
    async callback({ user_id }) {
      if (isOwner) {
        const offer = await createOffer();
        if (offer?.sdp) {
          sendOffer({ roomId, offer: { type: offer.type, sdp: offer.sdp } });
        } else {
          console.log("offer is null");
        }
      }
    },
  });

  useSubscribeToChunkedEvent({
    name: EventsNames.CHUNKED_Offer,
    async callback({ offer, senderId }) {
      if (!isOwner) {
        const ans = await createAnswer(offer);
        if (ans?.sdp)
          sendAnswer({ roomId, offer: { type: ans.type, sdp: ans.sdp } });
        else console.log("answer is null");
      }
    },
  });

  useSubscribeToChunkedEvent({
    name: EventsNames.CHUNKED_Answer,
    async callback({ answer: ans }) {
      if (isOwner) {
        console.log("ans received", ans);
        await setAnswer(ans);
      }
    },
  });

  useEffect(() => {
    joinRoom({ roomId });
    return () => leaveRoom({ roomId });
  }, [joinRoom, leaveRoom, roomId]);

  useEffect(() => {
    let canceled = false;

    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      setLocalTracs(stream);
      setRemoteStream(new MediaStream());
    };

    init();
    return () => {
      canceled = true;
    };
  }, []);

  // create local player and play video
  // maybe a component for this?
  return (
    <div className="mx-auto flex justify-around h-screen py-4">
      {localStream && (
        <>
          <div className="w-7/12">
            <div className="aspect-video  rounded-md overflow-hidden">
              <VideoPlayer muted={true} stream={localStream} />
              {remoteStream && (
                <VideoPlayer muted={true} stream={remoteStream} />
              )}
            </div>
          </div>
          <MessageView roomId={roomId} />
        </>
      )}
    </div>
  );
};

export default RoomView;
