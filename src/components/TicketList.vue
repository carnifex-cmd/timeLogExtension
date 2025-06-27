<template>
  <div class="ticket-list-container">
    <n-card title="🎫 Your Tickets" size="medium">
      <template #header-extra>
        <n-space align="center" :size="12">
          <!-- Compact Toggle -->
          <n-tooltip trigger="hover" placement="top">
            <template #trigger>
              <n-switch
                v-model:value="includeClosedTickets"
                size="small"
              >
                <template #checked><i class="fas fa-archive"></i></template>
                <template #unchecked><i class="fas fa-folder-open"></i></template>
              </n-switch>
            </template>
            <span>{{ includeClosedTickets ? 'Showing all tickets from last 4 weeks' : 'Open tickets only' }}</span>
          </n-tooltip>
          
          <!-- Selected Count -->
          <n-tag 
            :type="hasSelectedTickets ? 'success' : 'default'" 
            size="small"
          >
            {{ selectedCount }} selected
          </n-tag>
        </n-space>
      </template>
      
      <!-- Search and Filter Section -->
      <n-input
        v-model:value="searchQuery"
        placeholder="🔍 Search tickets by ID or summary..."
        clearable
        size="large"
        class="search-input"
      >
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
        <template #suffix>
          <n-button
            :type="selectedProject ? 'primary' : 'default'"
            size="small"
            @click="showProjectFilter = !showProjectFilter"
            class="filter-button"
          >
            <template #icon>
              <i class="fas fa-filter"></i>
            </template>
            {{ selectedProject ? getSelectedProjectLabel() : 'All Projects' }}
          </n-button>
          
          <!-- Project Filter Dropdown -->
          <n-dropdown
            :show="showProjectFilter"
            :options="projectDropdownOptions"
            @select="handleProjectSelect"
            @clickoutside="showProjectFilter = false"
            placement="bottom-end"
            trigger="manual"
          >
            <span></span>
          </n-dropdown>
        </template>
      </n-input>

      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <n-spin size="medium">
          <template #description>
            Loading your tickets...
          </template>
        </n-spin>
      </div>
      
      <!-- Ticket Content -->
      <div v-else class="ticket-content">
        <!-- No Results State -->
        <n-empty 
          v-if="filteredTickets.length === 0 && !loading"
          description="No tickets found"
          class="empty-state"
        >
          <template #icon>
            <i class="fas fa-ticket-alt"></i>
          </template>
          <template #extra>
            <n-button size="small" @click="searchQuery = ''">
              Clear Search
            </n-button>
          </template>
        </n-empty>
        
        <!-- Tickets List -->
        <div v-else class="tickets-grid">
          <TicketItem
            v-for="ticket in visibleTickets"
            :key="ticket.idReadable"
            :ticket="ticket"
            :is-selected="selectedTickets[ticket.idReadable] || false"
            :is-bookmarked="bookmarkedTickets && bookmarkedTickets[ticket.idReadable] || false"
            :time-log="logs[ticket.idReadable]"
            :logged-time-data="loggedTimeData && loggedTimeData[ticket.idReadable]"
            :is-loading-logged-time="loadingLoggedTime && loadingLoggedTime[ticket.idReadable]"
            @toggle-selection="handleToggleSelection"
            @open-modal="handleOpenModal"
            @toggle-bookmark="handleToggleBookmark"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="hasMoreTickets" class="show-more-container">
          <n-button
            @click="$emit('show-more')"
            type="primary"
            ghost
            size="small"
            round
          >
            <template #icon>
              <i class="fas fa-chevron-down"></i>
            </template>
            Show {{ Math.min(5, filteredTickets.length - ticketsToShow) }} more
          </n-button>
        </div>
      </div>
    </n-card>
    
    <!-- Sticky Submit Button -->
    <div class="submit-container-sticky">
      <n-button
        @click="$emit('submit-logs')"
        type="success"
        size="large"
        :disabled="!hasSelectedTickets"
        strong
      >
        <template #icon>
          <i class="fas fa-paper-plane"></i>
        </template>
        Submit {{ selectedCount }} Time Log{{ selectedCount !== 1 ? 's' : '' }}
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref, h } from 'vue'
import TicketItem from './TicketItem.vue'

