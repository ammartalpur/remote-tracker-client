import { redirect } from "next/navigation";

export default function RootPage() {
  // Immediately redirect the owner to the main dashboard
  redirect("/dashboard");
}
