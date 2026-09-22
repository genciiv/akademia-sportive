import assert from "node:assert/strict";
import test from "node:test";

import { sendStaffInvitationEmail } from "@/lib/invitation-email";

test("staff invitation email uses the canonical app URL and staff invitation path", async () => {
  const previousApiKey = process.env.BREVO_API_KEY;
  const previousSenderEmail = process.env.BREVO_SENDER_EMAIL;
  const previousSenderName = process.env.BREVO_SENDER_NAME;
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousFetch = globalThis.fetch;

  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.BREVO_SENDER_NAME = "AkademiaSportive";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  let capturedBody: Record<string, unknown> | null = null;

  globalThis.fetch = async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        messageId: "staff-message-id",
      }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  try {
    const result = await sendStaffInvitationEmail({
      email: "staff@example.com",
      staffName: "Beni Test",
      academyName: "Akademia Test",
      roleLabel: "Trajner",
      invitationToken: "staff-test-token",
      expiresAt: new Date("2026-09-29T08:38:00.000Z"),
    });

    assert.deepEqual(result, {
      ok: true,
      messageId: "staff-message-id",
    });

    assert.ok(capturedBody);

    const body = capturedBody as {
      to?: Array<{ email?: string; name?: string }>;
      subject?: string;
      htmlContent?: string;
      textContent?: string;
    };

    assert.equal(body.to?.[0]?.email, "staff@example.com");
    assert.equal(body.to?.[0]?.name, "Beni Test");
    assert.match(body.subject || "", /Akademia Test/);
    assert.match(body.htmlContent || "", /Trajner/);
    assert.match(body.textContent || "", /Trajner/);

    const expectedUrl =
      "http://localhost:3000/ftesa/staff-test-token";

    assert.ok(body.htmlContent?.includes(expectedUrl));
    assert.ok(body.textContent?.includes(expectedUrl));
  } finally {
    globalThis.fetch = previousFetch;

    if (previousApiKey === undefined) {
      delete process.env.BREVO_API_KEY;
    } else {
      process.env.BREVO_API_KEY = previousApiKey;
    }

    if (previousSenderEmail === undefined) {
      delete process.env.BREVO_SENDER_EMAIL;
    } else {
      process.env.BREVO_SENDER_EMAIL = previousSenderEmail;
    }

    if (previousSenderName === undefined) {
      delete process.env.BREVO_SENDER_NAME;
    } else {
      process.env.BREVO_SENDER_NAME = previousSenderName;
    }

    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  }
});

test("staff invitation email escapes user-controlled HTML values", async () => {
  const previousApiKey = process.env.BREVO_API_KEY;
  const previousSenderEmail = process.env.BREVO_SENDER_EMAIL;
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousFetch = globalThis.fetch;

  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  let htmlContent = "";

  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as {
      htmlContent?: string;
    };

    htmlContent = body.htmlContent || "";

    return new Response(
      JSON.stringify({
        messageId: "staff-escape-id",
      }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  try {
    await sendStaffInvitationEmail({
      email: "staff@example.com",
      staffName: "<script>alert(1)</script>",
      academyName: "Akademia <b>Test</b>",
      roleLabel: "<Admin>",
      invitationToken: "staff-test-token",
      expiresAt: new Date("2026-09-29T08:38:00.000Z"),
    });

    assert.ok(
      htmlContent.includes(
        "&lt;script&gt;alert(1)&lt;/script&gt;",
      ),
    );

    assert.ok(
      htmlContent.includes(
        "Akademia &lt;b&gt;Test&lt;/b&gt;",
      ),
    );

    assert.ok(
      htmlContent.includes("&lt;Admin&gt;"),
    );

    assert.ok(!htmlContent.includes("<script>alert(1)</script>"));
  } finally {
    globalThis.fetch = previousFetch;

    if (previousApiKey === undefined) {
      delete process.env.BREVO_API_KEY;
    } else {
      process.env.BREVO_API_KEY = previousApiKey;
    }

    if (previousSenderEmail === undefined) {
      delete process.env.BREVO_SENDER_EMAIL;
    } else {
      process.env.BREVO_SENDER_EMAIL = previousSenderEmail;
    }

    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  }
});
