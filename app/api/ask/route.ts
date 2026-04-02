import { NextResponse, NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const SYSTEM_PROMPT = `You are StudyAI, an advanced AI academic tutor. 
Use a professional, expert persona.

Format your responses using standard Markdown:
1. Wrap your internal reasoning inside <think>...</think> tags at the very beginning of your response.
2. Use standard triple-backtick markdown blocks for all code (e.g. \`\`\`java).
3. Provide deep technical explanations and step-by-step logic.
4. Be accurate, encouraging, and thorough.`;

// Simple in-memory rate limiter (10 requests per minute per user)
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  try {
    // 1. Secure Route API Protection
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in to request AI analysis." }, { status: 401 });
    }

    // 2. Rate Limit Enforcement
    const userId = session.user.email;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    const userRateData = rateLimitCache.get(userId) || { count: 0, timestamp: now };
    if (now - userRateData.timestamp > windowMs) {
      userRateData.count = 1;
      userRateData.timestamp = now;
    } else {
      userRateData.count += 1;
      if (userRateData.count > maxRequests) {
        return NextResponse.json({ error: "Rate limit exceeded. Please slow down your requests." }, { status: 429 });
      }
    }
    rateLimitCache.set(userId, userRateData);

    // 3. Dynamic Environment Parsing (Bypass Caching)
    const envPath = path.join(process.cwd(), ".env.local");
    let apiKey = process.env.GROQ_API_KEY;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/^GROQ_API_KEY=(.*)$/m);
      if (match && match[1]) apiKey = match[1].trim().replace(/["']/g, ''); // Fix Windows \r
    }

    if (!apiKey) {
      return NextResponse.json({ error: "GROQ API Key is missing. Please add it to your .env.local file." }, { status: 500 });
    }

    const body = await req.json();
    const { question, history = [] } = body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return NextResponse.json({ error: "Question is physically required." }, { status: 400 });
    }

    // Convert standard chat history for Groq
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question.trim() },
    ];

    // Call Groq directly via REST API with STREAMING enabled
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true // Enable Server-Sent Events
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error details:", errorData);
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    // Pass the raw SSE stream directly to the client!
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("[/api/ask] Streaming Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
