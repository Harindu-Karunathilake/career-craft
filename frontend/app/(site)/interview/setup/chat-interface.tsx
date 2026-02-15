'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Play } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ChatInterface() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true); 
  }, []);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChat({
    api: '/api/chat',
    maxSteps: 5,
    onError: (error: any) => {
        console.error('Chat error:', error);
        alert('Failed to send message: ' + error.message);
    },
  } as any) as any;

  // Derive interview config from messages
  const interviewConfig = useMemo(() => {
    if (!messages.length) return null;
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.toolInvocations) {
        const toolInvocation = lastMessage.toolInvocations.find(
            (tool: any) => tool.toolName === 'generateInterview' && 'result' in tool
        );
        if (toolInvocation && 'result' in toolInvocation) {
            
            const result = toolInvocation.result as any;
            return result.config as { role: string; experience: string; topic: string } | null;
        }
    }
    return null;
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleStartInterview = () => {
    if (!interviewConfig) return;
    const params = new URLSearchParams();
    params.set('role', interviewConfig.role);
    router.push(`/interview/active?${params.toString()}`);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!localInput.trim() || isLoading) return;

      const content = localInput;
      setLocalInput(''); // Clear immediately for better UX
      
      await sendMessage({
          role: 'user',
          content,
      });
  };

  if (!mounted) return <div className="w-full max-w-3xl h-[600px] bg-white/5 border-white/10 backdrop-blur-md rounded-xl animate-pulse" />;

  return (
    <Card className="w-full max-w-3xl h-[600px] flex flex-col bg-white/5 border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center ring-1 ring-white/20">
                    <Bot className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Interview Assistant</h3>
                    <p className="text-xs text-muted-foreground">Setup your session</p>
                </div>
            </div>
            {interviewConfig && (
                <Button 
                    onClick={handleStartInterview}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white animate-in zoom-in duration-300"
                >
                    <Play className="mr-2 h-4 w-4" /> Start Interview
                </Button>
            )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
             {messages.length === 0 && (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4">
                     <Bot className="h-12 w-12 opacity-50" />
                     <p>Say &quot;Hi&quot; to get started!</p>
                </div>
            )}
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                  m.role === 'user'
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-zinc-100"
                )}
              >
                 {m.content && <p>{m.content}</p>}
              </div>
            </div>
          ))}
          {isLoading && (
              <div className="flex justify-start w-full">
                  <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                       <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  </div>
              </div>
          )}
          {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                  Error: {error.message}
              </div>
          )}
        </div>
      </ScrollArea>
      
       {/* Input */}
       {!interviewConfig && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
                <div className="relative flex items-center">
                    <input
                        value={localInput}
                        onChange={(e) => setLocalInput(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground transition-all"
                    />
                    <Button 
                        type="submit" 
                        size="icon"
                        disabled={isLoading || !localInput.trim()}
                        title={isLoading ? "Sending..." : !localInput.trim() ? "Type a message" : "Send message"}
                        className="absolute right-1 top-1 h-8 w-8 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors z-10"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </form>
       )}
        {interviewConfig && (
            <div className="p-4 border-t border-white/10 bg-emerald-500/10 text-emerald-200 text-center text-sm">
                Interview configured! Click &quot;Start Interview&quot; to begin.
            </div>
        )}
    </Card>
  );
}
