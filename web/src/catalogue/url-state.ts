// Pure URLSearchParams edits shared by the filter controls. Any filter change returns to page 1.

import { formatRange, PARAM, type Range } from "./filters";

function next(
	params: URLSearchParams,
	edit: (p: URLSearchParams) => void,
): URLSearchParams {
	const p = new URLSearchParams(params);
	edit(p);
	p.delete(PARAM.page);
	return p;
}

export function toggleOption(
	params: URLSearchParams,
	id: string,
	value: string,
): URLSearchParams {
	return next(params, (p) => {
		const values = p.getAll(id);
		p.delete(id);
		const updated = values.includes(value)
			? values.filter((v) => v !== value)
			: [...values, value];
		for (const v of updated) p.append(id, v);
	});
}

export function setRange(
	params: URLSearchParams,
	id: string,
	range: Range | null,
): URLSearchParams {
	return next(params, (p) => {
		if (range && (range.min != null || range.max != null))
			p.set(id, formatRange(range));
		else p.delete(id);
	});
}

export function setFlag(
	params: URLSearchParams,
	id: string,
	on: boolean,
): URLSearchParams {
	return next(params, (p) => (on ? p.set(id, "1") : p.delete(id)));
}

export function setParam(
	params: URLSearchParams,
	id: string,
	value: string | null,
): URLSearchParams {
	return next(params, (p) => (value ? p.set(id, value) : p.delete(id)));
}

export function clearFilters(params: URLSearchParams): URLSearchParams {
	const p = new URLSearchParams();
	const sort = params.get(PARAM.sort);
	if (sort) p.set(PARAM.sort, sort);
	return p;
}

export function withPage(
	params: URLSearchParams,
	page: number,
): URLSearchParams {
	const p = new URLSearchParams(params);
	if (page > 1) p.set(PARAM.page, String(page));
	else p.delete(PARAM.page);
	return p;
}

export function toHref(params: URLSearchParams, pathname = "/"): string {
	const qs = params.toString();
	return qs ? `${pathname}?${qs}` : pathname;
}
