'use client';

// import { EuiDatePicker, EuiFormRow, EuiSuperDatePicker  } from '@elastic/eui';
import dateMath from '@elastic/datemath';
import type { EuiQuickSelect } from '@elastic/eui';
import { EuiSuperDatePicker } from '@elastic/eui';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { EuiCommonlyUsedTimeRanges } from '@elastic/eui/src/components/date_picker/super_date_picker/quick_select_popover/commonly_used_time_ranges';
import { useSearch } from './context/SearchContext.tsx';
import StartOf = moment.unitOfTime.StartOf;
import Diff = moment.unitOfTime.Diff;

interface TimeRange {
	start: string;
	end: string;
}

type Boundary = {
	unit: StartOf;
	suffix: string;
};

export const dateMathRangeToDates = ({ start, end }: TimeRange) => {
	const startDate = dateMath.parse(start);
	const endDate = dateMath.parse(end);

	return [
		startDate,
		startDate?.isSame(endDate) ? endDate?.endOf('day') : endDate,
	];
};

export const convertToDateMath = (inputDate: string) => {
	const mDate = moment(inputDate);
	const mNow = moment();

	const boundaries: Boundary[] = [
		{ unit: 'day', suffix: 'd' },
		{ unit: 'hour', suffix: 'h' },
		{ unit: 'minute', suffix: 'm' },
	];

	for (const { unit, suffix } of boundaries) {
		if (mDate.isSame(mDate.clone().startOf(unit))) {
			const diff = mNow.diff(mDate, unit as Diff);

			if (mDate.isSame(mNow, unit)) {
				return `now/${suffix}`;
			}

			return diff > 0
				? `now-${diff}${suffix}/${suffix}`
				: `now+${Math.abs(diff)}${suffix}/${suffix}`;
		}
	}
	return mDate.toISOString();
};

const timeRangeOption = (start: string) => {
	switch (start) {
		case '30m':
			return { start: `now-${start}`, end: 'now', label: 'Last 30 minutes' };
		case '1h':
			return { start: `now-${start}`, end: 'now', label: 'Last 1 hour' };
		case '24h':
			return { start: `now-${start}`, end: 'now', label: 'Last 24 hours' };
		case 'today':
			return {
				start: 'now/d',
				end: 'now/d',
				label: 'Today',
			};
		case '1d':
			return {
				start: `now-${start}/d`,
				end: `now-${start}/d`,
				label: 'Yesterday',
			};
		case '2d':
			return {
				start: `now-${start}/d`,
				end: `now-${start}/d`,
				label: moment().subtract(2, 'days').format('dddd'),
			};
		default:
			return { start: `now-2w`, end: 'now', label: 'Last 14 days' };
	}
};

export const DatePicker = () => {
	const { config, handleEnterQuery } = useSearch();

	const minDate = moment().subtract(2, 'weeks');
	const maxDate = moment().endOf('day');

	const [timeRange, setTimeRange] = useState<TimeRange>({
		start: 'now/d',
		end: 'now/d',
	});

	const onTimeChange = ({ start, end }: TimeRange) => {
		setTimeRange({ start, end });

		console.log(
			'date f',
			convertToDateMath(moment().toISOString()),
		);

		handleEnterQuery({
			...config.query,
			startDate: start,
			endDate: end,
		});
	};

	const customQuickSelectRender = ({
		quickSelect,
		commonlyUsedRanges,
	}: {
		quickSelect: ReactElement<typeof EuiQuickSelect>;
		commonlyUsedRanges: ReactElement<typeof EuiCommonlyUsedTimeRanges>;
	}) => (
		<>
			{commonlyUsedRanges}
			{quickSelect}
		</>
	);

	return (
		<div style={{ paddingTop: 20, paddingBottom: 20 }}>
			<EuiSuperDatePicker
				width={'auto'}
				start={timeRange.start}
				end={timeRange.end}
				minDate={minDate}
				maxDate={maxDate}
				onTimeChange={onTimeChange}
				showUpdateButton={false}
				customQuickSelectRender={customQuickSelectRender}
				commonlyUsedRanges={[
					timeRangeOption('30m'),
					timeRangeOption('1h'),
					timeRangeOption('24h'),
					timeRangeOption('today'),
					timeRangeOption('1d'),
					timeRangeOption('2d'),
				]}
			/>
		</div>
	);
};
