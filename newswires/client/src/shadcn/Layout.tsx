import { Button } from '../../components/ui/button';
import {Bell, Bookmark, ExternalLink} from 'lucide-react'; // Adjust the import based on your project structure
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../components/ui/tooltip';

type LayoutProps = {
	children: React.ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="flex justify-between items-center p-4 border-b border-gray-200 ">
				<div className="text-xl font-bold">Newswires</div>
				<div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" className="mr-4">
									<Bell size={40} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Notifications</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button>
									<ExternalLink /> New ticker
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Create a new ticker</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-grow p-4 bg-gray-50 h-[calc(100vh-8rem)]">
				{children}
			</main>
		</div>
	);
};
