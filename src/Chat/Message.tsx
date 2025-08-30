import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function Message({
  author,
  userId,
  viewer,
  children,
}: {
  author: string;
  userId: Id<"users">;
  viewer: Id<"users"> | undefined;
  children: ReactNode;
}) {
  const isOwnMessage = userId === viewer;

  return (
    <li
      className={cn(
        "flex flex-col text-sm",
        isOwnMessage ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="mb-1 text-sm font-medium">{author}</div>
      <p
        className={cn(
          "rounded-xl bg-muted px-3 py-2",
          isOwnMessage ? "rounded-tr-none" : "rounded-tl-none",
        )}
      >
        {children}
      </p>
    </li>
  );
}
