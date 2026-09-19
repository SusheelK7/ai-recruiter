import { LandingPage } from "@/components/landing/LandingPage";
import { Analytics } from "@vercel/analytics/react";

export default function Home() {
  return (
    <>
      <Analytics />
      <LandingPage />
    </>
  );

}
