"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, CheckCircle, AlertTriangle, X } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"

interface BugReportFormProps {
  onClose: () => void
  onSubmit: () => void
}

export function BugReportForm({ onClose, onSubmit }: BugReportFormProps) {
  const { publicKey } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${screen.width}x${screen.height}`,
      }

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userWallet: publicKey,
          title: formData.title,
          description: formData.description,
          pageUrl: window.location.href,
          browserInfo: JSON.stringify(browserInfo),
          severity: formData.severity,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setTimeout(() => {
          onSubmit()
          onClose()
        }, 2000)
      } else {
        throw new Error("Failed to submit bug report")
      }
    } catch (error) {
      console.error("Error submitting bug report:", error)
      alert("Failed to submit bug report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Bug Report Submitted!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Thank you for helping us improve HOLLOWVOX. We'll review your report and get back to you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-500" />
          <CardTitle className="text-lg">Report a Bug</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Bug Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe what happened, what you expected, and steps to reproduce..."
              required
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <label htmlFor="severity" className="text-sm font-medium">
              Severity
            </label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Low
                    </Badge>
                    <span className="text-sm">Minor issue</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Medium
                    </Badge>
                    <span className="text-sm">Affects functionality</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      High
                    </Badge>
                    <span className="text-sm">Blocks important features</span>
                  </div>
                </SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Critical</Badge>
                    <span className="text-sm">Site unusable</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Automatically included:</p>
                <ul className="space-y-0.5">
                  <li>• Current page URL</li>
                  <li>• Browser information</li>
                  <li>• Your wallet address (if connected)</li>
                  <li>• Timestamp</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
