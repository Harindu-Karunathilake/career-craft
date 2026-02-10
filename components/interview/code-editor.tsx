"use client";

import { Editor } from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
    initialCode: string;
    sessionId?: string; // Kept as optional if needed by interface, but removed from usage
    onChange: (code: string) => void;
}

export default function CodeEditor({ initialCode, onChange }: CodeEditorProps) {
    const [value, setValue] = useState(initialCode);

    const handleEditorChange = (value: string | undefined) => {
        const newValue = value || "";
        setValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={value}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 }
                }}
            />
        </div>
    );
}
