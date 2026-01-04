export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({ jobTitle, jobDescription }: { jobTitle: string; jobDescription: string; }) =>
    `You are a purely technical Applicant Tracking System (ATS) data processor.
      Your task is to extract structured data and feedback from the provided resume text in the context of the job description.
      Output ONLY valid JSON. Do not generate any conversational text, apologies, or markdown formatting.
      
      Analyze the resume against the following job detail:
      Job Title: ${jobTitle}
      Job Description: ${jobDescription}

      Evaluate the match and provide structured feedback data using exactly this schema:
      ${AIResponseFormat}

      IMPORTANT:
      - Return ONLY the raw JSON object. match the schema exactly.
      - Do not include markdown code blocks (\`\`\`json).
- Do not include any introductory or concluding text.
      - If the resume is poor, accurately reflect this in the scores(0 - 100).
      - This is a system - to - system data exchange.`;
