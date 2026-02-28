/**
 * MCP Knowledge Server — exposes DERP plan provisions as searchable MCP resources and tools.
 * Consumed by: Claude Code sessions, AI orchestration layer, any MCP-compatible client.
 * Depends on: YAML rule definition files in rules/definitions/ (the certified plan provisions).
 *
 * Loads all YAML provision files at startup, registers each rule as an MCP resource,
 * and exposes three tools for searching and retrieving provisions by query, ID, or stage.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed file-level metadata from a provision YAML file. */
interface FileMetadata {
  category: string;
  description: string;
  evaluation_order: number;
  rule_count: number;
  governing_authority: string;
  schema_version: string;
  phase?: string;
}

/** A single rule/provision as parsed from YAML. Typed loosely because the
 *  schema is rich and variable — we store the full object for passthrough. */
interface Provision {
  rule_id: string;
  rule_name: string;
  category: string;
  description: string;
  tier_applicability: number[];
  conditions?: unknown[];
  formula?: unknown;
  lookup_table?: unknown;
  result?: unknown;
  source_reference?: {
    document: string;
    section: string;
    verification?: string;
    notes?: string;
    url?: string;
  };
  effective_date?: string | null;
  end_date?: string | null;
  depends_on?: string[];
  assumptions?: unknown[];
  test_cases?: unknown[];
  governance?: unknown;
  // Allow extra fields from extended rule files (e.g. cost_factor_tables)
  [key: string]: unknown;
}

/** A loaded provision file, combining metadata with its rules. */
interface ProvisionFile {
  fileName: string;
  metadata: FileMetadata;
  rules: Provision[];
}

// ---------------------------------------------------------------------------
// Stage-to-category mapping
// ---------------------------------------------------------------------------

/**
 * Maps retirement application stage names to provision categories.
 * A stage may pull from multiple provision categories. This mapping reflects
 * the DERP retirement application workflow stages.
 */
const STAGE_CATEGORY_MAP: Record<string, string[]> = {
  "membership": ["membership"],
  "tier-determination": ["membership"],
  "service-credit": ["service_credit"],
  "service-purchase": ["service_purchase"],
  "eligibility": ["eligibility"],
  "benefit-calculation": ["benefit_calculation"],
  "payment-options": ["payment_options"],
  "dro": ["dro"],
  "supplemental": ["supplemental"],
  "death-survivor": ["death_survivor"],
  "refund": ["refund"],
  "process": ["process"],
  // Composite stages that span multiple categories
  "full-retirement": [
    "membership",
    "service_credit",
    "eligibility",
    "benefit_calculation",
    "payment_options",
    "supplemental",
    "process",
  ],
};

// ---------------------------------------------------------------------------
// Provision loader
// ---------------------------------------------------------------------------

