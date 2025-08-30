import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { ConversationList } from "@/Chat/ConversationList";
import { ChatWindow } from "@/Chat/ChatWindow";
import { NewConversationModal } from "@/Chat/NewConversationModal";

export function Chat({ viewer }: { viewer: Id<"users"> | undefined }) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    Id<"conversations"> | null
  >(null);
  const [openNew, setOpenNew] = useState(false);

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0">
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onOpenNewConversation={() => setOpenNew(true)}
        />
      </div>
      <div className="flex-1">
        <ChatWindow conversationId={selectedConversationId} viewer={viewer} />
      </div>

      <NewConversationModal
        open={openNew}
        onOpenChange={setOpenNew}
        onCreated={(id) => {
          setSelectedConversationId(id);
          setOpenNew(false);
        }}
      />
    </div>
  );
}
