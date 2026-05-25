import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

const defaultSlug = () => process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "mystic-dark";

export default function RootProductDetailRedirect({ params }: PageProps) {
  redirect(`/${defaultSlug()}/products/${params.id}`);
}
