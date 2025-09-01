import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Id } from "../../convex/_generated/dataModel";
import { Spinner } from "@/components/Spinner";

type SearchResult = {
  messageId: Id<"messages">;
  message: string;
  senderId: Id<"users">;
  senderName: string;
  timestamp: number;
  score: number;
};

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const search = useAction(api.messages.semanticSearch);

  const nameOrFallback = (senderId: Id<"users">, name: string) => name || `User ${senderId.slice(-4)}`;

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await search({ q: query, limit: 10 });
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          size="sm"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
        </Button>
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
          {results.map((result) => (
            <Card key={result.messageId} className="p-3 text-sm">
              <div className="font-medium text-xs text-muted-foreground mb-1">
                {nameOrFallback(result.senderId, result.senderName)} • Score: {result.score.toFixed(3)} • {formatTimestamp(result.timestamp)}
              </div>
              <div className="text-sm">{result.message}</div>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && results.length === 0 && query && (
        <div className="text-sm text-muted-foreground">No results found.</div>
      )}
    </div>
  );
}
