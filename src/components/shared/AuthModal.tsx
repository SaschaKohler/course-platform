// src/components/shared/AuthModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const authSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  fullName: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signOut, user, error } = useAuth();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "sascha.kohler@sent.at",
      password: "123456",
      fullName: "Sascha Kohler",
    },
  });

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
        toast.success("Erfolgreich angemeldet!");
        console.log("SignIn completed");
      } else {
        if (data.fullName) {
          await signUp(data.email, data.password, data.fullName);
          console.log("SignIn completed");
        }
      }
      // Prüfen Sie, ob die Operation erfolgreich war
      if (!error) {
        setIsOpen(false);
        form.reset();
        console.log("Form reset and modal closed");
      } else {
        console.log("Auth error from context:", error);
      }
    } catch (error) {
      console.error("Auth error in modal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset();
  };

  if (user) {
    return (
      <Button variant="outline" onClick={() => signOut()}>
        Abmelden
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Anmelden
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isLogin ? "Willkommen zurück" : "Konto erstellen"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vollständiger Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@beispiel.de"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-6 space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Anmelden" : "Konto erstellen"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={toggleMode}
                disabled={isLoading}
              >
                {isLogin
                  ? "Noch kein Konto? Jetzt registrieren"
                  : "Bereits registriert? Jetzt anmelden"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
