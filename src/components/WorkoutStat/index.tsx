import React from 'react';
import { intComma } from '@/utils/utils';
import { MAIN_COLOR } from '@/utils/const';

const WorkoutStat = ({value, description, pace, className, distance, onClick, color=MAIN_COLOR}:
                         { value: string, description:string, pace: string, className: string, distance: string, onClick: (_year: string) => void , color: string}) =>
    (<div className={`${className || " "} `} onClick={onClick}>
    <span className={`text-3xl font-semibold italic text-[#00AFAA]`}>{intComma(value)}</span>
    <span className="text-1xl font-semibold italic">{description}</span>
    { pace && (<span className="text-3xl font-semibold italic text-[#00AFAA]">{ " " +pace}</span>)}
    { pace && (<span className="text-1xl font-semibold italic"> Pace</span>)}

    { distance && (<span className="text-3xl font-semibold italic text-[#00AFAA]">{ " " + distance}</span>)}
    { distance && (<span className="text-1xl font-semibold italic"> KM</span>)}

  </div>
);

export default WorkoutStat;
