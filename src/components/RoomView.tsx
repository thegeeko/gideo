import React, { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import {
  EventsNames,
  useSubscribeToChunkedEvent,
  useSubscribeToEvent,
} from "../utils/pusher";
import { useRouter } from "next/router";
import MessageView from "./MessageView";
import { useRTCStore } from "../utils/webRTC";

const VideoPlayer: React.FC<{ stream: MediaStream; muted: boolean }> = ({
  stream,
  muted,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <>
      <video
        autoPlay
        playsInline
        id="sa"
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
  const router = useRouter();

  const [remoteActive, setRemoteActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream>(
    new MediaStream()
  );

  const RTCState = useRTCStore();

  const { mutate: sendOffer } = trpc.useMutation("room.offer");
  const { mutate: sendAnswer } = trpc.useMutation("room.answer");
  const { mutate: leaveRoom } = trpc.useMutation("room.leave");
  const { mutate: joinRoom } = trpc.useMutation("room.join", {
    onError() {
      router.push("/");
    },
  });

  useSubscribeToEvent({
    name: EventsNames.UserJoined,
    async callback({ user_id }) {
      if (isOwner) {
        const offer = await RTCState.createOffer();
        console.log("created offer");
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
        const ans = await RTCState.createAnswer(offer);
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
        RTCState.setAnswer(ans);
      }
    },
  });

  useEffect(() => {
    joinRoom({ roomId });
    return () => leaveRoom({ roomId });
  }, [joinRoom, leaveRoom, roomId]);

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      const conn = RTCState.initConnection();
      console.log(RTCState.peerConnection);

      stream.getTracks().forEach((track) => {
        conn.addTrack(track, stream);
        console.log("track added");
      });

      conn.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
          console.log("remote track added");
        });
      };
    };

    init();
    return () => {
      RTCState.destroyConnection();
      setLocalStream(null);
      remoteStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="mx-auto flex justify-around h-screen py-4">
      {localStream && (
        <>
          <div className="w-7/12">
            <div className="aspect-video  rounded-md overflow-hidden">
              <VideoPlayer
                muted={true}
                stream={remoteActive ? remoteStream : localStream}
              />
            </div>
            <button onClick={() => setRemoteActive(!remoteActive)}>
              {" "}
              Switch{" "}
            </button>
          </div>
          <MessageView roomId={roomId} />
        </>
      )}
    </div>
  );
};

export default RoomView;