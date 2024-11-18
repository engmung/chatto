const generateRandomColorWithConsistentSaturation = () => {
  const hue = Math.floor(Math.random() * 360); // 0-360 랜덤 색상
  const saturation = 80; // 고정된 채도 값 (%)
  const lightness = 60; // 고정된 명도 값 (%)
  
  // HSL to HEX 변환
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const positiveMemories = [
  {
    question: "지금 이 순간 당신의 마음을 따뜻하게 하는 것은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 하루 동안 느낀 작은 기쁨은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 하고 있던 일에서 어떤 즐거움을 찾았나요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 당신을 미소 짓게 하는 것은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 하루 중 가장 설레는 순간은 언제였나요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 느낀 감사한 마음이 있다면 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 당신에게 힘이 되는 것은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  }
];

const challengingMemories = [
  {
    question: "지금 이 순간 가장 마음에 걸리는 생각은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 하루 동안 느낀 불안이나 걱정이 있나요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 고민하고 있던 문제는 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 변화시키고 싶은 것이 있다면 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 마주한 어려움에서 배운 점이 있다면 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 느낀 답답한 감정이 있다면 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 해결하고 싶은 감정은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  }
];

const reflectiveMemories = [
  {
    question: "지금 이 순간 당신의 마음 상태는 어떤가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 하루 동안 특별히 의미 있었던 순간이 있나요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 떠올린 생각들은 어떤 것들인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 가장 크게 느껴지는 감정은 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "오늘 하루를 보내며 깨달은 것이 있다면 무엇인가요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "방금 전까지 나누었던 대화가 있다면 어떤 내용이었나요?",
    color: generateRandomColorWithConsistentSaturation()
  },
  {
    question: "지금 이 순간 당신의 호흡은 어떤가요?",
    color: generateRandomColorWithConsistentSaturation()
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