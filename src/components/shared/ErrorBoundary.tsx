// src/components/shared/ErrorBoundary.tsx
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hier könnten Sie den Fehler an einen Error-Tracking-Service senden
    console.error("Error caught by error boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong!</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="text-sm">
                  {this.state.error?.message || "An unexpected error occurred"}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                    className="flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
