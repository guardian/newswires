import {Button} from "../../components/ui/button.tsx";
import {Input} from "../../components/ui/input.tsx";
import {Separator} from "../../components/ui/separator.tsx";

export const AdvancedSearchForm = () => {
    return (
        <form className="px-4 py-2 max-w-8xl mx-auto">
            <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">Search</legend>
                <div>
                    <label htmlFor="source" className="text-sm font-medium">
                        News Source
                    </label>
                    <div className="flex gap-2 mt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            Reuters
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            AP News
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            Bloomberg
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            AFP
                        </Button>
                    </div>
                </div>

                <div>
                    <label htmlFor="category" className="text-sm font-medium">
                        Category
                    </label>
                    <div className="flex gap-2 mt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            Business
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            Politics
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            Technology
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            General
                        </Button>
                    </div>
                </div>

                <div>
                    <label htmlFor="date-range" className="text-sm font-medium">
                        Date Range
                    </label>
                    <div className="flex gap-2 mt-1">
                        <Input type="date" className="flex-1"/>
                        <span className="flex items-center">to</span>
                        <Input type="date" className="flex-1"/>
                    </div>
                </div>

                <div>
                    <label htmlFor="keywords" className="text-sm font-medium">
                        Keywords
                    </label>
                    <Input
                        type="text"
                        id="keywords"
                        placeholder="Enter keywords to filter by"
                        className="mt-1"
                    />
                </div>

                <Separator/>

                <div>
                    <label className="text-sm font-medium">
                        Save Filter Preset
                    </label>
                    <div className="flex gap-2 mt-1">
                        <Input
                            type="text"
                            placeholder="Enter preset name"
                            className="flex-1"
                        />
                        <Button size="sm">Save</Button>
                    </div>
                </div>
            </fieldset>
        </form>
    );
}