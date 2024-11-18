const positiveMemories = [
  {
    question: "지금 이 순간 당신의 마음을 따뜻하게 하는 것은 무엇인가요?",
    color: '#FF6B4A'
  },
  {
    question: "오늘 하루 동안 느낀 작은 기쁨은 무엇인가요?",
    color: '#FF7F5C'
  },
  {
    question: "방금 전까지 하고 있던 일에서 어떤 즐거움을 찾았나요?",
    color: '#FF8A4D'
  },
  {
    question: "지금 이 순간 당신을 미소 짓게 하는 것은 무엇인가요?",
    color: '#FFB375'
  },
  {
    question: "오늘 하루 중 가장 설레는 순간은 언제였나요?",
    color: '#FF9E5C'
  },
  {
    question: "방금 전까지 느낀 감사한 마음이 있다면 무엇인가요?",
    color: '#FF8466'
  },
  {
    question: "지금 이 순간 당신에게 힘이 되는 것은 무엇인가요?",
    color: '#FF8A99'
  }
];

const challengingMemories = [
  {
    question: "지금 이 순간 가장 마음에 걸리는 생각은 무엇인가요?",
    color: '#5C5CFF'
  },
  {
    question: "오늘 하루 동안 느낀 불안이나 걱정이 있나요?",
    color: '#476BFF'
  },
  {
    question: "방금 전까지 고민하고 있던 문제는 무엇인가요?",
    color: '#3D85FF'
  },
  {
    question: "지금 이 순간 변화시키고 싶은 것이 있다면 무엇인가요?",
    color: '#3DA3FF'
  },
  {
    question: "오늘 마주한 어려움에서 배운 점이 있다면 무엇인가요?",
    color: '#4D94FF'
  },
  {
    question: "방금 전까지 느낀 답답한 감정이 있다면 무엇인가요?",
    color: '#5C8AFF'
  },
  {
    question: "지금 이 순간 해결하고 싶은 감정은 무엇인가요?",
    color: '#47B8FF'
  }
];

const reflectiveMemories = [
  {
    question: "지금 이 순간 당신의 마음 상태는 어떤가요?",
    color: '#66E066'
  },
  {
    question: "오늘 하루 동안 특별히 의미 있었던 순간이 있나요?",
    color: '#7AE87A'
  },
  {
    question: "방금 전까지 떠올린 생각들은 어떤 것들인가요?",
    color: '#8FEF8F'
  },
  {
    question: "지금 이 순간 가장 크게 느껴지는 감정은 무엇인가요?",
    color: '#A3F4A3'
  },
  {
    question: "오늘 하루를 보내며 깨달은 것이 있다면 무엇인가요?",
    color: '#B8FFB8'
  },
  {
    question: "방금 전까지 나누었던 대화가 있다면 어떤 내용이었나요?",
    color: '#66F066'
  },
  {
    question: "지금 이 순간 당신의 호흡은 어떤가요?",
    color: '#66B066'
  }
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateThemeData() {
  return [
    {
      id: 0,
      ...getRandomItem(reflectiveMemories),
      floatingParams: { speed: 1, amplitude: 0.1, phase: 0 }
    },
    {
      id: 1,
      ...getRandomItem(positiveMemories),
      floatingParams: { speed: 0.8, amplitude: 0.15, phase: Math.PI / 3 }
    },
    {
      id: 2,
      ...getRandomItem(challengingMemories),
      floatingParams: { speed: 1.2, amplitude: 0.12, phase: Math.PI / 1.5 }
    },
    {
      id: 3,
      ...getRandomItem(reflectiveMemories),
      floatingParams: { speed: 0.9, amplitude: 0.14, phase: Math.PI / 2 }
    },
    {
      id: 4,
      ...getRandomItem(positiveMemories),
      floatingParams: { speed: 1.1, amplitude: 0.13, phase: Math.PI / 2.5 }
    }
  ];
}

export const initialThemeData = generateThemeData();
export { generateThemeData };