import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IS_CHINESE } from '@/utils/const';

const QuoteOfTheDay: React.FC = () => {
  const [quote, setQuote] = useState<string | null>(null);

  const fetchChineseQuote = async () => {
    try {
      const response = await axios.get(
        'https://international.v1.hitokoto.cn/?c=i'
      );
      const hitokoto = response.data.hitokoto; // 获取名言
      const fromWho = response.data.from_who
        ? `-- ${response.data.from_who}`
        : '-- ';
      const quoteText = `『${hitokoto}』${fromWho}「${response.data.from}」`;
      setQuote(quoteText);
    } catch (error) {
      console.error('Error fetching the Chinese quote:', error);
    }
  };

  const fetchEnglishQuote = async () => {
    try {
      const response = await axios.get('https://api.quotable.io/random');
      const { content, author } = response.data; // 获取名言内容和作者
      setQuote(`${content} -- ${author || 'Unknown'}`);
    } catch (error) {
      console.error('Error fetching the English quote:', error);
    }
  };

  useEffect(() => {
    if (IS_CHINESE) {
      fetchChineseQuote();
    } else {
      fetchEnglishQuote();
    }
  }, []); // 只在组件挂载时运行

  if (!quote) return null;

  return <div className="mr-6 text-base italic text-[#579EFB]">{quote}</div>;
};

export default QuoteOfTheDay;
