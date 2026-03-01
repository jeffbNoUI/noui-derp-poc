/**
 * Product Connector interface — defines the abstraction for multi-product architecture.
 *
 * COPERA administers multiple "products" (pension divisions, PERACare, PERAPlus, DC plans).
 * This interface defines how each product connects to the composition layer, enabling
 * the same workspace infrastructure to serve any product by plugging in a new connector.
 *
 * Architecture alignment with COPERA Target State (RMD-003.01):
 *   Experience Layer  → NoUI Frontend (React, AI-composed workspaces)
 *   Composition Layer → This service (Claude Messages API + deterministic fallback)
 *   Services Layer    → Product Connectors (this interface) → Rules Engine + Data Connectors
 *   Data Layer        → Legacy IBM i (MDPMBMR0, DCPSTMR0, etc.) + future Workday
 *
 * Adding a new product (e.g., PERAPlus DC plan, PERACare health benefits) requires:
 *   1. Implement this interface for the new product
 *   2. Register it in the product registry
 *   3. Add product-specific components to the frontend
 *   4. Update the composition system prompt with product rules
 *
 * The composition engine uses the product connector to fetch data and calculations,
 * then composes a workspace from the product's available components.
 *
 * Consumed by: compose.ts (product-aware composition), future product registrations
 * Depends on: types.ts (WorkspaceSpec, ComposeRequest)
 */

// ─── Product Connector Interface ────────────────────────────────────────

export interface ProductConnector {
  /** Unique product identifier (e.g., "pera-pension", "dps-pension", "peracare", "peraplus") */
  readonly productId: string

  /** Human-readable product name */
  readonly productName: string

  /** Division codes this product serves (empty = all divisions) */
  readonly divisions: string[]

  /** Available component IDs for this product's workspace */
  readonly availableComponents: string[]

  /** Fetch member data specific to this product */
  fetchMemberData(memberId: string): Promise<ProductMemberData>

  /** Fetch calculations specific to this product (if applicable) */
  fetchCalculations?(memberId: string, params: Record<string, unknown>): Promise<ProductCalculationResult>

  /** Get product-specific composition rules (appended to system prompt) */
  getCompositionRules(): string

  /** Get product-specific knowledge entries for the knowledge sidebar */
  getKnowledgeEntries(): ProductKnowledgeEntry[]
}

// ─── Product Data Types ─────────────────────────────────────────────────

export interface ProductMemberData {
  /** Product enrollment status */
  enrolled: boolean
  /** Product-specific member attributes */
  attributes: Record<string, unknown>
  /** Data source metadata (for data quality awareness) */
  source: {
    system: string        // "IBM i", "Workday", "PeopleSoft"
    table: string         // e.g., "MDPMBMR0", "DPPMBMR0"
    last_sync: string     // ISO timestamp
    quality_score?: number // 0-100 data quality assessment
  }
}

export interface ProductCalculationResult {
  /** Calculation type identifier */
  calculation_type: string
  /** Calculation results (product-specific structure) */
  results: Record<string, unknown>
  /** Audit trail entries */
  audit_trail: { rule_id: string; description: string; result: string; source_reference?: string }[]
}

export interface ProductKnowledgeEntry {
  id: string
  title: string
  provision: string
  citation: string
  keywords: string[]
}

// ─── Product Registry ───────────────────────────────────────────────────

const productRegistry = new Map<string, ProductConnector>()

/** Register a product connector. */
export function registerProduct(connector: ProductConnector): void {
  productRegistry.set(connector.productId, connector)
}

/** Get a registered product connector by ID. */
export function getProduct(productId: string): ProductConnector | undefined {
  return productRegistry.get(productId)
}

/** Get all registered product connectors. */
export function getAllProducts(): ProductConnector[] {
  return Array.from(productRegistry.values())
}

/** Get products applicable to a specific division. */
export function getProductsForDivision(division: string): ProductConnector[] {
  return getAllProducts().filter(
    p => p.divisions.length === 0 || p.divisions.includes(division)
  )
}

// ─── COPERA Pension Connector (reference implementation) ────────────────

/**
 * COPERA Defined Benefit Pension connector — the first concrete implementation.
 * Covers all 5 divisions (State, School, LocalGov, Judicial, DPS) with
 * 16 HAS tables, anti-spiking, and division-specific benefit options.
 */
