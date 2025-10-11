<template>
  <div class="social-security-3-container">
    <!-- Header -->
    <div class="ss-header">
      <div class="d-flex align-items-center gap-3">
        <i class="bi bi-shield-check text-primary" style="font-size: 2rem;"></i>
        <div>
          <h4 class="mb-0">Social Security Strategy Comparison</h4>
          <p class="text-muted mb-0 small">Compare claiming strategies to find the optimal approach for your retirement</p>
        </div>
      </div>
    </div>

    <!-- Strategy Builder (Top Section) -->
    <div class="strategy-builder-section">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light border-0">
          <h5 class="mb-0">
            <i class="bi bi-plus-circle me-2"></i>Quick Strategy Builder
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <!-- Primary Claiming Age -->
            <div class="col-md-6">
              <label class="form-label fw-bold">
                <i class="bi bi-person-fill text-primary me-1"></i>
                {{ client?.first_name || 'Primary' }}'s Claiming Age
              </label>
              <div class="claiming-age-control">
                <div class="d-flex justify-content-between mb-2">
                  <small class="text-muted">Age 62 (Early)</small>
                  <span class="badge bg-primary">{{ primaryClaimingAge }}</span>
                  <small class="text-muted">Age 70 (Maximum)</small>
                </div>
                <input
                  type="range"
                  v-model.number="primaryClaimingAge"
                  class="form-range"
                  min="62"
                  max="70"
                  step="1"
                >
                <div class="mt-2">
                  <small class="text-muted">
                    FRA: {{ primaryFRA }} | Monthly: {{ formatCurrency(currentPrimaryBenefit) }}
                  </small>
                </div>
              </div>
            </div>

            <!-- Spouse Claiming Age -->
            <div class="col-md-6" v-if="hasSpouse">
              <label class="form-label fw-bold">
                <i class="bi bi-person-fill text-info me-1"></i>
                {{ client?.spouse?.first_name || 'Spouse' }}'s Claiming Age
              </label>
              <div class="claiming-age-control">
                <div class="d-flex justify-content-between mb-2">
                  <small class="text-muted">Age 62 (Early)</small>
                  <span class="badge bg-info">{{ spouseClaimingAge }}</span>
                  <small class="text-muted">Age 70 (Maximum)</small>
                </div>
                <input
                  type="range"
                  v-model.number="spouseClaimingAge"
                  class="form-range"
                  min="62"
                  max="70"
                  step="1"
                >
                <div class="mt-2">
                  <small class="text-muted">
                    FRA: {{ spouseFRA }} | Monthly: {{ formatCurrency(currentSpouseBenefit) }}
                  </small>
                </div>
              </div>
            </div>

            <!-- Life Expectancy -->
            <div class="col-md-6">
              <label class="form-label fw-bold">Life Expectancy</label>
              <div class="row g-2">
                <div class="col">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">
                      <i class="bi bi-person-fill text-primary"></i>
                    </span>
                    <input
                      type="number"
                      v-model.number="primaryLifeExpectancy"
                      class="form-control"
                      min="60"
                      max="100"
                    >
                  </div>
                </div>
                <div class="col" v-if="hasSpouse">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">
                      <i class="bi bi-person-fill text-info"></i>
                    </span>
                    <input
                      type="number"
                      v-model.number="spouseLifeExpectancy"
                      class="form-control"
                      min="60"
                      max="100"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Survivor Benefits Toggle (for married couples) -->
            <div v-if="hasSpouse" class="col-md-6">
              <label class="form-label fw-bold">
                <i class="bi bi-heart-fill text-danger me-1"></i>
                Survivor Benefits
              </label>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="survivorBenefitSwitch"
                  v-model="survivorTakesHigherBenefit"
                >
                <label class="form-check-label" for="survivorBenefitSwitch">
                  Survivor takes higher benefit
                </label>
              </div>
              <small class="text-muted d-block mt-1">
                <i class="bi bi-info-circle me-1"></i>
                When one spouse passes, the survivor receives the higher of the two benefits.
                <span v-if="scenarioSurvivorSetting !== null" class="d-block mt-1">
                  <strong>Scenario setting:</strong> {{ scenarioSurvivorSetting ? 'Enabled' : 'Disabled' }}
                </span>
              </small>
            </div>

            <!-- Action Buttons -->
            <div class="col-md-6">
              <label class="form-label fw-bold d-block">Actions</label>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-primary flex-fill"
                  @click="addCurrentStrategyToComparison"
                  :disabled="strategies.length >= 4"
                >
                  <i class="bi bi-plus-circle me-1"></i>Add to Comparison
                </button>
                <button
                  class="btn btn-success"
                  @click="findOptimalStrategy"
                >
                  <i class="bi bi-bullseye me-1"></i>Find Optimal
                </button>
              </div>
              <small class="text-muted d-block mt-1">
                {{ strategies.length }}/4 strategies added
              </small>
            </div>
          </div>

          <!-- Advanced Options (Collapsible) -->
          <div class="mt-3">
            <button
              class="btn btn-link btn-sm p-0 text-decoration-none"
              @click="showAdvanced = !showAdvanced"
            >
              <i class="bi" :class="showAdvanced ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              Advanced Options (WEP/GPO, Earnings Test, Survivor Benefits)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Features Section -->
    <div v-if="showAdvanced" class="advanced-features-section">
      <!-- Earnings Test Calculator -->
      <div v-if="shouldShowEarningsTest" class="mb-3">
        <EarningsTestCalculator
          :claimingAge="primaryClaimingAge"
          :fra="primaryFRA"
          :monthlyBenefit="currentPrimaryBenefit"
          :initialEarnedIncome="earnedIncome"
          @earnings-changed="handleEarningsChanged"
        />
      </div>

      <!-- Survivor Benefit Timeline -->
      <div v-if="hasSpouse && ssData.primary && ssData.spouse" class="mb-3">
        <SurvivorBenefitTimeline
          :primaryName="client?.first_name || 'Primary'"
          :spouseName="client?.spouse?.first_name || 'Spouse'"
          :primaryCurrentAge="currentAge"
          :spouseCurrentAge="spouseCurrentAge"
          :primaryClaimingAge="primaryClaimingAge"
          :spouseClaimingAge="spouseClaimingAge"
          :primaryBenefit="currentPrimaryBenefit"
          :spouseBenefit="currentSpouseBenefit"
          :primaryLifeExpectancy="primaryLifeExpectancy"
          :spouseLifeExpectancy="spouseLifeExpectancy"
          @timeline-changed="handleTimelineChanged"
        />
      </div>

      <!-- WEP/GPO Calculator -->
      <div class="mb-3">
        <WepGpoCalculator
          :originalBenefit="currentPrimaryBenefit"
          :spousalBenefit="hasSpouse ? currentSpouseBenefit * 0.5 : 0"
          :lifeExpectancy="primaryLifeExpectancy"
          :currentAge="currentAge"
          :initialPensionAmount="pensionAmount"
          :initialWepApplies="wepApplies"
          :initialGpoApplies="gpoApplies"
          @wep-gpo-changed="handleWepGpoChanged"
        />
      </div>
    </div>

    <!-- Strategy Comparison Table (Main Section) -->
    <div class="comparison-section" v-if="strategies.length > 0">
      <SSStrategyComparison
        :strategies="strategies"
        :hasSpouse="hasSpouse"
        :lifeExpectancy="primaryLifeExpectancy"
        @delete-strategy="deleteStrategy"
        @rename-strategy="renameStrategy"
        @save-strategies="saveStrategies"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state-section">
      <div class="card border-0 shadow-sm">
        <div class="card-body text-center py-5">
          <i class="bi bi-clipboard-data text-muted" style="font-size: 3rem;"></i>
          <h5 class="mt-3 mb-2">No Strategies to Compare Yet</h5>
          <p class="text-muted mb-4">
            Use the Strategy Builder above to create your first claiming strategy, then click "Add to Comparison" to start comparing options.
          </p>
          <button class="btn btn-primary" @click="addPresetStrategies">
            <i class="bi bi-lightning-charge me-1"></i>Add 3 Preset Strategies
          </button>
          <small class="d-block mt-2 text-muted">
            (Early @ 62, FRA @ {{ primaryFRA }}, Delayed @ 70)
          </small>
        </div>
      </div>
    </div>

    <!-- Recommendation Engine -->
    <div class="recommendation-section" v-if="strategies.length > 0 && recommendedStrategy">
      <div class="card border-0 shadow-sm border-success" style="border-width: 3px !important;">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">
            <i class="bi bi-lightbulb-fill me-2"></i>Recommendation
          </h5>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-start gap-3">
            <div class="recommendation-icon">
              <div class="badge bg-success" style="font-size: 2rem; padding: 1rem;">
                <i class="bi bi-check-circle-fill"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <h5 class="mb-2">{{ recommendedStrategy.name }}</h5>
              <p class="mb-3">{{ recommendationText }}</p>

              <div class="row g-3">
                <div class="col-md-4">
                  <div class="recommendation-metric">
                    <i class="bi bi-check-circle text-success me-2"></i>
                    <strong>NET Lifetime Benefits:</strong>
                    <span class="d-block ms-4">{{ formatCurrency(recommendedStrategy.lifetimeNet) }}</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="recommendation-metric">
                    <i class="bi bi-check-circle text-success me-2"></i>
                    <strong>Monthly Income:</strong>
                    <span class="d-block ms-4">{{ formatCurrency(recommendedStrategy.totalMonthlyBenefit) }}/mo</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="recommendation-metric">
                    <i class="bi bi-check-circle text-success me-2"></i>
                    <strong>Portfolio @ {{ primaryLifeExpectancy }}:</strong>
                    <span class="d-block ms-4">{{ formatCurrency(recommendedStrategy.portfolioAtLifeExpectancy) }}</span>
                  </div>
                </div>
              </div>

              <div class="alert alert-warning mt-3 mb-0" v-if="recommendationWarning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Consider:</strong> {{ recommendationWarning }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Supporting Charts (Collapsible) -->
    <div class="charts-section" v-if="strategies.length > 0">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light border-0">
          <button
            class="btn btn-link p-0 text-decoration-none w-100 text-start"
            @click="showCharts = !showCharts"
          >
            <i class="bi me-2" :class="showCharts ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            <strong>Detailed Charts</strong>
            <span class="text-muted ms-2">(Lifetime Benefits & Asset Projection)</span>
          </button>
        </div>
        <div v-show="showCharts" class="card-body">
          <div class="row g-4">
            <!-- Lifetime Benefits Chart -->
            <div class="col-lg-6">
              <h6 class="mb-3">Lifetime Benefits by Claiming Age</h6>
              <div class="chart-container" style="height: 300px;">
                <canvas ref="lifetimeChart"></canvas>
              </div>
              <small class="text-muted d-block mt-2">
                Shows GROSS and NET lifetime benefits for {{ client?.first_name || 'Primary' }} at different claiming ages (to age {{ primaryLifeExpectancy }})
              </small>
            </div>

            <!-- Asset Projection Chart (Placeholder) -->
            <div class="col-lg-6">
              <h6 class="mb-3">Portfolio Balance Over Time</h6>
              <div class="chart-container" style="height: 300px;">
                <div class="d-flex align-items-center justify-content-center h-100 bg-light rounded">
                  <div class="text-center">
                    <i class="bi bi-graph-up text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2 mb-0">Asset projection chart coming soon</p>
                  </div>
                </div>
              </div>
              <small class="text-muted d-block mt-2">
                Will show how each strategy impacts portfolio balance over time
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Disclosures -->
    <DisclosuresCard />
  </div>
