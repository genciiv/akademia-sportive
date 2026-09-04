import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Formulari from "./formulari";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    redirect("/hyrje");
  }

  const membership = await prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (membership) {
    redirect("/");
  }

  return <Formulari />;
}