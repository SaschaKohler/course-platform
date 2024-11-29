// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AdminRoute } from "@/components/shared/AdminRoute";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { ErrorBoundaryWrapper } from "./components/shared/ErrorBoundaryWrapper";

// Lazy load pages
const Home = lazy(() => import("@/pages/Home"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
// const Courses = lazy(() => import("@/pages/Courses"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
// const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
// const AdminUsers = lazy(() => import("@/pages/admin/Users"));
// const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
// const Settings = lazy(() => import("@/pages/Settings"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route
              index
              element={
                <ErrorBoundaryWrapper>
                  <Home />
                </ErrorBoundaryWrapper>
              }
            />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="dashboard"
                element={
                  <ErrorBoundaryWrapper>
                    <Dashboard />
                  </ErrorBoundaryWrapper>
                }
              />
              {/* <Route path="courses" element={<Courses />} /> */}
              {/* <Route path="settings" element={<Settings />} /> */}
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ErrorBoundaryWrapper>
                  <AdminRoute />
                </ErrorBoundaryWrapper>
              }
            >
              <Route path="admin">
                <Route index element={<AdminDashboard />} />
                {/* <Route path="courses" element={<AdminCourses />} /> */}
                {/* <Route path="users" element={<AdminUsers />} /> */}
                {/* <Route path="analytics" element={<AdminAnalytics />} /> */}
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
