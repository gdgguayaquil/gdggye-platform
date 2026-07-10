"use server";

import { revalidatePath } from "next/cache";

import {
  RoleChangeBlocked,
  type RoleChangeBlockedReason,
  type SystemRole,
} from "@gdggye/backend-core";

import { requireAdmin } from "@/lib/server/auth";
import { setUserRole } from "@/lib/server/users";

export interface SetRoleActionState {
  ok: boolean;
  error?: string;
}

const ROLES: SystemRole[] = ["attendee", "organizer", "admin"];

const BLOCK_COPY: Record<RoleChangeBlockedReason, string> = {
  self_demotion: "You can't remove your own admin access.",
  user_not_found: "That user no longer exists.",
};

function readString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function setUserRoleAction(
  _prev: SetRoleActionState,
  form: FormData,
): Promise<SetRoleActionState> {
  const admin = await requireAdmin();
  const targetUserId = readString(form, "userId");
  const role = readString(form, "role");

  if (!targetUserId) return { ok: false, error: "Missing user." };
  if (!ROLES.includes(role as SystemRole)) {
    return { ok: false, error: "Invalid role." };
  }

  try {
    await setUserRole({
      targetUserId,
      role: role as SystemRole,
      actorId: admin.id,
    });
  } catch (e) {
    if (e instanceof RoleChangeBlocked) {
      return { ok: false, error: BLOCK_COPY[e.reason] };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/users");
  return { ok: true };
}
