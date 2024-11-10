// themes.js
const funMemories = [
  {
    question: "최근에 큰 소리로 웃은 순간이 있나요?",
    color: '#FF7B7B'
  },
  {
    question: "친구와 함께한 즐거운 추억을 들려주세요",
    color: '#FF9B6A'
  },
  {
    question: "예상치 못한 즐거운 일이 있었나요?",
    color: '#FFB55F'
  },
  {
    question: "최근 가장 맛있게 먹은 음식은 무엇인가요?",
    color: '#FFCC59'
  },
  {
    question: "우연히 발견한 재미있는 것이 있나요?",
    color: '#FFB86F'
  },
  {
    question: "최근 본 영화나 드라마 중 재미있었던 장면은?",
    color: '#FFA76F'
  },
  {
    question: "갑자기 웃음이 났던 순간이 있나요?",
    color: '#FF8E8E'
  },
  {
    question: "친구와 나눈 재미있는 대화가 있나요?",
    color: '#FFAA7B'
  },
  {
    question: "최근에 받은 예상치 못한 선물이 있나요?",
    color: '#FF9D6E'
  },
  {
    question: "길거리에서 마주친 재미있는 장면이 있나요?",
    color: '#FFB57B'
  }
];

const frustratingMemories = [
  {
    question: "최근에 가장 답답했던 순간은 언제인가요?",
    color: '#7B7BFF'
  },
  {
    question: "누군가에게 하지 못한 말이 있나요?",
    color: '#6A9BFF'
  },
  {
    question: "시간이 부족하다고 느낀 순간이 있나요?",
    color: '#5FB5FF'
  },
  {
    question: "최근에 실수한 것 중 아쉬운 게 있나요?",
    color: '#59CCFF'
  },
  {
    question: "다시 한번 기회가 있다면 하고 싶은 말은?",
    color: '#6FB8FF'
  },
  {
    question: "오늘 하루 중 가장 힘들었던 순간은?",
    color: '#6FA7FF'
  },
  {
    question: "최근에 포기한 것이 있다면?",
    color: '#8E8EFF'
  },
  {
    question: "지금 해결하고 싶은 고민이 있나요?",
    color: '#7BAAFF'
  },
  {
    question: "누군가에게 사과하고 싶은 마음이 있나요?",
    color: '#6E9DFF'
  },
  {
    question: "스스로에게 화가 났던 순간이 있나요?",
    color: '#7BB5FF'
  }
];

const contemplativeMemories = [
  {
    question: "요즘 자주 떠오르는 생각이 있나요?",
    color: '#7BFF7B'
  },
  {
    question: "혼자만의 시간에 무엇을 하시나요?",
    color: '#6AFF9B'
  },
  {
    question: "변화하고 싶은 자신의 모습이 있나요?",
    color: '#5FFFB5'
  },
  {
    question: "최근에 새롭게 시작한 것이 있나요?",
    color: '#59FFCC'
  },
  {
    question: "자신의 어떤 모습이 가장 마음에 드나요?",
    color: '#6FFFB8'
  },
  {
    question: "스스로에게 해주고 싶은 칭찬은?",
    color: '#6FFFA7'
  },
  {
    question: "요즘 가장 집중하고 있는 것은 무엇인가요?",
    color: '#8EFF8E'
  },
  {
    question: "미래의 자신에게 하고 싶은 말이 있나요?",
    color: '#7BFFAA'
  },
  {
    question: "최근에 깨달은 것이 있다면?",
    color: '#6EFF9D'
  },
  {
    question: "나에게 가장 소중한 가치는 무엇인가요?",
    color: '#7BFFB5'
  }
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateThemeData() {
  return [
    {
      id: 0,
      color: '#ff4b6b',
      question: "오늘 가장 기억에 남는 순간은 언제인가요?",
      floatingParams: { speed: 1, amplitude: 0.1, phase: 0 }
    },
    {
      id: 1,
      ...getRandomItem(funMemories),
      floatingParams: { speed: 0.8, amplitude: 0.15, phase: Math.PI / 3 }
    },
    {
      id: 2,
      ...getRandomItem(frustratingMemories),
      floatingParams: { speed: 1.2, amplitude: 0.12, phase: Math.PI / 1.5 }
    },
    {
      id: 3,
      ...getRandomItem(contemplativeMemories),
      floatingParams: { speed: 0.9, amplitude: 0.14, phase: Math.PI / 2 }
    },
    {
      id: 4,
      color: '#4ade80',
      question: "전시 중 가장 인상 깊었던 것은?",
      floatingParams: { speed: 1.1, amplitude: 0.13, phase: Math.PI / 2.5 }
    }
  ];
}

export const initialThemeData = generateThemeData();
export { generateThemeData };