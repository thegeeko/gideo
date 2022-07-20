import create from "zustand/react";

type PusherState = {
  counter: number;
};

export const usePusher = create<PusherState>((set) => ({
  counter: 0,
  increment: set((state) => ({ counter: state.counter + 1 })),
}));
