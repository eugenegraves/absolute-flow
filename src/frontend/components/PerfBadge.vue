<script setup lang="ts">
import { computed, ref } from 'vue';
import {
	formatVital,
	usePerfBadge,
	type VitalName,
	type VitalRating
} from '../composables/usePerfBadge';

const props = defineProps<{
	pageName: string;
	frameworkVersion: string;
}>();

const expanded = ref(true);

const { vitals, hydrationMs, ready, mode } = usePerfBadge({
	frameworkVersion: props.frameworkVersion
});

const ratingColor = (rating: VitalRating | undefined): string => {
	if (rating === 'good') return 'text-mint-400';
	if (rating === 'needs-improvement') return 'text-amber-400';
	if (rating === 'poor') return 'text-rose-400';
	return 'text-ink-500';
};

const ratingDot = (rating: VitalRating | undefined): string => {
	if (rating === 'good') return 'bg-mint-400';
	if (rating === 'needs-improvement') return 'bg-amber-400';
	if (rating === 'poor') return 'bg-rose-400';
	return 'bg-ink-600';
};

const vitalOrder: VitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

const summaryMetric = computed(() => {
	for (const name of vitalOrder) {
		const entry = vitals[name];
		if (entry) return { name, entry };
	}
	return null;
});

const toggle = () => {
	expanded.value = !expanded.value;
};

const formatHydration = (ms: number | null): string => {
	if (ms === null) return '—';
	if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
	return `${ms} ms`;
};
</script>

<template>
	<div
		data-perf-badge
		role="status"
		aria-live="polite"
		class="glass-strong fixed right-4 bottom-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-card text-xs"
	>
		<div class="flex items-center gap-2 px-3 py-2.5">
			<img
				src="/assets/png/absolutejs-temp.png"
				alt=""
				aria-hidden="true"
				class="h-7 w-7 shrink-0 object-contain"
			/>
			<div class="flex min-w-0 flex-1 flex-col">
				<div class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
					<span>AbsoluteJS</span>
					<span class="text-ink-600">·</span>
					<span class="truncate text-flow-300 normal-case tracking-normal">
						v{{ frameworkVersion }}
					</span>
				</div>
				<div
					v-if="!expanded && summaryMetric"
					class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-200"
				>
					<span
						class="inline-block h-1.5 w-1.5 rounded-full"
						:class="ratingDot(summaryMetric.entry.rating)"
					/>
					<span class="font-medium uppercase tracking-wide text-ink-400">
						{{ summaryMetric.name }}
					</span>
					<span
						class="font-semibold tabular-nums"
						:class="ratingColor(summaryMetric.entry.rating)"
					>
						{{ formatVital(summaryMetric.name, summaryMetric.entry) }}
					</span>
				</div>
				<div
					v-else-if="!expanded"
					class="mt-0.5 text-[11px] text-ink-500"
				>
					measuring…
				</div>
			</div>
			<button
				type="button"
				data-perf-badge-toggle
				:aria-expanded="expanded"
				aria-label="Toggle performance details"
				class="shrink-0 rounded-md p-1 text-ink-300 transition hover:bg-white/5 hover:text-ink-50"
				@click="toggle"
			>
				<svg
					viewBox="0 0 12 12"
					class="h-3 w-3 transition-transform"
					:class="{ 'rotate-180': !expanded }"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M2 4l4 4 4-4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<Transition name="badge-body">
			<div v-if="expanded">
				<div class="mx-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/5 pt-2 pb-2 text-[11px]">
					<div class="flex items-center gap-1 text-ink-400">
						<span class="text-ink-500 uppercase tracking-wide">Page</span>
						<span class="text-ink-100">{{ pageName }}</span>
					</div>
					<div class="flex items-center gap-1 text-ink-400">
						<span class="text-ink-500 uppercase tracking-wide">Mode</span>
						<span class="text-ink-100">{{ mode }}</span>
					</div>
					<div class="flex items-center gap-1 text-ink-400">
						<span class="inline-flex items-center gap-1 text-mint-400">
							<span class="inline-block h-1.5 w-1.5 rounded-full bg-mint-400" />
							SSR
						</span>
					</div>
					<div class="flex items-center gap-1 text-ink-400">
						<span class="text-ink-500 uppercase tracking-wide">Hydrated</span>
						<span class="text-ink-100 tabular-nums">
							{{ formatHydration(hydrationMs) }}
						</span>
					</div>
				</div>

				<div class="mx-3 mb-3 mt-1 rounded-xl bg-black/20 px-2.5 py-2 ring-1 ring-white/5">
					<div class="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-ink-500">
						<span>Core Web Vitals</span>
						<span v-if="!ready">init</span>
					</div>
					<div class="grid grid-cols-2 gap-x-3 gap-y-1.5">
						<div
							v-for="name in vitalOrder"
							:key="name"
							class="flex items-center justify-between"
						>
							<span class="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
								{{ name }}
							</span>
							<span
								class="flex items-center gap-1.5 tabular-nums"
								:data-vital="name.toLowerCase()"
								:class="ratingColor(vitals[name]?.rating)"
							>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full"
									:class="ratingDot(vitals[name]?.rating)"
								/>
								<span class="font-semibold">
									{{ formatVital(name, vitals[name]) }}
								</span>
							</span>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.badge-body-enter-active,
.badge-body-leave-active {
	transition:
		opacity 200ms ease,
		max-height 220ms ease;
	overflow: hidden;
}
.badge-body-enter-from,
.badge-body-leave-to {
	opacity: 0;
	max-height: 0;
}
.badge-body-enter-to,
.badge-body-leave-from {
	opacity: 1;
	max-height: 240px;
}
</style>
