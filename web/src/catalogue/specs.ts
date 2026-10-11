// The pipeline's 42-field canonical schema (outputs/schema/laptop_schema.json), grouped for display.

export type SpecValue = string | number | boolean | null;

export const SPEC_GROUPS = [
	{
		id: "identity",
		label: "Identity",
		fields: ["brand", "series", "model_number", "part_number"],
	},
	{
		id: "processor",
		label: "Processor",
		fields: [
			"cpu_brand",
			"cpu_family",
			"cpu_model",
			"cpu_cores",
			"cpu_threads",
			"cpu_base_ghz",
			"cpu_boost_ghz",
			"cpu_cache_mb",
			"cpu_tdp_w",
		],
	},
	{
		id: "memory",
		label: "Memory and storage",
		fields: [
			"ram_gb",
			"ram_type",
			"ram_speed_mts",
			"ram_max_gb",
			"storage_gb",
			"storage_type",
		],
	},
	{
		id: "graphics",
		label: "Graphics",
		fields: [
			"gpu_type",
			"gpu_model",
			"gpu_vram_gb",
			"gpu_vram_type",
			"gpu_tgp_w",
		],
	},
	{
		id: "display",
		label: "Display",
		fields: [
			"display_size_in",
			"display_resolution",
			"display_refresh_hz",
			"display_panel",
			"display_brightness_nits",
			"display_color_gamut",
			"touchscreen",
		],
	},
	{
		id: "power",
		label: "Power and build",
		fields: [
			"battery_wh",
			"battery_cells",
			"adapter_w",
			"weight_kg",
			"thickness_mm",
			"cooling",
		],
	},
	{
		id: "features",
		label: "Features and software",
		fields: ["wifi_standard", "backlit_keyboard", "os", "ms_office", "colour"],
	},
] as const;

export type SpecKey = (typeof SPEC_GROUPS)[number]["fields"][number];

export const SPEC_KEYS: readonly SpecKey[] = SPEC_GROUPS.flatMap(
	(g) => g.fields,
);

/** Columns stored as SQLite integers 0/1. */
export const BOOLEAN_SPECS = new Set<SpecKey>([
	"touchscreen",
	"backlit_keyboard",
	"ms_office",
]);

export type Specs = Record<SpecKey, SpecValue>;

interface SpecMeta {
	label: string;
	unit?: string;
}

export const SPEC_META: Record<SpecKey, SpecMeta> = {
	brand: { label: "Brand" },
	series: { label: "Series" },
	model_number: { label: "Model number" },
	part_number: { label: "Part number" },
	cpu_brand: { label: "Processor brand" },
	cpu_family: { label: "Processor family" },
	cpu_model: { label: "Processor model" },
	cpu_cores: { label: "Cores" },
	cpu_threads: { label: "Threads" },
	cpu_base_ghz: { label: "Base clock", unit: "GHz" },
	cpu_boost_ghz: { label: "Boost clock", unit: "GHz" },
	cpu_cache_mb: { label: "Cache", unit: "MB" },
	cpu_tdp_w: { label: "Processor power limit", unit: "W" },
	ram_gb: { label: "RAM", unit: "GB" },
	ram_type: { label: "RAM type" },
	ram_speed_mts: { label: "RAM speed", unit: "MT/s" },
	ram_max_gb: { label: "Maximum RAM", unit: "GB" },
	storage_gb: { label: "Storage", unit: "GB" },
	storage_type: { label: "Storage type" },
	gpu_type: { label: "Graphics type" },
	gpu_model: { label: "Graphics" },
	gpu_vram_gb: { label: "Video memory", unit: "GB" },
	gpu_vram_type: { label: "Video memory type" },
	gpu_tgp_w: { label: "Graphics power (TGP)", unit: "W" },
	display_size_in: { label: "Screen size", unit: "in" },
	display_resolution: { label: "Resolution" },
	display_refresh_hz: { label: "Refresh rate", unit: "Hz" },
	display_panel: { label: "Panel" },
	display_brightness_nits: { label: "Brightness", unit: "nits" },
	display_color_gamut: { label: "Colour gamut" },
	touchscreen: { label: "Touchscreen" },
	battery_wh: { label: "Battery", unit: "Wh" },
	battery_cells: { label: "Battery cells" },
	adapter_w: { label: "Charger", unit: "W" },
	weight_kg: { label: "Weight", unit: "kg" },
	thickness_mm: { label: "Thickness", unit: "mm" },
	cooling: { label: "Cooling" },
	wifi_standard: { label: "Wi-Fi" },
	backlit_keyboard: { label: "Backlit keyboard" },
	os: { label: "Operating system" },
	ms_office: { label: "Microsoft Office included" },
	colour: { label: "Colour" },
};
