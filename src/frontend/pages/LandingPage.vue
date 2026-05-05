<script setup lang="ts">
import PerfBadge from '../components/PerfBadge.vue';

defineProps<{
	demoBoardId: string;
	frameworkVersion: string;
}>();
</script>

<template>
	<div class="relative isolate min-h-screen w-full overflow-hidden">
		<header
			class="glass sticky top-0 z-30 mx-4 mt-4 flex items-center justify-between rounded-2xl px-6 py-4 md:mx-10"
		>
			<a
				href="/"
				class="flex items-center gap-2 text-lg font-semibold tracking-tight"
			>
				<span
					class="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-flow-500 via-glow-500 to-mint-500 shadow-glow"
				>
					<span class="text-sm font-black text-ink-950">A</span>
				</span>
				<span class="text-gradient">AbsoluteFlow</span>
			</a>
			<nav class="flex items-center gap-7 text-sm text-ink-300">
				<a class="transition hover:text-ink-50" href="#features">Features</a>
				<a class="transition hover:text-ink-50" href="#stack">Stack</a>
				<a
					:href="`/board/${demoBoardId}`"
					class="rounded-lg bg-flow-500 px-4 py-2 font-medium text-white shadow-lg shadow-flow-500/30 transition hover:bg-flow-400 hover:shadow-flow-400/40"
				>
					Open the board
				</a>
			</nav>
		</header>

		<main class="relative mx-auto max-w-6xl px-6 pt-20 pb-32 md:pt-32">
			<div
				class="absolute inset-x-0 -top-24 -z-10 mx-auto h-[420px] max-w-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(168,85,247,0.35),transparent_70%)] blur-2xl"
			/>

			<section class="text-center">
				<div
					class="glass mx-auto mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-ink-300"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-mint-400" />
					AbsoluteJS · Vue 3 · Drizzle · Postgres
				</div>
				<h1
					class="text-gradient text-5xl leading-[1.05] font-black tracking-tight md:text-7xl"
				>
					Kanban that<br />never breaks flow.
				</h1>
				<p
					class="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-300 md:text-xl"
				>
					Server-rendered by AbsoluteJS, hydrated by Vue 3 — Composition API,
					drag-and-drop, layout transitions, optimistic persistence on
					Drizzle + Postgres. Refresh and your board is right where you left
					it.
				</p>
				<div class="mt-12 flex flex-wrap items-center justify-center gap-4">
					<a
						:href="`/board/${demoBoardId}`"
						class="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-flow-500 to-glow-500 px-7 py-3.5 text-base font-semibold text-white shadow-glow transition hover:scale-[1.02] hover:shadow-flow-400/50"
					>
						Try the live board
						<svg
							class="h-4 w-4 transition group-hover:translate-x-1"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M3 8h10m0 0L8 3m5 5l-5 5"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
					<a
						href="https://absolutejs.com"
						target="_blank"
						rel="noopener"
						class="glass rounded-xl px-6 py-3.5 text-base font-medium text-ink-100 transition hover:bg-white/8"
					>
						About AbsoluteJS
					</a>
				</div>

				<div class="mt-16 flex items-center justify-center gap-10 text-ink-400">
					<div class="flex items-center gap-2 text-sm">
						<span class="h-2 w-2 rounded-full bg-mint-500" />
						SSR everywhere
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span class="h-2 w-2 rounded-full bg-flow-500" />
						Vue 3 Composition API
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span class="h-2 w-2 rounded-full bg-glow-500" />
						Drizzle + Postgres
					</div>
				</div>
			</section>

			<section
				id="features"
				class="mt-32 grid gap-6 md:grid-cols-3"
			>
				<article
					class="glass group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-card"
				>
					<div
						class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-flow-500/15 text-flow-400 ring-1 ring-flow-500/30"
					>
						<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none">
							<path
								d="M4 6h16M4 12h10M4 18h16"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-ink-50">
						Server-first rendering
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-300">
						AbsoluteJS streams every route as fully-rendered HTML. Vue picks up
						client-side to make the board reactive, with no client-side router
						and no waterfalls.
					</p>
				</article>

				<article
					class="glass group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-card"
				>
					<div
						class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-glow-500/15 text-glow-400 ring-1 ring-glow-500/30"
					>
						<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none">
							<path
								d="M7 4h10v6l4 4-7 7-7-7 4-4V4z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-ink-50">
						Drag-and-drop, animated
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-300">
						Vue
						<code
							class="mx-0.5 rounded bg-ink-800/80 px-1.5 py-0.5 text-[0.78em] text-glow-400"
							>&lt;TransitionGroup&gt;</code
						>
						handles the FLIP, vue-draggable-plus handles the input — flawless
						motion, never out of sync.
					</p>
				</article>

				<article
					class="glass group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-card"
				>
					<div
						class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint-500/15 text-mint-400 ring-1 ring-mint-500/30"
					>
						<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none">
							<path
								d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-ink-50">
						Optimistic, persistent
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-300">
						Every move PATCHes Postgres through Drizzle in the background while
						the UI moves first. Refresh and your board is exactly where you
						left it.
					</p>
				</article>
			</section>

			<section id="stack" class="mt-32">
				<div class="glass-strong rounded-3xl p-8 md:p-12">
					<div
						class="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"
					>
						<div class="max-w-xl">
							<h2
								class="text-3xl font-bold tracking-tight text-ink-50 md:text-4xl"
							>
								Built on a stack that gets out of the way.
							</h2>
							<p class="mt-4 text-base leading-relaxed text-ink-300">
								Bun for the runtime, Elysia for the routes, AbsoluteJS for the
								island choreography, Vue 3 for the surface, Drizzle on top of
								Postgres for the durable state.
							</p>
						</div>
						<a
							:href="`/board/${demoBoardId}`"
							class="inline-flex items-center gap-2 rounded-xl bg-ink-50 px-6 py-3 text-base font-semibold text-ink-950 shadow-card transition hover:bg-white"
						>
							Open the board →
						</a>
					</div>
				</div>
			</section>
		</main>

		<footer
			class="border-t border-white/5 py-8 text-center text-sm text-ink-500"
		>
			AbsoluteFlow · a flagship demo for AbsoluteJS Island Architecture
		</footer>

		<PerfBadge
			page-name="LandingPage"
			:framework-version="$props.frameworkVersion"
		/>
	</div>
</template>
