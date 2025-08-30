import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function Message({
  author,
  userId,
  viewer,
  time,
  children,
}: {
  author: string;
  userId: Id<"users">;
  viewer: Id<"users"> | undefined;
  time: number;
  children: ReactNode;
}) {
  const isOwnMessage = userId === viewer;
  const formattedTime = new Date(time).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li
      className={cn(
        "flex flex-col text-sm",
        isOwnMessage ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="mb-1 text-sm font-medium flex items-center gap-2">
        <span>{author}</span>
        <time className="text-xs text-muted-foreground">{formattedTime}</time>
      </div>
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
