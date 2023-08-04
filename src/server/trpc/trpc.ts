import type { NextRequest } from "next/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db, type Kysely, type DB } from "@/server/db";
import { type LogtoContext } from "../logto/logto-client";
import { getUser } from "../logto/get-user";

interface CreateContextOptions {
  auth: LogtoContext | null;
  req?: NextRequest;
  db: Kysely<DB>;
  headers?: NextRequest["headers"];
}

export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const auth = await getUser();

  return {
    auth,
    req: opts.req,
    db,
    headers: opts?.req?.headers,
  } satisfies CreateContextOptions;
};

export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.auth.isAuthenticated) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        /**
         * @TODO what is identities
         */
        userId: ctx.auth.userInfo?.identities,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
