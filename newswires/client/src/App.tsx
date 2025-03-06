import { Bell, Bookmark, Filter, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Layout } from './shadcn/Layout.tsx';
import { Badge } from '../components/ui/badge';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '../components/ui/resizable.tsx';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../components/ui/tooltip';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../components/ui/drawer';
import { Separator } from '../components/ui/separator';
import { Direction } from 'react-resizable-panels/dist/declarations/src/types';
import { useSearch } from './context/SearchContext.tsx';
import { Skeleton } from '../components/ui/skeleton';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import {AdvancedSearchForm} from "./shadcn/AdvancedSearchForm.tsx";

export function formatTimestamp(s: string): [string, string] {
	const date = new Date(s);
	const relativeTime = formatDistanceToNow(date, { addSuffix: true });
	const formattedDate = isToday(date) ? format(date, 'p') : format(date, 'Pp');
	return [relativeTime, formattedDate];
}

const sampleNews = [
	{
		id: 1,
		title: 'Breaking: Market Surges',
		source: 'Reuters',
		category: 'Business',
		timestamp: '2 mins ago',
	},
	{
		id: 2,
		title: 'Elections: Latest Poll Results',
		source: 'AP News',
		category: 'Politics',
		timestamp: '5 mins ago',
	},
	{
		id: 3,
		title: 'Tech Giants Announce AI Breakthrough',
		source: 'Bloomberg',
		category: 'Technology',
		timestamp: '10 mins ago',
	},
];

