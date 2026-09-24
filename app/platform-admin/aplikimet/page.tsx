import { redirect } from "next/navigation";

import ApplicationsClient from "./applications-client";
import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export default async function PlatformAdminApplicationsPage() {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect("/hyrje?next=/platform-admin/aplikimet");
    }

    redirect("/");
  }

  const applications = await prisma.academyApplication.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  const serialized = applications.map((application) => ({
    id: application.id,
    academyName: application.academyName,
    contactName: application.contactName,
    email: application.email,
    phone: application.phone,
    city: application.city,
    address: application.address,
    sport: application.sport,
    message: application.message,
    requestedPlanCode: application.requestedPlanCode,
    status: application.status,
    adminNotes: application.adminNotes,
    contactedAt: application.contactedAt?.toISOString() ?? null,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    approvedAt: application.approvedAt?.toISOString() ?? null,
    rejectedAt: application.rejectedAt?.toISOString() ?? null,
    consumedAt: application.consumedAt?.toISOString() ?? null,
    createdAcademyId: application.createdAcademyId,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));

  return (
    <PlatformAdminShell>
      <ApplicationsClient
        initialApplications={serialized}
        adminName={access.user.name ?? access.user.email}
      />
    </PlatformAdminShell>
  );
}
