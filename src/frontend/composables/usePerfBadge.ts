import { onMounted, reactive, ref } from 'vue';

export type VitalRating = 'good' | 'needs-improvement' | 'poor';
export type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export type VitalEntry = {
	value: number;
	rating: VitalRating;
};

export type Vitals = Record<VitalName, VitalEntry | null>;

const initialVitals = (): Vitals => ({
	LCP: null,
	INP: null,
	CLS: null,
	FCP: null,
	TTFB: null
});

export type PerfBadgeOptions = {
	frameworkVersion: string;
};

export const usePerfBadge = (options: PerfBadgeOptions) => {
	const vitals = reactive<Vitals>(initialVitals());
	const hydrationMs = ref<number | null>(null);
	const ready = ref(false);
	const mode = ref<'dev' | 'prod'>('prod');
	const islandCount = ref(0);

	onMounted(async () => {
		hydrationMs.value = Math.round(performance.now());
		mode.value =
			typeof window !== 'undefined' && Boolean(window.__HMR_FRAMEWORK__)
				? 'dev'
				: 'prod';

		try {
			const claimed = (
				window as unknown as {
					__ABS_CLAIMED_ISLAND_MARKUP__?: Map<string, number>;
				}
			).__ABS_CLAIMED_ISLAND_MARKUP__;
			if (claimed && typeof claimed.size === 'number') {
				islandCount.value = claimed.size;
			}
		} catch {
			islandCount.value = 0;
		}

		ready.value = true;

		try {
			const wv = await import('web-vitals');
			wv.onLCP(
				(m) => {
					vitals.LCP = { value: m.value, rating: m.rating };
				},
				{ reportAllChanges: true }
			);
			wv.onINP(
				(m) => {
					vitals.INP = { value: m.value, rating: m.rating };
				},
				{ reportAllChanges: true }
			);
			wv.onCLS(
				(m) => {
					vitals.CLS = { value: m.value, rating: m.rating };
				},
				{ reportAllChanges: true }
			);
			wv.onFCP((m) => {
				vitals.FCP = { value: m.value, rating: m.rating };
			});
			wv.onTTFB((m) => {
				vitals.TTFB = { value: m.value, rating: m.rating };
			});
		} catch (err) {
			console.warn('[PerfBadge] failed to load web-vitals', err);
		}
	});

	return {
		vitals,
		hydrationMs,
		ready,
		mode,
		islandCount,
		frameworkVersion: options.frameworkVersion
	};
};

export const formatVital = (name: VitalName, entry: VitalEntry | null): string => {
	if (!entry) return '—';
	const v = entry.value;
	if (name === 'CLS') {
		return v.toFixed(2);
	}
	if (v >= 1000) {
		return `${(v / 1000).toFixed(2)} s`;
	}
	return `${Math.round(v)} ms`;
};
