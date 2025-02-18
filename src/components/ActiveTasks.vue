<template>
	<div
		id="tasks"
		style="
			margin-top: 30px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			width: 800px;
		"
	>
		<div
			style="
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				gap: 10px;
			"
			v-if="groupedAndSortedTasks.length === 0"
		>
			<v-btn
				roudned="lg"
				size="large"
				variant="tonal"
				prepend-icon="mdi-plus"
				@click="dialog = true"
			>
				New Task
			</v-btn>
			<p>Create a task to get started</p>
		</div>

		<div
			v-if="groupedAndSortedTasks.length > 0"
			style="
				display: flex;
				justify-content: center;
				align-items: baseline;
				flex-direction: column;
				gap: 30px;
			"
		>
			<div
				style="
					display: flex;
					flex-direction: row;
					align-items: center;
					gap: 10px;
					justify-content: center;
					width: 100%;
				"
			>
				<v-btn
					rounded="md"
					size="large"
					variant="tonal"
					prepend-icon="mdi-plus"
					@click="openAddModal()"
				>
					New Task
				</v-btn>
				<v-btn
					rounded="md"
					size="large"
					variant="tonal"
					@click="showCalendar = !showCalendar"
				>
					View {{ !showCalendar ? "Calendar" : "List" }}
				</v-btn>
				<v-btn
					rounded="md"
					size="large"
					variant="tonal"
					:disabled="!enableShowCompleted"
					@click="showCompleted = !showCompleted"
					>{{ showCompleted ? "Hide" : "Show" }} Completed
				</v-btn>
			</div>
			<div
				v-if="!showCalendar"
				style="
					display: flex;
					justify-content: space-between;
					width: 100%;
				"
			>
				<v-card style="height: 100%">
					<v-tabs
						fixed-tabs
						direction="vertical"
						v-model="selectedDateIndex"
					>
						<v-tab
							v-for="(date, index) in groupedAndSortedTasks"
							:key="index"
							@click="handleTabSelect(index)"
							>{{ formatDate(date.date) }} ({{
								date.tasks.filter(
									(task) => task.isCompleted === false
								).length
							}})</v-tab
						>
					</v-tabs>
				</v-card>
				<div
					id="taskInfo"
					v-if="selectedDateIndex != null"
					style="flex: 2"
				>
					<div
						v-for="(task, taskIndex) in groupedAndSortedTasks[
							selectedDateIndex
						].tasks"
						:key="taskIndex"
						style="display: flex; flex-direction: column"
					>
						<div v-if="task.isCompleted == false || showCompleted">
							<div>
								<div
									style="
										display: flex;
										justify-content: space-between;
										align-items: center;
									"
								>
									<div>
										<v-checkbox
											color="green"
											:label="task.name"
											class="no-checkbox"
											v-model="task.isCompleted"
											@change="toggleTask(task.taskID)"
											:key="`checkbox-${task.taskID}-${showCompleted}`"
										></v-checkbox>
									</div>
									<v-tooltip text="Edit">
										<template #activator="{ props }">
											<v-icon
												@click="openEditModal(task)"
												v-bind="props"
											>
												{{ "mdi-pencil" }}
											</v-icon>
										</template>
									</v-tooltip>
								</div>
							</div>
							<div
								v-if="task.description"
								style="
									margin-left: 40px;
									display: flex;
									text-align: start;
								"
							>
								<v-icon icon="mdi-arrow-right-bottom"></v-icon>
								<p style="font-size: 14px; padding-top: 5px">
									{{ task.description }}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<v-sheet v-if="showCalendar">
			<VCalendar type="month" ref="calendar" :events="calendarEvents" />
		</v-sheet>
		<v-dialog v-model="dialog" width="800px">
			<v-card
				prepend-icon="mdi-note-check-outline"
				:title="modalFunction.value === 'add' ? 'Add Task' : 'Edit'"
			>
				<v-card-text>
					<v-row dense>
						<v-col cols="7">
							<v-date-picker
								variant="solo-filled"
								v-model="newTask.date"
								width="auto"
								class="no-header"
							></v-date-picker>
						</v-col>
						<v-col cols="5">
							<v-text-field
								label="Task name"
								required
								variant="solo-filled"
								v-model="newTask.name"
							></v-text-field>
							<v-textarea
								label="Description"
								required
								no-resize
								variant="solo-filled"
								v-model="newTask.description"
								class="mt-4"
								style="height: 90%"
							></v-textarea>
						</v-col>
					</v-row>
				</v-card-text>
				<v-divider></v-divider>
				<v-card-actions>
					<v-btn
						v-if="modalFunction === 'edit'"
						color="error"
						variant="tonal"
						@click="deleteTask(newTask, listID)"
						><v-icon>{{ "mdi-delete" }}</v-icon></v-btn
					>
					<v-spacer></v-spacer>
					<v-btn variant="plain" @click="closeDialog()">Cancel</v-btn>
					<v-btn
						color="primary"
						variant="tonal"
						@click="submitTask(listID)"
						>{{ modalFunction === "add" ? "Add" : "Update" }}</v-btn
					>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-snackbar v-model="snackbar" :color="snackbarColor">
			{{ snackbarText }}
			<template v-slot:actions>
				<v-btn variant="text" @click="handleCloseSnackbar()">
					Close
				</v-btn>
			</template>
		</v-snackbar>
	</div>
