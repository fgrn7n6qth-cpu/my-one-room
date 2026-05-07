export const defaultCatalogItemId = 1

export function isValidCatalogItemId(id) {
  return Number.isInteger(id) && id >= 1 && id <= 52
}
