import {
  sendTransactionalEmail,
  type EmailDeliveryResult,
} from "@/lib/email";

type AcademyOwnerInvitationEmailInput = {
  email: string;
  contactName: string;
  academyName: string;
  invitationToken: string;
  expiresAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAppUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
}

function formatExpiry(expiresAt: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Tirane",
  }).format(expiresAt);
}

export async function sendAcademyOwnerInvitationEmail(
  input: AcademyOwnerInvitationEmailInput,
): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return {
      ok: false,
      reason: "not_configured",
    };
  }

  const invitationUrl = new URL("/regjistrohu", appUrl);
  invitationUrl.searchParams.set("invite", input.invitationToken);

  const safeContactName = escapeHtml(input.contactName);
  const safeAcademyName = escapeHtml(input.academyName);
  const safeInvitationUrl = escapeHtml(invitationUrl.toString());
  const expiry = formatExpiry(input.expiresAt);

  const subject = `Ftesa juaj për AkademiaSportive — ${input.academyName}`;

  const textContent = [
    `Përshëndetje ${input.contactName},`,
    "",
    `Aplikimi për ${input.academyName} është aprovuar.`,
    "",
    "Për të krijuar llogarinë dhe për të vazhduar me konfigurimin e akademisë, përdorni linkun:",
    invitationUrl.toString(),
    "",
    `Ftesa është e vlefshme deri më ${expiry}.`,
    "",
    "Ky link është personal. Mos ia përcillni personave të tjerë.",
    "",
    "AkademiaSportive",
  ].join("\n");

  const htmlContent = `
<!doctype html>
<html lang="sq">
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;padding:36px;">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:700;margin-bottom:28px;">AkademiaSportive</div>

                <h1 style="font-size:26px;line-height:1.25;margin:0 0 18px;">
                  Aplikimi juaj është aprovuar
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
                  Përshëndetje ${safeContactName},
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 24px;">
                  Aplikimi për <strong>${safeAcademyName}</strong> është aprovuar.
                  Tani mund të krijoni llogarinë dhe të vazhdoni me konfigurimin e akademisë.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 26px;">
                  <tr>
                    <td>
                      <a
                        href="${safeInvitationUrl}"
                        style="display:inline-block;background:#172033;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 22px;border-radius:10px;"
                      >
                        Krijo llogarinë
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:14px;line-height:1.6;color:#5f6878;margin:0 0 8px;">
                  Ftesa është e vlefshme deri më ${escapeHtml(expiry)}.
                </p>

                <p style="font-size:14px;line-height:1.6;color:#5f6878;margin:0;">
                  Ky link është personal. Mos ia përcillni personave të tjerë.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return sendTransactionalEmail({
    to: {
      email: input.email,
      name: input.contactName,
    },
    subject,
    htmlContent,
    textContent,
  });
}


type StaffInvitationEmailInput = {
  email: string;
  staffName?: string;
  academyName: string;
  roleLabel: string;
  invitationToken: string;
  expiresAt: Date;
};

export async function sendStaffInvitationEmail(
  input: StaffInvitationEmailInput,
): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return {
      ok: false,
      reason: "not_configured",
    };
  }

  const invitationUrl = new URL(
    `/ftesa/${encodeURIComponent(input.invitationToken)}`,
    appUrl,
  );

  const staffName = input.staffName?.trim() || "";
  const greeting = staffName
    ? `P\u00ebrsh\u00ebndetje ${staffName},`
    : "P\u00ebrsh\u00ebndetje,";

  const safeGreeting = escapeHtml(greeting);
  const safeAcademyName = escapeHtml(input.academyName);
  const safeRoleLabel = escapeHtml(input.roleLabel);
  const safeInvitationUrl = escapeHtml(
    invitationUrl.toString(),
  );
  const expiry = formatExpiry(input.expiresAt);

  const subject =
    `Ftes\u00eb p\u00ebr t'iu bashkuar ${input.academyName} n\u00eb AkademiaSportive`;

  const textContent = [
    greeting,
    "",
    `Jeni ftuar t'i bashkoheni ${input.academyName} n\u00eb AkademiaSportive.`,
    `Roli juaj: ${input.roleLabel}.`,
    "",
    "P\u00ebr t\u00eb krijuar ose lidhur llogarin\u00eb tuaj, p\u00ebrdorni linkun:",
    invitationUrl.toString(),
    "",
    `Ftesa \u00ebsht\u00eb e vlefshme deri m\u00eb ${expiry}.`,
    "",
    "Ky link \u00ebsht\u00eb personal. Mos ia p\u00ebrcillni personave t\u00eb tjer\u00eb.",
    "",
    "AkademiaSportive",
  ].join("\n");

  const htmlContent = `
<!doctype html>
<html lang="sq">
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;padding:36px;">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:700;margin-bottom:28px;">AkademiaSportive</div>

                <h1 style="font-size:26px;line-height:1.25;margin:0 0 18px;">
                  Ftes\u00eb p\u00ebr t'iu bashkuar akademis\u00eb
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
                  ${safeGreeting}
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">
                  Jeni ftuar t'i bashkoheni <strong>${safeAcademyName}</strong>
                  n\u00eb AkademiaSportive.
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:#5f6878;">
                  Roli juaj: <strong>${safeRoleLabel}</strong>
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 26px;">
                  <tr>
                    <td>
                      <a
                        href="${safeInvitationUrl}"
                        style="display:inline-block;background:#172033;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 22px;border-radius:10px;"
                      >
                        Prano ftes\u00ebn
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:14px;line-height:1.6;color:#5f6878;margin:0 0 8px;">
                  Ftesa \u00ebsht\u00eb e vlefshme deri m\u00eb ${escapeHtml(expiry)}.
                </p>

                <p style="font-size:14px;line-height:1.6;color:#5f6878;margin:0;">
                  Ky link \u00ebsht\u00eb personal. Mos ia p\u00ebrcillni personave t\u00eb tjer\u00eb.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return sendTransactionalEmail({
    to: {
      email: input.email,
      ...(staffName ? { name: staffName } : {}),
    },
    subject,
    htmlContent,
    textContent,
  });
}
