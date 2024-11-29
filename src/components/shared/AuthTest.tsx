// src/components/shared/AuthTest.tsx
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function AuthTest() {
  const testToast = () => {
    console.log("Testing toast");
    toast.success("Test Toast");
  };

  return <Button onClick={testToast}>Test Toast</Button>;
}
