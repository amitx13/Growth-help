import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [ripple, setRipple] = useState<{ x: number; y: number; theme: string } | null>(null);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const nextTheme = theme === "light" ? "dark" : "light";
    
    setRipple({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      theme: nextTheme,
    });

    setTimeout(() => {
      setTheme(nextTheme);
    }, 300);

    setTimeout(() => setRipple(null), 400);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="ghost"
        onClick={handleToggle}
      >
        <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {ripple && (
        <div
          className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-[9999]"
          style={{
            background: ripple.theme === "dark" 
              ? "hsl(0 0% 3.9%)"
              : "hsl(0 0% 100%)",
            clipPath: `circle(0% at ${ripple.x}px ${ripple.y}px)`,
            animation: "ripple 400ms ease-out forwards",
            // @ts-ignore
            "--ripple-x": `${ripple.x}px`,
            "--ripple-y": `${ripple.y}px`,
          }}
        />
      )}
    </>
  );
}
