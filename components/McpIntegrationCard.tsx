"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Check, Key, RefreshCw, Trash2, Loader2, Terminal, FileJson } from "lucide-react";

const MCP_URL = "https://wisdm-smart-logger.vercel.app/api/mcp";

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className={className} title="Copy">
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function CliSnippet({ apiKey }: { apiKey: string }) {
  const cmd = `claude mcp add --transport http smart-logger ${MCP_URL} --header "Authorization: Bearer ${apiKey}"`;
  return (
    <div className="relative">
      <pre className="rounded-md bg-muted p-3 pr-8 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
        {cmd}
      </pre>
      <CopyButton
        text={cmd}
        className="absolute top-2 right-2 p-1.5 rounded hover:bg-accent"
      />
    </div>
  );
}

function ConfigSnippet({ apiKey }: { apiKey: string }) {
  const config = JSON.stringify(
    {
      mcpServers: {
        "smart-logger": {
          url: MCP_URL,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="relative">
      <pre className="rounded-md bg-muted p-3 pr-8 text-xs overflow-x-auto font-mono leading-relaxed">
        {config}
      </pre>
      <CopyButton
        text={config}
        className="absolute top-2 right-2 p-1.5 rounded hover:bg-accent"
      />
    </div>
  );
}

type Status = "loading" | "none" | "exists" | "revealed";

export function McpIntegrationCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [hint, setHint] = useState<string | null>(null);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    fetch("/api/profile/mcp-key")
      .then((r) => r.json())
      .then((data) => {
        setHint(data.hint ?? null);
        setStatus(data.hasKey ? "exists" : "none");
      })
      .catch(() => setStatus("none"));
  }, []);

  const generateKey = useCallback(async () => {
    setWorking(true);
    const res = await fetch("/api/profile/mcp-key", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setFullKey(data.key);
      setHint(data.hint);
      setStatus("revealed");
    }
    setWorking(false);
  }, []);

  const revokeKey = useCallback(async () => {
    setWorking(true);
    await fetch("/api/profile/mcp-key", { method: "DELETE" });
    setFullKey(null);
    setHint(null);
    setStatus("none");
    setWorking(false);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Key className="h-3.5 w-3.5" />
              Claude MCP Integration
            </CardTitle>
            <CardDescription className="mt-1">
              Connect Claude to Smart Logger — log time, query projects, and pull
              reports via AI.
            </CardDescription>
          </div>
          {(status === "exists" || status === "revealed") && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {status === "none" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate an API key to connect Claude Desktop or Claude.ai to
              your account. Takes 30 seconds to set up.
            </p>
            <Button onClick={generateKey} disabled={working} size="sm">
              {working && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate API Key
            </Button>
          </div>
        )}

        {status === "exists" && hint && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active key:</span>
              <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                {hint}
              </code>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                Claude Desktop —{" "}
                <code className="bg-muted px-1 rounded font-mono">claude_desktop_config.json</code>
              </p>
              <ConfigSnippet apiKey="YOUR_API_KEY" />
              <p className="text-xs text-muted-foreground">
                Replace <code className="bg-muted px-1 rounded">YOUR_API_KEY</code> with your saved key.
                macOS: <code className="bg-muted px-1 rounded">~/Library/Application Support/Claude/</code>
                &nbsp;· Windows: <code className="bg-muted px-1 rounded">%APPDATA%\Claude\</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                Or add via Claude Code CLI:
              </p>
              <CliSnippet apiKey="YOUR_API_KEY" />
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400">
              Don&apos;t have your key? Click Regenerate — you&apos;ll get a
              fresh key with all snippets pre-filled.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={generateKey}
                disabled={working}
                size="sm"
                variant="outline"
              >
                {working ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Regenerate
              </Button>
              <Button
                onClick={revokeKey}
                disabled={working}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Revoke
              </Button>
            </div>
          </div>
        )}

        {status === "revealed" && fullKey && (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Save this key now — it will not be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white dark:bg-black/30 border rounded px-2 py-1 flex-1 overflow-x-auto break-all">
                  {fullKey}
                </code>
                <CopyButton
                  text={fullKey}
                  className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900 flex-shrink-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                Claude Desktop —{" "}
                <code className="bg-muted px-1 rounded font-mono">claude_desktop_config.json</code>
              </p>
              <ConfigSnippet apiKey={fullKey} />
              <p className="text-xs text-muted-foreground">
                On macOS: <code className="bg-muted px-1 rounded">~/Library/Application Support/Claude/</code>
                &nbsp;· Windows: <code className="bg-muted px-1 rounded">%APPDATA%\Claude\</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                Or add via Claude Code CLI:
              </p>
              <CliSnippet apiKey={fullKey} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={generateKey}
                disabled={working}
                size="sm"
                variant="outline"
              >
                {working ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Regenerate
              </Button>
              <Button
                onClick={revokeKey}
                disabled={working}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Revoke
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
