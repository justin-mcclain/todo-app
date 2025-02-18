<template>
	<v-app>
		<AppHeader />
		<router-view />
	</v-app>
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue";

</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #ececec;
	margin-top: 60px;
}

.v-application {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
</style>
