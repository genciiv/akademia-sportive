import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  "METHODOLOGY",
  "POLICY",
  "PROCEDURE",
  "COMMUNICATION",
  "DEVELOPMENT",
  "SAFEGUARDING",
  "RESOURCE",
  "OTHER",
] as const;

const AUDIENCES = [
  "ALL",
  "COACHES",
  "STAFF",
  "PLAYERS",
  "PARENTS",
] as const;

const STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

const MAX_TITLE_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 600;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 12;
const MAX_SOURCE_URL_LENGTH = 2048;

function optionalText(
  value: unknown
): string | null {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function normalizeTags(
  value: unknown
):
  | {
      ok: true;
      value: string[];
    }
  | {
      ok: false;
    } {
  if (value === undefined) {
    return {
      ok: true,
      value: [],
    };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
    };
  }

  const tags = Array.from(
    new Set(
      value
        .map((tag) =>
          String(tag).trim()
        )
        .filter(Boolean)
    )
  );

  if (
    tags.length > MAX_TAGS ||
    tags.some(
      (tag) =>
        tag.length > MAX_TAG_LENGTH
    )
  ) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value: tags,
  };
}

function isValidSourceUrl(
  value: string | null
): boolean {
  if (!value) {
    return true;
  }

  if (
    value.length >
    MAX_SOURCE_URL_LENGTH
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.KNOWLEDGE_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const canManage =
    access.permissions.includes(
      PERMISSIONS.KNOWLEDGE_MANAGE
    );

  const articles =
    await prisma.knowledgeArticle.findMany({
      where: {
        academyId: access.academyId,

        ...(canManage
          ? {}
          : {
              status: "PUBLISHED",
            }),
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: [
        {
          isPinned: "desc",
        },
        {
          publishedAt: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

  return NextResponse.json({
    articles,
    canManage,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.KNOWLEDGE_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  let rawBody: unknown;

  try {
    rawBody =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Të dhënat e dërguara nuk janë në format të vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const body =
    rawBody &&
    typeof rawBody === "object" &&
    !Array.isArray(rawBody)
      ? (rawBody as Record<
          string,
          unknown
        >)
      : {};

  const title =
    String(body.title ?? "").trim();

  const summary =
    optionalText(body.summary);

  const content =
    String(body.content ?? "").trim();

  const category =
    String(
      body.category ?? "OTHER"
    ).trim();

  const audience =
    String(
      body.audience ?? "ALL"
    ).trim();

  const status =
    String(
      body.status ?? "DRAFT"
    ).trim();

  const sourceUrl =
    optionalText(body.sourceUrl);

  const tagsResult =
    normalizeTags(body.tags);

  if (!title) {
    return NextResponse.json(
      {
        error:
          "Titulli është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    title.length >
    MAX_TITLE_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Titulli nuk mund të kalojë ${MAX_TITLE_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (!content) {
    return NextResponse.json(
      {
        error:
          "Përmbajtja është e detyrueshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    summary &&
    summary.length >
      MAX_SUMMARY_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Përmbledhja nuk mund të kalojë ${MAX_SUMMARY_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    content.length >
    MAX_CONTENT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Përmbajtja nuk mund të kalojë ${MAX_CONTENT_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    !CATEGORIES.includes(
      category as
        (typeof CATEGORIES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Kategoria e zgjedhur nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !AUDIENCES.includes(
      audience as
        (typeof AUDIENCES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Audienca e zgjedhur nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !STATUSES.includes(
      status as
        (typeof STATUSES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi i zgjedhur nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (!tagsResult.ok) {
    return NextResponse.json(
      {
        error:
          `Etiketat duhet të jenë maksimumi ${MAX_TAGS}, me deri në ${MAX_TAG_LENGTH} karaktere secila.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    !isValidSourceUrl(sourceUrl)
  ) {
    return NextResponse.json(
      {
        error:
          "Linku i burimit nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    body.isPinned !== undefined &&
    typeof body.isPinned !== "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "Vlera e materialit të fiksuar nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const isPinned =
    body.isPinned === true;

  const article =
    await prisma.knowledgeArticle.create({
      data: {
        academyId:
          access.academyId,

        authorId:
          access.session.user.id,

        title,
        summary,
        content,

        category:
          category as
            (typeof CATEGORIES)[number],

        audience:
          audience as
            (typeof AUDIENCES)[number],

        status:
          status as
            (typeof STATUSES)[number],

        tags:
          tagsResult.value,

        sourceUrl,
        isPinned,

        publishedAt:
          status === "PUBLISHED"
            ? new Date()
            : null,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

  return NextResponse.json(
    {
      article,
    },
    {
      status: 201,
    }
  );
}