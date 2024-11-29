// src/components/layout/Sidebar.tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Library,
  LayoutDashboard,
  Settings,
  Users,
  GraduationCap,
  BarChart,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isAdmin = profile?.email?.endsWith("@yourcompany.com"); // Beispiel Admin-Check

  const routes = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      public: true,
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      protected: true,
    },
    {
      label: "My Courses",
      icon: Library,
      href: "/courses",
      protected: true,
    },
    // Admin Routes
    {
      label: "Course Management",
      icon: GraduationCap,
      href: "/admin/courses",
      admin: true,
    },
    {
      label: "Users",
      icon: Users,
      href: "/admin/users",
      admin: true,
    },
    {
      label: "Analytics",
      icon: BarChart,
      href: "/admin/analytics",
      admin: true,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      protected: true,
    },
  ];

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
          <div className="space-y-1">
            {routes.map((route) => {
              if (route.protected && !user) return null;
              if (route.admin && !isAdmin) return null;

              return (
                <NavLink
                  key={route.href}
                  to={route.href}
                  onClick={() => onNavigate?.()} // Schließt das mobile Menü beim Navigieren
                  className={({ isActive }) =>
                    cn(
                      "flex items-center w-full justify-start",
                      isActive && "bg-accent text-accent-foreground",
                    )
                  }
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location.pathname === route.href &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    <route.icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </Button>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
