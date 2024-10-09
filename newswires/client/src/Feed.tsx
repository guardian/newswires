import { EuiEmptyPrompt, EuiPageTemplate } from '@elastic/eui';
import type { WireData } from './sharedTypes';
import { WireItemTable } from './WireItemTable';

export const Feed = ({ items }: { items: WireData[] }) => {
	return (
		<EuiPageTemplate.Section>
			{items.length === 0 && (
				<EuiEmptyPrompt
					body={<p>Try a different search term</p>}
					color="subdued"
					layout="horizontal"
					title={<h2>No results match your search criteria</h2>}
					titleSize="s"
				/>
			)}

			{items.length > 0 && <WireItemTable wires={items} />}
		</EuiPageTemplate.Section>
	);
};
