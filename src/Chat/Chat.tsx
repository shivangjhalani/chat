import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { ConversationList } from "@/Chat/ConversationList";
import { ChatWindow } from "@/Chat/ChatWindow";
import { NewConversationModal } from "@/Chat/NewConversationModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Chat({ viewer }: { viewer: Id<"users"> | undefined }) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    Id<"conversations"> | null
  >(null);
  const [openNew, setOpenNew] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Mobile top bar */}
      <div className="flex items-center gap-2 border-b p-3 md:hidden">
        <Button variant="outline" onClick={() => setMobileOpen(true)}>
          Conversations
        </Button>
        <Button size="sm" onClick={() => setOpenNew(true)}>
          New
        </Button>
      </div>

      <div className="flex h-full">
        <div className="hidden md:block w-80 shrink-0 border-r">
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onOpenNewConversation={() => setOpenNew(true)}
        />
        </div>
        <div className="flex-1">
          <ChatWindow conversationId={selectedConversationId} viewer={viewer} />
        </div>
      </div>

      <NewConversationModal
        open={openNew}
        onOpenChange={setOpenNew}
        onCreated={(id) => {
          setSelectedConversationId(id);
          setOpenNew(false);
          setMobileOpen(false);
        }}
      />

      {/* Mobile Conversations Drawer */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="p-0 sm:max-w-lg">
          <DialogHeader className="p-3 pb-0">
            <DialogTitle>Conversations</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <ConversationList
              selectedConversationId={selectedConversationId}
              onSelectConversation={(id) => {
                setSelectedConversationId(id);
                setMobileOpen(false);
              }}
              onOpenNewConversation={() => {
                setMobileOpen(false);
                setOpenNew(true);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
