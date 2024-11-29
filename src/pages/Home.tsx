// src/pages/Home.tsx
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/shared/AuthModal";
import { AuthTest } from "@/components/shared/AuthTest";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <h1 className="text-4xl font-bold text-center mb-4">
        Welcome to Learn Platform
      </h1>
      <p className="text-xl text-center text-muted-foreground mb-8">
        Start your learning journey today
      </p>
      <AuthModal />
      <div className="mt-4">
        <AuthTest />
      </div>
    </div>
  );
}
