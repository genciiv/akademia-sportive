import { sendTransactionalEmail, type EmailDeliveryResult } from "@/lib/email";

type AthleteInvitationEmailInput = {
  email: string;
  athleteName: string;
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

export async function sendAthleteInvitationEmail(
  input: AthleteInvitationEmailInput,
): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return {
      ok: false,
      reason: "not_configured",
    };
  }

  const invitationUrl = new URL(
    `/sportist/ftesa/${encodeURIComponent(input.invitationToken)}`,
    appUrl,
  );

  const safeAthleteName = escapeHtml(input.athleteName);

  const safeAcademyName = escapeHtml(input.academyName);

  const safeInvitationUrl = escapeHtml(invitationUrl.toString());

  const expiry = formatExpiry(input.expiresAt);

  const subject = `Ftesë për portalin e sportistit — ${input.academyName}`;

  const textContent = [
    `Përshëndetje ${input.athleteName},`,
    "",
    `${input.academyName} ju ka ftuar të aktivizoni portalin tuaj të sportistit në AkademiaSportive.`,
    "",
    "Për të krijuar ose lidhur llogarinë tuaj, përdorni linkun:",
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
                <div style="font-size:22px;font-weight:700;margin-bottom:28px;">
                  AkademiaSportive
                </div>

                <h1 style="font-size:26px;line-height:1.25;margin:0 0 18px;">
                  Aktivizo portalin e sportistit
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
                  Përshëndetje ${safeAthleteName},
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 24px;">
                  <strong>${safeAcademyName}</strong> ju ka ftuar të aktivizoni
                  portalin tuaj të sportistit në AkademiaSportive.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 26px;">
                  <tr>
                    <td>
                      <a
                        href="${safeInvitationUrl}"
                        style="display:inline-block;background:#172033;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 22px;border-radius:10px;"
                      >
                        Prano ftesën
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
      name: input.athleteName,
    },
    subject,
    htmlContent,
    textContent,
  });
}
