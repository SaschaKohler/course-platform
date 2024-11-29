// src/components/shared/Navigation.tsx
import { UserMenu } from "./UserMenu";
import { AuthModal } from "./AuthModal_test";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function Navigation() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MobileNav />
        <Link to="/" className="flex items-center space-x-2 md:mr-6">
          <span className="hidden font-bold md:inline-block">
            Learn Platform
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? <UserMenu /> : <AuthModal />}
          </nav>
        </div>
      </div>
    </header>
  );
}
