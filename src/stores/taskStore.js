import { defineStore } from "pinia";
import { ref } from "vue";

export const useTaskStore = defineStore("task", () => {
	const listList = ref([]);
	const tasks = ref([]);
	const listID = ref(null);

	const setListID = (id) => {
		listID.value = id;
	};

	const getLists = async () => {
		try {
			const response = await fetch(
				"http://localhost:5000/api/task-lists"
			);
			const data = await response.json();
			listList.value = data;
		} catch (error) {
			console.error("Error getting lists", error);
		}
	};

	const getTasks = async (id) => {
		try {
			const response = await fetch(
				`http://localhost:5000/api/get-tasks/${id}`
			);
			const data = await response.json();
			if (response.ok) {
				tasks.value = data;
				listID.value = id;
				return data; 
			} else {
				console.error("Error fetching tasks");
				return null;
			}
		} catch (err) {
			console.error("Error: ", err);
			return null; 
		}
	};

	return {
		listList,
		tasks,
		listID,
		getLists,
		getTasks,
		setListID,
	};
});