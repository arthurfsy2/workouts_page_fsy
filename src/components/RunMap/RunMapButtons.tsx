import useActivities from '@/hooks/useActivities';
import styles from './style.module.css';

const RunMapButtons = ({ changeYear, thisYear }: { changeYear: (_year: string) => void, thisYear: string }) => {
  const { years } = useActivities();
  const yearsButtons = years.slice();
  yearsButtons.push('Total');

  return (
    <ul className={styles.buttons}>
      {yearsButtons.map((year) => (
        <li
        key={`${year}button`}
        className={`py-0.5 px-2 mb-1.5 border-1 border-transparent rounded-lg cursor-pointer transition-all duration-300`}
                    style={{ 
                      outline: 'none', 
                      backgroundColor: year === thisYear ? '#579EFB' : '#D1D5DB', // 指定背景颜色
                      color: year === thisYear ? '#FFFFFF' : '#1F2937', // 指定字体颜色
                      fontSize: '18px' // 设置字体大小
                  }}
        onClick={() => changeYear(year)}
    >
        {year}
      </li>
      ))}
    </ul>
  );
};

export default RunMapButtons;