</template>

<script>
import { socialSecurityService } from '@/services/socialSecurityService';
import { ssPlanningApi } from '@/services/ssPlanningApi';
import SSStrategyComparison from '@/components/SSStrategyComparison.vue';
import DisclosuresCard from '@/components/DisclosuresCard.vue';
import EarningsTestCalculator from '@/components/SocialSecurity/EarningsTestCalculator.vue';
import SurvivorBenefitTimeline from '@/components/SocialSecurity/SurvivorBenefitTimeline.vue';
import WepGpoCalculator from '@/components/SocialSecurity/WepGpoCalculator.vue';
import Chart from 'chart.js/auto';

export default {
  name: 'SocialSecurityClaimingTab',
  components: {
    SSStrategyComparison,
    DisclosuresCard,
    EarningsTestCalculator,
    SurvivorBenefitTimeline,
    WepGpoCalculator
  },
  props: {
    client: {
      type: Object,
      required: true
    },
    scenario: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // UI State
      showAdvanced: false,
      showCharts: false,

      // Current strategy being built
      primaryClaimingAge: 67,
      spouseClaimingAge: 67,
      primaryLifeExpectancy: 85,
      spouseLifeExpectancy: 85,

      // Strategies for comparison
      strategies: [],
      strategyCounter: 0,

      // Social Security data
      ssData: {
        primary: null,
        spouse: null
      },
      primaryFRA: 67,
      spouseFRA: 67,

      // Charts
      lifetimeChart: null,

      // API data
      apiPreviewData: null,

      // Advanced features data
      earnedIncome: 0,
      pensionAmount: 0,
      wepApplies: false,
      gpoApplies: false,

      // Survivor benefit toggle
      survivorTakesHigherBenefit: false,
      scenarioSurvivorSetting: null
    };
  },
  computed: {
    hasSpouse() {
      return this.client?.spouse || this.client?.tax_status?.toLowerCase() === 'married filing jointly';
    },
    currentPrimaryBenefit() {
      if (!this.ssData.primary) return 0;
      return socialSecurityService.calculateBenefit(
        this.ssData.primary.amountAtFRA,
        this.primaryClaimingAge,
        this.primaryFRA
      );
    },
    currentSpouseBenefit() {
      if (!this.hasSpouse || !this.ssData.spouse) return 0;
      return socialSecurityService.calculateBenefit(
        this.ssData.spouse.amountAtFRA,
        this.spouseClaimingAge,
        this.spouseFRA
      );
    },
    recommendedStrategy() {
      if (this.strategies.length === 0) return null;

      // Find strategy with highest NET lifetime benefits
      return this.strategies.reduce((best, current) => {
        if (!best || (current.lifetimeNet > best.lifetimeNet)) {
          return current;
        }
        return best;
      }, null);
    },
    recommendationText() {
      if (!this.recommendedStrategy) return '';

      const strategy = this.recommendedStrategy;
      const reasons = [];

      // Analyze why this is recommended
      if (strategy.lifetimeNet === this.getBestMetric('lifetimeNet')) {
        reasons.push('maximizes NET lifetime benefits');
      }
      if (strategy.portfolioAtLifeExpectancy > 0) {
        reasons.push('maintains positive portfolio balance');
      }
      if (!strategy.assetDepletionAge) {
        reasons.push('avoids asset depletion');
      }

      return `Based on your inputs, this strategy ${reasons.join(', ')}.`;
    },
    recommendationWarning() {
      if (!this.recommendedStrategy) return null;

      const warnings = [];

      if (this.recommendedStrategy.primaryClaimingAge > this.currentAge) {
        const yearsToWait = this.recommendedStrategy.primaryClaimingAge - this.currentAge;
        warnings.push(`You'll need bridge income for ${yearsToWait} years until claiming`);
      }

      if (this.recommendedStrategy.totalTaxes + this.recommendedStrategy.totalIRMAA > 200000) {
        warnings.push('High-income scenario may face significant IRMAA surcharges');
      }

      return warnings.length > 0 ? warnings.join('. ') : null;
    },
    shouldShowEarningsTest() {
      // Show earnings test if claiming before FRA
      return this.primaryClaimingAge < this.primaryFRA;
    },
    currentAge() {
      if (!this.client?.birthdate) return 65;
      const birthdate = new Date(this.client.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthdate.getFullYear();
      const monthDiff = today.getMonth() - birthdate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
      }
      return age;
    },
    spouseCurrentAge() {
      if (!this.client?.spouse?.birthdate) return 65;
      const birthdate = new Date(this.client.spouse.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthdate.getFullYear();
      const monthDiff = today.getMonth() - birthdate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
      }
      return age;
    }
  },
  async mounted() {
    await this.initializeData();
    this.initializeCharts();
  },
  beforeUnmount() {
    if (this.lifetimeChart) {
      this.lifetimeChart.destroy();
    }
  },
  methods: {
    async initializeData() {
      try {
        // Fetch client info from API
        const clientInfo = await ssPlanningApi.getClientInfo(this.scenario.id);

        console.log('📋 SocialSecurityClaimingTab received clientInfo:', clientInfo);

        if (clientInfo.primary) {
          this.primaryLifeExpectancy = clientInfo.primary.life_expectancy || 85;
          this.primaryFRA = clientInfo.primary.fra || 67;
          this.primaryClaimingAge = clientInfo.primary.claiming_age || this.primaryFRA;

          // Extract SS data from API response
          this.ssData.primary = {
            amountAtFRA: clientInfo.primary.amount_at_fra || 0,
            startAge: clientInfo.primary.claiming_age || this.primaryFRA,
            ownedBy: 'primary',
            cola: 0.02
          };

          console.log('✅ Primary SS data extracted:', this.ssData.primary);
        }

        if (this.hasSpouse && clientInfo.spouse) {
          this.spouseLifeExpectancy = clientInfo.spouse.life_expectancy || 85;
          this.spouseFRA = clientInfo.spouse.fra || 67;
          this.spouseClaimingAge = clientInfo.spouse.claiming_age || this.spouseFRA;

          // Extract spouse SS data from API response
          this.ssData.spouse = {
            amountAtFRA: clientInfo.spouse.amount_at_fra || 0,
            startAge: clientInfo.spouse.claiming_age || this.spouseFRA,
            ownedBy: 'spouse',
            cola: 0.02
          };

          console.log('✅ Spouse SS data extracted:', this.ssData.spouse);
        }

        // Validate we have the data
        if (!this.ssData.primary || !this.ssData.primary.amountAtFRA) {
          console.error('❌ NO PRIMARY SS DATA - amount_at_fra:', clientInfo.primary?.amount_at_fra);
        }

        // Load survivor benefit setting from scenario
        this.scenarioSurvivorSetting = this.scenario?.survivor_takes_higher_benefit ?? false;
        this.survivorTakesHigherBenefit = this.scenarioSurvivorSetting;

        console.log('✅ SocialSecurityClaimingTab initialized');
        console.log('📋 Survivor takes higher benefit:', this.survivorTakesHigherBenefit);
      } catch (error) {
        console.error('❌ Error initializing:', error);
        this.fallbackInitialization();
      }
    },
    fallbackInitialization() {
      this.primaryLifeExpectancy = this.scenario?.mortality_age || 85;
      this.spouseLifeExpectancy = this.scenario?.spouse_mortality_age || 85;
      this.extractSocialSecurityData();
    },
    extractSocialSecurityData() {
      // Extract from scenario income sources or use defaults
      const ssIncomeSources = this.scenario?.income_sources?.filter(income =>
        income.income_type === 'Social Security' || income.income_type === 'social_security'
      ) || [];

      ssIncomeSources.forEach(income => {
        const data = {
          amountAtFRA: parseFloat(income.amount_at_fra || income.monthly_amount),
          startAge: parseInt(income.age_to_begin_withdrawal),
          ownedBy: income.owned_by,
          cola: parseFloat(income.cola) || 0.02
        };

        console.log('📋 SocialSecurityClaimingTab extracted SS data:', {
          income_type: income.income_type,
          owned_by: income.owned_by,
          amount_at_fra: income.amount_at_fra,
          monthly_amount: income.monthly_amount,
          extracted_amountAtFRA: data.amountAtFRA
        });

        if (income.owned_by === 'primary') {
          this.ssData.primary = data;
        } else if (income.owned_by === 'spouse') {
          this.ssData.spouse = data;
        }
      });

      // Error if not found - NO FALLBACKS
      if (!this.ssData.primary) {
        console.error('❌ NO PRIMARY SS DATA FOUND IN SocialSecurityClaimingTab');
      }
      if (this.hasSpouse && !this.ssData.spouse) {
        console.warn('⚠️ NO SPOUSE SS DATA FOUND');
      }
    },
    async addCurrentStrategyToComparison() {
      if (this.strategies.length >= 4) {
        alert('Maximum 4 strategies allowed');
        return;
      }

      this.strategyCounter++;
      const strategyName = `Strategy ${this.strategyCounter}`;

      // Calculate strategy metrics
      const strategy = await this.calculateStrategyMetrics(
        strategyName,
        this.primaryClaimingAge,
        this.spouseClaimingAge
      );

      this.strategies.push(strategy);

      console.log('✅ Added strategy:', strategy);
    },
    async calculateStrategyMetrics(name, primaryAge, spouseAge) {
      try {
        // Call API to get accurate metrics
        const params = {
          primary_claiming_age: primaryAge,
          life_expectancy_primary: this.primaryLifeExpectancy,
          survivor_takes_higher_benefit: this.survivorTakesHigherBenefit
        };

        if (this.hasSpouse) {
          params.spouse_claiming_age = spouseAge;
          params.life_expectancy_spouse = this.spouseLifeExpectancy;
        }

        const previewData = await ssPlanningApi.getPreview(this.scenario.id, params);

        // Extract metrics from API response
        return {
          id: Date.now(),
          name: name,
          primaryClaimingAge: primaryAge,
          spouseClaimingAge: spouseAge,
          primaryMonthlyBenefit: this.calculateMonthlyBenefit('primary', primaryAge),
          spouseMonthlyBenefit: this.hasSpouse ? this.calculateMonthlyBenefit('spouse', spouseAge) : 0,
          totalMonthlyBenefit: this.calculateMonthlyBenefit('primary', primaryAge) +
                              (this.hasSpouse ? this.calculateMonthlyBenefit('spouse', spouseAge) : 0),
          lifetimeGross: previewData.summary.total_lifetime_benefits,
          lifetimeNet: previewData.summary.net_lifetime_benefits,
          totalTaxes: previewData.summary.total_taxes_on_ss,
          totalIRMAA: previewData.summary.total_irmaa_costs,
          breakEvenAge: this.calculateBreakEvenAge(primaryAge),
          assetDepletionAge: previewData.summary.asset_depletion_age,
          portfolioAtLifeExpectancy: this.estimatePortfolioBalance(previewData),
          survivorBenefitPrimary: this.calculateMonthlyBenefit('primary', primaryAge),
          survivorBenefitIncluded: this.survivorTakesHigherBenefit, // Store per-strategy
          bestFor: this.generateBestForText(primaryAge, spouseAge),
          considerations: this.generateConsiderationsText(primaryAge, previewData)
        };
      } catch (error) {
        console.error('Error calculating metrics:', error);
        // Fallback to client-side estimation
        return this.calculateStrategyMetricsFallback(name, primaryAge, spouseAge);
      }
    },
    calculateStrategyMetricsFallback(name, primaryAge, spouseAge) {
      const primaryMonthly = this.calculateMonthlyBenefit('primary', primaryAge);
      const spouseMonthly = this.hasSpouse ? this.calculateMonthlyBenefit('spouse', spouseAge) : 0;
      const totalMonthly = primaryMonthly + spouseMonthly;

      const lifetimeGross = this.calculateLifetimeBenefits(primaryMonthly, spouseMonthly);
      const lifetimeNet = lifetimeGross * 0.80; // Estimate 20% reduction

      return {
        id: Date.now(),
        name: name,
        primaryClaimingAge: primaryAge,
        spouseClaimingAge: spouseAge,
        primaryMonthlyBenefit: primaryMonthly,
        spouseMonthlyBenefit: spouseMonthly,
        totalMonthlyBenefit: totalMonthly,
        lifetimeGross: lifetimeGross,
        lifetimeNet: lifetimeNet,
        totalTaxes: lifetimeGross * 0.15,
        totalIRMAA: lifetimeGross * 0.05,
        breakEvenAge: this.calculateBreakEvenAge(primaryAge),
        assetDepletionAge: null,
        portfolioAtLifeExpectancy: 250000, // Placeholder
        survivorBenefitPrimary: primaryMonthly,
        survivorBenefitIncluded: this.survivorTakesHigherBenefit, // Store per-strategy
        bestFor: this.generateBestForText(primaryAge, spouseAge),
        considerations: this.generateConsiderationsText(primaryAge, null)
      };
    },
    calculateMonthlyBenefit(person, age) {
      const data = person === 'primary' ? this.ssData.primary : this.ssData.spouse;
      const fra = person === 'primary' ? this.primaryFRA : this.spouseFRA;

      if (!data) return 0;

      return socialSecurityService.calculateBenefit(data.amountAtFRA, age, fra);
    },
    calculateLifetimeBenefits(primaryMonthly, spouseMonthly) {
      const primaryYears = Math.max(0, this.primaryLifeExpectancy - this.primaryClaimingAge);
      const spouseYears = this.hasSpouse ? Math.max(0, this.spouseLifeExpectancy - this.spouseClaimingAge) : 0;

      return (primaryMonthly * 12 * primaryYears) + (spouseMonthly * 12 * spouseYears);
    },
    calculateBreakEvenAge(claimingAge) {
      // Simple break-even calculation vs age 62
      if (claimingAge === 62) return null;

      const benefit62 = this.calculateMonthlyBenefit('primary', 62);
      const benefitCurrent = this.calculateMonthlyBenefit('primary', claimingAge);

      const monthsWaited = (claimingAge - 62) * 12;
      const extraPerMonth = benefitCurrent - benefit62;

      if (extraPerMonth <= 0) return null;

      const monthsToBreakEven = (benefit62 * monthsWaited) / extraPerMonth;
      return Math.round(claimingAge + (monthsToBreakEven / 12));
    },
    estimatePortfolioBalance(previewData) {
      // Try to get from last year of data
      if (previewData?.years && previewData.years.length > 0) {
        const lastYear = previewData.years[previewData.years.length - 1];
        return lastYear.total_assets || 0;
      }
      return 0;
    },
    generateBestForText(primaryAge, spouseAge) {
      if (primaryAge <= 63) {
        return 'Poor health, need immediate income, short life expectancy';
      } else if (primaryAge >= 69) {
        return 'Excellent health, longevity in family, substantial other assets';
      } else {
        return 'Average health, balanced approach, moderate longevity';
      }
    },
    generateConsiderationsText(primaryAge, previewData) {
      const warnings = [];

      if (primaryAge < this.primaryFRA) {
        warnings.push('Early claiming penalty');
      }
      if (primaryAge < 66 && this.hasEarnedIncome) {
        warnings.push('Earnings test may apply');
      }
      if (previewData?.summary?.total_irmaa_costs > 10000) {
        warnings.push('Significant IRMAA costs');
      }

      return warnings.length > 0 ? warnings.join(', ') : 'No major considerations';
    },
    addPresetStrategies() {
      // Add three common strategies
      this.primaryClaimingAge = 62;
      this.spouseClaimingAge = 62;
      this.addCurrentStrategyToComparison();

      setTimeout(() => {
        this.primaryClaimingAge = this.primaryFRA;
        this.spouseClaimingAge = this.spouseFRA;
        this.addCurrentStrategyToComparison();
      }, 500);

      setTimeout(() => {
        this.primaryClaimingAge = 70;
        this.spouseClaimingAge = 70;
        this.addCurrentStrategyToComparison();
      }, 1000);
    },
    findOptimalStrategy() {
      // Simple optimal: delay to 70 if life expectancy > 80, else FRA
      if (this.primaryLifeExpectancy >= 80) {
        this.primaryClaimingAge = 70;
        this.spouseClaimingAge = 70;
      } else {
        this.primaryClaimingAge = this.primaryFRA;
        this.spouseClaimingAge = this.spouseFRA;
      }

      this.addCurrentStrategyToComparison();
    },
    deleteStrategy(strategyId) {
      this.strategies = this.strategies.filter(s => s.id !== strategyId);
    },
    renameStrategy(strategy) {
      const index = this.strategies.findIndex(s => s.id === strategy.id);
      if (index !== -1) {
        this.strategies[index].name = strategy.name;
      }
    },
    async saveStrategies() {
      // TODO: Implement save to backend
      alert('Save functionality coming soon!');
    },
    getBestMetric(metric) {
      if (this.strategies.length === 0) return null;
      return Math.max(...this.strategies.map(s => s[metric] || 0));
    },
    initializeCharts() {
      this.$nextTick(() => {
        this.initializeLifetimeChart();
      });
    },
    initializeLifetimeChart() {
      const canvas = this.$refs.lifetimeChart;
      if (!canvas) return;

      if (this.lifetimeChart) {
        this.lifetimeChart.destroy();
      }

      const ctx = canvas.getContext('2d');
      const chartData = this.generateLifetimeChartData();

      this.lifetimeChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Claiming Age'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Lifetime Benefits ($)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + Math.round(value / 1000) + 'K';
                }
              }
            }
          }
        }
      });
    },
    generateLifetimeChartData() {
      const ages = [];
      const grossBenefits = [];
      const netBenefits = [];

      for (let age = 62; age <= 70; age++) {
        ages.push(age);

        const monthly = this.calculateMonthlyBenefit('primary', age);
        const years = this.primaryLifeExpectancy - age;
        const gross = monthly * 12 * years;

        grossBenefits.push(gross);
        netBenefits.push(gross * 0.80); // Estimate
      }

      return {
        labels: ages,
        datasets: [
          {
            label: 'Gross Benefits',
            data: grossBenefits,
            borderColor: '#007bff',
            tension: 0.4
          },
          {
            label: 'NET Benefits',
            data: netBenefits,
            borderColor: '#28a745',
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      };
    },
    formatCurrency(value) {
      if (!value && value !== 0) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    handleEarningsChanged(data) {
      this.earnedIncome = data.earnedIncome;
      console.log('Earnings test data updated:', data);
    },
    handleTimelineChanged(data) {
      console.log('Survivor benefit timeline updated:', data);
    },
    handleWepGpoChanged(data) {
      this.pensionAmount = data.pensionAmount;
      this.wepApplies = data.wepApplies;
      this.gpoApplies = data.gpoApplies;
      console.log('WEP/GPO data updated:', data);
    }
  }
};
</script>

<style scoped>
.social-security-3-container {
  padding: 0;
  background: #f8f9fa;
  min-height: 100vh;
}

.ss-header {
  background: white;
  border-bottom: 2px solid #e9ecef;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}

.strategy-builder-section,
.comparison-section,
.recommendation-section,
.charts-section,
.empty-state-section,
.advanced-features-section {
  margin: 0 2rem 2rem 2rem;
}

.claiming-age-control {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-range {
  cursor: pointer;
}

.form-range::-webkit-slider-thumb {
  background: #007bff;
  cursor: pointer;
}

.form-range::-moz-range-thumb {
  background: #007bff;
  cursor: pointer;
}

.recommendation-metric {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.chart-container {
  position: relative;
}

/* Responsive */
@media (max-width: 768px) {
  .strategy-builder-section,
  .comparison-section,
  .recommendation-section,
  .charts-section,
  .empty-state-section,
  .advanced-features-section {
    margin: 0 1rem 1rem 1rem;
  }

  .ss-header {
    padding: 1rem;
  }
}
</style>
