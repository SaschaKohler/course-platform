// src/hooks/useAdmin.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

interface AdminMetrics {
  totalUsers: number;
  activeCourses: number;
  monthlyRevenue: number;
  conversionRate: number;
}

interface RevenueData {
  month: string;
  amount: number;
}

export function useAdmin() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeCourses: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (userError) throw userError;

      // Fetch active courses
      const { count: courseCount, error: courseError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      if (courseError) throw courseError;

      // Fetch monthly revenue (from user_courses table)
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );

      const { data: monthlyPurchases, error: revenueError } = await supabase
        .from("user_courses")
        .select("courses(price)")
        .gte("purchased_at", firstDayOfMonth.toISOString());

      if (revenueError) throw revenueError;

      const monthlyRevenue = monthlyPurchases.reduce((sum, purchase) => {
        return sum + (purchase.courses?.price || 0);
      }, 0);

      // Calculate conversion rate (purchased courses / total user count)
      const { count: purchaseCount, error: purchaseError } = await supabase
        .from("user_courses")
        .select("*", { count: "exact", head: true });

      if (purchaseError) throw purchaseError;

      const conversionRate = userCount ? (purchaseCount / userCount) * 100 : 0;

      setMetrics({
        totalUsers: userCount || 0,
        activeCourses: courseCount || 0,
        monthlyRevenue,
        conversionRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching metrics");
      console.error("Error fetching admin metrics:", err);
    }
  };

  const fetchRevenueData = async () => {
    try {
      // Get revenue data for the last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date;
      }).reverse();

      const revenuePromises = months.map(async (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: purchases, error } = await supabase
          .from("user_courses")
          .select("courses(price)")
          .gte("purchased_at", firstDay.toISOString())
          .lte("purchased_at", lastDay.toISOString());

        if (error) throw error;

        const monthlyAmount = purchases.reduce((sum, purchase) => {
          return sum + (purchase.courses?.price || 0);
        }, 0);

        return {
          month: date.toLocaleString("default", { month: "short" }),
          amount: monthlyAmount,
        };
      });

      const revenueData = await Promise.all(revenuePromises);
      setRevenueData(revenueData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error fetching revenue data",
      );
      console.error("Error fetching revenue data:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchRevenueData()]);
      setLoading(false);
    };

    fetchData();

    // Optional: Set up real-time subscription for updates
    const subscription = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    metrics,
    revenueData,
    loading,
    error,
    refetch: async () => {
      await Promise.all([fetchMetrics(), fetchRevenueData()]);
    },
  };
}
