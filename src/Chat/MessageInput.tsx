import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

type MessageInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const canSend = useMemo(() => text.trim().length > 0 && !disabled, [text, disabled]);

  const handleSend = () => {
    if (!canSend) return;
    const body = text.trim();
    setText("");
    onSend(body);
  };

  return (
    <div className="border-t p-3 flex gap-2">
      <Input
        placeholder="Type a message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={disabled}
      />
      <Button onClick={handleSend} disabled={!canSend}>
        Send
      </Button>
    </div>
  );
}

