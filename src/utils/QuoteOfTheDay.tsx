import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface TypewriterProps {
  text: string;
  delay?: number; // 控制逐字显示的延迟
}

const Typewriter: React.FC<TypewriterProps> = ({ text, delay = 100 }) => {
  const [displayedText, setDisplayedText] = useState<string>('');

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, delay);

    return () => clearInterval(typingInterval); // 清理定时器
  }, [text, delay]);

  return <span >{displayedText}</span>;
};

const QuoteOfTheDay: React.FC = () => {
  const [quote, setQuote] = useState<string>('');

  const fetchQuote = async () => {
    try {
      const response = await axios.get('https://international.v1.hitokoto.cn/?c=k');
      setQuote(response.data.hitokoto);
    } catch (error) {
      console.error('Error fetching the quote:', error);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="text-[#ED55DB]">
      每日一言：{quote && <Typewriter text={quote} delay={100} />} {/* 使用 Typewriter 组件来显示逐字打印效果 */}
    </div>
  );
};

export default QuoteOfTheDay;