</template>

<script setup>
import { onMounted, ref, computed, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { VCalendar } from "vuetify/labs/VCalendar";
import { VDialog } from "vuetify/lib/components/index.mjs";
import { VCard } from "vuetify/lib/components/index.mjs";
import {
	VTextField,
	VCheckbox,
	VTextarea,
	VSheet,
	VTooltip,
	VDatePicker,
	VSnackbar,
} from "vuetify/lib/components/index.mjs";
import dayjs from "dayjs";
import { useTaskStore } from "@/stores/taskStore";

const taskStore = useTaskStore();
const route = useRoute();

const listID = computed(() => taskStore.listID);
const tasks = computed(() => taskStore.tasks);

const modalFunction = ref("add");
const groupedAndSortedTasks = ref([]);
const dialog = ref(false);
const showCalendar = ref(false);
const selectedDateIndex = ref(0);
const snackbarText = ref("");
const snackbar = ref(false);
const snackbarColor = ref("");
const showCompleted = ref(false);
const enableShowCompleted = ref(false);
const calendarEvents = ref([]);

const formatDate = (date) => {
	return dayjs(date).format("MMMM D, YYYY");
};

const newTask = ref({
	name: "",
	description: "",
	date: new Date(),
	isCompleted: false,
});

const submitTask = async (listID) => {
	if (modalFunction.value === "add") {
		try {
			const highestTaskIDResponse = await fetch(
				`http://localhost:5000/api/highest-task-id/${listID}`
			);
			const { highestTaskID } = await highestTaskIDResponse.json();
			const taskID = highestTaskID + 1;
			const taskData = {
				taskID: taskID,
				name: newTask.value.name,
				description: newTask.value.description,
				date: newTask.value.date,
				isCompleted: false,
			};

			const response = await fetch("http://localhost:5000/api/add-task", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ taskData, listID }),
			});

			const data = await response.json();
			if (response.ok) {
				dialog.value = false;
				modalFunction.value = "";
				newTask.value = {
					name: "",
					description: "",
					date: new Date(),
				};
				const fetchedTasks = await taskStore.getTasks(listID);
				groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
				taskStore.getLists();
				snackbarText.value = "Task successfully added!";
				snackbarColor.value = "success";
				snackbar.value = true;
			} else {
				console.log("Error adding task", data);
				snackbarText.value = "Task failed to add.";
				snackbarColor.value = "error";
				snackbar.value = true;
			}
		} catch (error) {
			console.log("Error submitting task: ", error);
		}
	} else if (modalFunction.value === "edit") {
		try {
			const taskID = newTask.value.taskID;
			const taskData = {
				taskID: newTask.value.taskID,
				name: newTask.value.name,
				description: newTask.value.description,
				date: newTask.value.date,
				isCompleted: newTask.value.isCompleted,
			};
			const response = await fetch(
				"http://localhost:5000/api/edit-task",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ taskData, listID, taskID }),
				}
			);

			const data = await response.json();
			if (response.ok) {
				dialog.value = false;
				modalFunction.value = "";
				newTask.value = {
					name: "",
					description: "",
					date: new Date(),
					isAllDay: false,
				};
				snackbarText.value = "Task successfully edited!";
				snackbarColor.value = "success";
				snackbar.value = true;
				const fetchedTasks = await taskStore.getTasks(listID);
				groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
			} else {
				console.log("Error editing task", data);
				snackbarText.value = "Task failed to add.";
				snackbarColor.value = "error";
				snackbar.value = true;
			}
		} catch (error) {
			console.log("Error editing task: ", error);
		}
	}
};

const deleteTask = async (task, list) => {
	const listID = list;
	const taskID = task.taskID;
	try {
		const response = await fetch("http://localhost:5000/api/delete-task", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ listID, taskID }),
		});

		const data = await response.json();
		if (response.ok) {
			task.isEditing = false;
			const fetchedTasks = await taskStore.getTasks(listID);
			groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
			dialog.value = false;
			snackbarText.value = "Task successfully deleted!";
			snackbarColor.value = "success";
			snackbar.value = true;
		} else {
			console.log("Error deleting task", data);
			snackbarText.value = "Task failed to delete.";
			snackbarColor.value = "error";
			snackbar.value = true;
		}
	} catch (error) {
		console.log("Error deleting task: ", error);
	}
};

