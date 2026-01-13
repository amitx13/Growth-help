import { Statistics } from "./Statistics";
import growth from "../assets/growth.png";

export const About = () => {
  return (
    <section id="about" className="mx-3 py-8 md:py-12">
      <div>
        <div className="px-4 md:px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src={growth}
            alt="Growth Help"
            className="w-full md:w-[350px] max-w-[280px] md:max-w-none mx-auto md:mx-0 object-contain rounded-xl"
          />

          <div className="flex flex-col justify-between min-w-0">
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                  About{" "}
                </span>
                <span className="text-nowrap">
                  Growth Help
                </span>
              </h2>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                We are India's first reliable peer-to-peer (P2P) financial support platform,
                built on a community-driven crowdfunding system that helps people support
                each other and unlock new financial opportunities.
              </p>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Thousands of people across India have already benefited from this platform
                and taken a step toward financial growth and independence.
              </p>

              <ul className="text-base md:text-lg text-muted-foreground space-y-2">
                <li>💠 <strong>100% Peer-to-Peer Transactions</strong></li>
                <li>💠 <strong>Secure & Verified System</strong></li>
                <li>💠 <strong>Transparent Processes</strong></li>
                <li>💠 <strong>Trusted by Users Nationwide</strong></li>
              </ul>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Our mission is to empower individuals with financial freedom while building
                a network founded on trust, transparency, and community support.
              </p>

              <p className="text-base md:text-lg font-semibold text-primary">
                🚀 Join us today — your life-changing opportunity starts here.
              </p>
            </div>

            <div className="pt-6 md:pt-10">
              <Statistics />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
