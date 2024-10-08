import {
	EuiBadge,
	EuiButton,
	EuiContextMenu,
	EuiFieldSearch,
	EuiListGroup,
	EuiPopover,
	EuiScreenReaderOnly,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useMemo, useState } from 'react';
import { debounce } from './debounce';
import type { Query } from './sharedTypes';
import { paramsToQuerystring } from './urlState';
import type { SearchHistory } from './useSearch';

export function SearchBox({
	initialQuery,
	update,
	searchHistory,
	incremental = false,
}: {
	initialQuery: Query;
	update: (newQuery: Query) => void;
	searchHistory: SearchHistory;
	incremental?: boolean;
}) {
	const [freeTextQuery, setFreeTextQuery] = useState<string>(initialQuery.q);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const onButtonClick = () =>
		setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);
	const closePopover = () => setIsPopoverOpen(false);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				update({ q: freeTextQuery });
			}}
		>
			<EuiFieldSearch
				value={freeTextQuery}
				onChange={(e) => {
					const newQuery = e.target.value;
					setFreeTextQuery(newQuery);
					if (incremental) {
						debouncedUpdate({ q: newQuery });
					}
				}}
				aria-label="search wires"
				append={
					<NestedDropdown searchHistory={searchHistory} update={update} />
					// <EuiPopover
					// 	button={
					// 		<EuiButtonEmpty
					// 			iconType="clock"
					// 			iconSide="right"
					// 			onClick={onButtonClick}
					// 			aria-label="search history"
					// 		/>
					// 	}
					// 	isOpen={isPopoverOpen}
					// 	closePopover={closePopover}
					// >
					// 	{searchHistory.length === 0 ? (
					// 		<EuiText color="subdued">No search history</EuiText>
					// 	) : (
					// 		<EuiListGroup>
					// 			{searchHistory.map(({ query, resultsCount }) => (
					// 				<EuiButton
					// 					onClick={() => {
					// 						update(query);
					// 						closePopover();
					// 					}}
					// 					key={paramsToQuerystring(query)}
					// 				>
					// 					{paramsToQuerystring(query)}{' '}
					// 					<EuiBadge
					// 						color={resultsCount > 0 ? 'success' : 'text'}
					// 						aria-label={`${resultsCount} results`}
					// 					>
					// 						{resultsCount}
					// 					</EuiBadge>
					// 				</EuiButton>
					// 			))}
					// 		</EuiListGroup>
					// 	)}
					// </EuiPopover>
				}
			/>
		</form>
	);
}

const NestedDropdown = ({
	searchHistory,
	update,
}: {
	searchHistory: SearchHistory;
	update: (newQuery: Query) => void;
}) => {
	const [isPopoverOpen, setPopover] = useState(false);
	const contextMenuPopoverId = useGeneratedHtmlId({
		prefix: 'contextMenuPopover',
	});
	const onButtonClick = () => {
		setPopover(!isPopoverOpen);
	};
	const closePopover = () => {
		setPopover(false);
	};

	const panels = [
		{
			id: 0,
			title: 'Navigation',
			items: [
				{
					name: 'Agencies',
					icon: 'list',
					panel: 1,
				},
				{
					name: 'Saved feeds',
					icon: 'save',
					panel: 2,
				},
				{
					name: 'Search history',
					icon: 'clock',
					panel: 3,
				},
			],
		},
		{
			id: 1,
			title: 'Agencies',
			items: [
				{ name: 'All', onClick: closePopover },
				{
					name: 'Reuters',
					onClick: closePopover,
				},
				{
					name: 'AP',
					onClick: closePopover,
				},
				{
					name: 'AFP',
					onClick: closePopover,
				},
			],
		},
		{
			id: 2,
			title: 'Saved feeds',
			items: [
				{
					name: 'Feed 1',
					onClick: closePopover,
				},
				{
					name: 'Feed 2',
					onClick: closePopover,
				},
				{
					name: 'Feed 3',
					onClick: closePopover,
				},
			],
		},
		{
			id: 3,
			title: 'Search history',
			content: (
				<EuiListGroup>
					{searchHistory
						.filter(
							({ query }) =>
								Object.keys(query).length == 1 && query.q.length == 0,
						)
						.map(({ query, resultsCount }) => (
							<EuiButton
								onClick={() => {
									update(query);
									closePopover();
								}}
								key={paramsToQuerystring(query)}
							>
								{paramsToQuerystring(query)}{' '}
								<EuiBadge
									color={resultsCount > 0 ? 'success' : 'text'}
									aria-label={`${resultsCount} results`}
								>
									{resultsCount}
								</EuiBadge>
							</EuiButton>
						))}
				</EuiListGroup>
			),
		},
	];
	const button = (
		<EuiButton iconType="menu" iconSide="right" onClick={onButtonClick}>
			<EuiScreenReaderOnly>
				<span>Menu</span>
			</EuiScreenReaderOnly>
		</EuiButton>
	);
	return (
		<EuiPopover
			id={contextMenuPopoverId}
			button={button}
			isOpen={isPopoverOpen}
			closePopover={closePopover}
			panelPaddingSize="none"
			anchorPosition="downLeft"
		>
			<EuiContextMenu initialPanelId={0} panels={panels} />
		</EuiPopover>
	);
};
