import {
	EuiButtonGroup,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingLogo,
	EuiPageTemplate,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { DatePicker } from './DatePicker.tsx';
import { SearchSummary } from './SearchSummary.tsx';
import { WireItemList } from './WireItemList.tsx';

export const Feed = () => {
	const { state } = useSearch();
	const { status, queryData } = state;

	const basicButtonGroupPrefix = useGeneratedHtmlId({
		prefix: 'basicButtonGroup',
	});

	const [toggleIdSelected, setToggleIdSelected] = useState(
		`${basicButtonGroupPrefix}__0`,
	);

	const toggleButtons = [
		{
			id: `${basicButtonGroupPrefix}__0`,
			label: 'Today',
		},
		{
			id: `${basicButtonGroupPrefix}__1`,
			label: 'Yesterday',
		},
		{
			id: `${basicButtonGroupPrefix}__2`,
			label: 'Tuesday',
		},
	];

	const onChange = (optionId: string) => {
		setToggleIdSelected(optionId);
	};

	return (
		<EuiPageTemplate.Section>
			{status == 'loading' && (
				<EuiEmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="l" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length === 0 && (
					<EuiEmptyPrompt
						body={
							<>
								<SearchSummary />
								<p>Try another search or reset filters.</p>
							</>
						}
						color="subdued"
						layout="horizontal"
						title={<h2>No results match your search criteria</h2>}
						titleSize="s"
					/>
				)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length > 0 && (
					<>
						<div style={{ display: 'flex' }}>
							<div style={{ flex: 1, paddingTop: 20, paddingBottom: 20 }}>
								<EuiButtonGroup
									buttonSize="m"
									legend="This is a basic group"
									options={toggleButtons}
									idSelected={toggleIdSelected}
									onChange={(id) => onChange(id)}
								/>
							</div>
							<DatePicker />
						</div>

						<EuiFlexGroup>
							<EuiFlexItem
								style={{ flex: 1, paddingTop: 20, paddingBottom: 20 }}
							>
								<SearchSummary />
							</EuiFlexItem>
							<EuiFlexItem grow={false}>
								<DatePicker />
							</EuiFlexItem>
						</EuiFlexGroup>

						<div style={{ display: 'flex' }}>
							<div style={{ flex: 1, paddingTop: 20, paddingBottom: 20 }}>
								<EuiButtonGroup
									buttonSize="m"
									legend="This is a basic group"
									options={toggleButtons}
									idSelected={toggleIdSelected}
									onChange={(id) => onChange(id)}
								/>
							</div>
							<DatePicker />
						</div>

						<WireItemList
							wires={queryData.results}
							totalCount={queryData.totalCount}
						/>
					</>
				)}
		</EuiPageTemplate.Section>
	);
};
