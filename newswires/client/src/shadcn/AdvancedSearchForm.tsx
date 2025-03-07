import {Button} from "../../components/ui/button.tsx";
import {Input} from "../../components/ui/input.tsx";
import {Separator} from "../../components/ui/separator.tsx";
import {ToggleGroup, ToggleGroupItem} from "../../components/ui/toggle-group.tsx";

const supplierOptions = ['All', 'Reuters', 'AP', 'APP', 'AFP', 'PA', 'Comet']

export const AdvancedSearchForm = ({ className = '' }: { className?: string}) => {
    return (
        <form className={`px-4 py-2 ${className}`}>
            <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">Search</legend>
                <div className="!mt-0">
                    <label htmlFor="searchTerm" className="text-sm font-medium">
                        Search term
                    </label>
                    <Input
                        type="text"
                        id="searchTerm"
                        placeholder="Search term to search by"
                        className="mt-1"
                    />
                </div>
                <div>
                    <label htmlFor="source" className="text-sm font-medium">
                        Suppliers
                    </label>
                    <div className="flex gap-2 mt-1">
                        <ToggleGroup type="multiple">
                            {supplierOptions.map(_ => (<ToggleGroupItem value={_} aria-label="Toggle bold">
                                {_}
                            </ToggleGroupItem>))}
                        </ToggleGroup>
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
                        placeholder="Enter keywords to search by"
                        className="mt-1"
                    />
                </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border p-4 mt-6">
                <legend className="-ml-1 px-1 text-sm font-medium">Presets</legend>

                <div className="!mt-0">
                    <label className="text-sm font-medium">
                        Save Search Preset
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