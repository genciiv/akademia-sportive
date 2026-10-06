import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    academyId: string;
  }>;
};

type Action =
  | "SUSPEND"
  | "REACTIVATE";

export async function PATCH(
  request: Request,
  context: Params
) {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikohesh."
            : "Nuk ke leje për këtë veprim.",
      },
      {
        status: access.status,
      }
    );
  }

  const {
    academyId,
  } = await context.params;

  const body =
    (await request.json().catch(
      () => null
    )) as {
      action?: Action;
    } | null;

  if (
    body?.action !== "SUSPEND" &&
    body?.action !== "REACTIVATE"
  ) {
    return NextResponse.json(
      {
        error:
          "Veprimi i kërkuar nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const academy =
    await prisma.academy.findUnique({
      where: {
        id: academyId,
      },
      select: {
        id: true,
        name: true,
        status: true,

        subscription: {
          select: {
            status: true,
          },
        },
      },
    });

  if (!academy) {
    return NextResponse.json(
      {
        error:
          "Akademia nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  if (body.action === "SUSPEND") {
    if (
      academy.status === "SUSPENDED"
    ) {
      return NextResponse.json({
        ok: true,
        academy: {
          id: academy.id,
          name: academy.name,
          status: academy.status,
        },
      });
    }

    if (
      academy.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error:
            "Akademia e anuluar nuk mund të çaktivizohet.",
        },
        {
          status: 409,
        }
      );
    }

    const updated =
      await prisma.academy.update({
        where: {
          id: academy.id,
        },
        data: {
          status: "SUSPENDED",
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

    return NextResponse.json({
      ok: true,
      academy: updated,
    });
  }

  if (
    academy.status !== "SUSPENDED"
  ) {
    return NextResponse.json(
      {
        error:
          "Vetëm një akademi e çaktivizuar mund të riaktivizohet.",
      },
      {
        status: 409,
      }
    );
  }

  const nextStatus =
    academy.subscription?.status ===
    "TRIALING"
      ? "TRIAL"
      : "ACTIVE";

  const updated =
    await prisma.academy.update({
      where: {
        id: academy.id,
      },
      data: {
        status: nextStatus,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

  return NextResponse.json({
    ok: true,
    academy: updated,
  });
}