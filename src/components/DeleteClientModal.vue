<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" role="dialog" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title text-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Client
          </h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <div class="alert alert-warning" role="alert">
            <i class="bi bi-info-circle-fill me-2"></i>
            <strong>Warning:</strong> This action will archive the client and all associated data.
          </div>

          <p class="mb-3">
            To confirm deletion, please type the client's name exactly as shown below:
          </p>

          <div class="mb-3">
            <div class="p-3 bg-light rounded text-center">
              <strong class="text-dark">{{ clientFullName }}</strong>
            </div>
          </div>

          <div class="mb-3">
            <label for="confirmName" class="form-label">Type client name to confirm:</label>
            <input
              id="confirmName"
              v-model="confirmationName"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': attemptedSubmit && !isNameMatch }"
              placeholder="Enter client name"
              @keyup.enter="handleDelete"
              autofocus
            >
            <div v-if="attemptedSubmit && !isNameMatch" class="invalid-feedback">
              The name does not match. Please try again.
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="!isNameMatch || isDeleting"
            @click="handleDelete"
          >
            <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i v-else class="bi bi-trash me-2"></i>
            {{ isDeleting ? 'Deleting...' : 'Delete Client' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteClientModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    clientId: {
      type: Number,
      required: true
    },
    clientFullName: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      confirmationName: '',
      attemptedSubmit: false,
      isDeleting: false,
      errorMessage: ''
    };
  },
  computed: {
    isNameMatch() {
      return this.confirmationName.trim() === this.clientFullName.trim();
    }
  },
  watch: {
    show(newVal) {
      // Reset state when modal is opened/closed
      if (newVal) {
        this.confirmationName = '';
        this.attemptedSubmit = false;
        this.errorMessage = '';
        this.isDeleting = false;
      } else {
        // Also reset when modal closes
        this.isDeleting = false;
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    handleDelete() {
      this.attemptedSubmit = true;

      if (!this.isNameMatch) {
        return;
      }

      this.isDeleting = true;
      this.errorMessage = '';

      // Emit the delete event - parent will handle the async operation
      this.$emit('delete', this.clientId);
    }
  }
};
</script>

<style scoped>
.modal.show {
  display: block;
}

.modal-dialog {
  max-width: 500px;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.text-dark {
  font-size: 1.1rem;
}

/* Ensure modal appears above other content */
.modal {
  z-index: 1050;
}

/* Icon styling */
.bi {
  vertical-align: middle;
}
</style>
