import React from 'react';
import { intComma } from '@/utils/utils';
import { MAIN_COLOR } from '@/utils/const';

const WorkoutStat = ({
  value,
  description,
  pace,
  className,
  distance,
  onClick,
  color = MAIN_COLOR,
}: {
  value: string;
  description: string;
  pace: string;
  className: string;
  distance: string;
  onClick: (_year: string) => void;
  color: string;
}) => (
  <div
    className={`${className || 'flex w-full items-center justify-between pb-1'} `}
    onClick={onClick}
  >
    <span
      className={`mr-2 w-1/2 text-right text-5xl font-semibold text-[#00AFAA]`}
    >
      {intComma(value)}
    </span>

    {pace && (
      <span className="mr-4 w-1/2 text-right text-4xl font-semibold text-[#00AFAA]">
        {' ' + pace}
      </span>
    )}
    {pace && <span className="text-1xl w-1/2 font-semibold italic"> Pace</span>}

    {distance && (
      <span className="text-1xl w-1/2 font-semibold italic">
        {description + ' ' + distance + ' KM'}
      </span>
    )}
  </div>
);

export default WorkoutStat;