export const coperaPensionConnector: ProductConnector = {
  productId: 'copera-pension',
  productName: 'COPERA Defined Benefit Pension',
  divisions: ['State', 'School', 'LocalGov', 'Judicial', 'DPS'],

  availableComponents: [
    'member-banner',
    'alert-bar',
    'employment-timeline',
    'salary-table',
    'service-credit-summary',
    'anti-spiking-detail',
    'eligibility-panel',
    'benefit-calculation',
    'early-retirement-reduction',
    'payment-options',
    'scenario-modeler',
    'annual-increase',
    'dro-impact',
  ],

  async fetchMemberData(memberId: string): Promise<ProductMemberData> {
    // In production, this would call the connector service
    return {
      enrolled: true,
      attributes: { member_id: memberId },
      source: {
        system: 'IBM i',
        table: 'MDPMBMR0',  // or DPPMBMR0 for DPS
        last_sync: new Date().toISOString(),
        quality_score: 85,
      },
    }
  },

  getCompositionRules(): string {
    return `
## COPERA Pension — Product-Specific Rules
- Anti-spiking (108% cascading salary cap) applies to all HAS window calculations
- DPS members use Options A/B/P2/P3 (with pop-up feature); PERA members use Options 1/2/3
- Annual increase: 1.5% compound (pre-2011 eligible) or 1.0% compound (post-SB 18-200)
- Purchased service excluded from Rule of N (80/85/88/90) and vesting
- HAS window: 36 months (vested before 1/1/2020) or 60 months (unvested as of 1/1/2020)
`
  },

  getKnowledgeEntries(): ProductKnowledgeEntry[] {
    return [
      {
        id: 'copera-benefit-formula',
        title: 'COPERA Benefit Formula',
        provision: 'HAS × 2.5% × Years of Service × Reduction Factor',
        citation: 'C.R.S. §24-51-603',
        keywords: ['benefit', 'formula', 'calculation', 'has', 'multiplier'],
      },
      {
        id: 'copera-anti-spiking',
        title: 'Anti-Spiking Salary Cap',
        provision: 'Each year capped at 108% of prior year (base year method)',
        citation: 'C.R.S. §24-51-101(25.5)',
        keywords: ['anti-spiking', 'salary cap', '108%'],
      },
      {
        id: 'copera-annual-increase',
        title: 'Annual Increase',
        provision: 'Compound annual increase: 1.0% (post-SB 18-200) or 1.5% (pre-reform)',
        citation: 'C.R.S. §24-51-1001 through §24-51-1009',
        keywords: ['annual increase', 'cola', 'compound'],
      },
    ]
  },
}

// ─── Future Product Stubs (architecture demonstration) ──────────────────

/**
 * PERACare Health Benefits — future product connector stub.
 * Demonstrates the extensibility of the multi-product architecture.
 * Would connect to health plan enrollment and premium subsidy systems.
 */
export const peracareConnectorStub: ProductConnector = {
  productId: 'peracare',
  productName: 'PERACare Health Benefits',
  divisions: ['State', 'School', 'LocalGov', 'Judicial'],  // Not DPS

  availableComponents: [
    'peracare-enrollment',
    'peracare-premium-subsidy',
    'peracare-plan-comparison',
    'peracare-coverage-timeline',
  ],

  async fetchMemberData(memberId: string): Promise<ProductMemberData> {
    return {
      enrolled: false,
      attributes: { member_id: memberId },
      source: { system: 'PERACare', table: 'HEALTH_ENROLLMENT', last_sync: new Date().toISOString() },
    }
  },

  getCompositionRules(): string {
    return `
## PERACare — Product-Specific Rules
- Premium subsidy based on years of service credit at retirement
- Medicare coordination required at age 65
- Open enrollment periods: October annually
- DPS members not eligible for PERACare (separate health plan)
`
  },

  getKnowledgeEntries(): ProductKnowledgeEntry[] {
    return [{
      id: 'peracare-subsidy',
      title: 'PERACare Premium Subsidy',
      provision: 'Subsidy based on years of service credit',
      citation: 'C.R.S. §24-51-1201+',
      keywords: ['peracare', 'health', 'premium', 'subsidy'],
    }]
  },
}

/**
 * PERAPlus 401(k)/457 Defined Contribution — future product connector stub.
 */
export const peraplusConnectorStub: ProductConnector = {
  productId: 'peraplus',
  productName: 'PERAPlus 401(k)/457 Plan',
  divisions: [],  // All divisions

  availableComponents: [
    'peraplus-balance',
    'peraplus-contributions',
    'peraplus-investment-mix',
    'peraplus-distribution-options',
  ],

  async fetchMemberData(memberId: string): Promise<ProductMemberData> {
    return {
      enrolled: false,
      attributes: { member_id: memberId },
      source: { system: 'PERAPlus', table: 'DC_ACCOUNTS', last_sync: new Date().toISOString() },
    }
  },

  getCompositionRules(): string {
    return `
## PERAPlus — Product-Specific Rules
- Voluntary defined contribution (401k and 457)
- Employee contributions only (no employer match for PERAPlus)
- Distribution at separation or retirement
- Rollover eligible
`
  },

  getKnowledgeEntries(): ProductKnowledgeEntry[] {
    return [{
      id: 'peraplus-overview',
      title: 'PERAPlus Defined Contribution',
      provision: 'Voluntary 401(k)/457 plan for additional retirement savings',
      citation: 'C.R.S. §24-51-1401+',
      keywords: ['peraplus', '401k', '457', 'defined contribution'],
    }]
  },
}

// ─── Register default products ──────────────────────────────────────────

registerProduct(coperaPensionConnector)
// Future: registerProduct(peracareConnectorStub)
// Future: registerProduct(peraplusConnectorStub)
