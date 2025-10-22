<template>
  <div class="admin-webhook-logs">
    <!-- Page Header -->
    <div class="page-header admin-page-header">
      <div class="row align-items-center">
        <div class="col">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/admin">Admin</router-link></li>
              <li class="breadcrumb-item active" aria-current="page">NSSA Webhook Logs</li>
            </ol>
          </nav>
          <h1 class="page-header-title">NSSA/Kajabi Webhook Logs</h1>
          <p class="text-muted">Monitor incoming webhooks from Kajabi integration</p>
        </div>
        <div class="col-auto">
          <button @click="refreshLogs" :disabled="loading" class="btn btn-outline-primary">
            <i class="bi-arrow-clockwise" :class="{ 'spinner-border spinner-border-sm': loading }"></i>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <!-- Search -->
          <div class="col-md-4">
            <div class="input-group">
              <input
                v-model="searchQuery"
                @input="debouncedSearch"
                type="text"
                class="form-control"
                placeholder="Search by name or email..."
              >
              <span class="input-group-text">
                <i class="bi-search"></i>
              </span>
            </div>
          </div>

          <!-- Event Type Filter -->
          <div class="col-md-3">
            <select v-model="filters.event_type" @change="fetchLogs" class="form-select">
              <option value="">All Event Types</option>
              <option value="offer.purchased">New Purchase</option>
              <option value="member.subscription.canceled">Subscription Canceled</option>
              <option value="member.subscription.renewed">Subscription Renewed</option>
              <option value="member.subscription.expired">Subscription Expired</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="col-md-3">
            <select v-model="filters.processed" @change="fetchLogs" class="form-select">
              <option value="">All Statuses</option>
              <option value="true">Success</option>
              <option value="false">Failed/Pending</option>
            </select>
          </div>

          <!-- Results per page -->
          <div class="col-md-2">
            <select v-model="pagination.page_size" @change="fetchLogs" class="form-select">
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Webhook Logs Table -->
    <div class="card">
      <div class="card-header">
        <div class="row justify-content-between align-items-center flex-grow-1">
          <div class="col">
            <h4 class="card-header-title">
              Webhook Events
              <span v-if="!loading" class="badge bg-secondary ms-2">{{ pagination.total_count }}</span>
            </h4>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Loading State -->
        <div v-if="loading && logs.length === 0" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger">
          <i class="bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="logs.length === 0 && !loading" class="text-center py-4 text-muted">
          <i class="bi-inbox display-4 mb-3"></i>
          <p>No webhook events found</p>
        </div>

        <!-- Logs Table -->
        <div v-else class="table-responsive">
          <table class="table table-borderless table-thead-bordered table-nowrap table-align-middle table-sm">
            <thead class="thead-light">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Event Type</th>
                <th>Status</th>
                <th>Token</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <!-- Date -->
                <td>
                  <span class="text-nowrap">{{ log.date }}</span>
                </td>

                <!-- Time -->
                <td>
                  <span class="text-nowrap text-muted">{{ log.time }}</span>
                </td>

                <!-- First Name -->
                <td>
                  <span>{{ log.first_name || 'N/A' }}</span>
                </td>

                <!-- Last Name -->
                <td>
                  <span>{{ log.last_name || 'N/A' }}</span>
                </td>

                <!-- Email -->
                <td>
                  <span class="text-break">{{ log.email || 'N/A' }}</span>
                </td>

                <!-- Event Type -->
                <td>
                  <span class="badge" :class="getEventTypeBadgeClass(log.event_type)">
                    {{ formatEventType(log.event_type) }}
                  </span>
                </td>

                <!-- Status -->
                <td>
                  <span v-if="log.processed" class="badge bg-success">
                    <i class="bi-check-circle me-1"></i>Success
                  </span>
                  <span v-else-if="log.error_message" class="badge bg-danger"
                        :title="log.error_message">
                    <i class="bi-x-circle me-1"></i>Failed
                  </span>
                  <span v-else class="badge bg-warning">
                    <i class="bi-clock me-1"></i>Pending
                  </span>
                </td>

                <!-- Token -->
                <td>
                  <span v-if="log.token" class="font-monospace text-muted small"
                        :title="log.token">
                    {{ truncateToken(log.token) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total_pages > 1" class="mt-4">
          <nav>
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                <button class="page-link" @click="changePage(pagination.page - 1)"
                        :disabled="pagination.page === 1">
                  Previous
                </button>
              </li>
              <li v-for="page in displayedPages" :key="page"
                  class="page-item" :class="{ active: page === pagination.page }">
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page === pagination.total_pages }">
                <button class="page-link" @click="changePage(pagination.page + 1)"
                        :disabled="pagination.page === pagination.total_pages">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_CONFIG } from '@/config';

