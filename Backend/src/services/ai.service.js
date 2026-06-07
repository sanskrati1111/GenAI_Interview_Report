const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const maxRetries = 3
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const prompt = `You are an expert interview coach. Generate a comprehensive interview report in JSON format for a candidate.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY a valid JSON object with this exact structure:
{
  "matchScore": <number 0-100>,
  "title": "<job title from job description>",
  "technicalQuestions": [
    {
      "question": "<specific technical question>",
      "intention": "<why interviewer asks this>",
      "answer": "<how to answer with specific points>"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "<specific behavioral question>",
      "intention": "<why interviewer asks this>",
      "answer": "<how to answer with STAR method>"
    }
  ],
  "skillGaps": [
    {
      "skill": "<specific skill name>",
      "severity": "low" or "medium" or "high"
    }
  ],
  "preparationPlan": [
    {
      "day": <number>,
      "focus": "<main topic for this day>",
      "tasks": ["<specific task>", "<specific task>"]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. technicalQuestions MUST be array of objects, EACH with: question (string), intention (string), answer (string)
2. behavioralQuestions MUST be array of objects, EACH with: question (string), intention (string), answer (string)
3. skillGaps MUST be array of objects, EACH with: skill (string name), severity (string: "low", "medium", or "high")
4. preparationPlan MUST be array of objects, EACH with: day (number 1-7), focus (string), tasks (array of strings)
5. Return ONLY the JSON object, no markdown, no extra text`

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            })

            // console.log("Raw API Response:", response.text)
            const parsedResponse = JSON.parse(response.text)
            // console.log("Parsed Response:", JSON.stringify(parsedResponse, null, 2))
            
            // Transform and validate the response
            const transformedResponse = transformApiResponse(parsedResponse)
            // console.log("Transformed Response:", JSON.stringify(transformedResponse, null, 2))
            
            return transformedResponse
        } catch (error) {
            lastError = error
            console.error(`Attempt ${attempt} failed:`, error.message)
            
            // Check if it's a 503 error (service unavailable)
            if (error.message && error.message.includes("503")) {
                if (attempt < maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s
                    const delayMs = Math.pow(2, attempt) * 1000
                    console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms due to service unavailability`)
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                    continue
                }
            }
            
            // For other errors or final attempt, throw immediately
            throw error
        }
    }
    
    throw lastError
}

/**
 * Transform API response to match the database schema
 * Handles cases where API returns strings instead of objects
 */
function transformApiResponse(response) {
    const result = {
        matchScore: response.matchScore || 0,
        title: response.title || "Unknown Position",
        technicalQuestions: [],
        behavioralQuestions: [],
        skillGaps: [],
        preparationPlan: []
    }

    // Transform technical questions
    if (Array.isArray(response.technicalQuestions)) {
        result.technicalQuestions = response.technicalQuestions
            .filter(q => typeof q === 'object' && q.question)
            .map(q => ({
                question: q.question || "",
                intention: q.intention || "",
                answer: q.answer || ""
            }))
    }

    // Transform behavioral questions
    if (Array.isArray(response.behavioralQuestions)) {
        result.behavioralQuestions = response.behavioralQuestions
            .filter(q => typeof q === 'object' && q.question)
            .map(q => ({
                question: q.question || "",
                intention: q.intention || "",
                answer: q.answer || ""
            }))
    }

    // Transform skill gaps
    if (Array.isArray(response.skillGaps)) {
        result.skillGaps = response.skillGaps
            .filter(gap => typeof gap === 'object' && gap.skill)
            .map(gap => ({
                skill: gap.skill || "",
                severity: (gap.severity && ['low', 'medium', 'high'].includes(gap.severity)) ? gap.severity : "low"
            }))
    }

    // Transform preparation plan
    if (Array.isArray(response.preparationPlan)) {
        result.preparationPlan = response.preparationPlan
            .filter(day => typeof day === 'object' && day.day)
            .map(day => ({
                day: parseInt(day.day) || 0,
                focus: day.focus || "",
                tasks: Array.isArray(day.tasks) 
                    ? day.tasks.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim())
                    : []
            }))
    }

    return result
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        Return ONLY a JSON object with this structure:
                        {
                          "html": "<complete HTML content of a professional resume>"
                        }

                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        You can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                        
                        Return ONLY the JSON object, no markdown formatting, no extra text.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    })

    const jsonContent = JSON.parse(response.text)

    if (!jsonContent.html) {
        throw new Error("Failed to generate resume HTML from AI")
    }

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }