import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        "flex max-w-full text-sm",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("flex items-end gap-2 max-w-full", isOwnMessage ? "flex-row-reverse" : "flex-row")}
      >
        <Avatar className="h-7 w-7">
          <AvatarImage alt={author} src={undefined} />
          <AvatarFallback>{author?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 max-w-[80%] flex-col">
          <div className={cn("mb-1 text-xs font-medium flex items-center gap-2", isOwnMessage ? "justify-end" : "justify-start")}
          >
            <span className="truncate">{author}</span>
            <time className="text-[10px] text-muted-foreground">{formattedTime}</time>
          </div>
          <p
            className={cn(
              "rounded-xl px-3 py-2 shadow break-words",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-muted rounded-tl-none",
            )}
          >
            {children}
          </p>
        </div>
      </div>
    </li>
  );
}
