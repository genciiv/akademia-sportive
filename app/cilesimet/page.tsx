import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { AcademySettings } from "@/components/cilesimet/academy-settings";
import { SeasonsSettings } from "@/components/cilesimet/seasons-settings";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SETTINGS_VIEW
    );

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  return (
    <AppShell>
      <PageHeader
        title="Cilësimet"
        description="Konfigurimi i akademisë dhe sezonit aktiv."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <AcademySettings />
        <SeasonsSettings />
      </div>
    </AppShell>
  );
}