const openEditModal = (task) => {
	modalFunction.value = "edit";
	newTask.value = {
		name: task.name,
		description: task.description,
		date: new Date(task.date),
		taskID: task.taskID,
	};
	dialog.value = true;
};

const openAddModal = () => {
	modalFunction.value = "add";
	dialog.value = true;
};

const toggleTask = async (taskID) => {
	const fetchedTasks = await taskStore.getTasks(listID.value);
	groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
	const task = tasks.value.find((t) => t.taskID === taskID);

	if (!task) {
		console.error("Task not found");
		return;
	}
	const newCompletionStatus = !task.isCompleted;
	const taskData = {
		taskID: taskID,
		name: task.name,
		description: task.description,
		date: task.date,
		isCompleted: newCompletionStatus,
	};
	try {
		const response = await fetch("http://localhost:5000/api/edit-task", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				listID: listID.value,
				taskID: taskID,
				taskData,
			}),
		});
		const data = await response.json();
		if (response.ok) {
			task.isCompleted = newCompletionStatus;
			snackbarText.value = "Task marked as complete.";
			snackbarColor.value = "success";
			snackbar.value = true;
			const fetchedTasks = await taskStore.getTasks(listID.value);
			groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
			handleTabSelect();
		} else {
			console.log("Error", data);
		}
	} catch (error) {
		console.log("Error: ", error);
	}
};

const handleTabSelect = (index = selectedDateIndex.value) => {
    selectedDateIndex.value = index;
    const tasksInGroup = groupedAndSortedTasks.value[index]?.tasks;
    enableShowCompleted.value =
        tasksInGroup && tasksInGroup.some((task) => task.isCompleted);
};


const closeDialog = () => {
	dialog.value = false;
	newTask.value = {
		name: "",
		description: "",
		date: new Date(),
		isAllDay: false,
	};
};
const handleCloseSnackbar = () => {
	snackbar.value = false;
	snackbarText.value = "";
	snackbarColor.value = "";
};

onUnmounted(() => {
	tasks.value = [];
});

watch(listID, async (newListID) => {
	if (newListID) {
		taskStore.setListID(newListID);
		const fetchedTasks = await taskStore.getTasks(newListID);
		if (fetchedTasks && fetchedTasks.length > 0) {
			groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
			calendarEvents.value = fetchedTasks
				.filter((task) => task.date && !isNaN(new Date(task.date)))
				.map((task) => ({
					title: task.name,
					start: new Date(task.date),
					end: new Date(task.date),
				}));
		}
		if (fetchedTasks == null) {
			groupedAndSortedTasks.value = [];
			calendarEvents.value = [];
		}
		enableShowCompleted.value = false;
		showCompleted.value = false;
	}
});

onMounted(async () => {
	const listID = route.params.listID;
	if (listID) {
		taskStore.setListID(listID);
		const fetchedTasks = await taskStore.getTasks(listID);
		if (fetchedTasks && fetchedTasks.length > 0) {
			groupedAndSortedTasks.value = groupAndSortTasks(fetchedTasks);
			calendarEvents.value = fetchedTasks
				.filter((task) => task.date && !isNaN(new Date(task.date)))
				.map((task) => ({
					title: task.name,
					start: new Date(task.date),
					end: new Date(task.date),
				}));
		} else {
			console.error(
				"Failed to fetch tasks or tasks array is invalid:",
				fetchedTasks
			);
		}
	}
});

const groupAndSortTasks = (tasks) => {
	const grouped = {};

	tasks.forEach((task) => {
		if (!task.date || isNaN(new Date(task.date))) return;

		const dateKey = new Date(task.date).toISOString().split("T")[0];
		if (!grouped[dateKey]) {
			grouped[dateKey] = {
				date: task.date,
				tasks: [],
			};
		}
		grouped[dateKey].tasks.push(task);
	});

	const groupedArray = Object.values(grouped).sort(
		(a, b) => new Date(a.date) - new Date(b.date)
	);

	groupedArray.forEach((group) => {
		group.tasks.sort((a, b) => {
			if (a.isCompleted === b.isCompleted) {
				return a.taskID - b.taskID;
			}
			return a.isCompleted ? 1 : -1;
		});
	});
	return groupedArray;
};
</script>

<style scoped>
.no-checkbox >>> .v-input__details {
	display: none;
}

.no-header >>> .v-picker__header {
	display: none;
}

.test {
	opacity: 0.4;
}
</style>
