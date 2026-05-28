import { describe, expect, it } from "vitest";

import { InMemoryEventRepository } from "../../../test-support/InMemoryEventRepository";
import { makeEvent } from "../../../test-support/fixtures";
import { getEventBySlug } from "./getEventBySlug";

describe("getEventBySlug", () => {
  it("returns a published event", async () => {
    const repo = new InMemoryEventRepository([
      makeEvent({ slug: "bwai-2026", status: "published" }),
    ]);
    const result = await getEventBySlug(
      { slug: "bwai-2026" },
      { eventRepo: repo },
    );
    expect(result?.slug).toBe("bwai-2026");
  });

  it("returns null for missing slug", async () => {
    const repo = new InMemoryEventRepository([]);
    const result = await getEventBySlug({ slug: "nope" }, { eventRepo: repo });
    expect(result).toBeNull();
  });

  it("returns null for a draft (drafts never leave)", async () => {
    const repo = new InMemoryEventRepository([
      makeEvent({ slug: "secret", status: "draft" }),
    ]);
    const result = await getEventBySlug(
      { slug: "secret" },
      { eventRepo: repo },
    );
    expect(result).toBeNull();
  });
});
