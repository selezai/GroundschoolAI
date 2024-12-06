import pdf from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import axios from 'axios';

export const extractTextFromPDF = async (fileUrl: string): Promise<string> => {
  try {
    // Download PDF file
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    // Extract text from PDF
    const data = await pdf(response.data);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

export const extractTextFromImage = async (fileUrl: string): Promise<string> => {
  try {
    // Download image file
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    // Create Tesseract worker
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Extract text from image
    const { data: { text } } = await worker.recognize(Buffer.from(response.data));
    
    // Terminate worker
    await worker.terminate();

    return text;
  } catch (error: any) {
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};
