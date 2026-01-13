import { useState } from "react";
import { useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BellRing,
  Key,
  LayoutDashboard,
  LogIn,
  LogOut,
  LucideIcon,
  Menu,
  Settings,
  User,
  UserPlus,
  Users,
  Wallet,
  Sparkles
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";

interface RouteProps {
  label: string
  route: string
}

interface NavbarProps {
  handleNavigateToRoutes: (route: string) => void;
  routeList: RouteProps[]
  user: any | null;
}

export const Navbar = ({ handleNavigateToRoutes, routeList, user }: NavbarProps) => {

  const routeIconMap: Record<string, LucideIcon> = {
    '/dashboard': LayoutDashboard,
    '/notifications': BellRing,
    '/profile': User,
    '/community': Users,
    '/wallet': Wallet,
    '/pin': Key,
    '/users': Users,
    '/payments': Wallet,
    '/settings': Settings,
    '/login': LogIn,
    '/signup': UserPlus,
    '/logout': LogOut,
  };

  const getIconForRoute = (route: string): LucideIcon => {
    return routeIconMap[route];
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <header className="sticky border-b top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-border shadow-sm">

      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-16 px-4 w-screen flex justify-between">
          {/* Logo */}
          <NavigationMenuItem className="font-bold flex">
            <a
              rel="noreferrer noopener"
              className="ml-2 font-bold text-xl flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600 font-extrabold">
                Growth Help
              </span>
            </a>
          </NavigationMenuItem>

          {/* Mobile */}
          <span className="flex md:hidden items-center gap-3">
            <ModeToggle />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex items-center justify-center p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all border border-border"
                  onClick={() => setIsOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu Icon</span>
                </button>
              </SheetTrigger>

              <SheetContent side={"left"} className="w-[280px] sm:w-[340px] p-0">
                {/* Mobile Header */}
                <SheetHeader className="border-b border-border p-6 bg-gradient-to-r from-primary/5 to-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/30">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
                      Growth Help
                    </SheetTitle>
                  </div>
                  {user && (
                    <div className="mt-4 p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-3">
                        {/* Avatar with initial */}
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* ✅ FIXED: Changed from justify-center to items-start */}
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <div className="flex gap-2 items-center">
                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono truncate">ID: {user.id}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </SheetHeader>

                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-1 p-4">
                  {routeList.map(({ route, label }: RouteProps) => {
                    const location = useLocation();
                    const isActive = location.pathname === route;
                    const isLogout = label.toLowerCase() === 'logout';

                    if (user && (route === '/login' || route === '/signup')) {
                      return null;
                    }
                    if (user === null && (route === '/login' || route === '/signup')) {
                      return (
                        <a
                          rel="noreferrer noopener"
                          key={label}
                          onClick={() => {
                            setIsOpen(false)
                            handleNavigateToRoutes(route);
                          }}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${isActive
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                        >
                          {(() => {
                            const Icon = getIconForRoute(route);
                            return <Icon className="h-5 w-5 flex-shrink-0" />;
                          })()}
                          <span className="flex-1">{label}</span>
                          {isActive && (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                          )}
                        </a>
                      )
                    }
                    if (user !== null) {
                      return (
                        <a
                          rel="noreferrer noopener"
                          key={label}
                          onClick={() => {
                            setIsOpen(false)
                            handleNavigateToRoutes(route);
                          }}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${isLogout
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 mt-2 border border-red-200 dark:border-red-900'
                            : isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                        >
                          {(() => {
                            const Icon = getIconForRoute(route);
                            return <Icon className="h-5 w-5 flex-shrink-0" />;
                          })()}
                          <span className="flex-1">{label}</span>
                          {isActive && !isLogout && (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                          )}
                        </a>
                      )
                    }
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </span>

          {/* Desktop */}
          <nav className="hidden md:flex w-full justify-end items-center gap-2">
            {routeList.map((route: RouteProps) => {
              const location = useLocation();
              const isActive = location.pathname === route.route;
              const isLogout = route.label.toLowerCase() === 'logout';

              if (!user && (route.route === '/login' || route.route === '/signup')) {
                return (
                  <div
                    rel="noreferrer noopener"
                    key={route.label}
                    onClick={() => {
                      setIsOpen(false)
                      handleNavigateToRoutes(route.route);
                    }}
                    className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'hover:bg-accent hover:text-accent-foreground border border-border'
                      }`}
                  >
                    <div className="flex justify-center items-center gap-2">
                      {(() => {
                        const Icon = getIconForRoute(route.route);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span>{route.label}</span>
                    </div>
                  </div>
                )
              }
              if (user && (route.route === '/login' || route.route === '/signup')) {
                return null;
              }
              if (user !== null) {
                return (
                  <a
                    rel="noreferrer noopener"
                    key={route.label}
                    onClick={() => {
                      setIsOpen(false)
                      handleNavigateToRoutes(route.route);
                    }}
                    className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 relative ${isLogout
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900'
                      : isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <div className="flex justify-center items-center gap-2">
                      {(() => {
                        const Icon = getIconForRoute(route.route);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span>{route.label}</span>
                    </div>
                  </a>
                )
              }
            })}
          </nav>

          <div className="hidden md:flex gap-2">
            <ModeToggle />
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
