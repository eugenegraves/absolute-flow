<script setup lang="ts">
import KanbanBoard from '../components/KanbanBoard.vue';
import PerfBadge from '../components/PerfBadge.vue';
import type { BoardWithChildren } from '../../backend/handlers/boards';

const props = defineProps<{
	board: BoardWithChildren;
	frameworkVersion: string;
}>();
</script>

<template>
	<div class="relative isolate flex min-h-screen w-full flex-col">
		<header
			class="glass sticky top-0 z-30 mx-4 mt-4 flex items-center justify-between rounded-2xl px-5 py-3 md:mx-8"
		>
			<div class="flex items-center gap-3">
				<a
					href="/"
					class="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink-200 transition hover:text-ink-50"
				>
					<span
						class="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-flow-500 via-glow-500 to-mint-500"
					>
						<span class="text-sm font-black text-ink-950">A</span>
					</span>
					AbsoluteFlow
				</a>
				<span class="text-ink-500">/</span>
				<span class="text-sm font-medium text-ink-100">
					{{ props.board.title }}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<span
					class="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-ink-300"
				>
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-400" />
					Live
				</span>
			</div>
		</header>

		<main class="flex flex-1 flex-col px-4 pt-6 pb-10 md:px-8">
			<KanbanBoard :board="props.board" />
		</main>

		<PerfBadge
			page-name="BoardPage"
			:framework-version="props.frameworkVersion"
		/>
	</div>
</template>
