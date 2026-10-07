import {
  redirect,
} from "next/navigation";

import { AthletePortalShell } from "@/components/athlete-portal-shell";
import { requireAthleteAccess } from "@/lib/athlete-access";

export default async function AthletePortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status ===
      401
    ) {
      redirect(
        "/hyrje?next=/sportist/dashboard"
      );
    }

    redirect("/");
  }

  const athleteName =
    `${access.player.firstName} ${access.player.lastName}`.trim();

  return (
    <AthletePortalShell
      athleteName={
        athleteName
      }
      academyName={
        access.academy.name
      }
    >
      {children}
    </AthletePortalShell>
  );
}