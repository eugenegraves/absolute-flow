<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { vDraggable } from 'vue-draggable-plus';

type SerializableTask = {
	id: string;
	columnId: string;
	content: string;
	description: string | null;
	orderIndex: number;
};

type SerializableColumn = {
	id: string;
	boardId: string;
	title: string;
	orderIndex: number;
	tasks: SerializableTask[];
};

type SerializableBoard = {
	id: string;
	title: string;
	columns: SerializableColumn[];
};

const props = defineProps<{ board: SerializableBoard }>();

const board = reactive<SerializableBoard>(JSON.parse(JSON.stringify(props.board)));

const sortedColumns = computed(() =>
	[...board.columns].sort((a, b) => a.orderIndex - b.orderIndex)
);

const draftTitleByColumn = ref<Record<string, string>>({});
const expandedTaskId = ref<string | null>(null);
const flashMessage = ref<string | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | null = null;
const flash = (msg: string) => {
	flashMessage.value = msg;
	if (flashTimer) clearTimeout(flashTimer);
	flashTimer = setTimeout(() => (flashMessage.value = null), 2400);
};

const findColumn = (columnId: string) =>
	board.columns.find((c) => c.id === columnId);

const renumberColumn = (columnId: string) => {
	const col = findColumn(columnId);
	if (!col) return;
	col.tasks.forEach((t, idx) => {
		t.orderIndex = idx;
		t.columnId = columnId;
	});
};

const handleDragEnd = async (evt: {
	item: HTMLElement;
	from: HTMLElement;
	to: HTMLElement;
	oldIndex?: number;
	newIndex?: number;
}) => {
	const taskId = evt.item.dataset.taskId;
	const fromColumnId = evt.from.dataset.columnId;
	const toColumnId = evt.to.dataset.columnId;
	if (!taskId || !fromColumnId || !toColumnId) return;
	if (
		fromColumnId === toColumnId &&
		evt.oldIndex === evt.newIndex
	) {
		return;
	}

	if (fromColumnId !== toColumnId) renumberColumn(fromColumnId);
	renumberColumn(toColumnId);

	const movedTask = findColumn(toColumnId)?.tasks.find((t) => t.id === taskId);
	if (!movedTask) return;

	try {
		const res = await fetch(`/api/tasks/${taskId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				columnId: toColumnId,
				orderIndex: movedTask.orderIndex
			})
		});
		if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
	} catch (err) {
		flash('Could not save move — refreshing.');
		console.error(err);
		window.location.reload();
	}
};

const addTask = async (column: SerializableColumn) => {
	const tempId = `temp-${crypto.randomUUID()}`;
	const orderIndex = column.tasks.length;
	const optimistic: SerializableTask = {
		id: tempId,
		columnId: column.id,
		content: 'New task',
		description: null,
		orderIndex
	};
	column.tasks.push(optimistic);
	expandedTaskId.value = tempId;

	try {
		const res = await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				columnId: column.id,
				content: optimistic.content,
				description: null,
				orderIndex
			})
		});
		if (!res.ok) throw new Error(`POST failed: ${res.status}`);
		const created = (await res.json()) as SerializableTask;
		const idx = column.tasks.findIndex((t) => t.id === tempId);
		if (idx !== -1) {
			column.tasks[idx] = {
				...created,
				description: created.description ?? null
			};
			if (expandedTaskId.value === tempId) {
				expandedTaskId.value = created.id;
			}
			await nextTick();
			focusTaskInput(created.id);
		}
	} catch (err) {
		const idx = column.tasks.findIndex((t) => t.id === tempId);
		if (idx !== -1) column.tasks.splice(idx, 1);
		flash('Could not create task.');
		console.error(err);
	}
};

const focusTaskInput = (taskId: string) => {
	const el = document.querySelector<HTMLTextAreaElement>(
		`[data-task-id="${taskId}"] [data-task-content-input]`
	);
	if (el) {
		el.focus();
		el.select();
	}
};

const persistTaskField = async (
	task: SerializableTask,
	patch: Partial<Pick<SerializableTask, 'content' | 'description'>>
) => {
	if (task.id.startsWith('temp-')) return;
	try {
		const res = await fetch(`/api/tasks/${task.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(patch)
		});
		if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
	} catch (err) {
		flash('Could not save edit.');
		console.error(err);
	}
};

