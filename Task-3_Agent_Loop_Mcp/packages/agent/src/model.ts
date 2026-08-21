export interface ToolCall {
    tool: "read_file" | "list_dir" | "grep" | "propose_edit" | "run_test";
    arguments: Record<string, any>;
}

export interface ModelCallResult {
    ok: boolean;
    toolCall?: ToolCall;
    error?: string;
    rawResponse?: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

export async function queryModel(
    systemPrompt: string,
    messages: { role: string; content: string }[]
): Promise<ModelCallResult> {
    const payload = {
        model: OLLAMA_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages
        ],
        stream: false,
        format: "json"
    };

    let res: Response;
    try {
        res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err: any) {
        throw new Error(
            `Ollama connection failed (${OLLAMA_URL}). Ensure Ollama is running with '${OLLAMA_MODEL}'. Error: ${err.message}`
        );
    }

    if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}: ${await res.text()}`);
    }

    const data: any = await res.json();
    const content = data.message?.content?.trim() || "";

    try {
        const parsed = JSON.parse(content);

        if (parsed && typeof parsed === "object" && typeof parsed.tool === "string") {
            const tool = parsed.tool;
            const validTools = ["read_file", "list_dir", "grep", "propose_edit", "run_test"];

            if (!validTools.includes(tool)) {
                return {
                    ok: false,
                    error: `Unknown tool requested: ${tool}`,
                    rawResponse: content
                };
            }

            return {
                ok: true,
                toolCall: {
                    tool: tool as ToolCall["tool"],
                    arguments: parsed.arguments || {}
                },
                rawResponse: content
            };
        }

        if (Array.isArray(parsed)) {
            return {
                ok: false,
                error: "Malformed tool call: model returned array of tools instead of single tool call",
                rawResponse: content
            };
        }

        return {
            ok: false,
            error: "Malformed tool call: response missing 'tool' string property",
            rawResponse: content
        };
    } catch (err) {
        return {
            ok: false,
            error: "Malformed tool call: JSON parse failed",
            rawResponse: content
        };
    }
}
