import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  }
) {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikoheni."
            : "Nuk keni akses.",
      },
      {
        status: access.status,
      }
    );
  }

  const { userId } =
    await context.params;

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Përdoruesi nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
      },
    });

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Përdoruesi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const redirectTo =
    new URL(
      "/rivendos-fjalekalimin",
      request.url
    ).toString();

  await auth.api.requestPasswordReset({
    body: {
      email: user.email,
      redirectTo,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}