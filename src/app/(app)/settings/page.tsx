import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";
import { MembershipPlansSection } from "./membership-plans";

export const metadata = { title: "Settings · Block23 Gym" };

export default async function SettingsPage() {
  const gym = await getCurrentGym();
  if (!gym) redirect("/login");

  // Membership plan catalog (US-3.9). Active plans first, then by creation order.
  const plans = await prisma.membershipPlan.findMany({
    where: { gymId: gym.id },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      durationDays: true,
      defaultPrice: true,
      isActive: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Gym information, pricing, membership plans, and system preferences."
      />
      <div className="space-y-6">
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
        <MembershipPlansSection
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            durationDays: p.durationDays,
            defaultPrice: Number(p.defaultPrice),
            isActive: p.isActive,
          }))}
        />
      </div>
    </>
  );
}
