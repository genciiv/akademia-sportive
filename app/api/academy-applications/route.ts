import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function cleanOptional(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Kërkesa nuk është e vlefshme." },
      { status: 400 }
    );
  }

  const academyName = String(body.academyName ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();

  const city = cleanOptional(body.city);
  const address = cleanOptional(body.address);
  const sport = cleanOptional(body.sport);
  const message = cleanOptional(body.message);

  if (academyName.length < 2) {
    return NextResponse.json(
      { error: "Shkruaj emrin e akademisë." },
      { status: 400 }
    );
  }

  if (contactName.length < 2) {
    return NextResponse.json(
      { error: "Shkruaj emrin e personit të kontaktit." },
      { status: 400 }
    );
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "Shkruaj një adresë elektronike të vlefshme." },
      { status: 400 }
    );
  }

  if (phone.length < 6) {
    return NextResponse.json(
      { error: "Shkruaj një numër telefoni të vlefshëm." },
      { status: 400 }
    );
  }

  if (academyName.length > 160 || contactName.length > 120) {
    return NextResponse.json(
      { error: "Të dhënat e dërguara janë shumë të gjata." },
      { status: 400 }
    );
  }

  if (
    (city?.length ?? 0) > 120 ||
    (address?.length ?? 0) > 240 ||
    (sport?.length ?? 0) > 120 ||
    (message?.length ?? 0) > 2000
  ) {
    return NextResponse.json(
      { error: "Të dhënat e dërguara janë shumë të gjata." },
      { status: 400 }
    );
  }

  const existing = await prisma.academyApplication.findFirst({
    where: {
      email,
      consumedAt: null,
      status: {
        in: ["PENDING", "CONTACTED", "APPROVED"],
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Ka tashmë një aplikim aktiv me këtë adresë elektronike. Do të kontaktoheni pasi aplikimi të shqyrtohet.",
      },
      { status: 409 }
    );
  }

  const application = await prisma.academyApplication.create({
    data: {
      academyName,
      contactName,
      email,
      phone,
      city,
      address,
      sport,
      message,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      application,
      message: "Aplikimi u dërgua me sukses.",
    },
    { status: 201 }
  );
}