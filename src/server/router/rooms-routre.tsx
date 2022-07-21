import { createRouter } from "./context";
import z from "zod";
import { TRPCError } from "@trpc/server";

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

      return {
        room,
        isOwner: ctx.session?.user?.id
          ? room?.id === ctx.session.user.id
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
        },
      });
    },
  });

export default roomRouter;
