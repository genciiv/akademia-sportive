import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const LLOJET = [
  "MEETING",
  "MEDICAL",
  "TRIAL",
  "TOURNAMENT",
  "ADMINISTRATIVE",
  "OTHER",
] as const;

function tekstOseNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function dateELejuar(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function merrAktivitetin(
  eventId: string,
  academyId: string
) {
  return prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      academyId,
    },
  });
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {
      eventId: string;
    };
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.CALENDAR_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const event = await merrAktivitetin(
    params.eventId,
    academyId
  );

  if (!event) {
    return NextResponse.json(
      {
        error: "Aktiviteti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }
  const eventScope =
    await getActiveTeamScope(access);

  if (
    eventScope.isScoped &&
    event.teamId !== null &&
    !eventScope.teamIds.includes(
      event.teamId
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë aktivitet.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    event,
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      eventId: string;
    };
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.CALENDAR_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const existing = await merrAktivitetin(
    params.eventId,
    academyId
  );

  if (!existing) {
    return NextResponse.json(
      {
        error: "Aktiviteti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }
  const eventScope =
    await getActiveTeamScope(access);

  if (
    eventScope.isScoped &&
    (
      existing.teamId === null ||
      !eventScope.teamIds.includes(
        existing.teamId
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të menaxhuar këtë aktivitet.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  let title = existing.title;

  if (body.title !== undefined) {
    title = String(body.title).trim();

    if (!title) {
      return NextResponse.json(
        {
          error: "Titulli është i detyrueshëm.",
        },
        {
          status: 400,
        }
      );
    }
  }

  let type = existing.type;

  if (body.type !== undefined) {
    const nextType = String(body.type);

    if (
      !LLOJET.includes(
        nextType as (typeof LLOJET)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: "Lloji i aktivitetit nuk është i vlefshëm.",
        },
        {
          status: 400,
        }
      );
    }

    type =
      nextType as
        | "MEETING"
        | "MEDICAL"
        | "TRIAL"
        | "TOURNAMENT"
        | "ADMINISTRATIVE"
        | "OTHER";
  }

  let startsAt = existing.startsAt;

  if (body.startsAt !== undefined) {
    const parsed =
      dateELejuar(body.startsAt);

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Data dhe ora e fillimit nuk janë të vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    startsAt = parsed;
  }

  let endsAt = existing.endsAt;

  if (body.endsAt !== undefined) {
    if (
      body.endsAt === null ||
      body.endsAt === ""
    ) {
      endsAt = null;
    } else {
      const parsed =
        dateELejuar(body.endsAt);

      if (!parsed) {
        return NextResponse.json(
          {
            error: "Data e përfundimit nuk është e vlefshme.",
          },
          {
            status: 400,
          }
        );
      }

      endsAt = parsed;
    }
  }

  if (
    endsAt &&
    endsAt.getTime() <
      startsAt.getTime()
  ) {
    return NextResponse.json(
      {
        error: "Përfundimi nuk mund të jetë para fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  let teamId = existing.teamId;

  if (body.teamId !== undefined) {
    if (
      body.teamId === null ||
      body.teamId === ""
    ) {
      if (eventScope.isScoped) {
        return NextResponse.json(
          {
            error:
              "Nuk mund ta kthesh aktivitetin në aktivitet global.",
          },
          { status: 403 }
        );
      }

      teamId = null;
    } else {
      const team =
        await prisma.team.findFirst({
          where: {
            id: String(body.teamId),
            academyId:
              academyId,
          },
          select: {
            id: true,
          },
        });

      if (!team) {
        return NextResponse.json(
          {
            error: "Ekipi nuk u gjet.",
          },
          {
            status: 404,
          }
        );
      }
      const hasTeamAccess =
        await canAccessTeam(
          access,
          team.id
        );

      if (!hasTeamAccess) {
        return NextResponse.json(
          {
            error:
              "Nuk ke leje për të aksesuar këtë ekip.",
          },
          { status: 403 }
        );
      }

      teamId = team.id;
    }
  }

  const event =
    await prisma.calendarEvent.update({
      where: {
        id: existing.id,
      },
      data: {
        title,
        type,
        startsAt,
        endsAt,

        location:
          body.location === undefined
            ? existing.location
            : tekstOseNull(
                body.location
              ),

        description:
          body.description === undefined
            ? existing.description
            : tekstOseNull(
                body.description
              ),

        notes:
          body.notes === undefined
            ? existing.notes
            : tekstOseNull(
                body.notes
              ),

        teamId,
      },
    });

  return NextResponse.json({
    event,
  });
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: {
      eventId: string;
    };
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.CALENDAR_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const event = await merrAktivitetin(
    params.eventId,
    academyId
  );

  if (!event) {
    return NextResponse.json(
      {
        error: "Aktiviteti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }
  const eventScope =
    await getActiveTeamScope(access);

  if (
    eventScope.isScoped &&
    (
      event.teamId === null ||
      !eventScope.teamIds.includes(
        event.teamId
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të menaxhuar këtë aktivitet.",
      },
      { status: 403 }
    );
  }

  await prisma.calendarEvent.delete({
    where: {
      id: event.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
