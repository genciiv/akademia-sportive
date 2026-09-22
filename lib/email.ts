const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

export type TransactionalEmailInput = {
  to: {
    email: string;
    name?: string;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
};

export type EmailDeliveryResult =
  | {
      ok: true;
      messageId: string | null;
    }
  | {
      ok: false;
      reason: "not_configured" | "provider_error" | "network_error";
      status?: number;
    };

function getEmailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "AkademiaSportive";

  if (!apiKey || !senderEmail) {
    return null;
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  };
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config) {
    return {
      ok: false,
      reason: "not_configured",
    };
  }

  try {
    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: config.senderEmail,
          name: config.senderName,
        },
        to: [
          {
            email: input.to.email,
            ...(input.to.name ? { name: input.to.name } : {}),
          },
        ],
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "provider_error",
        status: response.status,
      };
    }

    const data = (await response.json()) as {
      messageId?: unknown;
    };

    return {
      ok: true,
      messageId:
        typeof data.messageId === "string" ? data.messageId : null,
    };
  } catch {
    return {
      ok: false,
      reason: "network_error",
    };
  }
}
