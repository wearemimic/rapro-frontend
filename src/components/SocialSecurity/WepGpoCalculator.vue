<template>
  <div class="wep-gpo-calculator">
    <div class="card border-secondary">
      <div class="card-header bg-secondary text-white">
        <div class="d-flex align-items-center">
          <i class="bi bi-building me-2"></i>
          <h6 class="mb-0">WEP/GPO Calculator</h6>
        </div>
      </div>
      <div class="card-body">
        <!-- WEP/GPO Selection -->
        <div class="mb-4">
          <p class="text-muted mb-3">
            These provisions affect individuals who receive a pension from employment not covered by Social Security
            (typically government jobs).
          </p>

          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="wepApplies"
              id="wepCheck"
              @change="calculate"
            >
            <label class="form-check-label" for="wepCheck">
              <strong>Windfall Elimination Provision (WEP) applies</strong>
              <small class="d-block text-muted">Reduces your own Social Security benefit</small>
            </label>
          </div>

          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="gpoApplies"
              id="gpoCheck"
              @change="calculate"
            >
            <label class="form-check-label" for="gpoCheck">
              <strong>Government Pension Offset (GPO) applies</strong>
              <small class="d-block text-muted">Reduces spousal/survivor benefits</small>
            </label>
          </div>
        </div>

        <!-- Pension Amount Input -->
        <div v-if="wepApplies || gpoApplies" class="mb-4">
          <label class="form-label fw-bold">Monthly Pension Amount</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input
              type="number"
              v-model.number="pensionAmount"
              class="form-control"
              placeholder="0"
              @input="calculate"
            >
            <span class="input-group-text">/month</span>
          </div>
          <small class="text-muted">
            From employment not covered by Social Security (e.g., federal, state, or local government)
          </small>
        </div>

        <!-- WEP Calculation -->
        <div v-if="wepApplies && pensionAmount > 0" class="wep-results mb-4">
          <h6 class="mb-3"><i class="bi bi-calculator me-2"></i>WEP Impact</h6>

          <div class="alert alert-warning">
            <p class="mb-2">
              <strong>What is WEP?</strong> The Windfall Elimination Provision reduces your Social Security benefit
              if you also receive a pension from work not covered by Social Security.
            </p>
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">Before WEP</small>
                <strong class="text-primary d-block fs-5">{{ formatCurrency(originalBenefit) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">WEP Reduction</small>
                <strong class="text-danger d-block fs-5">-{{ formatCurrency(wepReduction) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">After WEP</small>
                <strong class="text-success d-block fs-5">{{ formatCurrency(benefitAfterWep) }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td>Maximum WEP reduction ({{ currentYear }}):</td>
                  <td class="text-end"><strong>{{ formatCurrency(maxWepReduction) }}</strong></td>
                </tr>
                <tr>
                  <td>Actual reduction:</td>
                  <td class="text-end text-danger"><strong>{{ formatCurrency(wepReduction) }}</strong></td>
                </tr>
                <tr>
                  <td>Lifetime impact (to age {{ lifeExpectancy }}):</td>
                  <td class="text-end text-danger"><strong>{{ formatCurrency(lifetimeWepImpact) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Years of Coverage Info -->
          <div class="mt-3 p-3 bg-light rounded">
            <small class="text-muted">
              <strong>Note:</strong> WEP reduction may be lower if you have 20+ years of "substantial earnings"
              under Social Security. The reduction is eliminated entirely at 30+ years. Consult with SSA for exact calculation
              based on your earnings record.
            </small>
          </div>
        </div>

        <!-- GPO Calculation -->
        <div v-if="gpoApplies && pensionAmount > 0" class="gpo-results mb-4">
          <h6 class="mb-3"><i class="bi bi-people me-2"></i>GPO Impact</h6>

          <div class="alert alert-warning">
            <p class="mb-2">
              <strong>What is GPO?</strong> The Government Pension Offset reduces spousal or survivor benefits by
              two-thirds of your government pension.
            </p>
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">Spousal Benefit</small>
                <strong class="text-primary d-block fs-5">{{ formatCurrency(spousalBenefit) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">GPO Offset</small>
                <strong class="text-danger d-block fs-5">-{{ formatCurrency(gpoReduction) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box bg-light p-3 rounded text-center">
                <small class="text-muted d-block">After GPO</small>
                <strong class="text-success d-block fs-5">{{ formatCurrency(benefitAfterGpo) }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td>Your pension amount:</td>
                  <td class="text-end">{{ formatCurrency(pensionAmount) }}/mo</td>
                </tr>
                <tr>
                  <td>Two-thirds of pension:</td>
                  <td class="text-end text-danger">{{ formatCurrency(gpoReduction) }}</td>
                </tr>
                <tr>
                  <td>Spousal/Survivor benefit reduction:</td>
                  <td class="text-end text-danger"><strong>{{ formatCurrency(Math.min(gpoReduction, spousalBenefit)) }}</strong></td>
                </tr>
                <tr v-if="benefitAfterGpo === 0">
                  <td colspan="2" class="text-danger">
                    <strong>⚠️ Your spousal/survivor benefit is completely eliminated by GPO</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Educational Resources -->
        <div class="educational-section mt-4">
          <h6 class="mb-3"><i class="bi bi-book me-2"></i>Learn More</h6>

          <div class="accordion" id="wepGpoAccordion">
            <!-- WEP FAQ -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#wepFaq">
                  Who is affected by WEP?
                </button>
              </h2>
              <div id="wepFaq" class="accordion-collapse collapse" data-bs-parent="#wepGpoAccordion">
                <div class="accordion-body">
                  <ul class="mb-0">
                    <li>Federal employees hired before 1984</li>
                    <li>State and local government employees not covered by Social Security</li>
                    <li>Employees of non-profit organizations that opted out of Social Security</li>
                    <li>Individuals who worked in other countries</li>
                  </ul>
                  <p class="mt-2 mb-0">
                    <strong>Exception:</strong> WEP doesn't apply if you have 30+ years of "substantial earnings" under Social Security.
                  </p>
                </div>
              </div>
            </div>

            <!-- GPO FAQ -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#gpoFaq">
                  Who is affected by GPO?
                </button>
              </h2>
              <div id="gpoFaq" class="accordion-collapse collapse" data-bs-parent="#wepGpoAccordion">
                <div class="accordion-body">
                  <p>GPO affects government pension recipients who are eligible for:</p>
                  <ul class="mb-2">
                    <li>Spousal benefits (based on spouse's work record)</li>
                    <li>Widow(er) benefits (survivor benefits)</li>
                  </ul>
                  <p class="mb-0">
                    <strong>Important:</strong> GPO does NOT affect your own Social Security benefit based on your own work record.
                    Use WEP for that calculation.
                  </p>
                </div>
              </div>
            </div>

            <!-- Resources -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#resources">
                  Official Resources
                </button>
              </h2>
              <div id="resources" class="accordion-collapse collapse" data-bs-parent="#wepGpoAccordion">
                <div class="accordion-body">
                  <ul class="mb-0">
                    <li><a href="https://www.ssa.gov/pubs/EN-05-10045.pdf" target="_blank">SSA: WEP Fact Sheet</a></li>
                    <li><a href="https://www.ssa.gov/pubs/EN-05-10007.pdf" target="_blank">SSA: GPO Fact Sheet</a></li>
                    <li><a href="https://www.ssa.gov/planners/retire/anyPiaWepjs04.html" target="_blank">SSA: Online WEP Calculator</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WepGpoCalculator',
  props: {
    originalBenefit: {
      type: Number,
      required: true
    },
    spousalBenefit: {
      type: Number,
      default: 0
    },
    lifeExpectancy: {
      type: Number,
      default: 85
    },
    currentAge: {
      type: Number,
      required: true
    },
    initialPensionAmount: {
      type: Number,
      default: 0
    },
    initialWepApplies: {
      type: Boolean,
      default: false
    },
    initialGpoApplies: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      wepApplies: this.initialWepApplies,
      gpoApplies: this.initialGpoApplies,
      pensionAmount: this.initialPensionAmount,
      currentYear: new Date().getFullYear(),
      maxWepReduction: 587 // 2025 maximum WEP reduction
    };
  },
  computed: {
    wepReduction() {
      if (!this.wepApplies || !this.pensionAmount) return 0;

      // WEP reduction is the lesser of:
      // 1. Maximum WEP reduction ($587 in 2025)
      // 2. 50% of the pension amount
      const halfPension = this.pensionAmount * 0.5;
      return Math.min(this.maxWepReduction, halfPension);
    },
    benefitAfterWep() {
      return Math.max(0, this.originalBenefit - this.wepReduction);
    },
    lifetimeWepImpact() {
      const yearsRemaining = this.lifeExpectancy - this.currentAge;
      return this.wepReduction * 12 * yearsRemaining;
    },
    gpoReduction() {
      if (!this.gpoApplies || !this.pensionAmount) return 0;

      // GPO reduces spousal/survivor benefit by 2/3 of pension
      return this.pensionAmount * (2/3);
    },
    benefitAfterGpo() {
      return Math.max(0, this.spousalBenefit - this.gpoReduction);
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
    calculate() {
      this.$emit('wep-gpo-changed', {
        wepApplies: this.wepApplies,
        gpoApplies: this.gpoApplies,
        pensionAmount: this.pensionAmount,
        wepReduction: this.wepReduction,
        benefitAfterWep: this.benefitAfterWep,
        gpoReduction: this.gpoReduction,
        benefitAfterGpo: this.benefitAfterGpo
      });
    }
  }
};
</script>

<style scoped>
.wep-gpo-calculator {
  margin-bottom: 1rem;
}

.metric-box small {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.accordion-button {
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

.accordion-body {
  font-size: 0.875rem;
}
</style>
