import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

document.documentElement.dataset.theme = '__THEME_MODE__';
createApp(App).mount('#app');
