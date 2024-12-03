import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import * as pdfjs from 'pdfjs-dist';

export const extractTextFromPDF = async (uri: string): Promise<string> => {
  try {
    // Read the PDF file
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: atob(fileContent) });
    const pdf = await loadingTask.promise;

    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
};

export const extractTextFromImage = async (uri: string): Promise<string> => {
  try {
    // Optimize image for OCR
    const optimizedImage = await manipulateAsync(
      uri,
      [
        { resize: { width: 1024 } },
        { normalize: true },
      ],
      { compress: 0.8, format: 'jpeg' }
    );

    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(optimizedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Use Claude's vision capabilities for OCR
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Please extract and return all the text from this image. Format it naturally, preserving paragraphs and important formatting.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
};
