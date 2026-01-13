import type { ReactNode } from "react";

export const AnimatedPageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Vertical structural flow */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px animate-line"
            style={{
              left: `${(i + 1) * 8}%`,
              background:
                "linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.25), transparent)",
              opacity: 0.35,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Horizontal constraint */}
      <div
        className="absolute inset-x-0 top-1/2 h-px animate-cross"
        style={{
          background:
            "linear-gradient(to right, transparent, hsl(var(--accent) / 0.25), transparent)",
          opacity: 0.3,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes line {
          0% {
            transform: translateY(-12%);
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(12%);
            opacity: 0.15;
          }
        }

        @keyframes cross {
          0% {
            transform: translateX(-8%);
            opacity: 0.12;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translateX(8%);
            opacity: 0.12;
          }
        }

        .animate-line {
          animation: line 10s ease-in-out infinite;
        }

        .animate-cross {
          animation: cross 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
