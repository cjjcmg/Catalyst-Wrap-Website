import { test } from "node:test";
import assert from "node:assert/strict";

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.RESEND_API_KEY = "re_test_key";
process.env.NEXT_PUBLIC_SITE_URL = "https://catalystmotorsport.com";
process.env.RESEND_WELCOME_FROM_EMAIL = "Catalyst Motorsport <team@catalystmotorsport.com>";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

// Dynamic imports AFTER env setup — ESM hoists static imports above statements,
// so top-level `import { ... } from ...` would run before env vars are assigned.
const { composeWelcomeEmail, sendWelcomeEmail, __TEST__ } = await import("../src/lib/welcome-email");
const emailMod = await import("../src/lib/email");

function makeMockAnthropic(jsonPayload: { kind: string; paragraph: string } | string) {
  const text = typeof jsonPayload === "string" ? jsonPayload : JSON.stringify(jsonPayload);
  return {
    messages: {
      create: async () => ({ content: [{ type: "text", text }] }),
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

test("composeWelcomeEmail sets correct headers for a real lead", async () => {
  const paragraph = "Your Raptor is getting the full Catalyst treatment.";
  const composed = await composeWelcomeEmail(
    {
      firstName: "Mike",
      email: "customer@example.com",
      serviceType: "Vinyl Wrap",
      vehicleMake: "Raptor",
    },
    makeMockAnthropic({ kind: "lead", paragraph })
  );

  assert.equal(composed.kind, "lead");
  assert.equal(composed.from, "Catalyst Motorsport <team@catalystmotorsport.com>");
  assert.equal(composed.to, "customer@example.com");
  assert.equal(composed.cc, "team@catalystmotorsport.com");
  assert.equal(composed.replyTo, "team@catalystmotorsport.com");
  assert.equal(composed.subject, __TEST__.SUBJECTS.lead);
});

test("lead email includes all three body blocks", async () => {
  const paragraph = "Your Raptor is getting the full Catalyst treatment and nothing less.";
  const composed = await composeWelcomeEmail(
    { firstName: "Mike", email: "customer@example.com", serviceType: "Vinyl Wrap" },
    makeMockAnthropic({ kind: "lead", paragraph })
  );

  assert.ok(composed.html.includes(__TEST__.STATIC_OPENERS.lead), "HTML missing lead opener");
  assert.ok(composed.text.includes(__TEST__.STATIC_OPENERS.lead), "text missing lead opener");
  assert.ok(composed.html.includes(paragraph), "HTML missing AI paragraph");
  assert.ok(composed.text.includes(paragraph), "text missing AI paragraph");
  assert.equal(composed.hype, paragraph);
  for (const line of __TEST__.STATIC_SIGNOFF_LINES) {
    assert.ok(composed.html.includes(line), `HTML missing sign-off line: ${line}`);
    assert.ok(composed.text.includes(line), `text missing sign-off line: ${line}`);
  }
});

test("solicitation uses alternate opener and subject", async () => {
  const paragraph = "Flattered, but Catalyst works on vehicles, not websites.";
  const composed = await composeWelcomeEmail(
    {
      firstName: "Steve",
      email: "steve@example.com",
      message: "We're seeking partners and would like to learn about your services.",
    },
    makeMockAnthropic({ kind: "solicitation", paragraph })
  );

  assert.equal(composed.kind, "solicitation");
  assert.equal(composed.subject, __TEST__.SUBJECTS.solicitation);
  assert.ok(composed.text.includes(__TEST__.STATIC_OPENERS.solicitation));
  assert.ok(!composed.text.includes(__TEST__.STATIC_OPENERS.lead), "should not include lead opener");
  assert.ok(composed.text.includes(paragraph));
});

test("partnership uses alternate opener and subject", async () => {
  const paragraph = "Send a real proposal to team@catalystmotorsport.com — serious inquiries only.";
  const composed = await composeWelcomeEmail(
    {
      firstName: "Jane",
      email: "jane@example.com",
      message: "We'd like to propose a referral partnership.",
    },
    makeMockAnthropic({ kind: "partnership", paragraph })
  );

  assert.equal(composed.kind, "partnership");
  assert.equal(composed.subject, __TEST__.SUBJECTS.partnership);
  assert.ok(composed.text.includes(__TEST__.STATIC_OPENERS.partnership));
  assert.ok(composed.text.includes(paragraph));
});

test("falls back to lead on Anthropic error", async () => {
  const composed = await composeWelcomeEmail(
    { firstName: "Mike", email: "customer@example.com", serviceType: "PPF" },
    makeFailingAnthropic(new Error("anthropic boom"))
  );

  assert.equal(composed.kind, "lead");
  assert.equal(composed.hype, __TEST__.FALLBACK_HYPE);
  assert.ok(composed.html.includes("the kind of work we live for"));
  assert.ok(composed.text.includes(__TEST__.FALLBACK_HYPE));
  assert.ok(composed.text.includes(__TEST__.STATIC_OPENERS.lead));
});

test("handles markdown-fenced JSON from the model", async () => {
  const paragraph = "Wrapped in backticks, still a real paragraph.";
  const fenced = "```json\n" + JSON.stringify({ kind: "lead", paragraph }) + "\n```";
  const composed = await composeWelcomeEmail(
    { email: "customer@example.com", serviceType: "Vinyl Wrap" },
    makeMockAnthropic(fenced)
  );

  assert.equal(composed.kind, "lead");
  assert.equal(composed.hype, paragraph);
});

test("sendWelcomeEmail calls Resend with composed headers", async (t) => {
  const sendCalls: unknown[] = [];
  const original = emailMod.resend.emails.send;
  emailMod.resend.emails.send = (async (args: unknown) => {
    sendCalls.push(args);
    return { data: { id: "mock-id" }, error: null };
  }) as typeof emailMod.resend.emails.send;
  t.after(() => {
    emailMod.resend.emails.send = original;
  });

  // No ANTHROPIC_API_KEY → fallback to lead path.
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
  assert.equal(call.subject, __TEST__.SUBJECTS.lead);
  assert.ok(call.html.includes("the kind of work we live for"));
  assert.ok(call.text.includes(__TEST__.FALLBACK_HYPE));
});
