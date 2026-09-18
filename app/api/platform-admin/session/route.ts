import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";

export async function GET() {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        platformAdmin: false,
      },
      {
        status: access.status,
      }
    );
  }

  return NextResponse.json({
    platformAdmin: true,
  });
}