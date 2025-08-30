import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { SemanticSearch } from "./SemanticSearch";

type ConversationListProps = {
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onOpenNewConversation: () => void;
};

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
  onOpenNewConversation,
}: ConversationListProps) {
  const conversations = useQuery(api.conversations.listUserConversations);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const term = search.trim().toLowerCase();
    if (term === "") return conversations;
    return conversations.filter((c) =>
      c.participantDetails.some(
        (p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
      )
    );
  }, [conversations, search]);

  return (
    <div className="flex h-full flex-col border-r">
      <Tabs defaultValue="conversations" className="h-full flex flex-col">
        <div className="p-3 flex gap-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations">Chats</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          <Button onClick={onOpenNewConversation} size="sm">New</Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="conversations" className="h-full m-0">
            <div className="py-3 px-3 pb-3">
              <Input
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y">
                {filtered?.map((c) => {
                  const title = c.participantDetails.map((p) => p.name || p.email).join(", ");
                  const isSelected = selectedConversationId === c._id;
                  return (
                    <li key={c._id}>
                      <button
                        className={`w-full text-left px-4 py-3 hover:bg-muted ${
                          isSelected ? "bg-muted" : ""
                        }`}
                        onClick={() => onSelectConversation(c._id)}
                      >
                        <div className="font-medium">{title}</div>
                      </button>
                    </li>
                  );
                })}
                {filtered?.length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">No conversations</li>
                )}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="search" className="h-full m-0 p-3">
            <SemanticSearch />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
