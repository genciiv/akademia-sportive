type NotificationCreateDelegate = {
  notification: {
    create: (args: {
      data: {
        academyId: string;
        title: string;
        message: string;
        href?: string | null;
        audience: "TEAM";
        teamId: string;
        priority: "IMPORTANT";
        status: "ACTIVE";
      };
    }) => Promise<unknown>;
  };
};

type InterAcademyNotificationInput = {
  academyId: string;
  teamId: string;
  title: string;
  message: string;
  href?: string | null;
};

export async function createInterAcademyNotification(
  tx: NotificationCreateDelegate,
  input: InterAcademyNotificationInput
) {
  return tx.notification.create({
    data: {
      academyId: input.academyId,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      audience: "TEAM",
      teamId: input.teamId,
      priority: "IMPORTANT",
      status: "ACTIVE",
    },
  });
}