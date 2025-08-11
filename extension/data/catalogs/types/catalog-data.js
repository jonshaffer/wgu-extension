// Canonical TypeScript types for parsed WGU catalog data
// Note: These are based on our current parser outputs and may evolve.
// Keep JSON Schema in sync (catalog-data.schema.json).
// Type guards (lightweight)
export function isCatalogData(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const v = value;
    return (!!v.courses && typeof v.courses === 'object' &&
        !!v.degreePlans && typeof v.degreePlans === 'object' &&
        !!v.metadata && typeof v.metadata === 'object');
}
