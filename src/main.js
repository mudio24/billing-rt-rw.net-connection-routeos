/**
 * Vue.js Entry Point
 * Initializes the Vue 3 application
 */

import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.mount('#app');
