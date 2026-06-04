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
import { Copy, Check, Key, RefreshCw, Trash2, Loader2 } from "lucide-react";

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
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" />
          Claude MCP Integration
        </CardTitle>
        <CardDescription>
          Connect Claude to Smart Logger — log time, query projects, and pull
          reports via AI.
        </CardDescription>
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
              <p className="text-xs text-muted-foreground font-medium">
                MCP server URL
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">
                  {MCP_URL}
                </code>
                <CopyButton
                  text={MCP_URL}
                  className="p-1.5 rounded hover:bg-accent flex-shrink-0"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              The full key is not shown again. Regenerate to get a fresh key
              with a ready-to-paste config snippet.
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
              <p className="text-xs font-medium text-foreground">
                Paste into your{" "}
                <code className="bg-muted px-1 rounded">
                  claude_desktop_config.json
                </code>
                :
              </p>
              <ConfigSnippet apiKey={fullKey} />
              <p className="text-xs text-muted-foreground">
                On macOS:{" "}
                <code className="bg-muted px-1 rounded">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
                <br />
                On Windows:{" "}
                <code className="bg-muted px-1 rounded">
                  %APPDATA%\Claude\claude_desktop_config.json
                </code>
              </p>
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
