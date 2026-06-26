import { redirect } from "next/navigation";
import { getCurrentGym } from "@/lib/gym";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings · Block23 Gym" };

export default async function SettingsPage() {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Gym information, pricing, and system preferences."
      />
      <SettingsForm
        defaultValues={{
          name: gym.name,
          address: gym.address,
          contactInfo: gym.contactInfo,
          timezone: gym.timezone,
          defaultWalkinFee: Number(gym.defaultWalkinFee),
          expirationWarningDays: gym.expirationWarningDays,
          walkinInactivityThresholdDays: gym.walkinInactivityThresholdDays,
          memberInactivityWarningDays: gym.memberInactivityWarningDays,
          walkinConversionPromptVisits: gym.walkinConversionPromptVisits,
        }}
      />
    </>
  );
}
