import { Button } from '../../components/ui/button';
import {ExternalLink} from "lucide-react"; // Adjust the import based on your project structure

type LayoutProps = {
	children: React.ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="flex justify-between items-center p-4 border-b border-gray-200 ">
				<div className="text-xl font-bold">Newswires</div>
				<Button>
					<ExternalLink /> New ticker
				</Button>
			</header>

			{/* Main Content */}
			<main className="flex-grow p-4 bg-gray-50">{children}</main>
		</div>
	);
};
