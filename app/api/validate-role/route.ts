import { z } from 'zod';
import { generateObjectWithFallback } from '@/lib/ai-helper';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error' }), { status: 500 });
        }

        const { role } = await req.json();

        if (!role) {
            return new Response(JSON.stringify({ error: 'Role is required' }), { status: 400 });
        }

        const schema = z.object({
            isValid: z.boolean(),
            message: z.string().describe("A helpful message explaining why the role is invalid or a confirmation if it is valid. If invalid, suggest 2-3 suitable IT roles."),
        });

        const result = await generateObjectWithFallback<z.infer<typeof schema>>({
            schema,
            prompt: `
            Analyze the job role: "${role}".
            Determine if this job role is a valid and recognized role within the Information Technology (IT), Software Engineering, Data Science, or tech industry.
            
            Strictly reject roles that are clearly non-technical or unrelated to the tech industry (e.g., "Chef", "Driver", "Doctor", "Gardener", "Teacher" unless it's "CS Teacher", etc.).
            Accept broad but tech-related roles (e.g., "Project Manager", "Product Owner", "Designer").
            Reject gibberish or nonsense strings.
            
            Return a boolean 'isValid' and a 'message'.
          `,
        });

        return new Response(JSON.stringify(result.object), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Validation Error:', error);
        return new Response(JSON.stringify({
            isValid: true, // Fail open if API fails to avoid blocking users unnecessarily
            message: "Validation service unavailable, proceeding with caution."
        }), { status: 200 });
    }
}
