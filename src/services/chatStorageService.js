// services/chatStorageService.js
export const chatStorageService = {
  async saveConversation(conversationData) {
    try {
      const data = {
        question: conversationData.question,
        messages: conversationData.history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      const response = await fetch('http://localhost:3001/api/save-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
};