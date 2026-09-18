import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPlatformAdminAccess() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      ok: false as const,
      status: 401 as const,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user || user.role !== "PLATFORM_ADMIN") {
    return {
      ok: false as const,
      status: 403 as const,
    };
  }

  return {
    ok: true as const,
    session,
    user,
  };
}