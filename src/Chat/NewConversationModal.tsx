import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "../../convex/_generated/dataModel";

type NewConversationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: Id<"conversations">) => void;
};

export function NewConversationModal({ open, onOpenChange, onCreated }: NewConversationModalProps) {
  const [email, setEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const results = useQuery(api.users.searchUsersByEmail, email ? { email } : "skip");
  const create = useMutation(api.conversations.findOrCreateConversation);

  const onCreate = async () => {
    if (!selectedUserId) return;
    const id = await create({ otherUserId: selectedUserId });
    onCreated(id);
    setEmail("");
    setSelectedUserId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <ul className="max-h-48 overflow-y-auto divide-y">
            {results?.map((u) => (
              <li key={u._id}>
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-muted ${selectedUserId === u._id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedUserId(u._id)}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </button>
              </li>
            ))}
            {email && results?.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground">No users found</li>
            )}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onCreate} disabled={!selectedUserId}>Start</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