export default {
  name: 'AdminWebhookLogs',
  setup() {
    const logs = ref([]);
    const loading = ref(false);
    const error = ref('');
    const searchQuery = ref('');

    const filters = ref({
      event_type: '',
      processed: ''
    });

    const pagination = ref({
      page: 1,
      page_size: 50,
      total_count: 0,
      total_pages: 0
    });

    let searchTimeout = null;

    // Fetch webhook logs from API
    const fetchLogs = async () => {
      loading.value = true;
      error.value = '';

      try {
        const params = {
          page: pagination.value.page,
          page_size: pagination.value.page_size,
          event_type: filters.value.event_type,
          processed: filters.value.processed,
          search: searchQuery.value
        };

        const response = await axios.get(`${API_CONFIG.API_URL}/admin/kajabi/webhooks/`, { params });

        logs.value = response.data.results;
        pagination.value.total_count = response.data.total_count;
        pagination.value.total_pages = response.data.total_pages;
      } catch (err) {
        console.error('Error fetching webhook logs:', err);
        error.value = err.response?.data?.error || 'Failed to load webhook logs';
      } finally {
        loading.value = false;
      }
    };

    // Debounced search
    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        fetchLogs();
      }, 500);
    };

    // Refresh logs
    const refreshLogs = () => {
      pagination.value.page = 1;
      fetchLogs();
    };

    // Change page
    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.total_pages) {
        pagination.value.page = page;
        fetchLogs();
      }
    };

    // Computed property for displayed page numbers
    const displayedPages = computed(() => {
      const current = pagination.value.page;
      const total = pagination.value.total_pages;
      const pages = [];

      // Show up to 7 page numbers
      let start = Math.max(1, current - 3);
      let end = Math.min(total, current + 3);

      // Adjust if near the beginning or end
      if (current <= 4) {
        end = Math.min(7, total);
      }
      if (current >= total - 3) {
        start = Math.max(1, total - 6);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    });

    // Format event type for display
    const formatEventType = (eventType) => {
      const typeMap = {
        'offer.purchased': 'New Purchase',
        'member.subscription.canceled': 'Canceled',
        'member.subscription.renewed': 'Renewed',
        'member.subscription.expired': 'Expired'
      };
      return typeMap[eventType] || eventType;
    };

    // Get badge class for event type
    const getEventTypeBadgeClass = (eventType) => {
      const classMap = {
        'offer.purchased': 'bg-primary',
        'member.subscription.canceled': 'bg-danger',
        'member.subscription.renewed': 'bg-success',
        'member.subscription.expired': 'bg-warning'
      };
      return classMap[eventType] || 'bg-secondary';
    };

    // Truncate token for display
    const truncateToken = (token) => {
      if (!token || token.length <= 20) return token;
      return token.substring(0, 20) + '...';
    };

    // Load logs on mount
    onMounted(() => {
      fetchLogs();
    });

    return {
      logs,
      loading,
      error,
      searchQuery,
      filters,
      pagination,
      fetchLogs,
      debouncedSearch,
      refreshLogs,
      changePage,
      displayedPages,
      formatEventType,
      getEventTypeBadgeClass,
      truncateToken
    };
  }
};
</script>

<style scoped>
.admin-webhook-logs {
  padding: 1.5rem;
}

.table-sm td, .table-sm th {
  padding: 0.5rem;
}

.font-monospace {
  font-family: 'Courier New', Courier, monospace;
}

.text-break {
  word-break: break-word;
}
</style>
