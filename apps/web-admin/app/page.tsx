import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/events");
  if (user.systemRole === "attendee") {
    redirect("/sign-in?error=not_staff");
  }
  redirect("/events");
}
