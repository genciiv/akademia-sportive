import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Duhet të identifikoheni.",
      },
      {
        status: 401,
      }
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        mustChangePassword: true,
      },
    });

  if (!user) {
    return NextResponse.json(
      {
        error: "Përdoruesi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    mustChangePassword:
      user.mustChangePassword,
  });
}