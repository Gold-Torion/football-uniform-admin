/**
 * Listing field enums aligned with Eduardo's signed meeting decisions.
 * Used by mobile dropdowns, backend validation, and Algolia indexing.
 */

export type ListingKind = 'TIME' | 'SELECAO';

export type Continent = 'AMERICA' | 'EUROPA' | 'ASIA' | 'AFRICA' | 'OCEANIA';

export type Supplier =
  | 'ADIDAS'
  | 'NIKE'
  | 'PUMA'
  | 'UMBRO'
  | 'KAPPA'
  | 'LE_COQ_SPORTIF'
  | 'NEW_BALANCE'
  | 'UNDER_ARMOUR'
  | 'PENALTY'
  | 'TOPPER'
  | 'REUSCH'
  | 'LOTTO'
  | 'OUTRO';

/** Suppliers that publish SKU codes verifiable by the platform. */
export const SUPPLIERS_WITH_SKU: ReadonlySet<Supplier> = new Set([
  'ADIDAS',
  'NIKE',
  'PUMA',
]);

export type Model =
  | 'TITULAR'
  | 'RESERVA'
  | 'TERCEIRA'
  | 'GOLEIRO'
  | 'TREINO'
  | 'COMEMORATIVA';

export type GarmentType = 'LOJA' | 'JOGO';

export type Size = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XGG' | '2XGG' | '3XGG';

export type Condition =
  | 'COM_ETIQUETA'
  | 'PERFEITA'
  | 'EXCELENTE'
  | 'BOA'
  | 'REGULAR'
  | 'DESGASTADA';

/** Public-facing description for each Condition value. */
export const CONDITION_LABELS: Record<Condition, string> = {
  COM_ETIQUETA: 'Nova com etiqueta de fábrica',
  PERFEITA: 'Nova ou como nova, sem uso aparente',
  EXCELENTE: 'Pouquíssimo uso, sem defeitos visíveis',
  BOA: 'Uso moderado, pequenos sinais',
  REGULAR: 'Sinais de uso evidentes',
  DESGASTADA: 'Muito usada, possíveis defeitos',
};

export type Gender = 'MASCULINO' | 'FEMININO';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'REMOVED';

/** Eduardo's contracted price filter range. */
export const PRICE_FILTER = { minCents: 9_900, maxCents: 500_000 } as const;

/** Eduardo's contracted listing-cap. */
export const ACTIVE_LISTINGS_CAP = 20;

/** Eduardo's contracted Minha Primeira Camisa per-user purchase cap. */
export const MPC_PURCHASE_CAP = 5;

/** MPC item price target. */
export const MPC_PRICE_CENTS = 14_900;
