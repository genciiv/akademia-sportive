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

  if (
    userId ===
    access.user.id
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk mund të fshini llogarinë tuaj Platform Admin.",
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
        name: true,
        email: true,
        role: true,

        _count: {
          select: {
            ownedAcademies: true,
          },
        },
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

  if (
    user.role ===
    "PLATFORM_ADMIN"
  ) {
    return NextResponse.json(
      {
        error:
          "Një llogari Platform Admin nuk mund të fshihet nga ky veprim.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    user._count
      .ownedAcademies > 0
  ) {
    return NextResponse.json(
      {
        error:
          "Ky përdorues është pronar i një akademie. Transferoni ose mbyllni akademinë përpara fshirjes së llogarisë.",
      },
      {
        status: 409,
      }
    );
  }

  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    console.error(
      "Platform Admin user delete failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Përdoruesi nuk mund të fshihej për shkak të të dhënave të lidhura.",
      },
      {
        status: 409,
      }
    );
  }

  return NextResponse.json({
    ok: true,

    deletedUser: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}