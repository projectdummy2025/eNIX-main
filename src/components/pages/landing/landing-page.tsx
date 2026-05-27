import { FeaturesSection } from "./features-section";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { LandingNavbar } from "./landing-navbar";

export function LandingPage() {
  return (
    <div className="flex w-full flex-col">
      <LandingNavbar />
      <main className="grow">
        <HeroSection />
        <FeaturesSection />
      </main>
      <FooterSection />
    </div>
  );
}
