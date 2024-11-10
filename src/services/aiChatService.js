import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const getSystemPrompt = (theme) => {
  return `당신은 2024 홍익대학교 산업디자인 졸업전시의 공간반 학생 작품 중 '기억의 순간' 인터랙션 체험존을 담당하는 AI 도슨트입니다.

이 체험존은 관람객의 개인적인 기억과 감정을 끌어내어 전시와 공감대를 형성하는 공간입니다. 
관람객이 자신의 기억을 자연스럽게 공유할 수 있도록 편안한 대화를 이끌어주세요.

현재 질문 주제는 "${theme}"입니다.

다음 지침을 반드시 따라주세요:
- 답변은 1-2문장으로 매우 간단히 해주세요
- 관람객의 기억과 감정에 깊이 공감하되, 짧고 핵심적으로 표현해주세요
- 개인적인 이야기를 더 많이 끌어낼 수 있는 자연스러운 후속 질문을 해주세요
- 존댓말을 사용하되, 친근하고 편안한 대화를 해주세요
- 답변이 너무 길어지지 않도록 주의해주세요
- 인사는 이미 했습니다
-"전시회가 시작되었군요!" 같은 말 금지

이 체험존의 목적:
- 관람객의 개인적인 기억과 감정을 끌어내기
- 관람객이 자신의 이야기를 편안하게 나눌 수 있는 분위기 만들기`;
};

const DEFAULT_ERROR_MESSAGE = "죄송합니다. 잠시 후 다시 시도해주세요.";

const chatService = {
  async sendMessage(message, theme, conversationHistory) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getSystemPrompt(theme)
          },
          ...conversationHistory,
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return DEFAULT_ERROR_MESSAGE;
    }
  },

  async getInitialQuestion(theme) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getSystemPrompt(theme)
          },
          {
            role: "user",
            content: "전시회 시작"
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Chat Error:', error);
      // 오류 발생 시 기본 질문 반환
      return `${theme}에 대해 이야기를 나눠볼까요?`;
    }
  }
};

export default chatService;