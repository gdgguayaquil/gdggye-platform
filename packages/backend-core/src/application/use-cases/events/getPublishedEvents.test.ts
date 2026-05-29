import { describe, expect, it } from "vitest";

import { InMemoryEventRepository } from "../../../test-support/InMemoryEventRepository";
import { makeEvent } from "../../../test-support/fixtures";
import { getPublishedEvents } from "./getPublishedEvents";

describe("getPublishedEvents", () => {
  it("returns published, live and closed events", async () => {
    const repo = new InMemoryEventRepository([
      makeEvent({ id: "1", slug: "a", status: "published" }),
      makeEvent({ id: "2", slug: "b", status: "live" }),
      makeEvent({ id: "3", slug: "c", status: "closed" }),
    ]);
    const result = await getPublishedEvents({}, { eventRepo: repo });
    expect(result.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("filters out drafts", async () => {
    const repo = new InMemoryEventRepository([
      makeEvent({ id: "1", slug: "a", status: "published" }),
      makeEvent({ id: "2", slug: "b", status: "draft" }),
    ]);
    const result = await getPublishedEvents({}, { eventRepo: repo });
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });

  it("optionally filters by year", async () => {
    const repo = new InMemoryEventRepository([
      makeEvent({ id: "1", slug: "a", year: 2025, status: "closed" }),
      makeEvent({ id: "2", slug: "b", year: 2026, status: "published" }),
    ]);
    const result = await getPublishedEvents(
      { year: 2026 },
      { eventRepo: repo },
    );
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });

  it("defends against a misconfigured repo that returns drafts", async () => {
    // Repo intentionally ignores the status filter — the use case should still
    // strip drafts before returning.
    const repo: import("../../ports/EventRepository").EventRepository = {
      async findById() {
        return null;
      },
      async findBySlug() {
        return null;
      },
      async list() {
        return [
          makeEvent({ id: "1", slug: "a", status: "draft" }),
          makeEvent({ id: "2", slug: "b", status: "published" }),
        ];
      },
      async create() {
        throw new Error("not used in this test");
      },
      async update() {
        throw new Error("not used in this test");
      },
      async updateStatus() {
        throw new Error("not used in this test");
      },
    };
    const result = await getPublishedEvents({}, { eventRepo: repo });
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });
});
