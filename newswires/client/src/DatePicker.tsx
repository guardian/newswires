'use client';

import type { EuiQuickSelect } from '@elastic/eui';
import { EuiSuperDatePicker } from '@elastic/eui';
import type { EuiCommonlyUsedTimeRanges } from '@elastic/eui/src/components/date_picker/super_date_picker/quick_select_popover/commonly_used_time_ranges';
import type { ReactElement } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import {
	END_OF_TODAY,
	LAST_TWO_WEEKS,
	NOW,
	TWO_WEEKS_AGO,
} from './dateConstants.ts';
import type { TimeRange } from './dateMathHelpers.ts';
import { timeRangeOption } from './dateMathHelpers.ts';

export const DatePicker = () => {
	const { config, handleEnterQuery } = useSearch();

	const onTimeChange = ({ start, end }: TimeRange) => {
		handleEnterQuery({
			...config.query,
			dateRange: {
				start,
				end,
			},
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
				start={
					config.query.dateRange ? config.query.dateRange.start : LAST_TWO_WEEKS
				}
				end={config.query.dateRange ? config.query.dateRange.end : NOW}
				minDate={TWO_WEEKS_AGO}
				maxDate={END_OF_TODAY}
				onTimeChange={onTimeChange}
				updateButtonProps={{ showTooltip: true, iconOnly: true }}
				customQuickSelectRender={customQuickSelectRender}
				dateFormat={'MMM D • HH:mm'}
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