const props = defineProps({
  tickets: Array,
  filteredTickets: Array,
  selectedTickets: Object,
  logs: Object,
  loggedTimeData: Object,
  loading: Boolean,
  searchQuery: String,
  ticketsToShow: Number,
  bookmarkedTickets: Object,
  loadingLoggedTime: Object,
  includeClosedTickets: Boolean,
  selectedProject: String,
  availableProjects: Array
})

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedProject',
  'toggle-selection', 
  'open-modal', 
  'toggle-bookmark',
  'show-more',
  'submit-logs',
  'toggle-closed-tickets'
])

const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

const selectedProject = computed({
  get: () => props.selectedProject,
  set: (value) => emit('update:selectedProject', value)
})

const includeClosedTickets = computed({
  get: () => props.includeClosedTickets,
  set: (value) => emit('toggle-closed-tickets', value)
})

// Computed property for project filter options
const projectOptions = computed(() => {
  if (!props.availableProjects || props.availableProjects.length === 0) {
    return []
  }
  
  return props.availableProjects.map(project => ({
    label: `${project.shortName} - ${project.name}`,
    value: project.shortName
  }))
})

// Dropdown options for the filter
const projectDropdownOptions = computed(() => {
  const options = [
    {
      label: 'All Projects',
      key: '',
      icon: () => h('i', { class: 'fas fa-list' })
    }
  ]
  
  if (props.availableProjects && props.availableProjects.length > 0) {
    props.availableProjects.forEach(project => {
      options.push({
        label: `${project.shortName} - ${project.name}`,
        key: project.shortName,
        icon: () => h('i', { class: 'fas fa-folder' })
      })
    })
  }
  
  return options
})

// Get display label for selected project
const getSelectedProjectLabel = () => {
  if (!props.selectedProject) return 'All Projects'
  const project = props.availableProjects?.find(p => p.shortName === props.selectedProject)
  return project ? project.shortName : props.selectedProject
}

// Handle project selection
const handleProjectSelect = (key) => {
  selectedProject.value = key || ''
  showProjectFilter.value = false
}

const visibleTickets = computed(() => 
  props.filteredTickets.slice(0, props.ticketsToShow)
)

const hasMoreTickets = computed(() => 
  props.filteredTickets.length > props.ticketsToShow
)

const hasSelectedTickets = computed(() => 
  Object.values(props.selectedTickets).some(Boolean)
)

const selectedCount = computed(() => 
  Object.values(props.selectedTickets).filter(Boolean).length
)

const handleToggleSelection = (ticketId) => {
  emit('toggle-selection', ticketId)
}

const handleOpenModal = (ticketId) => {
  emit('open-modal', ticketId)
}

const handleToggleBookmark = (ticket) => {
  emit('toggle-bookmark', ticket)
}

const showProjectFilter = ref(false)
</script>

<style scoped>
.ticket-list-container {
  width: 100%;
  position: relative;
  padding-bottom: 80px; /* Space for sticky button */
}

.search-input {
  margin-bottom: 16px;
  width: 100%;
}

.search-filter-container {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: stretch;
}

.search-filter-container .search-input {
  flex: 1;
  margin-bottom: 0;
}

.project-filter {
  flex-shrink: 0;
}

.project-filter .n-base-selection {
  height: 100%;
}

.loading-container {
  text-align: center;
  padding: 40px 20px;
}

.ticket-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 20px;
}

.tickets-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.show-more-container {
  text-align: center;
  margin: 8px 0;
}

.submit-container-sticky {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Custom card styling */
.ticket-list-container :deep(.n-card-header) {
  padding-bottom: 16px;
}

.ticket-list-container :deep(.n-empty) {
  padding: 20px 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .tickets-grid {
    gap: 1px;
  }
}

.filter-button {
  margin-left: 8px;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-button :deep(.n-button__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 