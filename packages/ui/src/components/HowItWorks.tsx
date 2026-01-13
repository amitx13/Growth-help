import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MedalIcon, MapIcon, PlaneIcon, GiftIcon } from "./Icons";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <MedalIcon />,
    title: "Join With ₹550",
    description:
      "Start by contributing ₹550 to become part of the community-driven peer-to-peer support system.",
  },
  {
    icon: <MapIcon />,
    title: "Refer & Earn Instantly",
    description:
      "Receive ₹500 instantly for every person you refer to the platform — no waiting, no delays.",
  },
  {
    icon: <PlaneIcon />,
    title: "Grow Your Network",
    description:
      "As your team expands, you unlock additional earning levels and bonuses through community participation.",
  },
  {
    icon: <GiftIcon />,
    title: "Multiple Income Sources",
    description:
      "Earn through Direct Income, Level Income, Sponsor Income, Re-Entry Income, and even Non-Working Income.",
  },
];


export const HowItWorks = () => {
  return (
    <section
      id="howItWorks"
      className="mx-3 sm:container text-center py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold ">
        How It{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Works{" "}
        </span>
        Step-by-Step Guide
      </h2>
      <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
        Turn your dreams into 
        <span className="pl-1 pr-1 text-primary">reality</span> 
        with Growth Help Crowdfunding! 🚀
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card
            key={title}
            className="bg-muted/50"
          >
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
