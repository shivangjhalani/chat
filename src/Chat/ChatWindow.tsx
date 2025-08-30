import { useMemo, useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MessageList } from "@/Chat/MessageList";
import { Message } from "@/Chat/Message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChatWindowProps = {
  conversationId: Id<"conversations"> | null;
  viewer: Id<"users"> | undefined;
};

export function ChatWindow({ conversationId, viewer }: ChatWindowProps) {
  const [text, setText] = useState("");
  const send = useMutation(api.messages.sendMessage);
  const messages = useQuery(
    api.messages.listMessages,
    conversationId ? { conversationId, limit: 200 } : "skip"
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const canSend = useMemo(() => text.trim().length > 0 && !!conversationId, [text, conversationId]);

  const onSend = async () => {
    if (!canSend || !conversationId) return;
    const body = text.trim();
    setText("");
    try {
      await send({ conversationId, body });
    } catch (e) {
      console.error(e);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation to begin
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <MessageList>
          {messages?.slice().reverse().map((m) => (
            <Message key={m._id} author={m.senderName} userId={m.senderId} viewer={viewer} time={m._creationTime}>
              {m.body}
            </Message>
          ))}
        </MessageList>
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button onClick={onSend} disabled={!canSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
