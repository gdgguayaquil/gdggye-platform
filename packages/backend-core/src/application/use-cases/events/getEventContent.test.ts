import { describe, expect, it } from "vitest";

import { InMemoryEventContentRepository } from "../../../test-support/InMemoryEventContentRepository";
import { InMemoryEventRepository } from "../../../test-support/InMemoryEventRepository";
import { makeContent, makeEvent } from "../../../test-support/fixtures";
import { getEventContent } from "./getEventContent";

describe("getEventContent", () => {
  it("returns content for a published event", async () => {
    const eventRepo = new InMemoryEventRepository([
      makeEvent({ id: "evt-1", slug: "bwai-2026", status: "published" }),
    ]);
    const contentRepo = new InMemoryEventContentRepository([
      makeContent({ eventId: "evt-1" }),
    ]);
    const result = await getEventContent(
      { slug: "bwai-2026" },
      { eventRepo, contentRepo },
    );
    expect(result?.eventId).toBe("evt-1");
  });

  it("returns null when the event does not exist", async () => {
    const eventRepo = new InMemoryEventRepository([]);
    const contentRepo = new InMemoryEventContentRepository([]);
    const result = await getEventContent(
      { slug: "ghost" },
      { eventRepo, contentRepo },
    );
    expect(result).toBeNull();
  });

  it("returns null when the event is a draft (even if content exists)", async () => {
    const eventRepo = new InMemoryEventRepository([
      makeEvent({ id: "evt-1", slug: "wip", status: "draft" }),
    ]);
    const contentRepo = new InMemoryEventContentRepository([
      makeContent({ eventId: "evt-1" }),
    ]);
    const result = await getEventContent(
      { slug: "wip" },
      { eventRepo, contentRepo },
    );
    expect(result).toBeNull();
  });
});
