import type { Language } from '@/types';
import type { AuthTranslations } from '@/translations';

interface DateOfBirthFieldsProps {
    day: string;
    month: string;
    year: string;
    onDayChange: (value: string) => void;
    onMonthChange: (value: string) => void;
    onYearChange: (value: string) => void;
    lang: Language;
    t: Pick<AuthTranslations, 'dateOfBirth' | 'selectDay' | 'selectMonth' | 'selectYear' | 'months'>;
    currentYear: number;
}

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const YEARS_TO_SHOW = 103;

export function DateOfBirthFields({
    day,
    month,
    year,
    onDayChange,
    onMonthChange,
    onYearChange,
    lang,
    t,
    currentYear,
}: DateOfBirthFieldsProps) {
    const direction = lang === 'ar' ? 'rtl' : 'ltr';

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-start">
                {t.dateOfBirth}
            </label>

            <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                dir={direction}
            >
                <select
                    id="birthDay"
                    value={day}
                    onChange={(event) => onDayChange(event.target.value)}
                    required
                    aria-label={t.selectDay}
                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50"
                >
                    <option value="" disabled>
                        {t.selectDay}
                    </option>
                    {DAYS.map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </select>

                <select
                    id="birthMonth"
                    value={month}
                    onChange={(event) => onMonthChange(event.target.value)}
                    required
                    aria-label={t.selectMonth}
                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50"
                >
                    <option value="" disabled>
                        {t.selectMonth}
                    </option>
                    {t.months.map((monthName, index) => (
                        <option key={monthName} value={index + 1}>
                            {monthName}
                        </option>
                    ))}
                </select>

                <select
                    id="birthYear"
                    value={year}
                    onChange={(event) => onYearChange(event.target.value)}
                    required
                    aria-label={t.selectYear}
                    className="h-11 w-full rounded-xl border border-irent-border bg-irent-surface px-3 text-sm text-irent-text outline-none transition focus:border-irent-accent focus:ring-2 focus:ring-irent-accent-soft disabled:opacity-50"
                >
                    <option value="" disabled>
                        {t.selectYear}
                    </option>
                    {Array.from({ length: YEARS_TO_SHOW }, (_, index) => {
                        const value = currentYear - 18 - index;

                        return (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
}
