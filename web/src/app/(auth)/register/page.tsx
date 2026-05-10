import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { plan } = await searchParams;
  const planPart = plan ? `&plan=${encodeURIComponent(plan)}` : "";
  redirect(`/login?mode=register${planPart}`);
}
