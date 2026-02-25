'use client';

import type { EuiQuickSelect } from '@elastic/eui';
import { EuiSuperDatePicker } from '@elastic/eui';
import type { EuiCommonlyUsedTimeRanges } from '@elastic/eui/src/components/date_picker/super_date_picker/quick_select_popover/commonly_used_time_ranges';
import type { ReactElement } from 'react';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext.tsx';
import { useSearch } from './context/SearchContext.tsx';
import {
	DEFAULT_DATE_RANGE,
	END_OF_TODAY,
	TWO_WEEKS_AGO,
} from './dateConstants.ts';
import { timeRangeOption } from './dateHelpers.ts';
import { EuiDateStringSchema } from './sharedTypes.ts';

export const DatePicker = ({ width = 'auto' }: { width?: 'full' | 'auto' }) => {
	const { config, handleEnterQuery } = useSearch();

	const onTimeChange = ({ start, end }: { start: string; end: string }) => {
		handleEnterQuery({
			...config.query,
			start: EuiDateStringSchema.parse(start),
			end: EuiDateStringSchema.parse(end),
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
		<StopShortcutPropagationWrapper>
			{/* Wrap date picker so StopShortcutPropagationWrapper can catch and stop its keyboard events */}
			<div>
				<EuiSuperDatePicker
					width={width}
					compressed={true}
					start={config.query.start ?? DEFAULT_DATE_RANGE.start}
					end={config.query.end ?? DEFAULT_DATE_RANGE.end}
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
						timeRangeOption('3d'),
						timeRangeOption('1w'),
						timeRangeOption('today'),
						timeRangeOption('1d'),
						timeRangeOption('2d'),
					]}
				/>
			</div>
		</StopShortcutPropagationWrapper>
	);
};
