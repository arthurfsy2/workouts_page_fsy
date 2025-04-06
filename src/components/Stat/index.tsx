import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  onClick?: () => void;
  style?: React.CSSProperties; // 新增：用于接收动态样式的属性
}

const Stat = ({
  value,
  description,
  className = 'pb-1 flex w-full items-center justify-between',
  citySize,
  onClick,
  style, // 新增：解构出 style 属性
}: IStatProperties) => (
  <div className={`${className}`} onClick={onClick} style={style}>
    {' '}
    {/* 新增：应用传入的样式 */}
    <span
      className={`w-1/2 text-${citySize || 5}xl mr-2 text-right font-semibold text-[#00AFAA]`}
    >
      {intComma(value.toString())}
    </span>
    <span className="text-1xl w-1/2 font-semibold italic"> {description}</span>
  </div>
);

export default Stat;
