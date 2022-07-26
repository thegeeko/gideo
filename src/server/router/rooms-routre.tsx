import { createRouter } from "./context";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { pusherServerClient } from "../common/pusher";
import { EventsNames } from "../../utils/pusher";
import { assert } from "console";

const roomRouter = createRouter()
  .query("get-by-id", {
    input: z.object({
      id: z.string().length(25),
    }),
    resolve: async ({ input, ctx }) => {
      const room = await ctx.prisma.room.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      return {
        ...room,
        isOwner: ctx.session?.user?.id
          ? room.id === ctx.session.user.id
          : false,
      };
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        ...ctx,
        userId: ctx.session.user.id,
      },
    });
  })
  .mutation("create", {
    input: z.object({
      name: z.string().max(25),
    }),
    resolve: async ({ input, ctx }) => {
      return ctx.prisma.room.upsert({
        create: {
          id: ctx.userId,
          name: input.name,
        },
        where: {
          id: ctx.userId,
        },
        update: {
          name: input.name,
          full: false,
        },
      });
    },
  })
  .mutation("join", {
    input: z.object({
      roomId: z.string().length(25),
    }),
    resolve: async ({ input, ctx }) => {
      if (ctx.userId === input.roomId) return;

      const full = await ctx.prisma.room.findUnique({
        where: {
          id: input.roomId,
        },
        select: {
          full: true,
        },
      });

      if (full?.full === false) {
        await pusherServerClient.trigger(
          `presence-${input.roomId}`,
          EventsNames.UserJoined,
          {
            user_id: ctx.userId,
          }
        );
      } else {
        throw new TRPCError({ code: "CONFLICT", message: "Room is full" });
      }
    },
  })
  .mutation("leave", {
    input: z.object({
      roomId: z.string().length(25),
    }),
    resolve: async ({ input, ctx }) => {
      await ctx.prisma.room.update({
        where: {
          id: input.roomId,
        },
        data: {
          full: false,
        },
      });

      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.UserLeft,
        {
          user_id: ctx.userId,
        }
      );
    },
  })
  .mutation("message", {
    input: z.object({
      roomId: z.string().length(25),
      message: z.string().max(255),
    }),
    resolve: async ({ input, ctx }) => {
      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.Message,
        {
          body: input.message,
          senderId: ctx.userId,
        }
      );
    },
  })
  .mutation("offer", {
    input: z.object({
      roomId: z.string().length(25),
      offer: z.object({
        type: z.string(),
        sdp: z.string(),
      }),
    }),
    async resolve({ input, ctx }) {
      const data = JSON.stringify({
        offer: input.offer,
        senderId: ctx.userId,
      });

      const half = Math.ceil(data.length / 2);
      const [part1, part2] = [data.slice(0, half), data.slice(half)];

      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.CHUNKED_Offer,
        {
          index: 0,
          data: part1,
          isLast: false,
        }
      );

      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.CHUNKED_Offer,
        {
          index: 1,
          data: part2,
          isLast: true,
        }
      );
    },
  })
  .mutation("answer", {
    input: z.object({
      roomId: z.string().length(25),
      offer: z.object({
        type: z.string(),
        sdp: z.string(),
      }),
    }),
    async resolve({ input, ctx }) {
      const data = JSON.stringify({
        answer: input.offer,
        senderId: ctx.userId,
      });

      const half = Math.ceil(data.length / 2);
      const [part1, part2] = [data.slice(0, half), data.slice(half)];

      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.CHUNKED_Answer,
        {
          index: 0,
          data: part1,
          isLast: false,
        }
      );

      await pusherServerClient.trigger(
        `presence-${input.roomId}`,
        EventsNames.CHUNKED_Answer,
        {
          index: 1,
          data: part2,
          isLast: true,
        }
      );
    },
  });

export default roomRouter;
