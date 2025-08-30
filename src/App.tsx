import { Chat } from "@/Chat/Chat";
import { randomName } from "@/Chat/randomName";
import { Layout } from "@/Layout";
import { UserMenu } from "@/components/UserMenu";
import { useState } from "react";

export default function App() {
  const [viewer] = useState(randomName());
  return (
    <Layout menu={<UserMenu>{viewer}</UserMenu>}>
      <Chat viewer={viewer} />
    </Layout>
  );
}
