import { useState, useRef, useEffect } from "react";
import { Loader2, Send, Sparkles, X, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/use-ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  entities?: Array<{
    type: string;
    id: string;
    deepLink?: string;
  }>;
}

const suggestedQueries = [
  "What decisions need my attention today?",
  "Who is overloaded on my team?",
  "Summarize the latest conflicts",
  "What's the status of the Q1 launch?",
  "Who owns the pricing decision?",
];

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { askChiefOfStaff, isLoading } = useAI();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Add loading placeholder
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await askChiefOfStaff(query);

      // Replace loading with actual response
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                ...m,
                content: response?.answer || "I couldn't process that request. Please try again.",
                entities: response?.created_entities?.map(e => ({
                  type: e.type,
                  id: e.decision_id || e.update_id || e.conflict_id || "",
                  deepLink: e.deepLink,
                })),
              }
            : m
        )
      );
    } catch (error) {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                ...m,
                content: "Sorry, there was an error processing your request. Please try again.",
              }
            : m
        )
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(input);
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group">
          <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              Mnemosyne AI
            </SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearConversation}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your AI Chief of Staff - Ask anything about your organization
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    I can search your organization's knowledge, track decisions, identify conflicts, and route information.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                    Suggested questions
                  </p>
                  <div className="space-y-2">
                    {suggestedQueries.map((query, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(query)}
                        disabled={isLoading}
                        className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors disabled:opacity-50"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      {message.content ? (
                        <>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          {message.entities && message.entities.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                              <p className="text-xs text-muted-foreground mb-2">
                                Related entities:
                              </p>
                              {message.entities.map((entity, i) => (
                                <a
                                  key={i}
                                  href={entity.deepLink}
                                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {entity.type}: {entity.id}
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-foreground">
                          NV
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border shrink-0">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask Mnemosyne..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Mnemosyne AI can search decisions, track conflicts, and route information.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
