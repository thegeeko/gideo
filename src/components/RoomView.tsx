import React, { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import {
  EventsNames,
  useCurrentMembers,
  useSubscribeToChannelEvent,
} from "../utils/pusher";

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

const RoomView: React.FC<{
  roomId: string;
  isOwner: boolean;
}> = ({ isOwner, roomId }) => {
  const currentMembers = useCurrentMembers();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [fullRoom, setFullRoom] = useState(false);
  const localPlayerRef = React.useRef<HTMLVideoElement>(null);
  const { mutate: joinRoom } = trpc.useMutation("room.join", {
    onSuccess() {
      console.log("joined-room");
    },
  });

  const { mutate: leaveRoom } = trpc.useMutation("room.leave", {
    onSuccess() {
      console.log("left-room");
    },
  });

  useSubscribeToChannelEvent({
    name: EventsNames.UserJoined,
    callback: ({ user_id }) => {
      console.log(`${user_id} joined`);
    },
  });

  useSubscribeToChannelEvent({
    name: EventsNames.UserLeft,
    callback: ({ user_id }) => {
      console.log(`${user_id} left`);
    },
  });

  useEffect(() => {
    if (Object.keys(currentMembers).length > 2) {
      setFullRoom(true);
    }
    joinRoom({ roomId });

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    })();

    return () => {
      leaveRoom({ roomId });
    };
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
          <div className="w-4/12 h-full rounded-lg bg-white"></div>
        </>
      )}
      {!isOwner && (
        <div>
          <input type="text" className="input" placeholder="name" />
          <input type="text" className="input" placeholder="msg" />
        </div>
      )}
    </div>
  );
};

export default RoomView;
