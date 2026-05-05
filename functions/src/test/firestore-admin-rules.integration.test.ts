import {describe, expect, test, beforeAll, afterAll, beforeEach} from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {setDoc, doc} from "firebase/firestore";

const RULES_PATH = path.resolve(__dirname, "../../../firebase/firestore-admin.rules");

const SUGGESTIONS = "suggestions";

function buildSuggestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: "discord_server",
    submittedAt: new Date().toISOString(),
    submittedBy: {
      userId: "user-alice",
      source: "manual",
    },
    payload: {name: "Example Discord"},
    status: "pending",
    ...overrides,
  };
}

describe("firestore-admin.rules: /suggestions create", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "demo-admin-rules",
      firestore: {
        rules: fs.readFileSync(RULES_PATH, "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  test("allows authenticated user to create when submittedBy.userId matches auth.uid", async () => {
    const ctx = testEnv.authenticatedContext("user-alice");
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-1");

    await assertSucceeds(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "user-alice", source: "manual"},
        })
      )
    );
  });

  test("denies authenticated user when submittedBy.userId does not match auth.uid", async () => {
    const ctx = testEnv.authenticatedContext("user-alice");
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-2");

    await assertFails(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "user-bob", source: "manual"},
        })
      )
    );
  });

  test("denies impersonation even when submittedBy.source is 'automated'", async () => {
    // Regression test for the removed `source == 'automated'` bypass.
    // A logged-in user must not be able to write a suggestion claiming
    // another user's uid by setting submittedBy.source to 'automated'.
    const ctx = testEnv.authenticatedContext("user-alice");
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-3");

    await assertFails(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "user-bob", source: "automated"},
        })
      )
    );
  });

  test("denies create when submittedBy.source is 'automated' and userId matches auth.uid is still permitted (source field is not authoritative)", async () => {
    // Even when source is 'automated', the rule only depends on
    // submittedBy.userId == auth.uid. Setting source should not change
    // the outcome relative to a normal create by the same user.
    const ctx = testEnv.authenticatedContext("user-alice");
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-4");

    await assertSucceeds(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "user-alice", source: "automated"},
        })
      )
    );
  });

  test("denies unauthenticated create even when payload userId is set", async () => {
    const ctx = testEnv.unauthenticatedContext();
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-5");

    await assertFails(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "user-alice", source: "manual"},
        })
      )
    );
  });

  test("denies unauthenticated create with submittedBy.source == 'automated'", async () => {
    const ctx = testEnv.unauthenticatedContext();
    const ref = doc(ctx.firestore(), SUGGESTIONS, "suggestion-6");

    await assertFails(
      setDoc(
        ref,
        buildSuggestion({
          submittedBy: {userId: "anyone", source: "automated"},
        })
      )
    );
  });
});
