import { SignInWithPassword } from "@/auth/SignInWithPassword";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignInFormPassword() {
  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in or create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInWithPassword />
        </CardContent>
      </Card>
    </div>
  );
}
