// themes.js
const positiveMemories = [
  {
    question: "최근에 가장 행복했던 순간은 언제인가요?",
    color: '#FF8C69'
  },
  {
    question: "지금 가장 감사한 것이 있다면 무엇인가요?",
    color: '#FFA07A'
  },
  {
    question: "최근에 누군가에게서 받은 친절한 행동이 있나요?",
    color: '#FFB07C'
  },
  {
    question: "스스로 칭찬하고 싶은 점이 있다면 무엇인가요?",
    color: '#FFD0A6'
  },
  {
    question: "가장 기대되는 일이 있다면 무엇인가요?",
    color: '#FFC590'
  }
];

const challengingMemories = [
  {
    question: "최근에 가장 어려웠던 결정은 무엇인가요?",
    color: '#7F7FFF'
  },
  {
    question: "지금 가장 해결하고 싶은 문제는 무엇인가요?",
    color: '#6B8EFF'
  },
  {
    question: "좌절감을 느꼈던 최근의 순간은 언제인가요?",
    color: '#5FA0FF'
  },
  {
    question: "스스로를 더 강하게 만들어준 경험이 있다면?",
    color: '#59B8FF'
  },
  {
    question: "다시 도전하고 싶은 일이 있다면 무엇인가요?",
    color: '#6FAFFF'
  }
];

const reflectiveMemories = [
  {
    question: "요즘 자주 생각하게 되는 것은 무엇인가요?",
    color: '#90EE90'
  },
  {
    question: "최근에 배운 가장 중요한 교훈은 무엇인가요?",
    color: '#A1F2A1'
  },
  {
    question: "자신의 성장에 대해 어떤 생각을 하시나요?",
    color: '#B3F7B3'
  },
  {
    question: "미래에 대한 가장 큰 희망은 무엇인가요?",
    color: '#C4FAC4'
  },
  {
    question: "스스로에게 해주고 싶은 말이 있다면 무엇인가요?",
    color: '#D8FFD8'
  }
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateThemeData() {
  return [
    {
      id: 0,
      color: '#FF6B6B',
      question: "오늘 하루 중 가장 기분 좋았던 순간은?",
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
      color: '#4CAF50',
      question: "오늘 자신을 가장 뿌듯하게 했던 것은?",
      floatingParams: { speed: 1.1, amplitude: 0.13, phase: Math.PI / 2.5 }
    }
  ];
}

export const initialThemeData = generateThemeData();
export { generateThemeData };
