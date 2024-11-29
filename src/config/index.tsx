// src/config/index.ts
interface Config {
  env: "development" | "production";
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
  };
  app: {
    name: string;
    description: string;
  };
  auth: {
    defaultRedirectUrl: string;
    adminEmails: string[];
  };
}

const development: Config = {
  env: "development",
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  api: {
    baseUrl: "http://localhost:5173/api",
  },
  app: {
    name: "Learn Platform (Dev)",
    description: "Your modern learning platform - Development",
  },
  auth: {
    defaultRedirectUrl: "/dashboard",
    adminEmails: ["admin@example.com", "sascha.kohler@emt.at"],
  },
};

const production: Config = {
  env: "production",
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  api: {
    baseUrl: "https://your-production-url.com/api",
  },
  app: {
    name: "Learn Platform",
    description: "Your modern learning platform",
  },
  auth: {
    defaultRedirectUrl: "/dashboard",
    adminEmails: ["admin@yourcompany.com"],
  },
};

const config: Config = import.meta.env.DEV ? development : production;

export function isAdmin(email: string): boolean {
  return config.auth.adminEmails.includes(email);
}

export default config;
