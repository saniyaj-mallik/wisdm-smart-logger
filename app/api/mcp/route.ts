import { NextRequest, NextResponse } from "next/server";
import { validateMcpApiKey } from "@/lib/mcp-auth";
import { listTools, callTool } from "@/lib/mcp-tools";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: unknown;
};

type ToolCallParams = {
  name: string;
  arguments?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  const user = await validateMcpApiKey(req);
  if (!user) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: invalid or missing API key" },
      },
      { status: 401 }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }

  const { method, id, params } = body;

  switch (method) {
    case "initialize":
      return rpc(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "smart-logger", version: "1.0.0" },
      });

    case "notifications/initialized":
      return new NextResponse(null, { status: 204 });

    case "ping":
      return rpc(id, {});

    case "tools/list":
      return rpc(id, { tools: listTools() });

    case "tools/call": {
      const { name, arguments: args = {} } = (params ?? {}) as ToolCallParams;
      try {
        const result = await callTool(name, args, user);
        return rpc(id, result);
      } catch (err) {
        return rpc(id, {
          content: [
            {
              type: "text",
              text: err instanceof Error ? err.message : "Tool execution error",
            },
          ],
          isError: true,
        });
      }
    }

    default:
      return NextResponse.json({
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      name: "Smart Logger MCP Server",
      description: "Send JSON-RPC 2.0 requests via POST with Authorization: Bearer <key>",
    },
    { status: 200 }
  );
}

function rpc(id: number | string | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}
