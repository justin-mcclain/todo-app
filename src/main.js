import { createApp } from "vue";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import App from "./App.vue";
import '@mdi/font/css/materialdesignicons.css' 
import router from "./router";
import { createPinia } from "pinia";

const vuetify = createVuetify({
	components,
	directives,
    theme: {
        defaultTheme: 'dark'
    },
    icons:{ 
        defaultSet: 'mdi'
    }
});

createApp(App).use(vuetify).use(router).use(createPinia()).mount("#app");
