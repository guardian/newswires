import { Bell, Bookmark, Filter, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Layout } from './shadcn/Layout.tsx';
import { Badge } from "../components/ui/badge"

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
	const [newsFeed, setNewsFeed] = useState(sampleNews);
	const [search, setSearch] = useState('');

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
			<div className="p-6 max-w-4xl mx-auto">
				<div className="flex items-center gap-4 mb-4">
					<Input
						className="bg-white"
						placeholder="Search news..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<Button variant="outline">
						<Filter className="w-5 h-5" />
					</Button>
					<Button variant="outline">
						<Bell className="w-5 h-5" />
					</Button>
					<Button variant="outline" onClick={() => setNewsFeed(sampleNews)}>
						<RefreshCw className="w-5 h-5" />
					</Button>
				</div>

				<Tabs defaultValue="all">
					<TabsList className="mb-4">
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="business">Reuters World</TabsTrigger>
						<TabsTrigger value="politics">AP World</TabsTrigger>
						<TabsTrigger value="technology">AAP World</TabsTrigger>
					</TabsList>

					<ScrollArea className="h-[500px] border rounded-lg p-4 bg-white">
						{newsFeed
							.filter((news) =>
								news.title.toLowerCase().includes(search.toLowerCase()),
							)
							.map((news) => (
								<Card
									key={news.id}
									className="border-t-0 border-x-0 border-b shadow-none rounded-none"
								>
									<CardContent className="p-2 flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-lg font-semibold">{news.title}</h3>
											<p className="text-sm text-gray-500">{news.category}</p>
										</div>
										<div className="flex flex-col items-end gap-1 ml-4">
											<div className="text-sm text-gray-500 text-right">
												{news.timestamp}
											</div>
											<Badge>{news.source}</Badge>
											<div className="text-sm text-gray-500 text-right">
												
											</div>
										</div>
									</CardContent>
								</Card>
							))}
					</ScrollArea>
				</Tabs>
			</div>
		</Layout>
	);
}
