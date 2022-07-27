import createStore from "zustand";

const ICE_SERVERS = [
  {
    urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
  },
];

type ConnectionStore = {
  peerConnection: RTCPeerConnection | null;
  initConnection: () => RTCPeerConnection;
  destroyConnection: () => void;
  createOffer: () => Promise<RTCSessionDescriptionInit | undefined>;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | undefined>;
  setAnswer: (answer: RTCSessionDescriptionInit) => void;
};

export const useRTCStore = createStore<ConnectionStore>((set, get) => {
  return {
    peerConnection: null,
    initConnection: () => {
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      });
      set({ peerConnection });

      return peerConnection;
    },
    destroyConnection: () => {
      set((state) => {
        state.peerConnection?.close();
        return { peerConnection: null };
      });
    },
    createOffer: async () => {
      const connection = get().peerConnection;
      if (connection) {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        return offer;
      }
    },
    createAnswer: async (offer: RTCSessionDescriptionInit) => {
      const connection = get().peerConnection;
      if (connection) {
        connection.setRemoteDescription(offer);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        return answer;
      }
    },
    setAnswer: async (answer: RTCSessionDescriptionInit) => {
      const connection = get().peerConnection;
      if (connection) {
        await connection.setRemoteDescription(answer);
      }
    },
  };
});