const onTaskContentBlur = (task: SerializableTask, evt: Event) => {
	const ta = evt.target as HTMLTextAreaElement;
	const trimmed = ta.value.trim();
	task.content = trimmed || task.content || 'Untitled';
	persistTaskField(task, { content: task.content });
};

const onTaskContentInput = (evt: Event) => {
	const ta = evt.target as HTMLTextAreaElement;
	ta.style.height = 'auto';
	ta.style.height = `${ta.scrollHeight}px`;
};

const onTaskContentEnter = (evt: KeyboardEvent) => {
	(evt.target as HTMLTextAreaElement).blur();
};

const onTaskDescriptionBlur = (task: SerializableTask, evt: Event) => {
	const next = (evt.target as HTMLTextAreaElement).value.trim() || null;
	task.description = next;
	persistTaskField(task, { description: next });
};

const onColumnTitleInput = (column: SerializableColumn, evt: Event) => {
	draftTitleByColumn.value[column.id] = (evt.target as HTMLInputElement).value;
};

const onColumnTitleBlur = async (column: SerializableColumn, evt: Event) => {
	const value = (evt.target as HTMLInputElement).value;
	const next = value.trim() || column.title;
	column.title = next;
	delete draftTitleByColumn.value[column.id];
	try {
		const res = await fetch(`/api/columns/${column.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: next })
		});
		if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
	} catch (err) {
		flash('Could not save column title.');
		console.error(err);
	}
};

const onColumnTitleEnter = (evt: KeyboardEvent) => {
	(evt.target as HTMLInputElement).blur();
};

const deleteTask = async (column: SerializableColumn, task: SerializableTask) => {
	const idx = column.tasks.findIndex((t) => t.id === task.id);
	if (idx === -1) return;
	const removed = column.tasks.splice(idx, 1)[0]!;
	if (expandedTaskId.value === task.id) expandedTaskId.value = null;

	if (task.id.startsWith('temp-')) return;
	try {
		const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
	} catch (err) {
		column.tasks.splice(idx, 0, removed);
		flash('Could not delete task.');
		console.error(err);
	}
};

const toggleExpanded = (taskId: string) => {
	expandedTaskId.value = expandedTaskId.value === taskId ? null : taskId;
};

const dragOptions = {
	animation: 0,
	group: 'tasks',
	ghostClass: 'task-ghost',
	chosenClass: 'task-chosen',
	dragClass: 'task-drag',
	handle: '[data-drag-handle]',
	onEnd: handleDragEnd
};

const titleValue = (column: SerializableColumn) =>
	draftTitleByColumn.value[column.id] ?? column.title;
</script>

<template>
	<div class="relative flex h-full w-full flex-col">
		<Transition name="flash">
			<div
				v-if="flashMessage"
				class="glass-strong pointer-events-none fixed top-24 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-2.5 text-sm font-medium text-rose-400 shadow-card ring-1 ring-rose-400/30"
			>
				{{ flashMessage }}
			</div>
		</Transition>

		<div class="mb-6 flex items-baseline justify-between px-2">
			<div>
				<h1
					class="text-gradient text-3xl leading-tight font-bold tracking-tight"
				>
					{{ board.title }}
				</h1>
				<p class="mt-1 text-sm text-ink-400">
					Drag tasks across columns. Click any card to edit. Everything saves
					automatically.
				</p>
			</div>
		</div>

		<div class="flex flex-1 gap-5 overflow-x-auto overflow-y-hidden pb-4">
			<section
				v-for="column in sortedColumns"
				:key="column.id"
				class="glass flex h-full w-80 shrink-0 flex-col rounded-2xl"
			>
				<header
					class="flex items-center justify-between gap-3 px-4 pt-4 pb-3"
				>
					<input
						class="flex-1 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-semibold tracking-wide text-ink-100 uppercase outline-none transition focus:bg-white/5 focus:ring-1 focus:ring-flow-500/50"
						:value="titleValue(column)"
						@input="(e) => onColumnTitleInput(column, e)"
						@blur="(e) => onColumnTitleBlur(column, e)"
						@keydown.enter.prevent="onColumnTitleEnter"
					/>
					<span
						class="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-ink-300 tabular-nums"
					>
						{{ column.tasks.length }}
					</span>
				</header>

				<TransitionGroup
					name="task"
					tag="ul"
					:data-column-id="column.id"
					class="flex min-h-[8rem] flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3"
					v-draggable="[column.tasks, dragOptions]"
				>
					<li
						v-for="task in column.tasks"
						:key="task.id"
						:data-task-id="task.id"
						class="task-card group glass-strong relative cursor-grab rounded-xl p-3.5 shadow-card ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:ring-flow-500/30 active:cursor-grabbing"
						@click="toggleExpanded(task.id)"
					>
						<div class="flex items-start gap-2">
							<span
								data-drag-handle
								class="mt-1 inline-flex shrink-0 cursor-grab text-ink-500 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
								title="Drag to move"
								@click.stop
							>
								<svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="currentColor">
									<circle cx="4" cy="4" r="1.2" />
									<circle cx="4" cy="8" r="1.2" />
									<circle cx="4" cy="12" r="1.2" />
									<circle cx="10" cy="4" r="1.2" />
									<circle cx="10" cy="8" r="1.2" />
									<circle cx="10" cy="12" r="1.2" />
								</svg>
							</span>
							<textarea
								data-task-content-input
								class="flex-1 resize-none bg-transparent text-sm leading-snug font-medium text-ink-50 outline-none focus:ring-0"
								rows="1"
								:value="task.content"
								@click.stop
								@input="onTaskContentInput"
								@blur="(e) => onTaskContentBlur(task, e)"
								@keydown.enter.prevent="onTaskContentEnter"
							/>
							<button
								class="shrink-0 rounded-md p-1 text-ink-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
								title="Delete task"
								@click.stop="deleteTask(column, task)"
							>
								<svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none">
									<path
										d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5L11 4M7 7v4M9 7v4"
										stroke="currentColor"
										stroke-width="1.4"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
						</div>

						<Transition name="reveal">
							<div
								v-if="expandedTaskId === task.id"
								class="mt-3 border-t border-white/5 pt-3"
								@click.stop
							>
								<textarea
									class="block w-full resize-none rounded-lg bg-black/20 p-2.5 text-xs leading-relaxed text-ink-200 placeholder:text-ink-500 outline-none ring-1 ring-white/5 transition focus:ring-flow-500/40"
									rows="3"
									placeholder="Add a description..."
									:value="task.description ?? ''"
									@blur="(e) => onTaskDescriptionBlur(task, e)"
								/>
							</div>
						</Transition>
					</li>
				</TransitionGroup>

				<div class="px-3 pb-3">
					<button
						class="w-full rounded-lg border border-dashed border-white/10 bg-white/0 px-3 py-2 text-xs font-medium text-ink-400 transition hover:border-flow-500/40 hover:bg-flow-500/5 hover:text-flow-300"
						@click="addTask(column)"
					>
						+ Add task
					</button>
				</div>
			</section>
		</div>
	</div>
</template>

<style scoped>
.task-move,
.task-enter-active,
.task-leave-active {
	transition:
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms ease;
}
.task-enter-from {
	opacity: 0;
	transform: translateY(-8px) scale(0.98);
}
.task-leave-to {
	opacity: 0;
	transform: scale(0.95);
}
.task-leave-active {
	position: absolute;
	left: 0;
	right: 0;
}

.task-ghost {
	opacity: 0.45;
	background: rgba(59, 130, 246, 0.08);
	border-color: rgba(59, 130, 246, 0.4) !important;
}
.task-chosen {
	cursor: grabbing !important;
}
.task-drag {
	transform: rotate(1.5deg);
	box-shadow: 0 16px 48px -12px rgba(0, 0, 0, 0.6);
}

.reveal-enter-active,
.reveal-leave-active {
	transition:
		opacity 180ms ease,
		max-height 220ms ease;
	overflow: hidden;
}
.reveal-enter-from,
.reveal-leave-to {
	opacity: 0;
	max-height: 0;
}
.reveal-enter-to,
.reveal-leave-from {
	opacity: 1;
	max-height: 200px;
}

.flash-enter-active,
.flash-leave-active {
	transition:
		opacity 200ms ease,
		transform 200ms ease;
}
.flash-enter-from,
.flash-leave-to {
	opacity: 0;
	transform: translate(-50%, -10px);
}
</style>
