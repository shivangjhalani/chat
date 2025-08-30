// import { SignInFormAnonymous } from "@/auth/SignInFormAnonymous";
import { SignInFormPassword } from "@/auth/SignInFormPassword";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// This component is here to showcase different combinations of sign-in methods.
// 1. Choose one of the forms and use it directly instead of this component.
// 2. Delete or add OAuth providers as needed.
// 3. Delete the unused forms.
export function SignInForm() {
  return (
    <Tabs defaultValue="otp" className="container flex flex-col mt-10">
      <TabsList className="ml-auto mr-10 mb-1 opacity-60 overflow-x-scroll max-w-full justify-start">
        <TabsTrigger value="password">Password</TabsTrigger>
        {/* <TabsTrigger value="anonymous">Anonymous</TabsTrigger> */}
      </TabsList>
      <TabsContent value="password">
        <Tabs defaultValue="basic" className="flex flex-col">
          {/* <TabsList className="ml-auto mr-10 mb-7 opacity-60 overflow-x-scroll max-w-full justify-start">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="custom">Custom Sign Up</TabsTrigger>
            <TabsTrigger value="password reset">Password Reset</TabsTrigger>
            <TabsTrigger value="email verification">
              OAuth + Email Verification
            </TabsTrigger>
          </TabsList> */}
          <TabsContent value="basic">
            {/* Simplest email + password, no recovery */}
            <SignInFormPassword />
          </TabsContent>
        </Tabs>
      </TabsContent>
      {/* Sign in anonymously */}
      {/* <TabsContent className="mt-20" value="anonymous">
        <SignInFormAnonymous />
      </TabsContent> */}
    </Tabs>
  );
}
