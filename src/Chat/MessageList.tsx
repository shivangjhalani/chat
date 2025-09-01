import { ReactNode } from "react";

export function MessageList({ children }: { children: ReactNode }) {
  return (
    <ol className="container flex grow flex-col gap-4 px-4 sm:px-8 py-4 max-w-3xl mx-auto w-full">
      {children}
    </ol>
  );
}
