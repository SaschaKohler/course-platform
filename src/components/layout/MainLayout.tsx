// src/components/layout/MainLayout.tsx
import { Sidebar } from "./Sidebar";
import { Navigation } from "../shared/Navigation";
import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
