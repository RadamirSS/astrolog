import { PaymentReturnScreen } from "@astro/miniapp-renderer";

export default function PaymentFailedPage() {
  return <PaymentReturnScreen returnState="failed" />;
}
