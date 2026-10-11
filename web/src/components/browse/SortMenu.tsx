"use client";

import { PARAM, SORTS } from "@/catalogue/filters";
import { setParam } from "@/catalogue/url-state";
import { Select } from "@/components/ui/Select";

import { useFilterNavigation } from "./FilterNavigation";

export function SortMenu() {
	const { params, navigate } = useFilterNavigation();
	const value =
		SORTS.find((s) => s.id === params.get(PARAM.sort))?.id ?? SORTS[0].id;
	return (
		<Select
			label="Sort"
			value={value}
			options={SORTS}
			onValueChange={(id) =>
				navigate(setParam(params, PARAM.sort, id === SORTS[0].id ? null : id))
			}
		/>
	);
}
