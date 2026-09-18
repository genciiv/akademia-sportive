import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import Formulari from "./formulari";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/hyrje?next=/krijo-akademine");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      memberships: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/hyrje");
  }

  if (user.memberships.length > 0) {
    redirect("/dashboard");
  }

  const email = user.email.trim().toLowerCase();

  const approvedApplication =
    await prisma.academyApplication.findFirst({
      where: {
        email,
        status: "APPROVED",
        consumedAt: null,
      },
      select: {
        id: true,
      },
      orderBy: {
        approvedAt: "desc",
      },
    });

  if (!approvedApplication) {
    redirect("/apliko");
  }

  return <Formulari />;
}