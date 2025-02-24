'use client';

import type { EuiQuickSelect } from '@elastic/eui';
import { EuiSuperDatePicker } from '@elastic/eui';
import type { EuiCommonlyUsedTimeRanges } from '@elastic/eui/src/components/date_picker/super_date_picker/quick_select_popover/commonly_used_time_ranges';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import type { TimeRange } from './dateMathHelpers.ts';
import { timeRangeOption } from './dateMathHelpers.ts';

export const DatePicker = () => {
	const { config, handleEnterQuery } = useSearch();

	const minDate = moment().subtract(2, 'weeks');
	const maxDate = moment().endOf('day');

	const onTimeChange = ({ start, end }: TimeRange) => {
		handleEnterQuery({
			...config.query,
			start,
			end,
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
				start={config.query.start}
				end={config.query.end}
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
