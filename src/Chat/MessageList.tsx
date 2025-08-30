import { ReactNode } from "react";

export function MessageList({ children }: { children: ReactNode }) {
  return (
    <ol className="container flex grow flex-col gap-4 px-8 py-4">
      {children}
    </ol>
  );
}
