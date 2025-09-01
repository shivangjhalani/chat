import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { ConvexError } from "convex/values";

export function SignInWithPassword({
  provider,
  handleSent,
  handlePasswordReset,
  customSignUp: customSignUp,
  passwordRequirements,
}: {
  provider?: string;
  handleSent?: (email: string) => void;
  handlePasswordReset?: () => void;
  customSignUp?: React.ReactNode;
  passwordRequirements?: string;
}) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        const formData = new FormData(event.currentTarget);
        signIn(provider ?? "password", formData)
          .then(() => {
            handleSent?.(formData.get("email") as string);
          })
          .catch((error) => {
            console.error(error);
            let toastTitle: string;
            if (
              error instanceof ConvexError &&
              error.data === "INVALID_PASSWORD"
            ) {
              toastTitle =
                "Invalid password - check the requirements and try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast({ title: toastTitle, variant: "destructive" });
            setSubmitting(false);
          });
      }}
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input name="email" id="email" autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        {handlePasswordReset && flow === "signIn" ? (
          <Button
            className="p-0 h-auto"
            type="button"
            variant="link"
            onClick={handlePasswordReset}
          >
            Forgot your password?
          </Button>
        ) : null}
      </div>
      <Input
        type="password"
        name="password"
        id="password"
        autoComplete={flow === "signIn" ? "current-password" : "new-password"}
        placeholder={flow === "signIn" ? "Your password" : "Create a strong password"}
      />
      {flow === "signUp" && passwordRequirements !== null && (
        <span className="text-gray-500 font-thin text-sm">
          {passwordRequirements}
        </span>
      )}
      {flow === "signUp" && customSignUp}
      <input name="flow" value={flow} type="hidden" />
      <Button type="submit" disabled={submitting} className="mt-2">
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </Button>
      <Button
        variant="link"
        type="button"
        onClick={() => {
          setFlow(flow === "signIn" ? "signUp" : "signIn");
        }}
      >
        {flow === "signIn"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </Button>
    </form>
  );
}
