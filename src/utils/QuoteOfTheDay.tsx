import React, { useEffect, useState, useRef  } from 'react';
import axios from 'axios';

interface TypewriterProps {
  text: string;
  delay?: number; // 控制逐字显示的延迟
}


const QuoteOfTheDay: React.FC = () => {
  const [quote, setQuote] = useState<string | null>(null);

  const fetchQuote = async () => {
    try {
        const response = await axios.get('https://international.v1.hitokoto.cn/?c=i');
        
        const hitokoto = response.data.hitokoto; // 直接获取名言
        const fromWho = response.data.from_who ? `-- ${response.data.from_who}` : '-- ';
        const quoteText = `『${hitokoto}』${fromWho}「${response.data.from}」`;
        setQuote(quoteText);
    } catch (error) {
        console.error('Error fetching the quote:', error);
    }
};

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="text-[grey] italic text-base mr-8">
      {quote}
    </div>
  );
};

export default QuoteOfTheDay;