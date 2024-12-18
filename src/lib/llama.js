// src/lib/llama.js
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

const model = 'llama-3.2-90b-vision-instruct-maas';

export async function generateChatResponse(message, file = null) {
  try {
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });

    let contents = [];

    // If there's an image, add it to the message content
    if (file && file.type.startsWith('image/')) {
      // Remove the "data:image/jpeg;base64," prefix
      const base64Data = file.data.split(',')[1];
      
      contents = [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: file.type,
                data: base64Data
              }
            },
            { text: message }  // The user's question about the image
          ]
        }
      ];
    } else {
      // Text-only message
      contents = [
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];
    }

    const result = await generativeModel.generateContent({
      contents,
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.4,
        top_p: 0.8,
        top_k: 40
      },
    });

    const response = result.response;
    return response.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Error calling Vertex AI:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}