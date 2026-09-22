import assert from "node:assert/strict";
import test from "node:test";

import { sendAcademyOwnerInvitationEmail } from "../lib/invitation-email";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.BREVO_API_KEY;
const originalSenderEmail = process.env.BREVO_SENDER_EMAIL;
const originalSenderName = process.env.BREVO_SENDER_NAME;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

function restoreEnv(
  name: string,
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;

  restoreEnv("BREVO_API_KEY", originalApiKey);
  restoreEnv("BREVO_SENDER_EMAIL", originalSenderEmail);
  restoreEnv("BREVO_SENDER_NAME", originalSenderName);
  restoreEnv("NEXT_PUBLIC_APP_URL", originalAppUrl);
});

test("builds the academy owner invitation email with the secure registration link", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.BREVO_SENDER_NAME = "AkademiaSportive";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));

    assert.deepEqual(body.to, [
      {
        email: "owner@example.com",
        name: "Genci Vaqo",
      },
    ]);

    assert.match(
      body.subject,
      /Akademia Test/,
    );

    assert.match(
      body.htmlContent,
      /http:\/\/localhost:3000\/regjistrohu\?invite=test-owner-token/,
    );

    assert.match(
      body.textContent,
      /http:\/\/localhost:3000\/regjistrohu\?invite=test-owner-token/,
    );

    return new Response(
      JSON.stringify({
        messageId: "<owner-test-message-id>",
      }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const result = await sendAcademyOwnerInvitationEmail({
    email: "owner@example.com",
    contactName: "Genci Vaqo",
    academyName: "Akademia Test",
    invitationToken: "test-owner-token",
    expiresAt: new Date("2026-09-29T10:00:00.000Z"),
  });

  assert.deepEqual(result, {
    ok: true,
    messageId: "<owner-test-message-id>",
  });
});

test("escapes user-controlled values in owner invitation HTML", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));

    assert.doesNotMatch(
      body.htmlContent,
      /<script>alert\(1\)<\/script>/,
    );

    assert.match(
      body.htmlContent,
      /&lt;script&gt;alert\(1\)&lt;\/script&gt;/,
    );

    assert.match(
      body.htmlContent,
      /Akademia &lt;b&gt;Test&lt;\/b&gt;/,
    );

    return new Response(
      JSON.stringify({
        messageId: "<escape-test-message-id>",
      }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const result = await sendAcademyOwnerInvitationEmail({
    email: "owner@example.com",
    contactName: "<script>alert(1)</script>",
    academyName: "Akademia <b>Test</b>",
    invitationToken: "safe-token",
    expiresAt: new Date("2026-09-29T10:00:00.000Z"),
  });

  assert.equal(result.ok, true);
});

test("does not call Brevo when the application URL is not configured", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  delete process.env.NEXT_PUBLIC_APP_URL;

  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  const result = await sendAcademyOwnerInvitationEmail({
    email: "owner@example.com",
    contactName: "Genci Vaqo",
    academyName: "Akademia Test",
    invitationToken: "test-owner-token",
    expiresAt: new Date("2026-09-29T10:00:00.000Z"),
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "not_configured",
  });

  assert.equal(fetchCalled, false);
});
