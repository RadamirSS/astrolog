import { redirect } from "next/navigation";

const defaultSlug = () => process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "mystic-dark";

export default function RootHomeRedirect() {
  redirect(`/${defaultSlug()}`);
}