function loadProvisions(rulesDir: string): ProvisionFile[] {
  const files: ProvisionFile[] = [];

  if (!fs.existsSync(rulesDir)) {
    console.error(
      `[mcp-knowledge] Rules directory not found: ${rulesDir}. No provisions loaded.`
    );
    return files;
  }

  const yamlFiles = fs
    .readdirSync(rulesDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .filter((f) => f !== "schema.yaml"); // schema.yaml is the meta-schema, not provisions

  for (const fileName of yamlFiles) {
    const filePath = path.join(rulesDir, fileName);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = yaml.load(content) as Record<string, unknown>;

      if (!parsed || typeof parsed !== "object") {
        console.error(`[mcp-knowledge] Skipping ${fileName}: not a valid YAML object`);
        continue;
      }

      const metadata = parsed.file_metadata as FileMetadata | undefined;
      if (!metadata) {
        console.error(`[mcp-knowledge] Skipping ${fileName}: missing file_metadata`);
        continue;
      }

      const rawRules = parsed.rules as Provision[] | undefined;
      if (!rawRules || !Array.isArray(rawRules)) {
        console.error(`[mcp-knowledge] Skipping ${fileName}: missing or invalid rules array`);
        continue;
      }

      // Ensure each rule has the category from file metadata if not set
      const rules: Provision[] = rawRules.map((r) => ({
        ...r,
        category: r.category || metadata.category,
      }));

      files.push({ fileName, metadata, rules });
    } catch (err) {
      console.error(`[mcp-knowledge] Error loading ${fileName}:`, err);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

/** Case-insensitive substring search across provision title and description. */
function matchesQuery(provision: Provision, query: string): boolean {
  const q = query.toLowerCase();
  const searchableFields = [
    provision.rule_id,
    provision.rule_name,
    provision.description,
    provision.category,
    provision.source_reference?.section ?? "",
    provision.source_reference?.document ?? "",
    provision.source_reference?.notes ?? "",
    ...(provision.tier_applicability ?? []).map((t) => `tier ${t}`),
    ...(provision.depends_on ?? []),
  ];
  return searchableFields.some(
    (field) => typeof field === "string" && field.toLowerCase().includes(q)
  );
}

/** Format a provision into a human-readable text block for tool responses. */
function formatProvision(p: Provision): string {
  const lines: string[] = [];
  lines.push(`# ${p.rule_id}: ${p.rule_name}`);
  lines.push("");
  lines.push(`**Category:** ${p.category}`);
  lines.push(`**Tiers:** ${(p.tier_applicability ?? []).join(", ")}`);
  lines.push("");
  lines.push(`## Description`);
  lines.push(typeof p.description === "string" ? p.description.trim() : "N/A");

  if (p.source_reference) {
    lines.push("");
    lines.push(`## Source Reference`);
    lines.push(`- Document: ${p.source_reference.document}`);
    lines.push(`- Section: ${p.source_reference.section}`);
    if (p.source_reference.verification) {
      lines.push(`- Verification: ${p.source_reference.verification}`);
    }
    if (p.source_reference.notes) {
      lines.push(`- Notes: ${p.source_reference.notes}`);
    }
  }

  if (p.formula) {
    lines.push("");
    lines.push(`## Formula`);
    lines.push("```");
    lines.push(
      typeof p.formula === "object"
        ? yaml.dump(p.formula).trim()
        : String(p.formula)
    );
    lines.push("```");
  }

  if (p.lookup_table) {
    lines.push("");
    lines.push(`## Lookup Table`);
    lines.push("```");
    lines.push(yaml.dump(p.lookup_table).trim());
    lines.push("```");
  }

  if (p.conditions && Array.isArray(p.conditions) && p.conditions.length > 0) {
    lines.push("");
    lines.push(`## Conditions`);
    lines.push("```");
    lines.push(yaml.dump(p.conditions).trim());
    lines.push("```");
  }

  if (p.result) {
    lines.push("");
    lines.push(`## Result`);
    lines.push("```");
    lines.push(yaml.dump(p.result).trim());
    lines.push("```");
  }

  if (p.depends_on && p.depends_on.length > 0) {
    lines.push("");
    lines.push(`## Dependencies`);
    lines.push(p.depends_on.map((d) => `- ${d}`).join("\n"));
  }

  if (p.assumptions && Array.isArray(p.assumptions) && p.assumptions.length > 0) {
    lines.push("");
    lines.push(`## Assumptions`);
    lines.push("```");
    lines.push(yaml.dump(p.assumptions).trim());
    lines.push("```");
  }

  if (p.effective_date) {
    lines.push("");
    lines.push(`**Effective Date:** ${p.effective_date}`);
  }
  if (p.end_date) {
    lines.push(`**End Date:** ${p.end_date}`);
  }

  return lines.join("\n");
}

/** Format a provision as a compact summary for search results. */
function formatProvisionSummary(p: Provision): string {
  const desc =
    typeof p.description === "string"
      ? p.description.trim().substring(0, 200)
      : "N/A";
  const source = p.source_reference
    ? `${p.source_reference.document} ${p.source_reference.section}`
    : "N/A";
  return [
    `**${p.rule_id}**: ${p.rule_name}`,
    `  Category: ${p.category} | Tiers: ${(p.tier_applicability ?? []).join(", ")} | Source: ${source}`,
    `  ${desc}${desc.length >= 200 ? "..." : ""}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Resolve rules directory from env or default relative path
  const rulesDir = path.resolve(
    process.env.RULES_DIR ?? path.join(import.meta.dirname ?? __dirname, "..", "..", "..", "rules", "definitions")
  );

  console.error(`[mcp-knowledge] Loading provisions from: ${rulesDir}`);

  const provisionFiles = loadProvisions(rulesDir);
  const allProvisions: Provision[] = provisionFiles.flatMap((f) => f.rules);

  console.error(
    `[mcp-knowledge] Loaded ${allProvisions.length} provisions from ${provisionFiles.length} files`
  );

  // Build lookup maps
  const provisionById = new Map<string, Provision>();
  for (const p of allProvisions) {
    provisionById.set(p.rule_id, p);
  }

  // Create MCP server
  const server = new McpServer({
    name: "derp-knowledge",
    version: "0.1.0",
  });

  // ---------------------------------------------------------------------------
  // Register MCP resources — one per provision
  // ---------------------------------------------------------------------------
  for (const p of allProvisions) {
    const uri = `derp://provisions/${p.rule_id}`;
    server.resource(
      `${p.rule_id}: ${p.rule_name}`,
      uri,
      {
        description: typeof p.description === "string" ? p.description.trim().substring(0, 300) : undefined,
        mimeType: "text/markdown",
      },
      async () => ({
        contents: [
          {
            uri,
            mimeType: "text/markdown" as const,
            text: formatProvision(p),
          },
        ],
      })
    );
  }

  // Also register a resource for each provision file (category-level overview)
  for (const pf of provisionFiles) {
    const uri = `derp://categories/${pf.metadata.category}`;
    server.resource(
      `Category: ${pf.metadata.category}`,
      uri,
      {
        description: pf.metadata.description,
        mimeType: "text/markdown",
      },
      async () => {
        const lines: string[] = [];
        lines.push(`# ${pf.metadata.category} (${pf.fileName})`);
        lines.push("");
        lines.push(`**Description:** ${pf.metadata.description}`);
        lines.push(`**Evaluation Order:** ${pf.metadata.evaluation_order}`);
        lines.push(`**Rule Count:** ${pf.metadata.rule_count}`);
        lines.push(`**Governing Authority:** ${pf.metadata.governing_authority}`);
        lines.push(`**Schema Version:** ${pf.metadata.schema_version}`);
        if (pf.metadata.phase) {
          lines.push(`**Phase:** ${pf.metadata.phase}`);
        }
        lines.push("");
        lines.push("## Rules in this category");
        lines.push("");
        for (const r of pf.rules) {
          lines.push(`- **${r.rule_id}**: ${r.rule_name}`);
        }
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown" as const,
              text: lines.join("\n"),
            },
          ],
        };
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Tool: search_provisions
  // ---------------------------------------------------------------------------
  server.tool(
    "search_provisions",
    "Search DERP plan provisions by keyword. Searches rule IDs, names, descriptions, source references, tier applicability, and dependencies. Returns matching provisions with summaries.",
    {
      query: z
        .string()
        .describe(
          "Search query — matches against provision titles, descriptions, rule IDs, source references, and categories (case-insensitive)"
        ),
    },
    async ({ query }) => {
      const matches = allProvisions.filter((p) => matchesQuery(p, query));

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No provisions found matching "${query}". Try broader terms like "tier", "eligibility", "benefit", "reduction", "vesting", "DRO", "IPR", "death", "refund", or "process".`,
            },
          ],
        };
      }

      const header = `Found ${matches.length} provision(s) matching "${query}":\n\n`;
      const body = matches.map(formatProvisionSummary).join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: header + body,
          },
        ],
      };
    }
  );

  // ---------------------------------------------------------------------------
  // Tool: get_provision
  // ---------------------------------------------------------------------------
  server.tool(
    "get_provision",
    "Get full details for a specific DERP provision by its rule ID. Returns the complete provision including description, formula, conditions, lookup tables, source reference, assumptions, and dependencies.",
    {
      provision_id: z
        .string()
        .describe(
          "The rule ID (e.g., RULE-VESTING, RULE-BENEFIT-T1, RULE-EARLY-REDUCE-T12). Use search_provisions to find IDs."
        ),
    },
    async ({ provision_id }) => {
      const provision = provisionById.get(provision_id.toUpperCase());

      if (!provision) {
        // Try partial match
        const partialMatches = allProvisions.filter((p) =>
          p.rule_id.toUpperCase().includes(provision_id.toUpperCase())
        );
        if (partialMatches.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Provision "${provision_id}" not found. Did you mean one of these?\n\n${partialMatches.map((p) => `- ${p.rule_id}: ${p.rule_name}`).join("\n")}`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: `Provision "${provision_id}" not found. Available provision IDs:\n\n${allProvisions.map((p) => `- ${p.rule_id}`).join("\n")}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: formatProvision(provision),
          },
        ],
      };
    }
  );

  // ---------------------------------------------------------------------------
  // Tool: get_rules_for_stage
  // ---------------------------------------------------------------------------
  server.tool(
    "get_rules_for_stage",
    "Get all DERP provisions relevant to a retirement application stage. Stages map to one or more provision categories. Available stages: membership, tier-determination, service-credit, service-purchase, eligibility, benefit-calculation, payment-options, dro, supplemental, death-survivor, refund, process, full-retirement.",
    {
      stage: z
        .string()
        .describe(
          'Stage name (e.g., "eligibility", "benefit-calculation", "payment-options", "dro", "process", "full-retirement")'
        ),
    },
    async ({ stage }) => {
      const normalizedStage = stage.toLowerCase().trim();
      const categories = STAGE_CATEGORY_MAP[normalizedStage];

      if (!categories) {
        const availableStages = Object.keys(STAGE_CATEGORY_MAP).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown stage "${stage}". Available stages: ${availableStages}`,
            },
          ],
        };
      }

      const matches = allProvisions.filter((p) =>
        categories.includes(p.category)
      );

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No provisions found for stage "${stage}" (categories: ${categories.join(", ")}).`,
            },
          ],
        };
      }

      const header = `## Provisions for stage: ${stage}\n\nCategories: ${categories.join(", ")} | Count: ${matches.length}\n\n`;
      const body = matches.map(formatProvisionSummary).join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: header + body,
          },
        ],
      };
    }
  );

  // ---------------------------------------------------------------------------
  // Start server
  // ---------------------------------------------------------------------------
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-knowledge] DERP Knowledge MCP server running on stdio");
}

main().catch((err) => {
  console.error("[mcp-knowledge] Fatal error:", err);
  process.exit(1);
});
