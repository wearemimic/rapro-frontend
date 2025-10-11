<template>
  <div class="earnings-test-calculator">
    <div class="card border-warning">
      <div class="card-header bg-warning text-dark">
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <h6 class="mb-0">Earnings Test Impact</h6>
        </div>
      </div>
      <div class="card-body">
        <div class="alert alert-warning mb-3">
          <strong>Important:</strong> You're claiming at age {{ claimingAge }} (before your Full Retirement Age of {{ fra }}).
          If you have earned income, your benefits may be reduced.
        </div>

        <!-- Earned Income Input -->
        <div class="mb-3">
          <label class="form-label fw-bold">Annual Earned Income</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input
              type="number"
              v-model.number="earnedIncome"
              class="form-control"
              placeholder="0"
              @input="calculateReduction"
            >
          </div>
          <small class="text-muted">
            Includes wages and self-employment income. Does NOT include pensions, investments, or Social Security.
          </small>
        </div>

        <!-- Calculation Results -->
        <div v-if="earnedIncome > 0" class="calculation-results">
          <div class="row g-3">
            <!-- Earnings Limit -->
            <div class="col-md-6">
              <div class="metric-box bg-light p-3 rounded">
                <small class="text-muted d-block">Earnings Limit ({{ currentYear }})</small>
                <strong class="text-primary">{{ formatCurrency(earningsLimit) }}</strong>
              </div>
            </div>

            <!-- Excess Earnings -->
            <div class="col-md-6">
              <div class="metric-box bg-light p-3 rounded">
                <small class="text-muted d-block">Excess Earnings</small>
                <strong :class="excessEarnings > 0 ? 'text-danger' : 'text-success'">
                  {{ formatCurrency(excessEarnings) }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Reduction Calculation -->
          <div v-if="excessEarnings > 0" class="mt-3">
            <div class="alert alert-danger">
              <h6 class="alert-heading">Benefit Reduction</h6>
              <p class="mb-2">
                <strong>Rule:</strong> $1 withheld for every $2 earned over the limit
              </p>
              <p class="mb-0">
                <strong>Annual Reduction:</strong> {{ formatCurrency(annualReduction) }}<br>
                <strong>Monthly Reduction:</strong> {{ formatCurrency(monthlyReduction) }}
              </p>
            </div>

            <!-- Before/After Comparison -->
            <div class="comparison-table">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th></th>
                    <th class="text-end">Monthly</th>
                    <th class="text-end">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Gross Benefit</strong></td>
                    <td class="text-end">{{ formatCurrency(grossMonthlyBenefit) }}</td>
                    <td class="text-end">{{ formatCurrency(grossMonthlyBenefit * 12) }}</td>
                  </tr>
                  <tr class="text-danger">
                    <td>- Earnings Test Reduction</td>
                    <td class="text-end">-{{ formatCurrency(monthlyReduction) }}</td>
                    <td class="text-end">-{{ formatCurrency(annualReduction) }}</td>
                  </tr>
                  <tr class="table-active">
                    <td><strong>Net Benefit</strong></td>
                    <td class="text-end"><strong>{{ formatCurrency(netMonthlyBenefit) }}</strong></td>
                    <td class="text-end"><strong>{{ formatCurrency(netMonthlyBenefit * 12) }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Recommendations -->
            <div class="mt-3">
              <h6><i class="bi bi-lightbulb me-2"></i>Recommendations</h6>
              <ul class="list-unstyled">
                <li class="mb-2">
                  <i class="bi bi-check-circle text-success me-2"></i>
                  <strong>Option 1:</strong> Delay claiming until Full Retirement Age ({{ fra }}) to avoid earnings test
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle text-success me-2"></i>
                  <strong>Option 2:</strong> Reduce work hours to earn no more than {{ formatCurrency(earningsLimit) }}/year
                </li>
                <li class="mb-2">
                  <i class="bi bi-info-circle text-primary me-2"></i>
                  <strong>Good News:</strong> Benefits withheld are not lost! They're recalculated at FRA to increase your monthly amount
                </li>
              </ul>
            </div>
          </div>

          <!-- No Reduction Message -->
          <div v-else class="mt-3">
            <div class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              <strong>No Reduction:</strong> Your earned income is below the limit. Your benefits will not be reduced.
            </div>
          </div>
        </div>

        <!-- Educational Info -->
        <div class="mt-3 p-3 bg-light rounded">
          <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>About the Earnings Test</h6>
          <small class="text-muted">
            <strong>Who it affects:</strong> People claiming Social Security before Full Retirement Age who continue to work.<br>
            <strong>What happens at FRA:</strong> The earnings test no longer applies, and benefits withheld are recalculated to increase your monthly payment.<br>
            <strong>Special rule for FRA year:</strong> A higher limit applies in the year you reach FRA (${{ formatCurrency(fraYearLimit) }} in {{ currentYear }}).
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EarningsTestCalculator',
  props: {
    claimingAge: {
      type: Number,
      required: true
    },
    fra: {
      type: Number,
      required: true
    },
    monthlyBenefit: {
      type: Number,
      required: true
    },
    initialEarnedIncome: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      earnedIncome: this.initialEarnedIncome,
      currentYear: new Date().getFullYear(),
      // 2025 SSA earnings limits
      earningsLimit: 22320,
      fraYearLimit: 59520
    };
  },
  computed: {
    grossMonthlyBenefit() {
      return this.monthlyBenefit;
    },
    excessEarnings() {
      return Math.max(0, this.earnedIncome - this.earningsLimit);
    },
    annualReduction() {
      // $1 withheld for every $2 over limit
      const reduction = this.excessEarnings / 2;
      // Cannot reduce below zero
      return Math.min(reduction, this.grossMonthlyBenefit * 12);
    },
    monthlyReduction() {
      return this.annualReduction / 12;
    },
    netMonthlyBenefit() {
      return Math.max(0, this.grossMonthlyBenefit - this.monthlyReduction);
    }
  },
  methods: {
    formatCurrency(value) {
      if (!value && value !== 0) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    calculateReduction() {
      // Emit changes to parent
      this.$emit('earnings-changed', {
        earnedIncome: this.earnedIncome,
        reduction: this.annualReduction,
        netBenefit: this.netMonthlyBenefit
      });
    }
  }
};
</script>

<style scoped>
.earnings-test-calculator {
  margin-bottom: 1rem;
}

.metric-box {
  text-align: center;
}

.metric-box small {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.metric-box strong {
  font-size: 1.25rem;
}

.comparison-table {
  margin-top: 1rem;
}

.comparison-table td,
.comparison-table th {
  padding: 0.5rem;
}
</style>
