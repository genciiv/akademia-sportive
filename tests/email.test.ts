import assert from "node:assert/strict";
import test from "node:test";

import { sendTransactionalEmail } from "../lib/email";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.BREVO_API_KEY;
const originalSenderEmail = process.env.BREVO_SENDER_EMAIL;
const originalSenderName = process.env.BREVO_SENDER_NAME;

function restoreEnvironment() {
  if (originalApiKey === undefined) {
    delete process.env.BREVO_API_KEY;
  } else {
    process.env.BREVO_API_KEY = originalApiKey;
  }

  if (originalSenderEmail === undefined) {
    delete process.env.BREVO_SENDER_EMAIL;
  } else {
    process.env.BREVO_SENDER_EMAIL = originalSenderEmail;
  }

  if (originalSenderName === undefined) {
    delete process.env.BREVO_SENDER_NAME;
  } else {
    process.env.BREVO_SENDER_NAME = originalSenderName;
  }

  globalThis.fetch = originalFetch;
}

const emailInput = {
  to: {
    email: "recipient@example.com",
    name: "Test Recipient",
  },
  subject: "Test email",
  htmlContent: "<p>Test</p>",
  textContent: "Test",
};

test.afterEach(() => {
  restoreEnvironment();
});

test("returns not_configured without Brevo credentials", async () => {
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_SENDER_EMAIL;

  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  const result = await sendTransactionalEmail(emailInput);

  assert.deepEqual(result, {
    ok: false,
    reason: "not_configured",
  });
  assert.equal(fetchCalled, false);
});

test("sends a transactional email through Brevo", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
  process.env.BREVO_SENDER_NAME = "AkademiaSportive";

  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://api.brevo.com/v3/smtp/email");
    assert.equal(init?.method, "POST");

    const headers = init?.headers as Record<string, string>;
    assert.equal(headers["api-key"], "test-api-key");
    assert.equal(headers["content-type"], "application/json");

    const body = JSON.parse(String(init?.body));

    assert.deepEqual(body.sender, {
      email: "sender@example.com",
      name: "AkademiaSportive",
    });
    assert.deepEqual(body.to, [
      {
        email: "recipient@example.com",
        name: "Test Recipient",
      },
    ]);
    assert.equal(body.subject, "Test email");
    assert.equal(body.htmlContent, "<p>Test</p>");
    assert.equal(body.textContent, "Test");

    return new Response(
      JSON.stringify({
        messageId: "<test-message-id>",
      }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const result = await sendTransactionalEmail(emailInput);

  assert.deepEqual(result, {
    ok: true,
    messageId: "<test-message-id>",
  });
});

test("returns provider_error when Brevo rejects the request", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });

  const result = await sendTransactionalEmail(emailInput);

  assert.deepEqual(result, {
    ok: false,
    reason: "provider_error",
    status: 401,
  });
});

test("returns network_error when the Brevo request fails", async () => {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";

  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  const result = await sendTransactionalEmail(emailInput);

  assert.deepEqual(result, {
    ok: false,
    reason: "network_error",
  });
});
