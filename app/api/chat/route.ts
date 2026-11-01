
import OpenAI from "openai";
import { NextResponse } from "next/server";



export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured on the server." },
        { status: 500 }
      );
    }

    const { message } = await request.json();

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      return NextResponse.json(
        { error: "Please enter a valid message (maximum 4000 characters)." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",

      instructions: `
You are the AI Assistant for My AI Assistant - Manufacturing ERP.

Your administrator is Pranav Gour.

Your responsibilities:

1. Explain how to use every ERP website module.
2. Help with User Management and employee records.
3. Explain Raw Materials and Packing Materials management.
4. Help with Purchase Orders, GRN and Inventory.
5. Support biscuit manufacturing and production operations.
6. Explain production planning, downtime, breakdowns and giveaway.
7. Help with Quality, Maintenance and Attendance.
8. Help with Dispatch, stores and stock reporting.
9. Answer general knowledge and everyday questions.

Rules:
- Give professional, clear and practical answers.
- Use simple English.
- Provide step-by-step instructions when appropriate.
- Use manufacturing and biscuit industry examples.
- Never invent actual ERP stock, production or employee data.
- You do not currently have direct access to the ERP database.
- Never request passwords, API keys or confidential information.
      `,

      input: message.trim(),
    });

    return NextResponse.json({
      reply:
        response.output_text ||
        "I could not generate an answer. Please try again.",
    });
  } catch (error) {
    console.error("AI Assistant API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        error: `AI service error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
