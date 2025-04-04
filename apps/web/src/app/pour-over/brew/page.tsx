import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pour-Over Coffee Brewing Timer",
  description:
    "Interactive timer for brewing pour-over coffee. Follow step-by-step instructions with precise water measurements and timing.",
  keywords: ["pour over", "coffee brewing", "timer", "v60", "chemex", "kalita"],
};

export default function BrewingRedirectPage() {
  redirect("/pour-over");
  return null;
}
