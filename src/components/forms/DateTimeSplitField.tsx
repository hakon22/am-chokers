import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { DatePicker } from 'antd';
import type { Moment } from 'moment';
import moment from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import cn from 'classnames';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import styles from '@/components/forms/DateTimeSplitField.module.scss';

const AntDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

export type DateTimeSplitFieldLabels = {
  selectTime: string;
  changeDate: string;
  edit: string;
};

export type DateTimeSplitFieldProps = {
  value?: Moment | null;
  onChange?: (value: Moment | null) => void;
  disabledDate?: (current: Moment) => boolean;
  disabledHours?: number[];
  step?: number;
  datePlaceholder?: string;
  locale?: Parameters<typeof AntDatePicker>[0]['locale'];
  datePickerSize?: 'small' | 'middle' | 'large';
  /** Подписи шагов (из i18n на странице корзины) */
  labels?: Partial<DateTimeSplitFieldLabels>;
};

type FlowPhase = 'date' | 'time' | 'summary';

function buildTimeSlotStrings(
  minDay: Moment,
  minuteStep: number,
  disabledHours?: number[],
): string[] {
  const options: string[] = [];
  const now = moment();
  const isToday = now.isSame(minDay, 'day');

  for (let hour = isToday ? now.hour() : 0; hour < 24; hour += 1) {
    if (disabledHours?.includes(hour)) {
      continue;
    }
    const startMinute = isToday && hour === now.hour()
      ? Math.ceil(now.minute() / (minuteStep || 1)) * (minuteStep || 1)
      : 0;
    for (let minute = startMinute; minute < 60; minute += minuteStep || 1) {
      const slot = moment().hour(hour).minute(minute).second(0).millisecond(0);
      if (isToday && slot.isBefore(now, 'minute')) {
        continue;
      }
      options.push(slot.format(DateFormatEnum.HH_MM));
    }
  }
  return options;
}

const defaultLabels: DateTimeSplitFieldLabels = {
  selectTime: 'Select time',
  changeDate: 'Change date',
  edit: 'Change',
};

/**
 * Одно поле формы: шаг 1 — дата (Ant), шаг 2 — время (сетка), затем сводка и «Изменить».
 */
export const DateTimeSplitField = ({
  value,
  onChange,
  disabledDate,
  disabledHours,
  step: minuteStep = 10,
  datePlaceholder,
  locale,
  datePickerSize = 'middle',
  labels: labelsProp,
}: DateTimeSplitFieldProps) => {
  const labels = { ...defaultLabels, ...labelsProp };
  const [date, setDate] = useState<Moment | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [phase, setPhase] = useState<FlowPhase>('date');
  /** Управление панелью календаря: после «Другая дата» открываем сразу (иначе кажется, что «окно» закрылось). */
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const prevValueRef = useRef<Moment | null | undefined>(undefined);
  const preserveDateForRepickRef = useRef(false);
  /** Семантическое значение value из формы; без этого при новой ссылке Moment эффект сбрасывал phase в summary и ломал шаг «время» / «другая дата». */
  const lastSyncedValueMsRef = useRef<number | null>(null);

  const setDateEffect = useEffectEvent(setDate);
  const setTimeEffect = useEffectEvent(setTime);
  const setPhaseEffect = useEffectEvent(setPhase);

  useEffect(() => {
    if (value && moment.isMoment(value)) {
      setDateEffect(value.clone().startOf('day'));
      setTimeEffect(value.format(DateFormatEnum.HH_MM));
      const ms = value.valueOf();
      if (lastSyncedValueMsRef.current !== ms) {
        lastSyncedValueMsRef.current = ms;
        setPhaseEffect('summary');
      }
      return;
    }
    if (preserveDateForRepickRef.current) {
      return;
    }
    lastSyncedValueMsRef.current = null;
  }, [value]);

  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = value ?? null;
    if (value || !prev || !moment.isMoment(prev)) {
      return;
    }
    if (preserveDateForRepickRef.current) {
      preserveDateForRepickRef.current = false;
      setDate(prev.clone().startOf('day'));
      setTime(null);
      setPhase('date');
      return;
    }
    setDate(null);
    setTime(null);
    setPhase('date');
  }, [value]);

  const minDayForSlots = (date ?? moment().startOf('day')).clone().startOf('day');
  const timeSlots = buildTimeSlotStrings(minDayForSlots, minuteStep, disabledHours);

  const onDatePicked = (d: Moment | null) => {
    setDatePanelOpen(false);
    if (!d) {
      setDate(null);
      setTime(null);
      onChange?.(null);
      setPhase('date');
      return;
    }
    setDate(d.clone().startOf('day'));
    setTime(null);
    onChange?.(null);
    setPhase('time');
  };

  const onTimePicked = (slot: string) => {
    if (!date) {
      return;
    }
    setDatePanelOpen(false);
    const [h, m] = slot.split(':').map(Number);
    const merged = date.clone().hour(h).minute(m).second(0).millisecond(0);
    setTime(slot);
    onChange?.(merged);
    setPhase('summary');
  };

  const goChangeDate = () => {
    preserveDateForRepickRef.current = true;
    setTime(null);
    onChange?.(null);
    setPhase('date');
    requestAnimationFrame(() => {
      setDatePanelOpen(true);
    });
  };

  const goChangeTime = () => {
    setDatePanelOpen(false);
    if (value && moment.isMoment(value)) {
      setDate(value.clone().startOf('day'));
      setTime(value.format(DateFormatEnum.HH_MM));
    }
    setPhase('time');
  };

  return (
    <div className={cn(styles.wrap, phase !== 'date' && styles.wrapFramed)}>
      {phase === 'date' && (
        <div className={styles.datePickerFull}>
          <AntDatePicker
            value={date}
            onChange={onDatePicked}
            format={DateFormatEnum.DD_MM_YYYY}
            placeholder={datePlaceholder}
            locale={locale}
            size={datePickerSize}
            showNow={false}
            disabledDate={disabledDate}
            open={datePanelOpen}
            onOpenChange={setDatePanelOpen}
            getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
          />
        </div>
      )}

      {phase === 'time' && date && (
        <>
          <div className={styles.timeHeader}>
            <span className={styles.timeTitle}>{labels.selectTime}</span>
            <button
              type="button"
              className={styles.backLink}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                goChangeDate();
              }}
            >
              {labels.changeDate}
            </button>
          </div>
          <div className={styles.dateMeta}>{date.format(DateFormatEnum.DD_MM_YYYY)}</div>
          <div className={styles.pills} role="listbox" aria-label={labels.selectTime}>
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                role="option"
                aria-selected={time === slot}
                className={cn(styles.pill, time === slot && styles.pillSelected)}
                onClick={() => onTimePicked(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'summary' && value && moment.isMoment(value) && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryValue}>{value.format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
          <button type="button" className={styles.editBtn} onClick={goChangeTime}>
            {labels.edit}
          </button>
        </div>
      )}
    </div>
  );
};
