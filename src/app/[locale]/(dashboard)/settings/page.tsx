import { auth } from "@/lib/auth/auth.config";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountSettingsForm } from "@/components/account/AccountSettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      nameAr: true,
      locale: true,
      timezone: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="p-4 lg:p-6">
      <AccountSettingsForm
        initial={{
          email: user.email,
          name: user.name,
          nameAr: user.nameAr,
          locale: user.locale === "ar" ? "ar" : "en",
          timezone: user.timezone,
        }}
      />
    </div>
  );
}
