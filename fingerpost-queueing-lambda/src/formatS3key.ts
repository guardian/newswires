export function formatS3Key(externalId: string): string {
    return externalId.replace(/\s+/g, '-').replace(/\//g, '-').concat('.json');
} 