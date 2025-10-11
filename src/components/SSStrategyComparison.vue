<template>
  <div class="strategy-comparison">
    <!-- Comparison Table -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Strategy Comparison</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="$emit('save-strategies')">
            <i class="bi bi-floppy"></i> Save
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="printComparison">
            <i class="bi bi-printer"></i> Print
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover strategy-table mb-0">
            <thead class="table-light">
              <tr>
                <th class="metric-label">Strategy</th>
                <th v-for="strategy in strategies" :key="strategy.id" class="strategy-column">
                  <div class="strategy-header">
                    <input
                      type="text"
                      v-model="strategy.name"
                      class="form-control form-control-sm strategy-name-input"
                      @blur="$emit('rename-strategy', strategy)"
                    >
                    <button
                      class="btn btn-sm btn-link text-danger p-0 ms-2"
                      @click="$emit('delete-strategy', strategy.id)"
                      title="Delete strategy"
                    >
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- Claiming Ages -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Claiming Ages</td>
              </tr>
              <tr>
                <td class="metric-label">Primary Claims At</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span class="value-primary">Age {{ strategy.primaryClaimingAge }}</span>
                  <span v-if="strategy.primaryClaimingAge === getBestValue('primaryClaimingAge', 'max')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>
              <tr v-if="hasSpouse">
                <td class="metric-label">Spouse Claims At</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span class="value-spouse">Age {{ strategy.spouseClaimingAge }}</span>
                  <span v-if="strategy.spouseClaimingAge === getBestValue('spouseClaimingAge', 'max')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>

              <!-- Monthly Benefits -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Monthly Benefits (at claiming)</td>
              </tr>
              <tr>
                <td class="metric-label">Primary</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span class="value-primary">{{ formatCurrency(strategy.primaryMonthlyBenefit) }}</span>
                  <span v-if="strategy.primaryMonthlyBenefit === getBestValue('primaryMonthlyBenefit')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>
              <tr v-if="hasSpouse">
                <td class="metric-label">Spouse</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span class="value-spouse">{{ formatCurrency(strategy.spouseMonthlyBenefit) }}</span>
                  <span v-if="strategy.spouseMonthlyBenefit === getBestValue('spouseMonthlyBenefit')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>
              <tr>
                <td class="metric-label fw-bold">Total Monthly</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value fw-bold">
                  {{ formatCurrency(strategy.totalMonthlyBenefit) }}
                  <span v-if="strategy.totalMonthlyBenefit === getBestValue('totalMonthlyBenefit')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>
              <tr v-if="hasSpouse">
                <td class="metric-label">Survivor Benefit</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span v-if="strategy.survivorBenefitIncluded" class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i>Included
                  </span>
                  <span v-else class="badge bg-secondary">
                    <i class="bi bi-x-circle me-1"></i>Not Included
                  </span>
                </td>
              </tr>

              <!-- Lifetime Benefits -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">
                  Lifetime Benefits (to age {{ lifeExpectancy }})
                </td>
              </tr>
              <tr>
                <td class="metric-label">Gross Benefits</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  {{ formatCurrency(strategy.lifetimeGross) }}
                  <span v-if="strategy.lifetimeGross === getBestValue('lifetimeGross')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>
              <tr>
                <td class="metric-label text-danger">
                  <span class="ms-3">- Total Taxes in Retirement</span>
                </td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value text-danger">
                  -{{ formatCurrency(strategy.totalTaxes) }}
                </td>
              </tr>
              <tr>
                <td class="metric-label text-danger">
                  <span class="ms-3">- IRMAA Costs</span>
                </td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value text-danger">
                  -{{ formatCurrency(strategy.totalIRMAA) }}
                </td>
              </tr>
              <tr class="highlight-row">
                <td class="metric-label fw-bold text-success">NET Benefits</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value fw-bold text-success">
                  {{ formatCurrency(strategy.lifetimeNet) }}
                  <span v-if="strategy.lifetimeNet === getBestValue('lifetimeNet')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>

              <!-- Break-Even Analysis -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Break-Even Analysis</td>
              </tr>
              <tr>
                <td class="metric-label">Break-Even Age</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span v-if="strategy.breakEvenAge">
                    Age {{ strategy.breakEvenAge }}
                    <small class="text-muted d-block">vs earliest strategy</small>
                  </span>
                  <span v-else class="text-muted">Baseline</span>
                </td>
              </tr>

              <!-- Asset Impact -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Asset Impact</td>
              </tr>
              <tr>
                <td class="metric-label">Assets Depleted At</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <span v-if="strategy.assetDepletionAge" class="text-warning">
                    <i class="bi bi-exclamation-triangle"></i> Age {{ strategy.assetDepletionAge }}
                  </span>
                  <span v-else class="text-success">
                    <i class="bi bi-check-circle"></i> No depletion
                  </span>
                </td>
              </tr>
              <tr>
                <td class="metric-label">Portfolio @ Age {{ lifeExpectancy }}</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  {{ formatCurrency(strategy.portfolioAtLifeExpectancy) }}
                  <span v-if="strategy.portfolioAtLifeExpectancy === getBestValue('portfolioAtLifeExpectancy')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>

              <!-- Survivor Benefits -->
              <tr v-if="hasSpouse" class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Survivor Benefits</td>
              </tr>
              <tr v-if="hasSpouse">
                <td class="metric-label">If Spouse Passes</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  {{ formatCurrency(strategy.survivorBenefitPrimary) }}/mo
                  <span v-if="strategy.survivorBenefitPrimary === getBestValue('survivorBenefitPrimary')" class="badge bg-success ms-2">👑</span>
                </td>
              </tr>

              <!-- Recommendations -->
              <tr class="section-header">
                <td colspan="100%" class="bg-light fw-bold">Best For</td>
              </tr>
              <tr>
                <td class="metric-label">Ideal Scenario</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <small class="text-muted">{{ strategy.bestFor }}</small>
                </td>
              </tr>
              <tr>
                <td class="metric-label">Considerations</td>
                <td v-for="strategy in strategies" :key="strategy.id" class="strategy-value">
                  <small class="text-warning">{{ strategy.considerations }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SSStrategyComparison',
  props: {
    strategies: {
      type: Array,
      required: true,
      // Each strategy should have: name, primaryClaimingAge, spouseClaimingAge,
      // primaryMonthlyBenefit, spouseMonthlyBenefit, lifetimeGross, lifetimeNet,
      // totalTaxes, totalIRMAA, breakEvenAge, assetDepletionAge, survivorBenefitIncluded, etc.
    },
    hasSpouse: {
      type: Boolean,
      default: false
    },
    lifeExpectancy: {
      type: Number,
      default: 85
    }
  },
  methods: {
    formatCurrency(value) {
      if (!value && value !== 0) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    getBestValue(metric, mode = 'max') {
      if (!this.strategies || this.strategies.length === 0) return null;

      const values = this.strategies
        .map(s => s[metric])
        .filter(v => v !== null && v !== undefined);

      if (values.length === 0) return null;

      if (mode === 'max') {
        return Math.max(...values);
      } else {
        return Math.min(...values);
      }
    },
    printComparison() {
      window.print();
    }
  }
};
</script>

<style scoped>
.strategy-comparison {
  margin-bottom: 2rem;
}

.strategy-table {
  font-size: 0.9rem;
}

.strategy-table th,
.strategy-table td {
  vertical-align: middle;
  padding: 0.75rem;
}

.metric-label {
  font-weight: 500;
  background: #f8f9fa;
  min-width: 200px;
  position: sticky;
  left: 0;
  z-index: 10;
}

.strategy-column {
  min-width: 220px;
  text-align: center;
}

.strategy-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.strategy-name-input {
  font-weight: 600;
  text-align: center;
  border: 1px solid transparent;
}

.strategy-name-input:focus {
  border-color: #007bff;
}

.strategy-value {
  text-align: center;
  font-weight: 500;
}

.section-header td {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.highlight-row {
  background: #f0f8f0;
}

.highlight-row td {
  font-size: 1.1rem;
}

.value-primary {
  color: #007bff;
}

.value-spouse {
  color: #17a2b8;
}

.badge {
  font-size: 0.75rem;
}

/* Print styles */
@media print {
  .btn {
    display: none;
  }

  .strategy-table {
    font-size: 0.8rem;
  }

  .strategy-table th,
  .strategy-table td {
    padding: 0.5rem;
  }
}
</style>
