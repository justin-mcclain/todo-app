<template>
	<div id="header">
		<svg
			height="256px"
			width="256px"
			version="1.1"
			id="Capa_1"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 17.837 17.837"
			xml:space="preserve"
			fill=""
			stroke=""
			@click="router.push('/')"
			style="cursor: pointer"
		>
			<g id="SVGRepo_bgCarrier" stroke-width="0"></g>
			<g
				id="SVGRepo_tracerCarrier"
				stroke-linecap="round"
				stroke-linejoin="round"
			></g>
			<g id="SVGRepo_iconCarrier">
				<g>
					<path
						style="fill: #ececec"
						d="M16.145,2.571c-0.272-0.273-0.718-0.273-0.99,0L6.92,10.804l-4.241-4.27 c-0.272-0.274-0.715-0.274-0.989,0L0.204,8.019c-0.272,0.271-0.272,0.717,0,0.99l6.217,6.258c0.272,0.271,0.715,0.271,0.99,0 L17.63,5.047c0.276-0.273,0.276-0.72,0-0.994L16.145,2.571z"
					></path>
				</g>
			</g>
		</svg>
		<h1>let's work</h1>
		<v-btn
			roudned="lg"
			size="large"
			variant="tonal"
			prepend-icon="mdi-plus"
			@click="showInput = !showInput"
		>
			New List
		</v-btn>
		<v-text-field
			v-if="showInput"
			label="List Name"
			variant="solo"
			v-model="newList"
			clearable
			style="width: 40%; margin-top: 10px"
			append-inner-icon="mdi-plus"
			@click:append-inner="addList"
		></v-text-field>
	</div>
	<div style="margin-top: 20px; width: 800px">
		<div v-if="theList.length == 0">Make a list to get started</div>
		<div
			style="display: flex; gap: 10px; flex-direction: column"
			v-if="theList.length > 0"
		>
			<h3>Select a list:</h3>
			<v-card :key="theList.length">
				<v-tabs center-active grow v-model="selectedTab">
					<v-tab
						v-for="list in theList"
						:key="Number(list.ID)"
						:value="list.ID"
						@click="navigateToTasks(list.ID)"
					>
						<v-icon
							v-if="selectedTab == list.ID"
							style="margin-right: 5px"
							@click.stop="openEditList()"
							>{{ "mdi-pencil" }}</v-icon
						>
						{{ list.Name }} ({{
							list.Tasks ? list.Tasks.length : "0"
						}})</v-tab
					>
				</v-tabs>
			</v-card>
			<v-dialog v-model="dialog" width="500px">
				<v-card title="Edit List">
					<v-card-text>
						<v-row dense>
							<v-col cols="12">
								<v-text-field
									required
									clearable
									variant="solo-filled"
									v-model="editedListName"
								>
								</v-text-field>
							</v-col>
						</v-row>
					</v-card-text>
					<v-divider></v-divider>
					<v-card-actions>
						<v-btn
							color="error"
							variant="tonal"
							@click="deleteList()"
							><v-icon>{{ "mdi-delete" }}</v-icon></v-btn
						>
						<v-spacer></v-spacer>
						<v-btn variant="plain" @click="dialog = false"
							>Cancel</v-btn
						>
						<v-btn
							color="primary"
							variant="tonal"
							@click="editList()"
							>Update</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</div>
		<div v-if="loadTasks" :key="selectedTab">
			<ActiveTasks />
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import router from "@/router";
import { useRoute } from "vue-router";
import { useTaskStore } from "@/stores/taskStore";
import ActiveTasks from "./ActiveTasks.vue";
import {
	VCard,
	VDialog,
	VTextField,
	VIcon,
} from "vuetify/lib/components/index.mjs";

const taskStore = useTaskStore();
const { getLists, getTasks } = taskStore;
const route = useRoute();

const editedListName = ref("");
const loadTasks = ref(false);
const showInput = ref(false);
const newList = ref("");
const selectedTab = computed({
	get: () => {
		const id = Number(route.params.listID);
		return id;
	},
	set: (value) => {
		router.push(`/list/${value}`);
	},
});

const theList = computed(() =>
	taskStore.listList.map((list) => {
		const incompleteTasks = (Array.isArray(list.Tasks) ? list.Tasks : []).filter((task) => !task.isCompleted);
		return {
			...list,
			Tasks: incompleteTasks.length > 0 ? incompleteTasks : [],
		};
	})
);


const dialog = ref(false);

const addList = async () => {
	if (!newList.value) {
		alert("Please provide a list name");
		return;
	}

	try {
		const response = await fetch("http://localhost:5000/api/add-list", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: newList.value,
			}),
		});

		const data = await response.json();
		if (response.ok) {
			console.log("New list added:", data);
			getLists();
		} else {
			console.error("Failed to add new list:", data);
		}
	} catch (error) {
		console.error("Error adding new list:", error);
	}

	newList.value = "";
	showInput.value = false;
};

const openEditList = () => {
	dialog.value = true;
	const listItem = theList.value.find((x) => x.ID === selectedTab.value);
	if (listItem) {
		editedListName.value = listItem.Name;
	}
};
const editList = async () => {
	const listID = selectedTab.value;
	const editedList = editedListName.value;
	try {
		const response = await fetch("http://localhost:5000/api/edit-list", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				listID,
				editedList,
			}),
		});
		const data = await response.json();
		if (response.ok) {
			dialog.value = false;
			taskStore.getLists();
		} else {
			console.log("Error editing list", data);
		}
	} catch (error) {
		console.log("Error editing list: ", error);
	}
};

const deleteList = async () => {
	const listID = selectedTab.value;
	try {
		const response = await fetch("http://localhost:5000/api/delete-list", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				listID,
			}),
		});
		const data = await response.json();
		if (response.ok) {
			dialog.value = false;
			taskStore.getLists();
		} else {
			console.log("Error deleteing list", data);
		}
	} catch (error) {
		console.log("Error deleting list: ", error);
	}
};

const navigateToTasks = (listID) => {
	getTasks(listID);
	if (listID) {
		taskStore.listID = listID;
		router.push(`/list/${listID}`);
	}
};

onMounted(async () => {
	await getLists();
	const listID = route.params.listID;
	if (listID) {
		selectedTab.value = Number(listID);
		taskStore.setListID(listID);
		taskStore.getTasks(listID);
	}
});
</script>
<style scoped>
#header {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
</style>
