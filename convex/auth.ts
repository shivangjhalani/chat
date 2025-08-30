import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

const CustomPassword = Password({
  profile(params) {
    if (typeof params.email !== "string") {
      throw new Error("Email must be a string for profile creation.");
    }
    return {
      name: params.email.split("@")[0],
      email: params.email,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});
