// Production seam — DOCUMENTED, NOT USED in the prototype.
//
// In production, Compass calls Azure OpenAI over the SSD IQ System of Records
// (grounded generation), replacing the deterministic mocks in ai.js. The shape
// below shows where a real call slots in. Nothing here executes.
//
// Responsible AI: outputs remain advisory, labelled, evidence-linked and
// human-in-the-loop. No automated adverse decision is ever made about a person.
//
// import { AzureOpenAI } from 'openai';
//
// const client = new AzureOpenAI({
//   endpoint: CONFIG.AOAI_ENDPOINT,        // https://<resource>.openai.azure.com
//   apiVersion: '2024-10-21',
//   // Auth via Microsoft Entra ID (managed identity) — never a raw key in the client.
// });
//
// export async function generate(prompt, grounding) {
//   const completion = await client.chat.completions.create({
//     model: CONFIG.AOAI_DEPLOYMENT,
//     temperature: 0.2,
//     messages: [
//       { role: 'system', content:
//         'You are Compass Copilot for SSD. Answer ONLY from the provided SSD IQ records. ' +
//         'Cite the record ids you used. Never make an adverse decision about a person; ' +
//         'performance and sentiment outputs are advisory inputs for a manager.' },
//       { role: 'user', content: `${prompt}\n\nSSD IQ context:\n${JSON.stringify(grounding)}` },
//     ],
//   });
//   return completion.choices[0]?.message?.content ?? '';
// }

export const PRODUCTION_SEAM = 'ai.js is swapped for Azure OpenAI grounded over SSD IQ.';
