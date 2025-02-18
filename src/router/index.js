import { createRouter, createWebHistory } from "vue-router";
import ActiveTasks from "@/components/ActiveTasks.vue";
import AppHeader from "@/components/AppHeader.vue";

const routes = [
	{
		path: "/list/:listID",
		name: "ActiveTasks",
		component: ActiveTasks
	},
	{
		path: "/",
		name: "Home",
		component: AppHeader
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
