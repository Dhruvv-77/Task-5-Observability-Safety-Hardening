import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { readFileTool } from "../tools/readFile.js";
import { listDirTool } from "../tools/listDir.js";
import { grepTool } from "../tools/grep.js";
import { proposeEditTool } from "../tools/proposeEdit.js";
import { runTest } from "../tools/runTest.js";

const server = new Server(
    { name: "intern-agent", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "read_file",
            description: "Read a file from the repository corpus",
            inputSchema: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
            },
        },
        {
            name: "list_dir",
            description: "List directory contents in the repository corpus",
            inputSchema: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
            },
        },
        {
            name: "grep",
            description: "Search for text inside repository files",
            inputSchema: {
                type: "object",
                properties: { pattern: { type: "string" } },
                required: ["pattern"],
            },
        },
        {
            name: "propose_edit",
            description: "Propose an edit snippet for review and safety check (does NOT write to file directly)",
            inputSchema: {
                type: "object",
                properties: {
                    file: { type: "string" },
                    before: { type: "string" },
                    after: { type: "string" },
                    reason: { type: "string" }
                },
                required: ["file", "before", "after", "reason"],
            },
        },
        {
            name: "run_test",
            description: "Run a single vitest suite in the corpus",
            inputSchema: {
                type: "object",
                properties: { testFile: { type: "string" } },
                required: ["testFile"],
            },
        },
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "read_file": {
            const filePath = String(args?.path ?? "");
            const output = await readFileTool(filePath);
            return { content: [{ type: "text", text: output }] };
        }
        case "list_dir": {
            const dirPath = String(args?.path ?? "");
            const output = await listDirTool(dirPath);
            return { content: [{ type: "text", text: output }] };
        }
        case "grep": {
            const pattern = String(args?.pattern ?? "");
            const output = await grepTool(pattern);
            return { content: [{ type: "text", text: output }] };
        }
        case "propose_edit": {
            const file = String(args?.file ?? "");
            const before = String(args?.before ?? "");
            const after = String(args?.after ?? "");
            const reason = String(args?.reason ?? "");
            const res = await proposeEditTool({ file, before, after, reason });
            return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
        }
        case "run_test": {
            const testFile = String(args?.testFile ?? "");
            const result = runTest(testFile);
            return { content: [{ type: "text", text: result.output }] };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
