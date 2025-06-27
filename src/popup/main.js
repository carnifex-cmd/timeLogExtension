import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/global.css';
import './fonts.css';
import { createApp } from 'vue'
import {
  // General
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  // Components we'll use
  NCard,
  NButton,
  NInput,
  NSelect,
  NDropdown,
  NCheckbox,
  NModal,
  NForm,
  NFormItem,
  NSpace,
  NTag,
  NEmpty,
  NSpin,
  NTooltip,
  NGrid,
  NGridItem,
  NDatePicker,
  NSteps,
  NStep,
  NAlert,
  NAvatar,
  NText,
  NSwitch,
  // Create naive ui
  create
} from 'naive-ui'

import App from './App.vue'

// Create naive ui instance
const naive = create({
  components: [
    NConfigProvider,
    NMessageProvider,
    NDialogProvider,
    NNotificationProvider,
    NCard,
    NButton,
    NInput,
    NSelect,
    NDropdown,
    NCheckbox,
    NModal,
    NForm,
    NFormItem,
    NSpace,
    NTag,
    NEmpty,
    NSpin,
    NTooltip,
    NGrid,
    NGridItem,
    NDatePicker,
    NSteps,
    NStep,
    NAlert,
    NAvatar,
    NText,
    NSwitch
  ]
})

const app = createApp(App)
app.use(naive)
app.mount('#app')
