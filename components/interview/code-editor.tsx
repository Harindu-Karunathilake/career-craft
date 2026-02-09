"use client";

import { Editor } from "@monaco-editor/react";
import { useEffect, useState, useCallback } from "react";
import { debounce } from "lodash"; 
// Note: Lodash might not be installed, I'll check or implement simple debounce.
// I'll implement a simple debounce to avoid dependency issues if not present.

interface CodeEditorProps {
    initialCode: string;
    sessionId: string;
    onChange: (code: string) => void;
}

export default function CodeEditor({ initialCode, sessionId, onChange }: CodeEditorProps) {
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
