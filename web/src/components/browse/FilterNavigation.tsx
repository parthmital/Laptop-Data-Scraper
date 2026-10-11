"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
	createContext,
	use,
	useCallback,
	useMemo,
	useOptimistic,
	useTransition,
} from "react";

import { toHref } from "@/catalogue/url-state";

interface FilterNavigationValue {
	/** The URL state, updated optimistically so controls respond before the server does. */
	params: URLSearchParams;
	navigate: (params: URLSearchParams) => void;
	pending: boolean;
}

const FilterNavigationContext = createContext<FilterNavigationValue | null>(
	null,
);

export function useFilterNavigation(): FilterNavigationValue {
	const value = use(FilterNavigationContext);
	if (!value)
		throw new Error("useFilterNavigation must be used inside FilterNavigation");
	return value;
}

export function FilterNavigation({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const current = useMemo(
		() => new URLSearchParams(searchParams.toString()),
		[searchParams],
	);
	const [params, setOptimisticParams] = useOptimistic(current);
	const [pending, startTransition] = useTransition();

	const navigate = useCallback(
		(next: URLSearchParams) =>
			startTransition(() => {
				setOptimisticParams(next);
				router.replace(toHref(next), { scroll: false });
			}),
		[router, setOptimisticParams],
	);

	const value = useMemo(
		() => ({ params, navigate, pending }),
		[params, navigate, pending],
	);
	return (
		<FilterNavigationContext value={value}>
			<div
				className={className}
				data-pending={pending || undefined}
				aria-busy={pending}
			>
				{children}
			</div>
		</FilterNavigationContext>
	);
}
