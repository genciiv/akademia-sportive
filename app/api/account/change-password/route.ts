import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers: requestHeaders,
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Kërkesa nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const data =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};

  const currentPassword =
    typeof data.currentPassword === "string"
      ? data.currentPassword
      : "";

  const newPassword =
    typeof data.newPassword === "string"
      ? data.newPassword
      : "";

  if (
    currentPassword.length < 8 ||
    newPassword.length < 8
  ) {
    return NextResponse.json(
      {
        error:
          "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    currentPassword ===
    newPassword
  ) {
    return NextResponse.json(
      {
        error:
          "Fjalëkalimi i ri duhet të jetë ndryshe nga ai i përkohshëm.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Fjalëkalimi aktual nuk është i saktë ose ndryshimi dështoi.",
      },
      {
        status: 400,
      }
    );
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },

    data: {
      mustChangePassword: false,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}