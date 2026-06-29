import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
const API_URL = `https://translation.googleapis.com/language/translate/v2`;

/**
 * Google Cloud Translation API를 사용하여 텍스트를 번역합니다.
 * @param texts 번역할 텍스트의 배열
 * @param targetLanguage 목표 언어 코드 (e.g., 'en', 'ja')
 * @returns 번역된 텍스트의 배열
 */
export const translateTexts = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("Google Translate API 키가 설정되지 않았습니다.");
  }

  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        q: texts,
        target: targetLanguage,
        format: 'text'
      }
    );

    const translations = response.data.data.translations.map((t: any) => t.translatedText);
    return translations;
  } catch (error) {
    console.error("Google Translation API 오류:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("오류 응답 데이터:", error.response.data);
    }
    throw new Error("텍스트를 번역하는 중 오류가 발생했습니다.");
  }
};
