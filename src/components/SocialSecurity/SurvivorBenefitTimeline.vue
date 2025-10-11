<template>
  <div class="survivor-benefit-timeline">
    <div class="card border-info">
      <div class="card-header bg-info text-white">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <i class="bi bi-heart-fill me-2"></i>
            <h6 class="mb-0 d-inline">Survivor Benefit Analysis</h6>
          </div>
          <small>Lifetime Planning</small>
        </div>
      </div>
      <div class="card-body">
        <!-- Death Age Inputs -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">
              <i class="bi bi-person-fill text-primary me-1"></i>
              {{ primaryName }}'s Assumed Death Age
            </label>
            <input
              type="number"
              v-model.number="primaryDeathAge"
              class="form-control"
              min="65"
              max="100"
              @input="recalculateTimeline"
            >
            <small class="text-muted">Life expectancy: {{ primaryLifeExpectancy }}</small>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold">
              <i class="bi bi-person-fill text-info me-1"></i>
              {{ spouseName }}'s Assumed Death Age
            </label>
            <input
              type="number"
              v-model.number="spouseDeathAge"
              class="form-control"
              min="65"
              max="100"
              @input="recalculateTimeline"
            >
            <small class="text-muted">Life expectancy: {{ spouseLifeExpectancy }}</small>
          </div>
        </div>

        <!-- Visual Timeline -->
        <div class="timeline-visualization mb-4">
          <h6 class="mb-3">Benefit Timeline</h6>

          <!-- Primary Timeline -->
          <div class="timeline-row mb-3">
            <div class="timeline-label">
              <strong class="text-primary">{{ primaryName }}</strong>
              <small class="d-block text-muted">Claims at {{ primaryClaimingAge }}</small>
            </div>
            <div class="timeline-bar">
              <div class="timeline-track">
                <div
                  class="timeline-segment claiming"
                  :style="getPrimaryClaimingStyle()"
                ></div>
                <div
                  class="timeline-segment receiving"
                  :style="getPrimaryReceivingStyle()"
                ></div>
                <div class="timeline-marker death" :style="{ left: getAgePosition(primaryDeathAge) }">
                  <i class="bi bi-x-circle-fill"></i>
                  <span class="marker-label">{{ primaryDeathAge }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Spouse Timeline -->
          <div class="timeline-row">
            <div class="timeline-label">
              <strong class="text-info">{{ spouseName }}</strong>
              <small class="d-block text-muted">Claims at {{ spouseClaimingAge }}</small>
            </div>
            <div class="timeline-bar">
              <div class="timeline-track">
                <div
                  class="timeline-segment claiming"
                  :style="getSpouseClaimingStyle()"
                ></div>
                <div
                  class="timeline-segment receiving"
                  :style="getSpouseReceivingStyle()"
                ></div>
                <div
                  v-if="survivorSwitch"
                  class="timeline-segment survivor"
                  :style="getSurvivorStyle()"
                ></div>
                <div class="timeline-marker death" :style="{ left: getAgePosition(spouseDeathAge) }">
                  <i class="bi bi-x-circle-fill"></i>
                  <span class="marker-label">{{ spouseDeathAge }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Age Scale -->
          <div class="age-scale">
            <span v-for="age in ageMarkers" :key="age" class="age-marker">{{ age }}</span>
          </div>
        </div>

        <!-- Combined Income Timeline -->
        <div class="income-timeline mb-4">
          <h6 class="mb-3">Combined Monthly Income</h6>
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>Period</th>
                <th class="text-end">{{ primaryName }}</th>
                <th class="text-end">{{ spouseName }}</th>
                <th class="text-end">Combined</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in incomePeriods" :key="period.label">
                <td><strong>{{ period.label }}</strong></td>
                <td class="text-end text-primary">{{ formatCurrency(period.primaryBenefit) }}</td>
                <td class="text-end text-info">{{ formatCurrency(period.spouseBenefit) }}</td>
                <td class="text-end"><strong>{{ formatCurrency(period.combined) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Survivor Benefit Analysis -->
        <div v-if="survivorSwitch" class="survivor-analysis">
          <div class="alert alert-info">
            <h6 class="alert-heading">
              <i class="bi bi-info-circle me-2"></i>Survivor Benefit Insight
            </h6>
            <p class="mb-2">
              <strong>When {{ primaryName }} passes at age {{ primaryDeathAge }}:</strong>
            </p>
            <ul class="mb-2">
              <li>{{ spouseName }} switches to survivor benefit (100% of {{ primaryName }}'s benefit)</li>
              <li>New monthly benefit: {{ formatCurrency(survivorBenefit) }}</li>
              <li>Increase from current: {{ formatCurrency(survivorBenefit - spouseOwnBenefit) }}/month</li>
              <li>Years receiving survivor benefit: {{ yearsReceivingSurvivor }}</li>
              <li>Total survivor benefits: {{ formatCurrency(totalSurvivorBenefits) }}</li>
            </ul>
            <p class="mb-0">
              <strong>💡 Optimization Tip:</strong> {{ optimizationTip }}
            </p>
          </div>
        </div>

        <!-- Alternative Scenario -->
        <div v-else class="survivor-analysis">
          <div class="alert alert-warning">
            <h6 class="alert-heading">
              <i class="bi bi-info-circle me-2"></i>Survivor Benefit Scenario
            </h6>
            <p class="mb-0">
              <strong>When {{ spouseName }} passes at age {{ spouseDeathAge }}:</strong><br>
              {{ primaryName }} continues receiving their own benefit of {{ formatCurrency(primaryBenefit) }}/month.
              Since {{ primaryName }}'s benefit is higher than {{ spouseName }}'s, there is no survivor benefit increase.
            </p>
          </div>
        </div>

        <!-- Legend -->
        <div class="timeline-legend mt-3">
          <div class="d-flex flex-wrap gap-3">
            <div class="legend-item">
              <span class="legend-color claiming"></span>
              <small>Before Claiming</small>
            </div>
            <div class="legend-item">
              <span class="legend-color receiving"></span>
              <small>Receiving Own Benefit</small>
            </div>
            <div class="legend-item">
              <span class="legend-color survivor"></span>
              <small>Receiving Survivor Benefit</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SurvivorBenefitTimeline',
  props: {
    primaryName: {
      type: String,
      default: 'Primary'
    },
    spouseName: {
      type: String,
      default: 'Spouse'
    },
    primaryCurrentAge: {
      type: Number,
      required: true
    },
    spouseCurrentAge: {
      type: Number,
      required: true
    },
    primaryClaimingAge: {
      type: Number,
      required: true
    },
    spouseClaimingAge: {
      type: Number,
      required: true
    },
    primaryBenefit: {
      type: Number,
      required: true
    },
    spouseBenefit: {
      type: Number,
      required: true
    },
    primaryLifeExpectancy: {
      type: Number,
      required: true
    },
    spouseLifeExpectancy: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      primaryDeathAge: this.primaryLifeExpectancy,
      spouseDeathAge: this.spouseLifeExpectancy,
      minAge: 60,
      maxAge: 100
    };
  },
  computed: {
    ageMarkers() {
      return [60, 65, 70, 75, 80, 85, 90, 95, 100];
    },
    spouseOwnBenefit() {
      return this.spouseBenefit;
    },
    survivorBenefit() {
      // Survivor gets 100% of deceased spouse's benefit if higher
      return Math.max(this.primaryBenefit, this.spouseOwnBenefit);
    },
    survivorSwitch() {
      // Survivor benefit applies if primary dies first AND primary's benefit is higher
      return this.primaryDeathAge < this.spouseDeathAge && this.primaryBenefit > this.spouseOwnBenefit;
    },
    yearsReceivingSurvivor() {
      if (!this.survivorSwitch) return 0;
      return this.spouseDeathAge - this.primaryDeathAge;
    },
    totalSurvivorBenefits() {
      return this.yearsReceivingSurvivor * 12 * this.survivorBenefit;
    },
    incomePeriods() {
      const periods = [];

      // Period 1: Before either claims
      const earliestClaim = Math.min(this.primaryClaimingAge, this.spouseClaimingAge);
      if (earliestClaim > this.primaryCurrentAge) {
        periods.push({
          label: `Now - Age ${earliestClaim}`,
          primaryBenefit: 0,
          spouseBenefit: 0,
          combined: 0
        });
      }

      // Period 2: Both claiming
      const latestClaim = Math.max(this.primaryClaimingAge, this.spouseClaimingAge);
      const firstDeath = Math.min(this.primaryDeathAge, this.spouseDeathAge);

      if (latestClaim < firstDeath) {
        periods.push({
          label: `Age ${latestClaim} - ${firstDeath}`,
          primaryBenefit: this.primaryBenefit,
          spouseBenefit: this.spouseOwnBenefit,
          combined: this.primaryBenefit + this.spouseOwnBenefit
        });
      }

      // Period 3: After first death
      if (this.survivorSwitch) {
        periods.push({
          label: `Age ${this.primaryDeathAge} - ${this.spouseDeathAge}`,
          primaryBenefit: 0,
          spouseBenefit: this.survivorBenefit,
          combined: this.survivorBenefit
        });
      } else {
        periods.push({
          label: `Age ${this.spouseDeathAge} - ${this.primaryDeathAge}`,
          primaryBenefit: this.primaryBenefit,
          spouseBenefit: 0,
          combined: this.primaryBenefit
        });
      }

      return periods;
    },
    optimizationTip() {
      const increase = this.survivorBenefit - this.spouseOwnBenefit;
      const lifetimeIncrease = increase * 12 * this.yearsReceivingSurvivor;

      if (this.primaryClaimingAge < 70) {
        return `${this.primaryName} should consider delaying to age 70 to maximize survivor benefit for ${this.spouseName}. Each year delayed increases the survivor benefit by approximately 8%, providing ${this.spouseName} an extra ${this.formatCurrency(lifetimeIncrease)} over their lifetime.`;
      }

      return `${this.primaryName} claiming at ${this.primaryClaimingAge} provides ${this.spouseName} a survivor benefit of ${this.formatCurrency(this.survivorBenefit)}/month for ${this.yearsReceivingSurvivor} years.`;
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
    getAgePosition(age) {
      const range = this.maxAge - this.minAge;
      const position = ((age - this.minAge) / range) * 100;
      return `${Math.min(100, Math.max(0, position))}%`;
    },
    getPrimaryClaimingStyle() {
      return {
        left: this.getAgePosition(this.minAge),
        width: `calc(${this.getAgePosition(this.primaryClaimingAge)} - ${this.getAgePosition(this.minAge)})`
      };
    },
    getPrimaryReceivingStyle() {
      return {
        left: this.getAgePosition(this.primaryClaimingAge),
        width: `calc(${this.getAgePosition(this.primaryDeathAge)} - ${this.getAgePosition(this.primaryClaimingAge)})`
      };
    },
    getSpouseClaimingStyle() {
      return {
        left: this.getAgePosition(this.minAge),
        width: `calc(${this.getAgePosition(this.spouseClaimingAge)} - ${this.getAgePosition(this.minAge)})`
      };
    },
    getSpouseReceivingStyle() {
      const endAge = this.survivorSwitch ? this.primaryDeathAge : this.spouseDeathAge;
      return {
        left: this.getAgePosition(this.spouseClaimingAge),
        width: `calc(${this.getAgePosition(endAge)} - ${this.getAgePosition(this.spouseClaimingAge)})`
      };
    },
    getSurvivorStyle() {
      if (!this.survivorSwitch) return {};
      return {
        left: this.getAgePosition(this.primaryDeathAge),
        width: `calc(${this.getAgePosition(this.spouseDeathAge)} - ${this.getAgePosition(this.primaryDeathAge)})`
      };
    },
    recalculateTimeline() {
      this.$emit('timeline-changed', {
        primaryDeathAge: this.primaryDeathAge,
        spouseDeathAge: this.spouseDeathAge,
        survivorBenefit: this.survivorBenefit,
        totalSurvivorBenefits: this.totalSurvivorBenefits
      });
    }
  }
};
</script>

<style scoped>
.survivor-benefit-timeline {
  margin-bottom: 1rem;
}

.timeline-visualization {
  padding: 1rem 0;
}

.timeline-row {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.timeline-label {
  width: 150px;
  flex-shrink: 0;
}

.timeline-bar {
  flex-grow: 1;
  padding: 0 1rem;
}

.timeline-track {
  position: relative;
  height: 40px;
  background: #f0f0f0;
  border-radius: 4px;
}

.timeline-segment {
  position: absolute;
  height: 100%;
  border-radius: 4px;
  top: 0;
}

.timeline-segment.claiming {
  background: linear-gradient(90deg, transparent, rgba(108, 117, 125, 0.3));
}

.timeline-segment.receiving {
  background: linear-gradient(90deg, rgba(0, 123, 255, 0.6), rgba(0, 123, 255, 0.8));
}

.timeline-segment.survivor {
  background: linear-gradient(90deg, rgba(23, 162, 184, 0.6), rgba(23, 162, 184, 0.8));
  border-left: 3px dashed #fff;
}

.timeline-marker {
  position: absolute;
  top: -10px;
  transform: translateX(-50%);
  z-index: 10;
}

.timeline-marker i {
  font-size: 1.5rem;
  color: #dc3545;
  display: block;
}

.timeline-marker .marker-label {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  font-weight: bold;
  margin-top: -5px;
}

.age-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 calc(150px + 1rem) 0 calc(150px + 1rem);
}

.age-marker {
  font-size: 0.75rem;
  color: #6c757d;
}

.timeline-legend {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  display: inline-block;
  width: 30px;
  height: 20px;
  border-radius: 3px;
}

.legend-color.claiming {
  background: linear-gradient(90deg, transparent, rgba(108, 117, 125, 0.3));
}

.legend-color.receiving {
  background: rgba(0, 123, 255, 0.7);
}

.legend-color.survivor {
  background: rgba(23, 162, 184, 0.7);
}

.income-timeline table {
  font-size: 0.9rem;
}
</style>
