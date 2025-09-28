import { Select } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';

interface TimePickerInterface {
  step?: number;
  placeholder?: string;
  minDate?: Date | null;
  style?: React.CSSProperties;
  value: string | null;
  onChange?: (value: string | null) => void;
}

export const TimePicker = ({ step, placeholder, minDate, style, value, onChange }: TimePickerInterface) => {
  const generateTimeOptions = () => {
    const options = [];
    const now = moment();
    const isToday = minDate && now.isSame(minDate, 'day');

    for (let hour = isToday ? now.hour() : 0; hour < 24; hour += 1) {
      const startMinute = isToday && hour === now.hour() 
        ? Math.ceil(now.minute() / (step || 1)) * (step || 1)
        : 0;
      for (let minute = startMinute; minute < 60; minute += step || 1) {
        const timeString = moment().set({ hour, minute }).format(DateFormatEnum.HH_MM);
        options.push({
          value: timeString,
          label: timeString,
        });
      }
    }
    return options;
  };

  return (
    <Select
      placeholder={placeholder}
      style={style}
      allowClear
      suffixIcon={<ClockCircleOutlined style={{ pointerEvents: 'none' }} />}
      options={generateTimeOptions()}
      value={value}
      onChange={onChange}
    />
  );
};
