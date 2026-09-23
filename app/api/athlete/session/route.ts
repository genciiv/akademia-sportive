import { NextResponse } from "next/server";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        athlete: false,
      },
      {
        status: access.response.status,
      },
    );
  }

  const activeStaffMembership =
    await prisma.academyMembership.findFirst({
      where: {
        userId: access.userId,
        academyId: access.academyId,
        status: "ACTIVE",
      },

      select: {
        id: true,
      },
    });

  if (activeStaffMembership) {
    return NextResponse.json({
      athlete: false,
    });
  }

  return NextResponse.json({
    athlete: true,
  });
}