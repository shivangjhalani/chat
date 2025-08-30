import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Chat } from "@/Chat/Chat";
import { Layout } from "@/Layout";
import { SignInFormPassword } from "@/auth/SignInFormPassword";
import { UserMenu } from "@/components/UserMenu";
import { api } from "../convex/_generated/api";

export default function App() {
  const user = useQuery(api.users.viewer);

  return (
    <Layout
      menu={
        <>
          <Authenticated>
            <UserMenu>{user?.name ?? user?.email ?? "User"}</UserMenu>
          </Authenticated>
        </>
      }
    >
      <>
        <Authenticated>
          <Chat viewer={user?._id} />
        </Authenticated>
        <Unauthenticated>
          <div className="container flex items-center justify-center min-h-[50vh]">
            <SignInFormPassword />
          </div>
        </Unauthenticated>
      </>
    </Layout>
  );
}
