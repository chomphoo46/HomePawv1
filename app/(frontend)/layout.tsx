import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SessionProviderWrapper from "@/app/SessionProviderWrapper";

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <SessionProviderWrapper session={session}>
      {children}
    </SessionProviderWrapper>
  );
}
