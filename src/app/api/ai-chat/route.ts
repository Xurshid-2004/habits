import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = (data as any)?.choices?.[0]?.message?.content ?? "Javob kelmadi.";
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
  }
}