import { formatS3Key } from "./formatS3key";

describe('formatS3Key', () => {
    it('should format the S3 key with the external ID and .json extension', () => {
        const externalId = 'test-external-id';
        const expectedKey = 'test-external-id.json';
        expect(formatS3Key(externalId)).toBe(expectedKey);
    });
    it('should replace spaces with a hyphen', () => {
        const externalId = 'test external id';
        const expectedKey = 'test-external-id.json';
        expect(formatS3Key(externalId)).toBe(expectedKey);
    });
    it('should replace forward slashes with a hyphen', () => {
        const externalId = 'test/external/id';
        const expectedKey = 'test-external-id.json';
        expect(formatS3Key(externalId)).toBe(expectedKey);
    })
});;