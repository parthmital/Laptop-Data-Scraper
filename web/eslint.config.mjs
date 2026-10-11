import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// Retailer images are hotlinked as-is; next/image would copy them through our server.
			"@next/next/no-img-element": "off",
		},
	},
	globalIgnores([".next/**", "next-env.d.ts"]),
]);
