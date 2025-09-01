export function batchedRecords<T>(records: T[], n: number = 10): T[][] {
    return records.reduce<T[][]>((acc, record) => {
        if (acc.length === 0 || acc[acc.length - 1]?.length === n) {
            acc.push([record]);
        } else {
            const lastBatch = acc[acc.length - 1] || [];
            if(lastBatch.length < n) {
                lastBatch.push(record);
            } else {
                acc.push([record]);
            }
        }
        return acc;
    }, [])
}

export function computeOffsets(max: number, batchSize: number): number[] {
    const batches = Math.ceil(max / batchSize);
    return Array.from({ length: batches }, (_, i) => i * batchSize);
}