import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function kerkoPerdoruesin() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    redirect("/hyrje");
  }

  return session;
}

export async function merrAkademineAktive() {
  const session = await kerkoPerdoruesin();

  const membership = await prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      academy: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  if (!membership) {
    redirect("/krijo-akademine");
  }

  return {
    session,
    membership,
    academy: membership.academy,
  };
}