export function App() {
	const {
		state: { status, queryData },
	} = useSearch();

	const [newsFeed, setNewsFeed] = useState(sampleNews);
	const [search, setSearch] = useState('');
	const [showContent, setShowContent] = useState(false);
	const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
	const [layout, setLayout] = useState<Direction>('horizontal');

	useEffect(() => {
		const interval = setInterval(() => {
			setNewsFeed((prev) => [
				{
					id: Date.now(),
					title: 'New Headline',
					source: 'AFP',
					category: 'General',
					timestamp: 'Just now',
				},
				...prev,
			]);
		}, 10000);
		return () => clearInterval(interval);
	}, []);

	return (
		<Layout>
			<div className="flex flex-col max-w-8xl mx-auto p-2 h-full">
				<div className="flex items-center gap-4 mb-4 shrink-0">
					<div className="relative flex-1 max-w-xl">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
						<Input
							className="bg-white pl-10"
							placeholder="Search..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<Drawer
						open={isFilterDrawerOpen}
						onOpenChange={setIsFilterDrawerOpen}
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<DrawerTrigger asChild>
										<Button variant="outline">
											<Filter className="w-5 h-5" />
										</Button>
									</DrawerTrigger>
								</TooltipTrigger>
								<TooltipContent>
									<p>Filter news</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<DrawerContent>
							<DrawerHeader className="mx-auto max-w-8xl">
								<DrawerTitle>Advanced Filters</DrawerTitle>
								<DrawerDescription>
									Customize your news feed with advanced filtering options.
								</DrawerDescription>
							</DrawerHeader>

							<AdvancedSearchForm />

							<DrawerFooter className="mx-auto max-w-8xl">
								<Button size="sm">Apply Filters</Button>
								<DrawerClose asChild>
									<Button variant="outline" size="sm">Cancel</Button>
								</DrawerClose>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									onClick={() => setNewsFeed(sampleNews)}
								>
									<RefreshCw className="w-5 h-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Refresh news feed</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				<div className="flex-1 flex flex-col min-h-0">
					<div className="flex justify-between items-center mb-4">
						<Tabs defaultValue="all" className="w-fit">
							<TabsList>
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="business">Reuters World</TabsTrigger>
								<TabsTrigger value="politics">AP World</TabsTrigger>
								<TabsTrigger value="technology">AAP World</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					<ResizablePanelGroup
						direction={layout}
						onLayout={(sizes: number[]) => {
							document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
								sizes,
							)}`;
						}}
						className="h-full max-h-[800px] items-stretch flex-1 border rounded-lg bg-white"
					>
						<ResizablePanel defaultSize={32} minSize={30}>
							<ScrollArea className=" overflow-auto h-full px-4 py-2">
								{status === 'loading' ? (
									// Skeleton loading state
									<>
										{Array(5)
											.fill(0)
											.map((_, index) => (
												<div key={index} className="mb-4">
													<Card className="border-t-0 border-x-0 border-b shadow-none rounded-none">
														<CardContent className="p-2 flex justify-between items-start">
															<div className="flex-1">
																<Skeleton className="h-6 w-3/4 mb-2" />
																<Skeleton className="h-4 w-1/4" />
															</div>
															<div className="flex flex-col items-end gap-1 ml-4">
																<Skeleton className="h-4 w-16 mb-1" />
																<Skeleton className="h-5 w-20" />
															</div>
														</CardContent>
													</Card>
												</div>
											))}
									</>
								) : (
									// Actual news content
									queryData?.results.map((wire, index) => (
										<div key={index} onClick={() => setShowContent(true)}>
											<Card
												key={wire.id}
												className="border-t-0 border-x-0 border-b shadow-none rounded-none"
											>
												<CardContent className="p-2 flex justify-between items-start">
													<div className="flex-1">
														<h3 className="text-sm font-semibold">
															{wire.content.headline}
														</h3>
														<p className="text-sm text-gray-500">
															{wire.content.subhead}
														</p>
													</div>
													<div className="flex flex-col items-end gap-1 ml-4">
														<div className="text-sm text-gray-500 text-right">
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<>
																			{wire.content.firstVersion
																				? formatTimestamp(
																						wire.content.firstVersion,
																					)[0]
																				: ''}
																		</>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>
																			{wire.content.firstVersion
																				? formatTimestamp(
																						wire.content.firstVersion,
																					)[1]
																				: ''}
																		</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</div>
														<Badge>{wire.supplier}</Badge>
														<div className="text-sm text-gray-500 text-right"></div>
													</div>
												</CardContent>
											</Card>
										</div>
									))
								)}
							</ScrollArea>
						</ResizablePanel>
						{showContent && (
							<>
								<ResizableHandle withHandle />
								<ResizablePanel defaultSize={48} minSize={30}>
									<div className="h-full flex flex-col p-4">
										{status === 'loading' ? (
											// Skeleton loading state for article content
											<>
												<div className="mb-4">
													<div>
														<Skeleton className="h-10 w-4/5 mb-3" />
														<Skeleton className="h-5 w-3/5 mb-2" />
													</div>
												</div>
												<ScrollArea className="flex-1">
													<div className="space-y-4">
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-3/4" />
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-5/6" />
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-full" />
														<Skeleton className="h-4 w-2/3" />
													</div>
												</ScrollArea>
											</>
										) : (
											// Actual article content
											<>
												<div className="mb-4 flex justify-between items-center">
													<div>
														<h2 className="text-2xl font-bold">
															Article Title
														</h2>
														<p className="text-sm text-gray-500">
															Source • Category • Timestamp
														</p>
													</div>
													<div className="flex space-x-1">
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button variant="ghost" size="icon">
																		<Bookmark className="h-5 w-5" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Bookmark article</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>

														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => setShowContent(false)}
																	>
																		<X className="h-5 w-5" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Close article</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
												</div>

												<div className="bg-gray-100 w-full h-48 mb-4 rounded-md flex items-center justify-center">
													<p className="text-gray-400">Article Image</p>
												</div>

												<ScrollArea className="flex-1">
													<div className="space-y-4">
														<p>
															Lorem ipsum dolor sit amet, consectetur adipiscing
															elit, sed do eiusmod tempor incididunt ut labore
															et dolore magna aliqua. Ut enim ad minim veniam,
															quis nostrud exercitation ullamco laboris nisi ut
															aliquip ex ea commodo consequat. Duis aute irure
															dolor in reprehenderit in voluptate velit esse
															cillum dolore eu fugiat nulla pariatur. Excepteur
															sint occaecat cupidatat non proident, sunt in
															culpa qui officia deserunt mollit anim id est
															laborum.
														</p>
														<p>
															Sed ut perspiciatis unde omnis iste natus error
															sit voluptatem accusantium doloremque laudantium,
															totam rem aperiam, eaque ipsa quae ab illo
															inventore veritatis et quasi architecto beatae
															vitae dicta sunt explicabo.
														</p>
													</div>
												</ScrollArea>
											</>
										)}
									</div>
								</ResizablePanel>
							</>
						)}
					</ResizablePanelGroup>
				</div>
			</div>
		</Layout>
	);
}
