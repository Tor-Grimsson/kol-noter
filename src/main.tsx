// Polyfill Buffer for gray-matter (used in note serialization)
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

console.log('[main.tsx] Starting app...');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('[main.tsx] All imports successful');
console.log('[main.tsx] Creating React root...');

createRoot(document.getElementById("root")!).render(<App />);
console.log('[main.tsx] App rendered');
