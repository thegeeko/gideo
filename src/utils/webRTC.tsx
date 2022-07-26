import { useEffect, useMemo, useRef, useState } from "react";
import create from "zustand";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

// type RTCstore = {
//   connection: RTCPeerConnection;
// };

type useRTCProps = {
  onIceCandidateCb: (event: RTCPeerConnectionIceEvent) => void;
  onTrackCb: (event: RTCTrackEvent) => void;
};

export const useRTC = ({ onIceCandidateCb, onTrackCb }: useRTCProps) => {
  const connectionRef = useRef<RTCPeerConnection>();

  useEffect(() => {
    const connection = new RTCPeerConnection(ICE_SERVERS);
    connectionRef.current = connection;

    return () => {
      connection.close();
    };
  }, []);

  useEffect(() => {
    if (connectionRef.current)
      connectionRef.current.onicecandidate = onIceCandidateCb;
  }, [onIceCandidateCb]);

  useEffect(() => {
    if (connectionRef.current) connectionRef.current.ontrack = onTrackCb;
  }, [onTrackCb]);

  const createOffer = async () => {
    if (connectionRef.current) {
      const offer = await connectionRef.current.createOffer();
      await connectionRef.current.setLocalDescription(offer);
      return offer;
    }
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    console.log("createAnswer");
    if (connectionRef.current) {
      await connectionRef.current.setRemoteDescription(offer);
      const answer = await connectionRef.current.createAnswer();
      await connectionRef.current.setLocalDescription(answer);
      return answer;
    }
  };

  const setAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log("setAnswer");
    if (connectionRef.current) {
      await connectionRef.current.setRemoteDescription(answer);
    }
  };

  const setLocalTracs = async (stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      if (connectionRef.current) {
        connectionRef.current.addTrack(track, stream);
      }
    });
  };

  return { createOffer, createAnswer, setAnswer, setLocalTracs };
};
