import {
	EuiButton,
	EuiHeader,
	EuiModal,
	EuiModalBody,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiSpacer,
	useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { STAGE } from './app-configuration';

export const StageDisplayBanner = () => {
	const stage = STAGE.toUpperCase();
	const { euiTheme } = useEuiTheme();
	const [showModal, setShowModal] = useState(false);
	if (stage === 'DEV' || stage === 'CODE') {
		return (
			<>
				<EuiHeader
					position="fixed"
					css={css`
						background-color: ${stage === 'DEV'
							? euiTheme.colors.warning
							: euiTheme.colors.danger};
						color: ${stage === 'DEV'
							? euiTheme.colors.textHeading
							: euiTheme.colors.ghost};
						padding: 10px;
						top: 10px;
						bottom: 10px;
						text-align: center;
						font-size: 16px;
						font-weight: 400;
						width: 100%;
						align-items: center;
						justify-content: center;
						gap: 10px;

						& p {
							text-align: center;
						}
					`}
				>
					<p>You are working in the Newswires {stage} Environment</p>
					{stage === 'CODE' && (
						<EuiButton
							color="danger"
							size="s"
							onClick={() => setShowModal(true)}
						>
							More info
						</EuiButton>
					)}
				</EuiHeader>
				{showModal && (
					<EuiModal
						title="CODE Environment"
						onClose={() => setShowModal(false)}
					>
						<EuiModalHeader>
							<EuiModalHeaderTitle>CODE Environment</EuiModalHeaderTitle>
						</EuiModalHeader>
						<EuiModalBody>
							<p>
								The &ldquo;CODE Environment&rdquo; is a shared environment for
								testing and development. Please be cautious when using it, as it
								may contain unstable features and data.
							</p>
							<EuiSpacer size="m" />
							<p style={{ fontWeight: 'bold' }}>
								If you need to use Newswires but are not a developer, you almost
								certainly want to{' '}
								<a href="https://newswires.gutools.co.uk">
									use the production version of the site
								</a>{' '}
								instead.
							</p>
						</EuiModalBody>
					</EuiModal>
				)}
			</>
		);
	}
	return null;
};
