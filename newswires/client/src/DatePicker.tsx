'use client';

import type { EuiQuickSelect } from '@elastic/eui';
import { EuiSuperDatePicker } from '@elastic/eui';
import type { EuiCommonlyUsedTimeRanges } from '@elastic/eui/src/components/date_picker/super_date_picker/quick_select_popover/commonly_used_time_ranges';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import {
	DEFAULT_DATE_RANGE,
	END_OF_TODAY,
	TWO_WEEKS_AGO,
} from './dateConstants.ts';
import type { TimeRange } from './dateHelpers.ts';
import { timeRangeOption } from './dateHelpers.ts';

export const DatePicker = () => {
	const { config, handleEnterQuery } = useSearch();

	/*
	 * The Super Date Picker automatically converts absolute dates to UTC.
	 * To display the dates correctly in local time, we adjust the UTC values back to the local timezone.
	 */
	const onTimeChange = ({ start, end }: TimeRange) => {
		handleEnterQuery({
			...config.query,
			dateRange: {
				start: moment(start).isValid() ? moment(start).format() : start,
				end: moment(end).isValid() ? moment(end).format() : end,
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
		<div>
			<EuiSuperDatePicker
				width={'auto'}
				start={
					config.query.dateRange
						? config.query.dateRange.start
						: DEFAULT_DATE_RANGE.start
				}
				end={
					config.query.dateRange
						? config.query.dateRange.end
						: DEFAULT_DATE_RANGE.end
				}
				minDate={TWO_WEEKS_AGO}
				maxDate={END_OF_TODAY}
				onTimeChange={onTimeChange}
				utcOffset={moment().utcOffset()}
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
