import { describe, expect, it } from "vitest";
import {
  canEditDocument,
  canShareDocument,
  canViewDocument,
  getDocumentAccess,
} from "./access";

const document = {
  ownerId: "alice-id",
  shares: [
    {
      userId: "bob-id",
      role: "EDITOR" as const,
    },
    {
      userId: "carol-id",
      role: "VIEWER" as const,
    },
  ],
};

describe("document access", () => {
  it("gives the owner full access", () => {
    const access = getDocumentAccess("alice-id", document);

    expect(access).toBe("OWNER");
    expect(canViewDocument(access)).toBe(true);
    expect(canEditDocument(access)).toBe(true);
    expect(canShareDocument(access)).toBe(true);
  });

  it("allows an editor to view and edit but not share", () => {
    const access = getDocumentAccess("bob-id", document);

    expect(access).toBe("EDITOR");
    expect(canViewDocument(access)).toBe(true);
    expect(canEditDocument(access)).toBe(true);
    expect(canShareDocument(access)).toBe(false);
  });

  it("allows a viewer to view but not edit", () => {
    const access = getDocumentAccess("carol-id", document);

    expect(access).toBe("VIEWER");
    expect(canViewDocument(access)).toBe(true);
    expect(canEditDocument(access)).toBe(false);
    expect(canShareDocument(access)).toBe(false);
  });

  it("rejects users who do not have access", () => {
    const access = getDocumentAccess("unknown-id", document);

    expect(access).toBe("NONE");
    expect(canViewDocument(access)).toBe(false);
    expect(canEditDocument(access)).toBe(false);
    expect(canShareDocument(access)).toBe(false);
  });
});
