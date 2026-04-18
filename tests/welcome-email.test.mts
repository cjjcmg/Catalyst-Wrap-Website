import { test } from "node:test";
import assert from "node:assert/strict";

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.RESEND_API_KEY = "re_test_key";
process.env.NEXT_PUBLIC_SITE_URL = "https://catalystmotorsport.com";
process.env.RESEND_WELCOME_FROM_EMAIL = "Catalyst Motorsport <team@catalystmotorsport.com>";

// Dynamic imports AFTER env setup — ESM hoists static imports above statements,
// so top-level `import { ... } from ...` would run before env vars are assigned.
const { composeWelcomeEmail, sendWelcomeEmail, __TEST__ } = await import("../src/lib/welcome-email");
const emailMod = await import("../src/lib/email");

function makeMockAnthropic(hype: string) {
  return {
    messages: {
      create: async () => ({ content: [{ type: "text", text: hype }] }),
    },
  } as never;
}

function makeFailingAnthropic(err: Error) {
  return {
    messages: {
      create: async () => {
        throw err;
      },
    },
  } as never;
}

test("composeWelcomeEmail sets correct From/To/Cc/Reply-To/Subject", async () => {
  const composed = await composeWelcomeEmail(
    {
      firstName: "Mike",
      email: "customer@example.com",
      serviceType: "Vinyl Wrap",
      vehicleMake: "Raptor",
    },
    makeMockAnthropic("Your Raptor is getting the full Catalyst treatment.")
  );

  assert.equal(composed.from, "Catalyst Motorsport <team@catalystmotorsport.com>");
  assert.equal(composed.to, "customer@example.com");
  assert.equal(composed.cc, "team@catalystmotorsport.com");
  assert.equal(composed.replyTo, "team@catalystmotorsport.com");
  assert.equal(composed.subject, "Welcome to Catalyst Motorsport — we're on it");
});

test("composeWelcomeEmail includes all three body blocks in HTML and text", async () => {
  const hype = "Your Raptor is getting the full Catalyst treatment and nothing less.";
  const composed = await composeWelcomeEmail(
    { firstName: "Mike", email: "customer@example.com", serviceType: "Vinyl Wrap" },
    makeMockAnthropic(hype)
  );

  // Block 1 — static welcome
  assert.ok(composed.html.includes(__TEST__.STATIC_WELCOME), "HTML missing static welcome block");
  assert.ok(composed.text.includes(__TEST__.STATIC_WELCOME), "text missing static welcome block");

  // Block 2 — AI hype paragraph
  assert.ok(composed.html.includes(hype), "HTML missing AI hype block");
  assert.ok(composed.text.includes(hype), "text missing AI hype block");
  assert.equal(composed.hype, hype);

  // Block 3 — static sign-off
  for (const line of __TEST__.STATIC_SIGNOFF_LINES) {
    assert.ok(composed.html.includes(line), `HTML missing sign-off line: ${line}`);
    assert.ok(composed.text.includes(line), `text missing sign-off line: ${line}`);
  }
});

test("composeWelcomeEmail falls back when Anthropic throws", async () => {
  const composed = await composeWelcomeEmail(
    { firstName: "Mike", email: "customer@example.com", serviceType: "PPF" },
    makeFailingAnthropic(new Error("anthropic boom"))
  );

  assert.equal(composed.hype, __TEST__.FALLBACK_HYPE);
  // HTML escapes apostrophes; assert on distinctive unescaped substrings plus text equality.
  assert.ok(composed.html.includes("the kind of work we live for"));
  assert.ok(composed.html.includes("Keep your phone close"));
  assert.ok(composed.text.includes(__TEST__.FALLBACK_HYPE));
});

test("sendWelcomeEmail calls Resend with the composed headers", async (t) => {
  const sendCalls: unknown[] = [];
  const original = emailMod.resend.emails.send;
  emailMod.resend.emails.send = (async (args: unknown) => {
    sendCalls.push(args);
    return { data: { id: "mock-id" }, error: null };
  }) as typeof emailMod.resend.emails.send;
  t.after(() => {
    emailMod.resend.emails.send = original;
  });

  // No ANTHROPIC_API_KEY → fallback path, so we don't need to stub Anthropic.
  const prevKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  t.after(() => {
    if (prevKey) process.env.ANTHROPIC_API_KEY = prevKey;
  });

  await sendWelcomeEmail({
    firstName: "Mike",
    email: "customer@example.com",
    serviceType: "Ceramic Coating",
  });

  assert.equal(sendCalls.length, 1);
  const call = sendCalls[0] as {
    from: string;
    to: string;
    cc: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
  };
  assert.equal(call.from, "Catalyst Motorsport <team@catalystmotorsport.com>");
  assert.equal(call.to, "customer@example.com");
  assert.equal(call.cc, "team@catalystmotorsport.com");
  assert.equal(call.replyTo, "team@catalystmotorsport.com");
  assert.equal(call.subject, "Welcome to Catalyst Motorsport — we're on it");
  assert.ok(call.html.includes("the kind of work we live for"));
  assert.ok(call.text.includes(__TEST__.FALLBACK_HYPE));
});
