"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Sparkles, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BugReportForm } from "@/components/bug-report-form"

const SUGGESTED_QUESTIONS = [
  "What is HOLLOWVOX?",
  "How do I check my token balance?",
  "What are the tier requirements?",
  "How does the Action Token commitment work?",
  "What is The Hollow?",
  "How can I participate in the raffle?",
  "What rewards are available?",
  "How does the profit tracker work?",
  "What is the Impact Fund?",
  "How do I connect my wallet?",
]

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hi! I'm your HOLLOWVOX assistant. I can help you with anything about The Hollow, token balances, rewards, the Action Token commitment, and more. What would you like to know?",
      },
    ],
    onFinish: (message) => {
      // Check if the AI response indicates bug reporting
      const content = message.content.toLowerCase()
      if (content.includes("bug report form") || content.includes("show you the bug report")) {
        setShowBugReport(true)
      }
    },
  })

  const handleSuggestedQuestion = (question: string) => {
    handleInputChange({ target: { value: question } } as any)
    handleSubmit({ preventDefault: () => {} } as any)
  }

  const handleBugReportClose = () => {
    setShowBugReport(false)
  }

  const handleBugReportSubmit = () => {
    setShowBugReport(false)
    // Add a confirmation message to the chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "✅ Thank you for submitting the bug report! We'll review it and get back to you. Is there anything else I can help you with?",
      },
    ])
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 group"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={cn(
          "bg-card/95 backdrop-blur-sm border-primary/20 shadow-2xl transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-5 w-5 text-primary" />
              <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <CardTitle className="text-lg font-orbitron">HOLLOWVOX Assistant</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
            {showBugReport ? (
              <div className="flex-1 p-4 flex items-center justify-center">
                <BugReportForm onClose={handleBugReportClose} onSubmit={handleBugReportSubmit} />
              </div>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex gap-3 text-sm", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {message.role === "assistant" && (
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[80%]",
                            message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
                          )}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                        {message.role === "user" && (
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 text-sm">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Suggested Questions */}
                {messages.length <= 1 && (
                  <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground font-medium">Suggested questions:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 text-xs"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border/50">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask me anything about HOLLOWVOX..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
