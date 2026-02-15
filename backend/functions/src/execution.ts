
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    isError: boolean;
}

export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
    // TODO: Integrate with Judge0 or similar for real execution.
    // For now, we mock the execution based on simple heuristics or just return a placeholder.

    console.log(`Executing ${language} code:`, code);

    // Mock responses for demo purposes
    if (code.includes("console.log")) {
        // Extract what's inside console.log roughly
        const match = code.match(/console\.log\((.*)\)/);
        const output = match ? match[1].replace(/["']/g, "") : "Hello World";
        return {
            stdout: output + "\n",
            stderr: "",
            isError: false
        }
    }

    if (code.includes("error") || code.includes("throw")) {
        return {
            stdout: "",
            stderr: "ReferenceError: variable is not defined\n    at Object.<anonymous> (/script.js:1:1)",
            isError: true
        }
    }

    return {
        stdout: "Code executed successfully (Mock Mode). \n\nNOTE: Real execution requires an external API (like Judge0) which is not currently configured.\n\nYour code:\n" + code,
        stderr: "",
        isError: false
    };
}
