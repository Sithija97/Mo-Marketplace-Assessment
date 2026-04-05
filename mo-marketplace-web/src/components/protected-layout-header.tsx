import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { Button } from "./ui/button";

type NavItem = {
  to: string;
  label: string;
};

type ProtectedLayoutHeaderProps = {
  navItems: NavItem[];
  userEmail?: string;
  onLogout: () => void;
};

export function ProtectedLayoutHeader({
  navItems,
  userEmail,
  onLogout,
}: ProtectedLayoutHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="https://mo.lk/_next/image?url=%2Fhome%2Fnav_logo.png&w=128&q=75"
            alt="MO Marketplace"
            className="size-8 rounded-md border object-cover"
          />
          <span className="text-sm font-semibold tracking-wide">
            MO Marketplace
          </span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userEmail}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
