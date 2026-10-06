import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
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

  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json(
      {
        error: "Përdoruesi nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (userId === access.user.id) {
    return NextResponse.json(
      {
        error:
          "Për siguri, nuk mund të mbyllni sesionin tuaj nga ky veprim.",
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

  const result =
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });

  return NextResponse.json({
    ok: true,
    revokedSessions: result.count,
  });
}