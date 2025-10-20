<template>
  <div v-if="eligibleAssets && eligibleAssets.length > 0">
    <!-- Multi-Step Wizard Layout -->
    <div class="row">
      <!-- Left Side: Steps (3/4 width) -->
      <div class="col-lg-9 mb-3 mb-lg-5">
        <div class="card">
          <div class="card-header" style="background-color: #f8f9fa !important; color: #000000 !important; border-bottom: 1px solid #dee2e6;">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-0" style="color: #000000 !important;">{{ currentStepTitle }}</h5>
              </div>
              <div class="step-indicator">
                <div class="step-container">
                  <div class="step-item" :class="{ 'completed': currentStep >= 1, 'active': currentStep === 1 }" @click="goToStep(1)">
                    <div class="step-number">1</div>
                  </div>
                  <div class="step-connector" :class="{ 'completed': currentStep >= 2 }"></div>
                  <div class="step-item" :class="{ 'completed': currentStep >= 2, 'active': currentStep === 2 }" @click="goToStep(2)">
                    <div class="step-number">2</div>
                  </div>
                  <div class="step-connector" :class="{ 'completed': currentStep >= 3 }"></div>
                  <div class="step-item" :class="{ 'completed': currentStep >= 3, 'active': currentStep === 3 }" @click="goToStep(3)">
                    <div class="step-number">3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Step 1: Asset Selection -->
            <div v-show="currentStep === 1">
              <AssetSelectionPanel
                :eligibleAssets="eligibleAssets"
                :maxToConvert="maxToConvert"
                :maxToConvertRaw="maxToConvertRaw"
                @update:maxToConvert="val => maxToConvert = val"
                @update:maxToConvertRaw="val => maxToConvertRaw = val"
              />
              <div class="text-end mt-3">
                <button 
                  class="btn btn-primary" 
                  @click="nextStep" 
                  :disabled="!canProceedFromStep1"
                >
                  Next: Conversion Schedule
                </button>
              </div>
            </div>

            <!-- Step 2: Conversion Schedule -->
            <div v-show="currentStep === 2">
              <div class="row">
                <div class="col-md-4">
                  <label for="conversionStartYear">Conversion Start Year</label>
                  <select id="conversionStartYear" v-model="conversionStartYear" class="form-control">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="maxAnnualAmount">Max Annual Conversion Amount</label>
                  <input
                    type="text"
                    id="maxAnnualAmount"
                    :value="maxAnnualAmountRaw"
                    @focus="onCurrencyFocus('maxAnnualAmount')"
                    @input="onCurrencyInput($event, 'maxAnnualAmount')"
                    @blur="onCurrencyBlur('maxAnnualAmount')"
                    class="form-control"
                    min="0"
                  />
                </div>
                <div class="col-md-4">
                  <label for="yearsToConvert">Years to Convert</label>
                  <input type="range" id="yearsToConvert" v-model="yearsToConvert" min="1" max="10" class="form-range w-100" />
                  <div class="text-center">
                    <span>{{ yearsToConvert }} years</span>
                  </div>
                </div>
              </div>

              <!-- Validation Message -->
              <div v-if="!isConversionScheduleValid" class="alert alert-danger mt-3" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ conversionScheduleValidationMessage }}
              </div>

              <div class="text-end mt-3">
                <button class="btn btn-outline-secondary me-2" @click="previousStep">
                  Previous
                </button>
                <button
                  class="btn btn-primary"
                  @click="nextStep"
                  :disabled="!isConversionScheduleValid"
                >
                  Next: Final Details
                </button>
              </div>
            </div>

            <!-- Step 3: Final Details -->
            <div v-show="currentStep === 3">
              <div class="row">
                <div class="col-md-6">
                  <label for="preRetirementIncome">
                    Pre-Retirement Income
                    <span v-if="isPreRetirementIncomeRequired" class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="preRetirementIncome"
                    :value="preRetirementIncomeRaw"
                    @focus="onCurrencyFocus('preRetirementIncome')"
                    @input="onCurrencyInput($event, 'preRetirementIncome')"
                    @blur="onCurrencyBlur('preRetirementIncome')"
                    :class="['form-control', { 'is-invalid': isPreRetirementIncomeRequired && !isPreRetirementIncomeValid }]"
                  />
                  <div v-if="isPreRetirementIncomeRequired && !isPreRetirementIncomeValid" class="invalid-feedback">
                    Pre-retirement income is required when converting before retirement ({{ retirementYear }})
                  </div>
                </div>
                <div class="col-md-6">
                  <label for="rothGrowthRate">Roth Growth Rate (%)</label>
                  <input type="number" id="rothGrowthRate" v-model="rothGrowthRate" class="form-control" />
                </div>
                <div class="col-md-6 mt-3">
                  <label for="rothWithdrawalAmount">Yearly Roth Withdrawal Amount</label>
                  <input
                    type="text"
                    id="rothWithdrawalAmount"
                    :value="rothWithdrawalAmountRaw"
                    @focus="onCurrencyFocus('rothWithdrawalAmount')"
                    @input="onCurrencyInput($event, 'rothWithdrawalAmount')"
                    @blur="onCurrencyBlur('rothWithdrawalAmount')"
                    class="form-control"
                    min="0"
                  />
                </div>
                <div class="col-md-6 mt-3">
                  <label for="rothWithdrawalStartYear">Roth Withdrawal Start Year</label>
                  <select 
                    id="rothWithdrawalStartYear" 
                    v-model="rothWithdrawalStartYear" 
                    class="form-control"
                    :class="{ 'is-invalid': shouldShowRothWithdrawalValidationError }"
                  >
                    <option v-for="year in availableWithdrawalYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                  <div v-if="shouldShowRothWithdrawalValidationError" class="invalid-feedback">
                    Withdrawal start year must be after conversion start year ({{ conversionStartYear }})
                  </div>
                </div>
              </div>
              <div class="text-end mt-3">
                <button class="btn btn-outline-secondary me-2" @click="previousStep">
                  Previous
                </button>
                <button 
                  class="btn me-2" 
                  :class="canRecalculateConversion ? 'btn-success' : 'btn-secondary'" 
                  :disabled="!canRecalculateConversion"
                  @click="recalculateConversion"
                  :title="canRecalculateConversion ? 'Run Roth conversion analysis' : 'Please complete all steps'"
                >
                  Calculate Conversion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Summary (1/4 width) -->
      <div class="col-lg-3 mb-3 mb-lg-5">
        <div class="card conversion-summary-card">
          <div class="card-header" style="background-color: #f8f9fa !important; color: #000000 !important; border-bottom: 1px solid #dee2e6;">
            <h6 class="mb-0" style="color: #000000 !important;">Conversion Summary</h6>
          </div>
          <div class="card-body">
            <!-- Asset Summary -->
            <div v-if="currentStep >= 1">
              <strong>Select Assets to Convert:</strong>
              <ul class="list-unstyled mt-2 mb-3">
                <li v-for="asset in selectedAssetList" :key="asset.id || asset.income_type" class="small">
                  {{ asset.income_name || asset.investment_name || asset.income_type }}: {{ formatCurrency(maxToConvert[asset.id || asset.income_type] || 0) }}
                </li>
                <li v-if="selectedAssetList.length === 0" class="text-muted small">No assets selected</li>
              </ul>
              <div class="border-top pt-2">
                <strong>Total: {{ formatCurrency(totalConversionAmount) }}</strong>
                <div v-if="!isConversionAmountValid" class="text-danger small mt-1">
                  <i class="fas fa-exclamation-triangle me-1"></i>
                  Annual conversion amount exceeds database limit. Please reduce total amount or increase conversion years.
                </div>
              </div>
            </div>

            <!-- Schedule Summary -->
            <div v-if="currentStep >= 2" class="mt-3">
              <hr>
              <strong>Conversion Schedule:</strong>
              <ul class="list-unstyled mt-2 mb-0 small">
                <li>Start: {{ conversionStartYear }}</li>
                <li>Duration: {{ yearsToConvert }} years</li>
                <li>Max Annual: {{ formatCurrency(maxAnnualAmount) }}</li>
              </ul>
            </div>

            <!-- Details Summary -->
            <div v-if="currentStep >= 3" class="mt-3">
              <hr>
              <strong>Details:</strong>
              <ul class="list-unstyled mt-2 mb-0 small">
                <li>Pre-Retirement Income: {{ formatCurrency(preRetirementIncome) }}</li>
                <li>Growth Rate: {{ rothGrowthRate }}%</li>
                <li>Withdrawal: {{ formatCurrency(rothWithdrawalAmount) }}</li>
                <li>Withdrawal Start: {{ rothWithdrawalStartYear }}</li>
              </ul>
            </div>

            <!-- Progress Indicator -->
            <div class="mt-4">
              <div class="progress">
                <div 
                  class="progress-bar" 
                  :style="{ width: (currentStep / 3 * 100) + '%' }"
                  :class="currentStep === 3 && canRecalculateConversion ? 'bg-success' : 'bg-primary'"
                ></div>
              </div>
              <small class="text-muted">Step {{ currentStep }} of 3</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty state message when no scenario has been run -->
    <div v-if="!hasScenarioBeenRun" class="empty-state">
      <div class="empty-state-icon">📊</div>
      <div class="empty-state-message">No Roth Conversion Scenario Yet</div>
      <div class="empty-state-description">
        Complete the 3-step wizard above, then click "Calculate Conversion" to see detailed analysis and projections.
      </div>
    </div>
    
    <div v-if="hasScenarioBeenRun" class="scenario-results">
    <!-- Combined Expense Summary Chart -->
    <h3 id="expense-summary">Expense Summary</h3>
    <div class="row mb-3">
      <div class="col-md-9">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="mb-3">Expense Comparison Before vs After Roth Conversion</h6>
            <Graph
              :data="expenseSummaryData || {
                labels: ['RMDs', 'State & Federal Taxes', 'Medicare & IRMAA', 'Total Expenses'],
                datasets: [
                  {
                    label: 'Before Conversion',
                    backgroundColor: '#007bff',
                    data: [0, 0, 0, 0]
                  },
                  {
                    label: 'After Conversion',
                    backgroundColor: '#28a745',
                    data: [0, 0, 0, 0]
                  }
                ]
              }"
              :options="expenseSummaryOptions"
              :height="300"
              type="bar"
              graphId="roth-expense-summary-chart"
            />
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="mb-3">Summary</h6>
            <div v-if="conversionTaxCost !== null && conversionTaxCost > 0" class="mb-3">
              <div class="alert alert-warning mb-0">
                <strong>Taxes Paid on Converted Amount</strong>
                <div class="mt-2">
                  <h5 class="mb-0">{{ formatCurrency(conversionTaxCost) }}</h5>
                  <small>({{ conversionTaxRate }}% effective rate)</small>
                </div>
              </div>
            </div>
            <div v-if="totalSavings">
              <div class="alert alert-success mb-0">
                <strong>Total Savings</strong>
                <div class="mt-2">
                  <h5 class="mb-0">{{ formatCurrency(totalSavings) }}</h5>
                  <small>({{ savingsPercentage }}% reduction in lifetime expenses)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NEW SECTION: Inheritance Tax Impact -->
    <h3 id="inheritance-tax">Inheritance Tax Impact</h3>
    <div class="row mb-3">
      <div class="col-md-12">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="mb-3">Estate Tax Comparison Before vs After Roth Conversion</h6>
            <Graph
              :data="inheritanceTaxData || {
                labels: ['Taxable Estate', 'Non-Taxable Estate', 'Estate Tax Owed'],
                datasets: [
                  {
                    label: 'Before Conversion',
                    backgroundColor: '#dc3545',
                    data: [0, 0, 0]
                  },
                  {
                    label: 'After Conversion',
                    backgroundColor: '#28a745',
                    data: [0, 0, 0]
                  }
                ]
              }"
              :options="inheritanceTaxOptions"
              :height="300"
              type="bar"
              graphId="roth-inheritance-tax-chart"
            />
            <div class="mt-3">
              <!-- Estate Tax Savings -->
              <div v-if="inheritanceTaxSavings > 0" class="alert alert-success">
                <strong>Estate Tax Savings: {{ formatCurrency(inheritanceTaxSavings) }}</strong>
                <p class="mb-0 mt-2 small">
                  By converting traditional assets to Roth, you reduce the taxable portion of your estate,
                  saving your heirs significant estate taxes.
                </p>
              </div>
            </div>

            <!-- Asset Breakdown Details -->
            <!-- Year-by-Year Audit Trail -->
            <h6 class="mb-3 mt-5">Year-by-Year Asset Growth & Estate Tax Audit Trail</h6>
            <p class="text-muted small">
              This table shows how assets grow year-by-year to reach the final estate values.
              Use this for CPA audit and verification of estate tax calculations.
            </p>

            <!-- Tabs for Baseline vs After Conversion with Download Button -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <ul class="nav nav-tabs mb-0" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link active"
                    id="audit-baseline-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#audit-baseline"
                    type="button"
                    role="tab"
                  >
                    Before Conversion
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    id="audit-after-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#audit-after"
                    type="button"
                    role="tab"
                  >
                    After Conversion
                  </button>
                </li>
              </ul>

              <!-- Download Dropdown Button -->
              <div class="dropdown">
                <button
                  class="btn btn-primary dropdown-toggle"
                  type="button"
                  id="downloadDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Download
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="downloadDropdown">
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="exportBeforeConversionAsExcel">
                      Before Conversion as Excel
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="exportBeforeConversionAsCSV">
                      Before Conversion as CSV
                    </a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="exportAfterConversionAsExcel">
                      After Conversion as Excel
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="exportAfterConversionAsCSV">
                      After Conversion as CSV
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div class="tab-content">
              <!-- Baseline Audit Trail -->
              <div class="tab-pane fade show active" id="audit-baseline" role="tabpanel">
                <ComprehensiveFinancialTable
                  :scenario-id="scenario.id"
                  :client="client"
                />
              </div>

              <!-- After Conversion Audit Trail -->
              <div class="tab-pane fade" id="audit-after" role="tabpanel">
                <ComprehensiveConversionTable
                  v-if="conversionComprehensiveData"
                  :comprehensive-data="conversionComprehensiveData"
                  :client="client"
                />
                <div v-else class="text-center py-5">
                  <i class="bi bi-table fs-1 text-muted"></i>
                  <p class="mt-2 text-muted">No conversion data available. Please run a calculation first.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Baseline vs Roth Conversion Comparison Table -->
    <div class="card mb-3 mb-lg-5">
      <div class="card-body">
        <h5 class="mb-4">Baseline vs Roth Conversion Comparison</h5>
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Baseline</th>
                <th>Roth Conversion</th>
                <th>Savings</th>
                <th>% Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lifetime RMDs</td>
                <td>${{ baselineMetrics.total_rmds !== undefined ? baselineMetrics.total_rmds.toLocaleString() : 0 }}</td>
                <td>${{ optimalSchedule.score_breakdown?.total_rmds !== undefined ? optimalSchedule.score_breakdown.total_rmds.toLocaleString() : 0 }}</td>
                <td>${{ comparisonMetrics.rmd_reduction !== undefined ? comparisonMetrics.rmd_reduction.toLocaleString() : 0 }}</td>
                <td>{{ comparisonMetrics.rmd_reduction_pct !== undefined ? comparisonMetrics.rmd_reduction_pct.toFixed(1) : 0 }}%</td>
              </tr>
              <tr>
                <td>Lifetime Federal and State Taxes</td>
                <td>${{ baselineMetrics.lifetime_tax !== undefined ? baselineMetrics.lifetime_tax.toLocaleString() : 0 }}</td>
                <td>${{ optimalSchedule.score_breakdown?.lifetime_tax !== undefined ? optimalSchedule.score_breakdown.lifetime_tax.toLocaleString() : 0 }}</td>
                <td>${{ comparisonMetrics.tax_savings !== undefined ? comparisonMetrics.tax_savings.toLocaleString() : 0 }}</td>
                <td>{{ comparisonMetrics.tax_savings_pct !== undefined ? comparisonMetrics.tax_savings_pct.toFixed(1) : 0 }}%</td>
              </tr>
              <tr>
                <td>Lifetime IRMAA Surcharges</td>
                <td>${{ baselineMetrics.total_irmaa !== undefined ? baselineMetrics.total_irmaa.toLocaleString() : 0 }}</td>
                <td>${{ optimalSchedule.score_breakdown?.total_irmaa !== undefined ? optimalSchedule.score_breakdown.total_irmaa.toLocaleString() : 0 }}</td>
                <td>${{ comparisonMetrics.irmaa_savings !== undefined ? comparisonMetrics.irmaa_savings.toLocaleString() : 0 }}</td>
                <td>{{ comparisonMetrics.irmaa_savings_pct !== undefined ? comparisonMetrics.irmaa_savings_pct.toFixed(1) : 0 }}%</td>
              </tr>
              <tr>
                <td>Inheritance Tax</td>
                <td>${{ baselineMetrics.inheritance_tax !== undefined ? baselineMetrics.inheritance_tax.toLocaleString() : 0 }}</td>
                <td>${{ optimalSchedule.score_breakdown?.inheritance_tax !== undefined ? optimalSchedule.score_breakdown.inheritance_tax.toLocaleString() : 0 }}</td>
                <td>${{ comparisonMetrics.inheritance_tax_savings !== undefined ? comparisonMetrics.inheritance_tax_savings.toLocaleString() : 0 }}</td>
                <td>{{ comparisonMetrics.inheritance_tax_savings_pct !== undefined ? comparisonMetrics.inheritance_tax_savings_pct.toFixed(1) : 0 }}%</td>
              </tr>
              <tr>
                <td>Net Lifetime Spendable Income</td>
                <td>${{ baselineMetrics.cumulative_net_income !== undefined ? baselineMetrics.cumulative_net_income.toLocaleString() : 0 }}</td>
                <td>${{ optimalSchedule.score_breakdown?.cumulative_net_income !== undefined ? optimalSchedule.score_breakdown.cumulative_net_income.toLocaleString() : 0 }}</td>
                <td>${{ comparisonMetrics.net_income_increase !== undefined ? comparisonMetrics.net_income_increase.toLocaleString() : 0 }}</td>
                <td>{{ baselineMetrics.cumulative_net_income && comparisonMetrics.net_income_increase ? ((comparisonMetrics.net_income_increase / baselineMetrics.cumulative_net_income) * 100).toFixed(1) : 0 }}%</td>
              </tr>
              <tr class="table-success">
                <td><strong>Total Lifetime Savings</strong></td>
                <td></td>
                <td></td>
                <td><strong>${{ comparisonMetrics.total_savings !== undefined ? comparisonMetrics.total_savings.toLocaleString() : totalSavings.toLocaleString() }}</strong></td>
                <td><strong>{{ savingsPercentage }}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Section 5: Action Buttons -->
    <div class="card mb-3 mb-lg-5">
      <div class="card-body">
        <button 
          class="btn me-2" 
          :class="canRecalculateConversion ? 'btn-primary' : 'btn-secondary'" 
          :disabled="!canRecalculateConversion"
          @click="recalculateConversion"
          :title="canRecalculateConversion ? 'Run Roth conversion analysis' : 'Please enter conversion amounts for at least one asset'"
        >
          Recalculate Conversion
        </button>
      </div>
    </div>
    </div> <!-- End of scenario-results div -->
    
    <!-- Disclosures Card -->
    <DisclosuresCard />
  </div>
</template>

<script>
import Graph from '../components/Graph.vue';
import AssetSelectionPanel from '../components/RothConversion/AssetSelectionPanel.vue';
import DisclosuresCard from '../components/DisclosuresCard.vue';
import ComprehensiveFinancialTable from '../components/ComprehensiveFinancialTable.vue';
import ComprehensiveConversionTable from '../components/ComprehensiveConversionTable.vue';
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import './RothConversionTab.css';
import { apiService } from '@/services/api';
import * as XLSX from 'xlsx';
import axios from 'axios';

export default {
  components: { Graph, AssetSelectionPanel, DisclosuresCard, ComprehensiveFinancialTable, ComprehensiveConversionTable },
  mounted() {
    // Initialize our component's chart data without affecting other components
    console.log('🚀 RothConversionTab mounted, initializing asset line data...');
    const assetLineData = this.generateAssetLineData();
    if (assetLineData) {
      console.log('📊 Initial assetLineData generated:', assetLineData);
      this.assetLineData = JSON.parse(JSON.stringify(assetLineData)); // Deep clone to avoid reference issues
    } else {
      console.warn('⚠️ Failed to generate initial asset line data');
    }
    
    const expenseSummaryData = this.generateExpenseSummaryData();
    if (expenseSummaryData) {
      this.expenseSummaryData = JSON.parse(JSON.stringify(expenseSummaryData)); // Deep clone to avoid reference issues
    }

    // Roth Withdrawal Start Year is already set to currentYear + 1 in data()
  },
  props: {
    scenario: {
      type: Object,
      required: true
    },
    assetDetails: {
      type: Array,
      required: true,
      default: () => []
    },
    scenarioResults: {
      type: Array,
      required: true,
      default: () => []
    },
    client: {
      type: Object,
      required: true
    }
  },
  data() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear + i);
    
    return {
      // Multi-step wizard state
      currentStep: 1,
      // Flag to track if we're in the middle of a recalculation
      _isRecalculating: false,
      // Flag to track if a scenario has been run
      hasScenarioBeenRun: false,
      // Flag to track if validation has been attempted (for better UX)
      validationAttempted: false,
      preRetirementIncome: 0,
      preRetirementIncomeRaw: '',
      availableYears: this.generateAvailableYears(),
      conversionStartYear: currentYear,
      yearsToConvert: 1,
      rothGrowthRate: 5.0,
      rothConversionResults: [], // Roth optimizer API results (separate from scenarioResults prop)
      baselineResults: [], // Year-by-year baseline scenario results
      conversionResults: [], // Year-by-year conversion scenario results
      conversionComprehensiveData: null, // Comprehensive format for After Conversion table
      baselineMetrics: {},
      comparisonMetrics: {},
      optimalSchedule: {},
      maxToConvert: {},
      maxToConvertRaw: {},
      maxToConvertDisplay: {},
      maxAnnualAmount: '',
      maxAnnualAmountRaw: '',
      maxTotalAmount: '',
      totalSavings: 0,
      savingsPercentage: 0,
      conversionTaxCost: null,
      conversionTaxRate: 0,
      conversionCostMetrics: null,
      conversionGoals: {
        taxes: true,
        irmaa: false,
        roth: false,
        volatility: false
      },
      conversionMode: 'auto',
      rothWithdrawalAmount: 0,
      rothWithdrawalAmountRaw: '',
      rothWithdrawalStartYear: currentYear + 1,
      // Asset data from API
      assetBalanceData: null,
      // Initialize assetLineData as null, will be set in mounted
      assetLineData: {
        labels: [],
        datasets: []
      },
      // Initialize expenseSummaryData as null, will be set in mounted
      expenseSummaryData: null,
      // Keep the original data for backward compatibility
      taxesBarData: {
        labels: ['Before', 'After'],
        datasets: [
          {
            label: 'Total Taxes',
            backgroundColor: ['#007bff', '#28a745'],
            data: [250000, 180000]
          }
        ]
      },
      irmaaBarData: {
        labels: ['Before', 'After'],
        datasets: [
          {
            label: 'Total IRMAA',
            backgroundColor: ['#ffc107', '#17a2b8'],
            data: [40000, 22000]
          }
        ]
      },

      barOptions: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      },
      expenseSummaryOptions: {
        plugins: {
          legend: { 
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.raw.toLocaleString();
              }
            }
          },
          totalColumnHighlight: {
            beforeDraw: function(chart) {
              const ctx = chart.ctx;
              const xAxis = chart.scales.x;
              const yAxis = chart.scales.y;
              
              // Highlight the total column with a light background
              if (xAxis.getLabels().length > 4) {
                const totalIndex = 4; // Index of "Total Expenses"
                const xStart = xAxis.getPixelForValue(totalIndex) - xAxis.width / (xAxis.ticks.length * 2);
                const xEnd = xAxis.getPixelForValue(totalIndex) + xAxis.width / (xAxis.ticks.length * 2);
                const yStart = yAxis.top;
                const yHeight = yAxis.height;
                
                ctx.save();
                ctx.fillStyle = 'rgba(220, 220, 220, 0.3)';
                ctx.fillRect(xStart, yStart, xEnd - xStart, yHeight);
                ctx.restore();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Expense Categories'
            }
          }
        },
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false
      },
      lineOptions: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      },
      // Inheritance tax data and options
      inheritanceTaxData: null,
      inheritanceTaxOptions: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.raw.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Estate Categories'
            }
          }
        },
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false
      },
    };
  },
  computed: {
    filteredScenarioResults() {
      // Filter Roth conversion results to start at the conversion start year
      console.log('🔍 filteredScenarioResults - rothConversionResults:', this.rothConversionResults);
      console.log('🔍 filteredScenarioResults - rothConversionResults length:', this.rothConversionResults ? this.rothConversionResults.length : 'null');

      if (!this.rothConversionResults || this.rothConversionResults.length === 0) {
        console.warn('⚠️ filteredScenarioResults: No Roth conversion results available');
        return [];
      }

      // Get conversion start year from optimal schedule or UI
      const conversionStartYr = this.optimalSchedule && this.optimalSchedule.start_year
        ? parseInt(this.optimalSchedule.start_year)
        : parseInt(this.conversionStartYear) || new Date().getFullYear();

      // Always start from the conversion start year, ignoring retirement year
      const tableStartYear = conversionStartYr;

      // Log for debugging
      console.log(`🔍 Filtering Roth conversion results to start from year ${tableStartYear}`);

      // Filter Roth conversion results
      const filtered = this.rothConversionResults.filter(row => parseInt(row.year) >= tableStartYear);
      console.log('🔍 filteredScenarioResults - filtered result:', filtered);
      return filtered;
    },
    preRetirementResults() {
      // Filter results for years before first person retires
      return this.filteredScenarioResults.filter(row => parseInt(row.year) < this.retirementYear);
    },
    inRetirementResults() {
      // Filter results for years from first retirement onward
      return this.filteredScenarioResults.filter(row => parseInt(row.year) >= this.retirementYear);
    },
    eligibleAssets() {
      // Show all eligible accounts for conversion (Qualified and Inherited Traditional accounts only)
      const assets = this.assetDetails || [];
      return assets.filter(asset => {
        if (!asset || !asset.income_type) return false;
        const type = asset.income_type;
        // Only traditional/qualified accounts can be converted to Roth
        // Roth accounts are already tax-free and cannot be converted
        return [
          'Qualified',
          'Inherited Traditional Spouse', 
          'Inherited Traditional Non-Spouse'
        ].includes(type);
      });
    },
    selectedAssetList() {
      // Only include assets with a maxToConvert value > 0
      const assets = this.eligibleAssets || [];
      return assets.filter(asset => {
        const val = this.maxToConvert[asset.id || asset.income_type];
        return val && parseFloat(val) > 0;
      });
    },
    // Calculate the retirement year based on client's birthdate and retirement age
    retirementYear() {
      if (!this.client || !this.client.birthdate || !this.scenario || !this.scenario.retirement_age) {
        return new Date().getFullYear() + 5; // Default to 5 years from now
      }
      
      const birthYear = new Date(this.client.birthdate).getFullYear();
      return birthYear + parseInt(this.scenario.retirement_age);
    },
    // Calculate the total conversion amount
    totalConversionAmount() {
      return this.selectedAssetList.reduce((sum, asset) => {
        return sum + (parseFloat(this.maxToConvert[asset.id || asset.income_type]) || 0);
      }, 0);
    },
    isConversionAmountValid() {
      // Check if the annual conversion amount would exceed database limits
      const yearsToConvertNum = parseInt(this.yearsToConvert) || 1;
      const annualAmount = this.totalConversionAmount / yearsToConvertNum;
      const maxAllowedAmount = 999999999.99;
      return annualAmount <= maxAllowedAmount;
    },
    unaffectedAssets() {
      // Filter out assets that have no conversion amount
      return this.eligibleAssets.filter(asset => {
        const key = asset.id || asset.income_type;
        return !this.maxToConvert[key] || parseFloat(this.maxToConvert[key]) <= 0;
      });
    },
    yearsUntilRetirement() {
      const currentYear = new Date().getFullYear();
      return this.retirementYear - currentYear;
    },
    yearsUntilWithdrawal() {
      const currentYear = new Date().getFullYear();
      return this.rothWithdrawalStartYear - currentYear;
    },
    hasScenarioBeenRun() {
      // Check if we have scenario results or baseline metrics
      return (
        (this.rothConversionResults && this.rothConversionResults.length > 0) || 
        (this.baselineMetrics && Object.keys(this.baselineMetrics).length > 0) ||
        (this.optimalSchedule && Object.keys(this.optimalSchedule).length > 0)
      );
    },
    canRecalculateConversion() {
      // Button is enabled if:
      // 1. At least one asset has a conversion amount > 0
      // 2. Pre-retirement income validation passes (if required)
      // 3. Withdrawal year validation passes
      return (
        this.totalConversionAmount > 0 &&
        this.isPreRetirementIncomeValid &&
        this.isRothWithdrawalYearValid
      );
    },
    isRothWithdrawalYearValid() {
      // Roth Withdrawal Start Year must be after the FINAL conversion year
      const conversionStartYear = parseInt(this.conversionStartYear) || 0;
      const yearsToConvert = parseInt(this.yearsToConvert) || 1;
      const conversionEndYear = conversionStartYear + yearsToConvert - 1;
      const withdrawalYear = parseInt(this.rothWithdrawalStartYear) || 0;
      return withdrawalYear > conversionEndYear;
    },
    isPreRetirementIncomeRequired() {
      // Pre-retirement income is required if conversion starts before retirement
      const conversionStartYear = parseInt(this.conversionStartYear) || 0;
      return conversionStartYear < this.retirementYear;
    },
    isPreRetirementIncomeValid() {
      // If pre-retirement income is required, it must be provided and greater than 0
      if (this.isPreRetirementIncomeRequired) {
        const income = parseFloat(this.preRetirementIncome);
        return !isNaN(income) && income > 0;
      }
      return true; // Not required, so it's valid
    },
    shouldShowRothWithdrawalValidationError() {
      // Only show validation error if user has attempted to calculate
      return this.validationAttempted && !this.isRothWithdrawalYearValid;
    },
    availableWithdrawalYears() {
      // Filter years to only show those after the final conversion year
      const conversionStartYear = parseInt(this.conversionStartYear) || new Date().getFullYear();
      const yearsToConvert = parseInt(this.yearsToConvert) || 1;
      const conversionEndYear = conversionStartYear + yearsToConvert - 1;
      return this.availableYears.filter(year => year > conversionEndYear);
    },
    rmdYear() {
      // Calculate the year when client reaches RMD age (73)
      if (!this.client || !this.client.birthdate) {
        return new Date().getFullYear() + 5; // Default fallback
      }
      
      const birthYear = new Date(this.client.birthdate).getFullYear();
      return birthYear + 73; // RMD starts at age 73
    },
    canProceedFromStep1() {
      // Can proceed from step 1 if at least one asset has conversion amount > 0
      return this.totalConversionAmount > 0;
    },
    isConversionScheduleValid() {
      // Validate that the total conversion amount can be distributed across the years
      // without exceeding the max annual amount
      if (this.totalConversionAmount <= 0 || this.yearsToConvert <= 0) {
        return true; // No validation needed if no amount set
      }

      const maxAnnual = parseFloat(this.maxAnnualAmount) || 0;
      if (maxAnnual <= 0) {
        return true; // No max limit set
      }

      // Use distributeConversionAmounts to get the actual distribution
      const distributedAmounts = this.distributeConversionAmounts(
        this.totalConversionAmount,
        parseInt(this.yearsToConvert)
      );

      // Check if any year exceeds the max annual amount
      const exceedsMax = distributedAmounts.some(amount => amount > maxAnnual);

      return !exceedsMax;
    },
    conversionScheduleValidationMessage() {
      if (this.isConversionScheduleValid) {
        return '';
      }

      const maxAnnual = parseFloat(this.maxAnnualAmount) || 0;
      const distributedAmounts = this.distributeConversionAmounts(
        this.totalConversionAmount,
        parseInt(this.yearsToConvert)
      );
      const maxDistributed = Math.max(...distributedAmounts);

      return `Total conversion amount of ${this.formatCurrency(this.totalConversionAmount)} cannot be distributed across ${this.yearsToConvert} years without exceeding the max annual amount of ${this.formatCurrency(maxAnnual)}. The largest annual amount would be ${this.formatCurrency(maxDistributed)}. Please increase the years to convert or increase the max annual amount.`;
    },
    currentStepTitle() {
      const titles = {
        1: 'Step 1: Select Assets to Convert',
        2: 'Step 2: Conversion Schedule',
        3: 'Step 3: Income and Withdrawal Details'
      };
      return titles[this.currentStep] || 'Roth Conversion Setup';
    },
    // Inheritance tax computed properties
    inheritanceTaxSavings() {
      const baseline = this.baselineMetrics?.inheritance_tax || 0;
      const optimal = this.optimalSchedule?.score_breakdown?.inheritance_tax || 0;
      return Math.max(0, baseline - optimal);
    },
    baselineAssetBreakdown() {
      return this.baselineMetrics?.inheritance_tax_breakdown?.taxable_assets || {};
    },
    afterAssetBreakdown() {
      return this.optimalSchedule?.score_breakdown?.inheritance_tax_breakdown?.taxable_assets || {};
    },
    baselineTotalTaxableEstate() {
      return this.baselineMetrics?.inheritance_tax_breakdown?.total_taxable_estate || 0;
    },
    afterTotalTaxableEstate() {
      return this.optimalSchedule?.score_breakdown?.inheritance_tax_breakdown?.total_taxable_estate || 0;
    },
    baselineTotalTaxes() {
      return (this.baselineResults || []).reduce((sum, row) => {
        return sum + (parseFloat(row.total_taxes || row.federal_tax || 0));
      }, 0);
    },
    afterConversionTotalTaxes() {
      return (this.conversionResults || []).reduce((sum, row) => {
        return sum + (parseFloat(row.total_taxes || row.federal_tax || 0));
      }, 0);
    },
    // Audit table computed properties
    baselineYearByYear() {
      return this.baselineResults || [];
    },
    afterConversionYearByYear() {
      return this.conversionResults || [];
    }
  },
  watch: {
    conversionStartYear(newYear, oldYear) {
      // Auto-update Roth Withdrawal Start Year when Conversion Start Year changes
      if (newYear && oldYear && newYear !== oldYear) {
        const newConversionYear = parseInt(newYear);
        const currentWithdrawalYear = parseInt(this.rothWithdrawalStartYear);
        
        // If current withdrawal year is not valid (not after conversion year), 
        // automatically set it to conversion year + 1
        if (currentWithdrawalYear <= newConversionYear) {
          this.rothWithdrawalStartYear = newConversionYear + 1;
        }
      }
    },
    totalConversionAmount(newTotal) {
      // Auto-update Max Annual Conversion Amount when total changes
      if (newTotal > 0 && this.yearsToConvert > 0) {
        const annualAmount = newTotal / this.yearsToConvert;
        this.maxAnnualAmount = annualAmount;
        this.maxAnnualAmountRaw = this.formatCurrency(annualAmount);
      }
    }
  },
  methods: {
    distributeConversionAmounts(total, years) {
      // Distributes total conversion amount across years, handling remainders correctly
      const baseAmount = Math.floor(total / years);
      const remainder = total - (baseAmount * years);
      const amounts = Array(years).fill(baseAmount);
      amounts[years - 1] += remainder; // Add remainder to final year
      return amounts;
    },
    getBaselineIndex(filteredIndex) {
      // Maps the index in filteredScenarioResults to the corresponding index in baselineMetrics.year_by_year
      if (!this.baselineMetrics || !this.baselineMetrics.year_by_year || !this.filteredScenarioResults) {
        return -1;
      }

      const year = this.filteredScenarioResults[filteredIndex]?.year;
      if (!year) return -1;

      return this.baselineMetrics.year_by_year.findIndex(row => row.year === year);
    },
    generateAvailableYears() {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 41 }, (_, i) => currentYear + i);
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    },
    // Step navigation methods
    nextStep() {
      if (this.currentStep < 3) {
        this.currentStep++;
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    goToStep(step) {
      // Allow navigation to any step (users can jump between steps freely)
      if (step >= 1 && step <= 3) {
        this.currentStep = step;
      }
    },
    onMaxToConvertFocus(asset) {
      const key = asset.id || asset.income_type;
      const val = this.maxToConvert[key];
      if (!val || val === 0) {
        this.maxToConvertRaw[key] = '';
      } else {
        this.maxToConvertRaw[key] = val.toString();
      }
    },
    onMaxToConvertInput(event, asset) {
      const key = asset.id || asset.income_type;
      let raw = event.target.value.replace(/[^0-9.]/g, '');
      // Only allow one decimal point
      const parts = raw.split('.');
      if (parts.length > 2) raw = parts[0] + '.' + parts[1];
      // Limit to two decimals
      if (parts[1]) raw = parts[0] + '.' + parts[1].slice(0, 2);
      // Handle just a decimal (e.g., ".")
      if (raw === '.') {
        this.maxToConvertRaw[key] = '0.';
        this.maxToConvert[key] = 0;
        return;
      }
      // Handle empty input
      if (raw === '') {
        this.maxToConvertRaw[key] = '';
        this.maxToConvert[key] = 0;
        return;
      }
      // Parse to float
      let numeric = parseFloat(raw);
      if (isNaN(numeric)) numeric = 0;
      // ENFORCE MAXIMUM
      const max = parseFloat(asset.current_asset_balance) || 0;
      if (numeric > max) {
        numeric = max;
      }
      // Format with commas but no $ while typing
      const [intPart, decPart] = numeric.toString().split('.');
      let formatted = parseInt(intPart, 10).toLocaleString();
      if (decPart !== undefined) {
        formatted += '.' + decPart;
      }
      this.maxToConvertRaw[key] = formatted;
      this.maxToConvert[key] = numeric;
    },
    onMaxToConvertBlur(asset) {
      const key = asset.id || asset.income_type;
      const val = this.maxToConvert[key];
      this.maxToConvertRaw[key] = this.formatCurrency(val);
    },
    onCurrencyFocus(field) {
      if (!this[field] || this[field] === 0) {
        this[`${field}Raw`] = '';
      } else {
        this[`${field}Raw`] = this[field].toString();
      }
    },
    validateCurrencyInput(value) {
      // Validate currency input for edge cases
      if (value < 0) return false; // Reject negative amounts
      if (isNaN(value)) return false; // Reject non-numeric
      if (typeof value === 'string' && /e/i.test(value)) return false; // Reject scientific notation

      // Reject very large numbers (beyond reasonable financial amounts)
      // Max: 999,999,999.99 (database limit for 12-digit decimal fields)
      const MAX_AMOUNT = 999999999.99;
      if (value > MAX_AMOUNT) {
        console.warn(`Amount ${value} exceeds maximum allowed value of ${MAX_AMOUNT}`);
        return false;
      }

      return true;
    },
    onCurrencyInput(event, field) {
      const inputValue = event.target.value;

      // Check for scientific notation before any processing
      if (/[eE]/.test(inputValue)) {
        console.warn('Scientific notation not allowed');
        return; // Reject scientific notation inputs
      }

      // Strip out invalid characters (keep only digits and decimal point)
      let raw = inputValue.replace(/[^0-9.]/g, '');

      // Handle multiple decimal points
      const parts = raw.split('.');
      if (parts.length > 2) raw = parts[0] + '.' + parts[1];

      // Limit decimal places to 2
      if (parts[1]) raw = parts[0] + '.' + parts[1].slice(0, 2);

      // Handle edge case: just a decimal point
      if (raw === '.') {
        this[`${field}Raw`] = '0.';
        this[field] = 0;
        return;
      }

      // Handle empty input
      if (raw === '') {
        this[`${field}Raw`] = '';
        this[field] = 0;
        return;
      }

      let numeric = parseFloat(raw);
      if (isNaN(numeric)) numeric = 0;

      // Validate the numeric value (checks for negative, NaN, and very large numbers)
      if (!this.validateCurrencyInput(numeric)) {
        console.warn('Invalid currency input:', numeric);
        return;
      }

      // Format the display value with thousands separators
      const [intPart, decPart] = numeric.toString().split('.');
      let formatted = parseInt(intPart, 10).toLocaleString();
      if (decPart !== undefined) {
        formatted += '.' + decPart;
      }
      this[`${field}Raw`] = formatted;
      this[field] = numeric;
    },
    onCurrencyBlur(field) {
      this[`${field}Raw`] = this.formatCurrency(this[field]);
    },
    calculateProjectedValue(asset) {
      // Simple compound interest calculation for asset growth
      const initialValue = parseFloat(asset.current_asset_balance) || 0;
      const conversionAmount = parseFloat(this.maxToConvert[asset.id || asset.income_type]) || 0;
      const remainingValue = initialValue - conversionAmount;
      
      // Use asset's growth rate if available, otherwise use a default value
      const growthRate = parseFloat(asset.rate_of_return || asset.growth_rate || 0);
      const years = this.yearsUntilRetirement;
      
      // Compound interest formula: A = P(1 + r/100)^t
      return remainingValue * Math.pow(1 + (growthRate / 100), years);
    },
    calculateRothProjectedValue() {
      // Calculate the projected value of the new Roth IRA
      const totalConversion = this.totalConversionAmount;
      const growthRate = parseFloat(this.rothGrowthRate) || 5.0;
      const yearsToRetirement = this.yearsUntilRetirement;
      const yearsToWithdrawal = this.yearsUntilWithdrawal;
      
      // Calculate value at retirement first
      let rothValue = totalConversion * Math.pow(1 + (growthRate / 100), yearsToRetirement);
      
      // If withdrawal starts after retirement, continue growth until withdrawal starts
      if (this.rothWithdrawalStartYear > this.retirementYear) {
        const additionalYears = this.rothWithdrawalStartYear - this.retirementYear;
        rothValue = rothValue * Math.pow(1 + (growthRate / 100), additionalYears);
      }
      
      return rothValue;
    },
    calculateWithdrawalYearPosition() {
      // Calculate the position of the withdrawal year marker on the timeline
      const currentYear = new Date().getFullYear();
      const totalYears = 30; // Total years shown in the timeline
      const withdrawalYear = parseInt(this.rothWithdrawalStartYear) || currentYear;
      
      // Calculate position as percentage of timeline width
      const position = ((withdrawalYear - currentYear) / totalYears) * 100;
      return Math.min(Math.max(position, 0), 100); // Clamp between 0-100%
    },
    calculateConversionStartPosition() {
      // Calculate the position of the conversion start year marker on the timeline
      const currentYear = new Date().getFullYear();
      const totalYears = 30; // Total years shown in the timeline
      const conversionYear = parseInt(this.conversionStartYear) || currentYear;
      
      // Calculate position as percentage of timeline width
      const position = ((conversionYear - currentYear) / totalYears) * 100;
      return Math.min(Math.max(position, 0), 100); // Clamp between 0-100%
    },
    calculateConversionEndPosition() {
      // Calculate the position of the conversion end year marker on the timeline
      const currentYear = new Date().getFullYear();
      const totalYears = 30; // Total years shown in the timeline
      const conversionEndYear = parseInt(this.conversionStartYear) + parseInt(this.yearsToConvert) || currentYear;
      
      // Calculate position as percentage of timeline width
      const position = ((conversionEndYear - currentYear) / totalYears) * 100;
      return Math.min(Math.max(position, 0), 100); // Clamp between 0-100%
    },
    updateAssetLineData() {
      try {
        // Generate years for x-axis
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 30 }, (_, i) => currentYear + i);
        
        // Create datasets for each affected asset
        const datasets = [];
        
        // If we have no assets or no scenario has been run, use the default data
        if (!this.hasScenarioBeenRun && (!this.eligibleAssets || this.eligibleAssets.length === 0)) {
          // Use default data
          this.assetLineData = {
            labels: years.map(year => year.toString()),
            datasets: [
              {
                label: 'IRA',
                borderColor: '#007bff',
                backgroundColor: 'rgba(0,123,255,0.1)',
                data: [300000, 250000, 200000, 180000, 160000, 140000, 120000, 100000, 80000, 60000, 40000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 2, 1, 1, 1, 1, 1, 1],
                fill: false
              },
              {
                label: '401k',
                borderColor: '#28a745',
                backgroundColor: 'rgba(40,167,69,0.1)',
                data: [200000, 180000, 160000, 140000, 120000, 100000, 80000, 60000, 40000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                fill: false
              },
              {
                label: 'Traditional IRA',
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255,193,7,0.1)',
                data: [100000, 95000, 90000, 85000, 80000, 75000, 70000, 65000, 60000, 55000, 50000, 45000, 40000, 35000, 30000, 25000, 20000, 15000, 10000, 5000, 2500, 1000, 500, 200, 100, 50, 25, 10, 5, 2],
                fill: false
              },
              {
                label: 'Roth IRA',
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111,66,193,0.1)',
                data: [0, 20000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000, 320000, 340000, 360000, 380000, 400000, 420000, 440000, 460000, 480000, 500000, 520000, 540000, 560000, 580000],
                fill: false
              }
            ]
          };
          return;
        }
        
        // Add datasets for affected assets (with declining balances due to conversion)
        this.selectedAssetList.forEach(asset => {
          const initialValue = parseFloat(asset.current_asset_balance) || 0;
          const conversionAmount = parseFloat(this.maxToConvert[asset.id || asset.income_type]) || 0;
          console.log(`🔍 Asset ${asset.income_type}: initial=${initialValue}, conversion=${conversionAmount}`);
          const growthRate = parseFloat(asset.rate_of_return || asset.growth_rate || 0);
          const yearsToConvert = parseInt(this.yearsToConvert) || 1;
          const annualConversion = conversionAmount / yearsToConvert;
          
          // Generate data points for this asset
          const data = [];
          let balance = initialValue;
          
          for (let i = 0; i < years.length; i++) {
            const year = years[i];
            // Apply growth first (start of year)
            balance = balance * (1 + (growthRate / 100));
            
            // Apply conversion during conversion years (reduce balance)
            if (year >= this.conversionStartYear && year < (this.conversionStartYear + yearsToConvert)) {
              balance -= annualConversion;
            }
            
            // Ensure balance doesn't go below zero
            balance = Math.max(0, balance);
            data.push(balance);
          }
          
          // Add to datasets
          datasets.push({
            label: asset.income_name || asset.investment_name || asset.income_type || 'Asset',
            borderColor: this.getRandomColor(),
            backgroundColor: 'rgba(0,0,0,0.1)',
            data: data,
            fill: false
          });
        });
        
        // Add dataset for unaffected assets
        this.unaffectedAssets.forEach(asset => {
          const initialValue = parseFloat(asset.current_asset_balance) || 0;
          const growthRate = parseFloat(asset.rate_of_return || asset.growth_rate || 0);
          
          // Generate data points
          const data = [];
          let balance = initialValue;
          
          for (let i = 0; i < years.length; i++) {
            const year = years[i];
            // Apply growth
            balance = balance * (1 + (growthRate / 100));
            data.push(balance);
          }
          
          // Add to datasets
          datasets.push({
            label: asset.income_name || asset.investment_name || asset.income_type || 'Asset',
            borderColor: this.getRandomColor(),
            backgroundColor: 'rgba(0,0,0,0.1)',
            data: data,
            fill: false
          });
        });
        
        // Add Roth IRA dataset
        const rothData = [];
        let rothBalance = 0;
        const rothGrowthRate = parseFloat(this.rothGrowthRate) || 5.0;
        const withdrawalAmount = parseFloat(this.rothWithdrawalAmount) || 0;
        const annualConversion = this.totalConversionAmount / this.yearsToConvert;
        
        for (let i = 0; i < years.length; i++) {
          const year = years[i];
          
          // Add conversion amounts during conversion years (at start of year)
          if (year >= this.conversionStartYear && year < (this.conversionStartYear + this.yearsToConvert)) {
            const annualConversion = this.totalConversionAmount / this.yearsToConvert;
            rothBalance += annualConversion;
            console.log(`💰 Year ${year}: Adding conversion ${annualConversion}, balance now: ${rothBalance}`);
          }
          
          // Apply growth to the entire balance (including new conversions)
          const growthMultiplier = (1 + (rothGrowthRate / 100));
          const balanceBeforeGrowth = rothBalance;
          rothBalance = rothBalance * growthMultiplier;
          if (year >= 2030 && year <= 2037) { // Only log conversion and post-conversion years to avoid spam
            console.log(`🔍 Year ${year}: Roth balance ${balanceBeforeGrowth} * ${growthMultiplier} = ${rothBalance}`);
          }
          
          // Apply withdrawals if past withdrawal start year (at end of year)
          if (year >= this.rothWithdrawalStartYear && withdrawalAmount > 0) {
            rothBalance -= withdrawalAmount;
            rothBalance = Math.max(0, rothBalance); // Ensure balance doesn't go below zero
          }
          
          rothData.push(rothBalance);
        }
        
        // Add Roth dataset if we have conversion data
        if (this.totalConversionAmount > 0) {
          datasets.push({
            label: 'Roth IRA',
            borderColor: '#6f42c1', // Purple for Roth
            backgroundColor: 'rgba(111,66,193,0.1)',
            data: rothData,
            fill: false,
            borderWidth: 2,
            tension: 0.1
          });
        }
        
        // Make sure we have at least one dataset
        if (datasets.length === 0) {
          datasets.push({
            label: 'Default Asset',
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.1)',
            data: Array(years.length).fill(0),
            fill: false
          });
        }
        
        // Update the asset line data
        this.assetLineData = {
          labels: years.map(year => year.toString()),
          datasets: datasets
        };
      } catch (error) {
        console.error('Error updating asset line data:', error);
        // Provide fallback data to ensure the graph doesn't break
        this.assetLineData = {
          labels: Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() + i).toString()),
          datasets: [
            {
              label: 'Default Asset',
              borderColor: '#007bff',
              backgroundColor: 'rgba(0,123,255,0.1)',
              data: Array(30).fill(0),
              fill: false
            }
          ]
        };
      }
    },
    getRandomColor() {
      // Generate a random color for asset lines
      const colors = [
        '#007bff', // Blue
        '#28a745', // Green
        '#ffc107', // Yellow
        '#dc3545', // Red
        '#17a2b8', // Cyan
        '#fd7e14', // Orange
        '#20c997', // Teal
        '#e83e8c', // Pink
        '#6610f2', // Indigo
        '#6c757d'  // Gray
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    hexToRgba(hex, alpha) {
      // Convert hex color to rgba
      if (!hex) return 'rgba(0,0,0,0.1)';
      
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    async recalculateConversion() {
      // Flag to track recalculation state
      this._isRecalculating = true;
      // Set validation attempted flag for better UX
      this.validationAttempted = true;
      
      // Check if Roth Withdrawal Start Year is valid before proceeding
      if (!this.isRothWithdrawalYearValid) {
        console.warn('Roth Withdrawal Start Year validation failed');
        this._isRecalculating = false;
        return;
      }
      
      // Check if conversion amount is valid for database storage
      if (!this.isConversionAmountValid) {
        console.error('Conversion amount exceeds database limit');
        alert('The annual conversion amount is too large for the database. Please reduce the total conversion amount or increase the number of conversion years.');
        this._isRecalculating = false;
        return;
      }
      
      // Check if client exists
      if (!this.client) {
        console.error('Client data is missing');
        console.error('Client data is missing. Cannot calculate conversion.');
        this._isRecalculating = false;
        return;
      }

      // Always include all income-producing assets
      const allAssets = (this.assetDetails || []).map(asset => ({
        ...asset,
        max_to_convert: this.maxToConvert[asset.id || asset.income_type] || 0
      }));

      // Always use manual mode
      const modeToSend = 'manual';

      // Calculate total amount to convert from all selected assets
      const totalToConvert = allAssets
        .filter(asset => [
          'Qualified', 'Inherited Traditional Spouse', 'Inherited Traditional Non-Spouse'
        ].includes(asset.income_type || ''))
        .reduce((sum, asset) => sum + (parseFloat(asset.max_to_convert) || 0), 0);

      // Ensure we have valid years to convert
      const yearsToConvert = Math.max(1, parseInt(this.yearsToConvert) || 1);
      
      // Calculate annual conversion amount by dividing total by years
      const annualConversion = totalToConvert / yearsToConvert;
      
      // Ensure all required fields have valid values
      const currentYear = new Date().getFullYear();
      const conversionStartYear = parseInt(this.conversionStartYear) || currentYear;
      const rothWithdrawalStartYear = parseInt(this.rothWithdrawalStartYear) || currentYear;
      const rothWithdrawalAmount = parseFloat(this.rothWithdrawalAmount) || 0;
      const rothGrowthRate = parseFloat(this.rothGrowthRate) || 0;
      const maxAnnualAmount = parseFloat(this.maxAnnualAmount) || 0;

      // Ensure the client and scenario have all required fields
      const scenarioData = {
        ...this.scenario,
        roth_conversion_start_year: parseInt(conversionStartYear),
        roth_conversion_duration: yearsToConvert,
        roth_conversion_annual_amount: annualConversion,  // Add the annual conversion amount for backend
        roth_withdrawal_amount: rothWithdrawalAmount,
        roth_withdrawal_start_year: rothWithdrawalStartYear,
        pre_retirement_income: this.preRetirementIncome || 0,
        max_annual_amount: maxAnnualAmount,
        // Add these fields to ensure they exist
        retirement_age: this.scenario.retirement_age || 65,
        mortality_age: this.scenario.mortality_age || 90,
        part_b_inflation_rate: this.scenario.part_b_inflation_rate || 3.0,
        part_d_inflation_rate: this.scenario.part_d_inflation_rate || 3.0,
      };
      
      // Ensure client has required fields
      const clientData = {
        ...this.client,
        // Safely access tax_status with fallback
        tax_status: this.client?.tax_status || 'Single',
        // Add other potentially missing fields
        birthdate: this.client?.birthdate || new Date().toISOString().split('T')[0],
        name: this.client?.name || 'Client',
        gender: this.client?.gender || 'M',
        state: this.client?.state || 'CA'
      };

      console.log('Client data being sent:', clientData);

      const payload = {
        scenario: scenarioData,
        client: clientData,
        spouse: this.scenario.spouse || (this.scenario.spouse_birthdate ? { birthdate: this.scenario.spouse_birthdate } : null),
        assets: allAssets,
        optimizer_params: {
          mode: modeToSend,
          conversion_start_year: parseInt(conversionStartYear),
          years_to_convert: yearsToConvert,
          annual_conversion_amount: annualConversion,
          roth_growth_rate: rothGrowthRate,
          max_annual_amount: maxAnnualAmount,
          max_total_amount: totalToConvert,
          roth_withdrawal_amount: rothWithdrawalAmount,
          roth_withdrawal_start_year: rothWithdrawalStartYear
        }
      };

      // Debug: print payload and mode to console
      console.log('Roth Conversion Payload:', JSON.stringify(payload, null, 2));
      console.log('Optimizer mode being sent:', modeToSend);
      console.log('Years to convert:', yearsToConvert);
      console.log('Total to convert:', totalToConvert);
      console.log('Annual conversion amount:', annualConversion);
      console.log('Conversion start year (parsed):', parseInt(conversionStartYear));
      console.log('Retirement year:', this.retirementYear);
      console.log('Max annual amount:', maxAnnualAmount);
      console.log('Scenario roth_conversion_annual_amount:', scenarioData.roth_conversion_annual_amount);

      try {
        // Create a loading indicator for the user
        console.log('Calculating Roth conversion...');

        console.log('🔍 Request payload to /api/roth-optimize/:', JSON.stringify(payload, null, 2));
        const response = await fetch(apiService.getUrl('/api/roth-optimize/'), {
          method: 'POST',
          credentials: 'include',  // Use httpOnly cookies for authentication
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          const errorMessage = data.error || data.detail || 'Calculation failed. Please try again.';
          console.error('API error:', data);
          console.error(`Error: ${errorMessage}`);
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 5000,
          });
          this._isRecalculating = false;
          return;
        }
        
        console.log('🔍 Complete API response:', data);
        console.log('🔍 API response keys:', Object.keys(data || {}));
        console.log('🔍 API response type:', typeof data);
        
        // Only update our specific data if we have valid response data
        if (data) {
          console.log('🔍 API Response data structure:', JSON.stringify(data, null, 2));
          console.log('🔍 API Response data.conversion:', data.conversion);
          console.log('🔍 API Response data.year_by_year:', data.year_by_year);
          console.log('🔍 API Response data.baseline:', data.baseline);
          console.log('🔍 API Response data.optimal_schedule:', data.optimal_schedule);
          console.log('🔍 API Response data.baseline_results:', data.baseline_results);
          console.log('🔍 API Response data.conversion_results:', data.conversion_results);
          console.log('🔍 API Response data.baseline_comprehensive:', data.baseline_comprehensive);
          console.log('🔍 API Response data.conversion_comprehensive:', data.conversion_comprehensive);

          // Store the baseline and conversion year-by-year results for audit table
          this.baselineResults = data.baseline_results || [];
          this.conversionResults = data.conversion_results || [];
          this.conversionComprehensiveData = data.conversion_comprehensive || null;
          console.log('🔍 Stored baselineResults:', this.baselineResults.length, 'years');
          console.log('🔍 Stored conversionResults:', this.conversionResults.length, 'years');
          console.log('🔍 Stored conversionComprehensiveData:', this.conversionComprehensiveData ? 'available' : 'null');

          // Store the API response data in component properties
          // Handle the new response structure with baseline and conversion data
          if (data.conversion && data.conversion.year_by_year) {
            this.rothConversionResults = data.conversion.year_by_year || [];
            console.log('🔍 Set rothConversionResults from data.conversion.year_by_year:', this.rothConversionResults.length);
          } else if (data.year_by_year) {
            // Fallback to old API structure
            this.rothConversionResults = data.year_by_year || [];
            console.log('🔍 Set rothConversionResults from data.year_by_year:', this.rothConversionResults.length);
          } else {
            this.rothConversionResults = [];
            console.warn('⚠️ No year_by_year data found in API response, setting empty rothConversionResults');
          }
          
          this.comparisonMetrics = data.comparison || {};
          this.optimalSchedule = data.optimal_schedule || {};
          this.conversionCostMetrics = data.conversion_cost_metrics || null;

          console.log('🔵 Setting optimalSchedule:', this.optimalSchedule);
          console.log('🔵 Setting conversionCostMetrics:', this.conversionCostMetrics);
          console.log('🔵 optimalSchedule.score_breakdown:', this.optimalSchedule.score_breakdown);
          if (this.optimalSchedule.score_breakdown) {
            console.log('🔵 optimalSchedule.score_breakdown.total_rmds:', this.optimalSchedule.score_breakdown.total_rmds);
          }
          
          // Update the UI's conversion start year to match the optimal schedule
          if (this.optimalSchedule && this.optimalSchedule.start_year) {
            this.conversionStartYear = parseInt(this.optimalSchedule.start_year);
            console.log('Updated UI conversion start year to match optimal schedule:', this.conversionStartYear);
          }
          
          // Handle the new baseline metrics structure
          console.log('🔵 API RESPONSE PROCESSING:');
          console.log('🔵 data.baseline:', data.baseline);
          console.log('🔵 data.optimal_schedule:', data.optimal_schedule);
          
          if (data.baseline && data.baseline.metrics) {
            this.baselineMetrics = data.baseline.metrics || {};
            console.log('🔵 Setting baselineMetrics from data.baseline.metrics:', this.baselineMetrics);
            console.log('🔵 baselineMetrics.total_rmds:', this.baselineMetrics.total_rmds);
          } else {
            // Fallback to old API structure
            this.baselineMetrics = data.baseline || {};
            console.log('🔵 Using fallback - Setting baselineMetrics from data.baseline:', this.baselineMetrics);
          }
          
          // Generate asset line data from the year-by-year results which contain asset balances
          if (this.rothConversionResults && this.rothConversionResults.length > 0) {
            console.log('📊 Generating asset line data from Roth conversion results...');
            // Extract asset balance data from year-by-year results
            const assetLineData = this.generateAssetLineDataFromYearByYear(this.rothConversionResults);
            if (assetLineData) {
              console.log('📊 Setting assetLineData from API:', assetLineData);
              this.assetLineData = assetLineData;
            }
          } else {
            console.log('📊 No API results, using local generation...');
            // Fallback to generating asset line data locally
            const newAssetLineData = this.generateAssetLineData();
            if (newAssetLineData) {
              console.log('📊 Setting assetLineData from local:', newAssetLineData);
              this.assetLineData = JSON.parse(JSON.stringify(newAssetLineData));
            }
          }
          
          // Set flag that we have run a scenario BEFORE generating the expense summary
          this.hasScenarioBeenRun = true;
          
          // Generate expense summary data (now it will use real data)
          const newExpenseSummaryData = this.generateExpenseSummaryData();
          if (newExpenseSummaryData) {
            console.log('📊 Setting new expense summary data:', newExpenseSummaryData);
            // Force Vue to detect the change by creating a completely new object
            this.expenseSummaryData = Object.freeze(JSON.parse(JSON.stringify(newExpenseSummaryData)));
            // Force a re-render of the chart component
            this.$nextTick(() => {
              console.log('📊 Chart data updated, forcing re-render');
              this.$forceUpdate();
            });
          }

          // Generate inheritance tax data
          const newInheritanceTaxData = this.generateInheritanceTaxData();
          if (newInheritanceTaxData) {
            console.log('🟣 Setting new inheritance tax data:', newInheritanceTaxData);
            this.inheritanceTaxData = Object.freeze(JSON.parse(JSON.stringify(newInheritanceTaxData)));
          }

          // Scroll to the Expense Summary section
          this.$nextTick(() => {
            const expenseSummaryElement = document.getElementById('expense-summary');
            if (expenseSummaryElement) {
              // First scroll to center, then adjust with a small offset
              expenseSummaryElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
              });
              
              // Add a small delay then scroll a bit more to show more content below
              setTimeout(() => {
                window.scrollBy({
                  top: 100, // Scroll down an additional 100px
                  behavior: 'smooth'
                });
              }, 500); // Wait for first scroll to complete
            }
          });
        } else {
          console.error('Invalid response data structure');
        }
        
        // Save the Roth conversion data to the database
        const saveResult = await this.saveRothConversionScenario();
        if (saveResult) {
          console.log('Roth conversion data saved successfully');
        } else {
          console.error('Error saving Roth conversion data');
        }
        
        // Debug: log income fields for each year
        if (this.rothConversionResults && this.rothConversionResults.length) {
          console.log('--- Roth ConversionTab: Income Data by Year ---');
          this.rothConversionResults.forEach(row => {
            const assetBalances = Object.fromEntries(Object.entries(row).filter(([k]) => k.endsWith('_balance')));
            const assetWithdrawals = Object.fromEntries(Object.entries(row).filter(([k]) => k.endsWith('_withdrawal') || k.endsWith('_conversion') || k.endsWith('_rmd') || k.endsWith('_distribution')));
            console.log(`Year: ${row.year}`);
            console.log('  Asset Balances:', assetBalances);
            if (Object.keys(assetWithdrawals).length > 0) {
              console.log('  Asset Withdrawals/Conversions:', assetWithdrawals);
            }
            console.log(`  Roth Conversion Amount: ${row.roth_conversion}`);
            console.log(`  Gross Income: ${row.gross_income}, SS Income: ${row.ss_income}, Taxable SS: ${row.taxable_ss}, Taxable Income: ${row.taxable_income}`);
          });
        } else {
          console.warn('No rothConversionResults returned from backend.');
        }
      } catch (err) {
        console.error('Error running optimizer:', err);
      } finally {
        // Always reset the recalculation flag
        this._isRecalculating = false;
      }
    },
    async saveRothConversionScenario() {
      try {
        // Validate required data
        if (!this.client || !this.client.id) {
          console.error('Client data is missing');
          throw new Error('Client data is missing. Cannot save scenario.');
        }
        
        if (!this.scenario || !this.scenario.id) {
          console.error('Scenario data is missing');
          throw new Error('Scenario data is missing. Cannot save scenario.');
        }
        
        const authStore = useAuthStore();
        const token = authStore.accessToken;
        
        if (!token) {
          console.error('No authentication token available');
          throw new Error('No authentication token available');
        }
        
        // Calculate annual conversion amount with validation for 12-digit database limit
        const yearsToConvertNum = parseInt(this.yearsToConvert) || 1;
        const rawAnnualAmount = this.totalConversionAmount / yearsToConvertNum;
        // Limit to 12 digits total (including decimals) - max value around 999,999,999.99
        const maxAllowedAmount = 999999999.99;
        const annualAmount = Math.min(rawAnnualAmount, maxAllowedAmount);
        
        if (rawAnnualAmount > maxAllowedAmount) {
          console.warn(`⚠️ Annual conversion amount (${rawAnnualAmount.toFixed(2)}) exceeds database limit, capping at ${maxAllowedAmount}`);
        }

        // Prepare the scenario update data
        const scenarioUpdateData = {
          id: this.scenario.id,
          name: this.scenario.name,
          description: this.scenario.description || 'Roth Conversion Scenario',
          roth_conversion_start_year: parseInt(this.conversionStartYear) || new Date().getFullYear(),
          roth_conversion_duration: yearsToConvertNum,
          roth_conversion_annual_amount: Math.round(annualAmount * 100) / 100, // Round to 2 decimal places
          retirement_age: this.scenario.retirement_age || 65,
          medicare_age: this.scenario.medicare_age || 65,
          spouse_retirement_age: this.scenario.spouse_retirement_age,
          spouse_medicare_age: this.scenario.spouse_medicare_age,
          mortality_age: this.scenario.mortality_age || 90,
          spouse_mortality_age: this.scenario.spouse_mortality_age,
          part_b_inflation_rate: this.scenario.part_b_inflation_rate || 3.0,
          part_d_inflation_rate: this.scenario.part_d_inflation_rate || 3.0,
          apply_standard_deduction: this.scenario.apply_standard_deduction !== undefined ? this.scenario.apply_standard_deduction : true
        };
        
        console.log('🔍 Scenario update data being sent:', scenarioUpdateData);
        console.log('🔍 Total conversion amount:', this.totalConversionAmount);
        console.log('🔍 Years to convert:', this.yearsToConvert);
        
        // Update the scenario with Roth conversion parameters
        try {
          const response = await fetch(apiService.getUrl(`/api/scenarios/${this.scenario.id}/update/`), {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(scenarioUpdateData)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('API error response status:', response.status);
            console.error('API error response data:', data);
            console.error('API error details:', JSON.stringify(data, null, 2));
            throw new Error(`Error ${response.status}: ${data.error || data.detail || JSON.stringify(data) || 'Unknown error occurred'}`);
          }
        } catch (error) {
          console.error('Error updating scenario:', error);
          toast.error('Failed to save scenario updates. Conversion results are displayed but may not be saved.', {
            position: 'top-right',
            autoClose: 5000,
          });
          // Don't rethrow - we'll try to continue with asset updates
        }
        
        // Update asset data to save conversion amounts
        const assetUpdates = [];
        
        // Process assets that have conversion amounts
        for (const asset of this.selectedAssetList) {
          const conversionAmount = parseFloat(this.maxToConvert[asset.id || asset.income_type]) || 0;
          if (conversionAmount > 0) {
            assetUpdates.push({
              id: asset.id,
              max_to_convert: conversionAmount,
              scenario_id: this.scenario.id
            });
          }
        }
        
        // Save asset updates if there are any
        if (assetUpdates.length > 0) {
          try {
            const assetResponse = await fetch(apiService.getUrl(`/api/scenarios/${this.scenario.id}/update-assets/`), {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ assets: assetUpdates })
            });
            
            const assetData = await assetResponse.json();
            
            if (!assetResponse.ok) {
              console.error('API error updating assets:', assetData);
              throw new Error(`Error updating assets: ${assetData.error || 'Unknown error occurred'}`);
            }
          } catch (error) {
            console.error('Error updating assets:', error);
            toast.error('Failed to save asset conversion amounts. You may need to re-enter them.', {
              position: 'top-right',
              autoClose: 5000,
            });
            // Continue with the flow even if asset updates fail
          }
        }
        
        console.log('Roth Conversion Scenario saved successfully!');
        return true;
      } catch (err) {
        console.error('Error saving Roth Conversion Scenario:', err);
        console.error('Error details:', err.message);
        return false;
      }
    },
    exportComparisonReport() {
      // Implement PDF export logic
    },
    formatBeforeConversionDataForExport(rawData) {
      const formatted = [];

      rawData.forEach(row => {
        const formattedRow = {
          'Year': row.year,
          'Primary Age': row.primary_age || '',
        };

        // Add spouse age if applicable
        if (this.client?.tax_status?.toLowerCase() !== 'single') {
          formattedRow['Spouse Age'] = row.spouse_age || '';
        }

        // Income sources (dynamic columns based on income_by_source)
        if (row.income_by_source) {
          Object.keys(row.income_by_source).forEach(sourceId => {
            const sourceName = rawData.income_source_names?.[sourceId] || `Income ${sourceId}`;
            formattedRow[sourceName] = row.income_by_source[sourceId] || 0;
          });
        }

        // Asset balances (dynamic columns)
        if (row.asset_balances) {
          Object.keys(row.asset_balances).forEach(assetId => {
            const assetName = rawData.asset_names?.[assetId] || `Asset ${assetId}`;
            formattedRow[assetName] = row.asset_balances[assetId] || 0;
          });
        }

        // RMDs
        formattedRow['RMD Required'] = Object.keys(row.rmd_required || {}).length > 0
          ? Object.values(row.rmd_required).reduce((a, b) => a + b, 0)
          : 0;
        formattedRow['RMD Total'] = row.rmd_total || 0;

        // Taxes
        formattedRow['AGI'] = row.agi || 0;
        formattedRow['MAGI'] = row.magi || 0;
        formattedRow['Taxable Income'] = row.taxable_income || 0;
        formattedRow['Federal Tax'] = row.federal_tax || 0;
        formattedRow['State Tax'] = row.state_tax || 0;
        formattedRow['Marginal Rate'] = `${row.marginal_rate || 0}%`;
        formattedRow['Effective Rate'] = `${row.effective_rate || 0}%`;

        // Medicare
        formattedRow['Part B'] = row.part_b || 0;
        formattedRow['Part D'] = row.part_d || 0;
        formattedRow['IRMAA'] = row.irmaa_surcharge || 0;
        formattedRow['IRMAA Bracket'] = row.irmaa_bracket_number || 0;
        formattedRow['Total Medicare'] = row.total_medicare || 0;

        // Income Phases
        formattedRow['Gross Income'] = row.gross_income_total || 0;
        formattedRow['After Tax'] = row.after_tax_income || 0;
        formattedRow['After Medicare'] = row.after_medicare_income || 0;

        // Net Income
        formattedRow['Remaining'] = row.remaining_income || 0;

        formatted.push(formattedRow);
      });

      return formatted;
    },
    calculateBeforeConversionTotals(formattedData) {
      if (formattedData.length === 0) return {};

      const totals = {
        'Year': 'TOTALS',
        'Primary Age': '-'
      };

      if (this.client?.tax_status?.toLowerCase() !== 'single') {
        totals['Spouse Age'] = '-';
      }

      // Get all column names from first row
      const firstRow = formattedData[0];
      Object.keys(firstRow).forEach(column => {
        if (column === 'Year' || column === 'Primary Age' || column === 'Spouse Age' ||
            column === 'Marginal Rate' || column === 'Effective Rate' || column === 'IRMAA Bracket') {
          // Skip these columns or already set
          return;
        }

        // Sum all numeric columns
        totals[column] = formattedData.reduce((sum, row) => {
          const value = typeof row[column] === 'number' ? row[column] : 0;
          return sum + value;
        }, 0);
      });

      // Asset balances should be final year values, not sums
      const lastRow = formattedData[formattedData.length - 1];
      Object.keys(lastRow).forEach(key => {
        if (key.includes('Balance') || key.includes('balance')) {
          totals[key] = lastRow[key];
        }
      });

      // Set non-summable fields to dash
      totals['Marginal Rate'] = '-';
      totals['Effective Rate'] = '-';
      totals['IRMAA Bracket'] = '-';

      return totals;
    },
    formatAfterConversionDataForExport(rawData, metadata) {
      const formatted = [];

      rawData.forEach(row => {
        const formattedRow = {
          'Year': row.year,
          'Primary Age': row.primary_age || '',
        };

        // Add spouse age if applicable
        if (this.client?.tax_status?.toLowerCase() !== 'single') {
          formattedRow['Spouse Age'] = row.spouse_age || '';
        }

        // Pre-retirement income
        formattedRow['Pre-Retirement Income'] = row.pre_retirement_income || 0;

        // Income sources (dynamic columns)
        if (row.income_by_source) {
          Object.keys(row.income_by_source).forEach(sourceId => {
            const sourceName = metadata?.income_source_names?.[sourceId] || `Income ${sourceId}`;
            formattedRow[sourceName] = row.income_by_source[sourceId] || 0;
          });
        }

        // Roth Conversion
        formattedRow['Conversion Amount'] = row.roth_conversion || 0;

        // Asset balances (dynamic columns)
        if (row.asset_balances) {
          Object.keys(row.asset_balances).forEach(assetId => {
            const assetName = metadata?.asset_names?.[assetId] || `Asset ${assetId}`;
            formattedRow[assetName] = row.asset_balances[assetId] || 0;
          });
        }

        // RMDs
        formattedRow['RMD Required'] = Object.keys(row.rmd_required || {}).length > 0
          ? Object.values(row.rmd_required).reduce((a, b) => a + b, 0)
          : 0;
        formattedRow['RMD Total'] = row.rmd_total || row.rmd_amount || 0;

        // Taxes (with conversion-specific columns)
        formattedRow['AGI'] = row.agi || 0;
        formattedRow['MAGI'] = row.magi || 0;
        formattedRow['Taxable Income'] = row.taxable_income || 0;
        formattedRow['Regular Tax'] = row.regular_income_tax || 0;
        formattedRow['Conversion Tax'] = row.conversion_tax || 0;
        formattedRow['Federal Tax'] = row.federal_tax || 0;
        formattedRow['State Tax'] = row.state_tax || 0;
        formattedRow['Marginal Rate'] = `${row.marginal_rate || 0}%`;
        formattedRow['Effective Rate'] = `${(row.effective_rate || 0).toFixed(2)}%`;

        // Medicare
        formattedRow['Part B'] = row.part_b || 0;
        formattedRow['Part D'] = row.part_d || 0;
        formattedRow['IRMAA'] = row.irmaa_surcharge || 0;
        formattedRow['IRMAA Bracket'] = row.irmaa_bracket_number || 0;
        formattedRow['Total Medicare'] = row.total_medicare || 0;

        // Income Phases
        formattedRow['Gross Income'] = row.gross_income_total || row.gross_income || 0;
        formattedRow['After Tax'] = row.after_tax_income || 0;
        formattedRow['After Medicare'] = row.after_medicare_income || 0;

        // Net Income
        formattedRow['Remaining'] = row.remaining_income || row.net_income || 0;

        formatted.push(formattedRow);
      });

      return formatted;
    },
    calculateAfterConversionTotals(formattedData) {
      if (formattedData.length === 0) return {};

      const totals = {
        'Year': 'TOTALS',
        'Primary Age': '-'
      };

      if (this.client?.tax_status?.toLowerCase() !== 'single') {
        totals['Spouse Age'] = '-';
      }

      // Get all column names from first row
      const firstRow = formattedData[0];
      Object.keys(firstRow).forEach(column => {
        if (column === 'Year' || column === 'Primary Age' || column === 'Spouse Age' ||
            column === 'Marginal Rate' || column === 'Effective Rate' || column === 'IRMAA Bracket') {
          // Skip these columns or already set
          return;
        }

        // Sum all numeric columns
        totals[column] = formattedData.reduce((sum, row) => {
          const value = typeof row[column] === 'number' ? row[column] : 0;
          return sum + value;
        }, 0);
      });

      // Asset balances should be final year values, not sums
      const lastRow = formattedData[formattedData.length - 1];
      Object.keys(lastRow).forEach(key => {
        if (key.includes('Balance') || key.includes('balance')) {
          totals[key] = lastRow[key];
        }
      });

      // Set non-summable fields to dash
      totals['Marginal Rate'] = '-';
      totals['Effective Rate'] = '-';
      totals['IRMAA Bracket'] = '-';

      return totals;
    },
    async exportBeforeConversionAsExcel() {
      try {
        const config = apiService.getConfig();
        const url = apiService.getUrl(`/api/scenarios/${this.scenario.id}/comprehensive-summary/`);
        const response = await axios.get(url, config);

        const rawData = response.data.years || [];
        if (rawData.length === 0) {
          toast.warning('No data available to export', { position: 'top-right' });
          return;
        }

        // Format data to only include visible columns
        const formattedData = this.formatBeforeConversionDataForExport(rawData);

        // Add totals row
        const totals = this.calculateBeforeConversionTotals(formattedData);
        const dataWithTotals = [...formattedData, totals];

        const worksheet = XLSX.utils.json_to_sheet(dataWithTotals);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Before Conversion');
        XLSX.writeFile(workbook, `Before_Conversion_${this.client.first_name}_${this.client.last_name}.xlsx`);

        toast.success('Excel file downloaded successfully', { position: 'top-right' });
      } catch (error) {
        console.error('Error exporting Before Conversion data:', error);
        toast.error('Failed to export data', { position: 'top-right' });
      }
    },
    async exportBeforeConversionAsCSV() {
      try {
        const config = apiService.getConfig();
        const url = apiService.getUrl(`/api/scenarios/${this.scenario.id}/comprehensive-summary/`);
        const response = await axios.get(url, config);

        const rawData = response.data.years || [];
        if (rawData.length === 0) {
          toast.warning('No data available to export', { position: 'top-right' });
          return;
        }

        // Format data to only include visible columns
        const formattedData = this.formatBeforeConversionDataForExport(rawData);

        // Add totals row
        const totals = this.calculateBeforeConversionTotals(formattedData);
        const dataWithTotals = [...formattedData, totals];

        const worksheet = XLSX.utils.json_to_sheet(dataWithTotals);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Before_Conversion_${this.client.first_name}_${this.client.last_name}.csv`;
        link.click();

        toast.success('CSV file downloaded successfully', { position: 'top-right' });
      } catch (error) {
        console.error('Error exporting Before Conversion data:', error);
        toast.error('Failed to export data', { position: 'top-right' });
      }
    },
    async exportAfterConversionAsExcel() {
      try {
        if (!this.conversionComprehensiveData || !this.conversionComprehensiveData.years) {
          toast.warning('No conversion data available. Please run a calculation first.', { position: 'top-right' });
          return;
        }

        const rawData = this.conversionComprehensiveData.years;

        // Format data to only include visible columns
        const formattedData = this.formatAfterConversionDataForExport(rawData, this.conversionComprehensiveData);

        // Add totals row
        const totals = this.calculateAfterConversionTotals(formattedData);
        const dataWithTotals = [...formattedData, totals];

        const worksheet = XLSX.utils.json_to_sheet(dataWithTotals);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'After Conversion');
        XLSX.writeFile(workbook, `After_Conversion_${this.client.first_name}_${this.client.last_name}.xlsx`);

        toast.success('Excel file downloaded successfully', { position: 'top-right' });
      } catch (error) {
        console.error('Error exporting After Conversion data:', error);
        toast.error('Failed to export data', { position: 'top-right' });
      }
    },
    async exportAfterConversionAsCSV() {
      try {
        if (!this.conversionComprehensiveData || !this.conversionComprehensiveData.years) {
          toast.warning('No conversion data available. Please run a calculation first.', { position: 'top-right' });
          return;
        }

        const rawData = this.conversionComprehensiveData.years;

        // Format data to only include visible columns
        const formattedData = this.formatAfterConversionDataForExport(rawData, this.conversionComprehensiveData);

        // Add totals row
        const totals = this.calculateAfterConversionTotals(formattedData);
        const dataWithTotals = [...formattedData, totals];

        const worksheet = XLSX.utils.json_to_sheet(dataWithTotals);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `After_Conversion_${this.client.first_name}_${this.client.last_name}.csv`;
        link.click();

        toast.success('CSV file downloaded successfully', { position: 'top-right' });
      } catch (error) {
        console.error('Error exporting After Conversion data:', error);
        toast.error('Failed to export data', { position: 'top-right' });
      }
    },
    updateExpenseSummaryData() {
      try {
        // Check if we have real data or need to use defaults
        if (!this.hasScenarioBeenRun) {
          // Use default data for initial display
          const defaultBaselineRMDs = 250000;
          const defaultOptimalRMDs = 180000;
          const defaultBaselineTaxes = 180000;
          const defaultOptimalTaxes = 140000;
          const defaultBaselineMedicare = 50000;
          const defaultOptimalMedicare = 40000;
          const defaultBaselineInheritance = 75000;
          const defaultOptimalInheritance = 45000;
          
          const defaultBaselineTotal = defaultBaselineRMDs + defaultBaselineTaxes + defaultBaselineMedicare + defaultBaselineInheritance;
          const defaultOptimalTotal = defaultOptimalRMDs + defaultOptimalTaxes + defaultOptimalMedicare + defaultOptimalInheritance;
          
          const defaultSavings = defaultBaselineTotal - defaultOptimalTotal;
          const defaultSavingsPercentage = ((defaultSavings / defaultBaselineTotal) * 100).toFixed(1);
          
          this.expenseSummaryData = {
            labels: ['RMDs', 'State & Federal Taxes', 'Medicare & IRMAA', 'Inheritance Tax', 'Total Expenses'],
            datasets: [
              {
                label: 'Before Conversion',
                backgroundColor: '#007bff',
                data: [defaultBaselineRMDs, defaultBaselineTaxes, defaultBaselineMedicare, defaultBaselineInheritance, defaultBaselineTotal],
                backgroundColor: (context) => {
                  return context.dataIndex === 4 ? '#0056b3' : '#007bff';
                }
              },
              {
                label: 'After Conversion',
                backgroundColor: '#28a745',
                data: [defaultOptimalRMDs, defaultOptimalTaxes, defaultOptimalMedicare, defaultOptimalInheritance, defaultOptimalTotal],
                backgroundColor: (context) => {
                  return context.dataIndex === 4 ? '#1e7e34' : '#28a745';
                }
              }
            ]
          };
          
          this.totalSavings = defaultSavings;
          this.savingsPercentage = defaultSavingsPercentage;
          return;
        }
        
        // Get values from baseline and optimal schedule
        const baseline = this.baselineMetrics || {};
        const optimal = this.optimalSchedule?.score_breakdown || {};
        
        // Extract RMD data (use total RMDs or a reasonable estimate)
        const baselineRMDs = baseline.total_rmds || 250000;
        const optimalRMDs = optimal.total_rmds || 180000;
        
        // Extract tax data
        const baselineTaxes = baseline.lifetime_tax || 180000;
        const optimalTaxes = optimal.lifetime_tax || 140000;
        
        // Extract Medicare and IRMAA data
        const baselineMedicare = (baseline.lifetime_medicare || 0) + (baseline.total_irmaa || 0);
        const optimalMedicare = (optimal.lifetime_medicare || 0) + (optimal.total_irmaa || 0);
        
        // Extract inheritance tax (estimate based on final balances)
        const baselineInheritance = baseline.inheritance_tax || 75000;
        const optimalInheritance = optimal.inheritance_tax || 45000;
        
        // Calculate totals (using only IRMAA, not base Medicare)
        const baselineTotal = baselineRMDs + baselineTaxes + baselineIRMAA + baselineInheritance;
        const optimalTotal = optimalRMDs + optimalTaxes + optimalIRMAA + optimalInheritance;
        
        // Calculate savings
        const savings = baselineTotal - optimalTotal;
        const savingsPercentage = ((savings / baselineTotal) * 100).toFixed(1);
        
        // Update the chart data
        this.expenseSummaryData = {
          labels: ['RMDs', 'State & Federal Taxes', 'Medicare & IRMAA', 'Inheritance Tax', 'Total Expenses'],
          datasets: [
            {
              label: 'Before Conversion',
              backgroundColor: '#007bff',
              data: [baselineRMDs, baselineTaxes, baselineMedicare, baselineInheritance, baselineTotal],
              // Make the total column darker
              backgroundColor: (context) => {
                return context.dataIndex === 4 ? '#0056b3' : '#007bff';
              }
            },
            {
              label: 'After Conversion',
              backgroundColor: '#28a745',
              data: [optimalRMDs, optimalTaxes, optimalMedicare, optimalInheritance, optimalTotal],
              // Make the total column darker
              backgroundColor: (context) => {
                return context.dataIndex === 4 ? '#1e7e34' : '#28a745';
              }
            }
          ]
        };
        
        // Update savings display
        this.totalSavings = savings;
        this.savingsPercentage = savingsPercentage;
      } catch (error) {
        console.error('Error updating expense summary data:', error);
        // Provide fallback data to ensure the graph doesn't break
        this.expenseSummaryData = {
          labels: ['RMDs', 'State & Federal Taxes', 'Medicare & IRMAA', 'Inheritance Tax', 'Total Expenses'],
          datasets: [
            {
              label: 'Before Conversion',
              backgroundColor: '#007bff',
              data: [0, 0, 0, 0, 0]
            },
            {
              label: 'After Conversion',
              backgroundColor: '#28a745',
              data: [0, 0, 0, 0, 0]
            }
          ]
        };
        this.totalSavings = 0;
        this.savingsPercentage = 0;
      }
    },
    generateAssetLineData() {
      try {
        // Generate years for x-axis
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 30 }, (_, i) => currentYear + i);
        
        // Create datasets for each affected asset
        const datasets = [];
        
        // If we have no assets or no scenario has been run, use the default data
        if (!this.hasScenarioBeenRun && (!this.eligibleAssets || this.eligibleAssets.length === 0)) {
          // Return default data
          return {
            labels: years.map(year => year.toString()),
            datasets: [
              {
                label: 'IRA',
                borderColor: '#007bff',
                backgroundColor: 'rgba(0,123,255,0.1)',
                data: [300000, 250000, 200000, 180000, 160000, 140000, 120000, 100000, 80000, 60000, 40000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 2, 1, 1, 1, 1, 1, 1],
                fill: false
              },
              {
                label: '401k',
                borderColor: '#28a745',
                backgroundColor: 'rgba(40,167,69,0.1)',
                data: [200000, 180000, 160000, 140000, 120000, 100000, 80000, 60000, 40000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                fill: false
              },
              {
                label: 'Traditional IRA',
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255,193,7,0.1)',
                data: [100000, 95000, 90000, 85000, 80000, 75000, 70000, 65000, 60000, 55000, 50000, 45000, 40000, 35000, 30000, 25000, 20000, 15000, 10000, 5000, 2500, 1000, 500, 200, 100, 50, 25, 10, 5, 2],
                fill: false
              },
              {
                label: 'Roth IRA',
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111,66,193,0.1)',
                data: [0, 20000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000, 320000, 340000, 360000, 380000, 400000, 420000, 440000, 460000, 480000, 500000, 520000, 540000, 560000, 580000],
                fill: false
              }
            ]
          };
        }
        
        // Add datasets for affected assets (with declining balances due to conversion)
        console.log('🔍 selectedAssetList for graph:', this.selectedAssetList);
        console.log('🔍 maxToConvert values:', this.maxToConvert);
        this.selectedAssetList.forEach(asset => {
          const initialValue = parseFloat(asset.current_asset_balance) || 0;
          const conversionAmount = parseFloat(this.maxToConvert[asset.id || asset.income_type]) || 0;
          console.log(`🔍 Asset ${asset.income_type}: initial=${initialValue}, conversion=${conversionAmount}`);
          const growthRate = parseFloat(asset.rate_of_return || asset.growth_rate || 0) * 100; // Convert from decimal to percentage
          const yearsToConvert = parseInt(this.yearsToConvert) || 1;
          const annualConversion = conversionAmount / yearsToConvert;
          
          // Generate data points for this asset
          const data = [];
          let balance = initialValue;
          
          for (let i = 0; i < years.length; i++) {
            const year = years[i];
            
            // Apply conversion during conversion years FIRST (reduce balance at start of year)
            if (year >= this.conversionStartYear && year < (this.conversionStartYear + yearsToConvert)) {
              balance -= annualConversion;
              balance = Math.max(0, balance);
            }
            
            // Then apply growth on remaining balance
            if (balance > 0) {
              balance = balance * (1 + (growthRate / 100));
            }
            
            data.push(Math.round(balance)); // Round for cleaner display
          }
          
          // Add to datasets
          datasets.push({
            label: asset.income_name || asset.investment_name || asset.income_type || 'Asset',
            borderColor: '#28a745', // Green for Qualified
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            data: data,
            fill: false,
            borderWidth: 2,
            tension: 0.1
          });
        });
        
        // Add dataset for unaffected assets
        this.unaffectedAssets.forEach(asset => {
          const initialValue = parseFloat(asset.current_asset_balance) || 0;
          const growthRate = parseFloat(asset.rate_of_return || asset.growth_rate || 0);
          
          // Generate data points
          const data = [];
          let balance = initialValue;
          
          for (let i = 0; i < years.length; i++) {
            const year = years[i];
            // Apply growth
            balance = balance * (1 + (growthRate / 100));
            data.push(balance);
          }
          
          // Add to datasets
          datasets.push({
            label: asset.income_name || asset.investment_name || asset.income_type || 'Asset',
            borderColor: this.getRandomColor(),
            backgroundColor: 'rgba(0,0,0,0.1)',
            data: data,
            fill: false
          });
        });
        
        // Add Roth IRA dataset
        const rothData = [];
        let rothBalance = 0;
        const rothGrowthRate = parseFloat(this.rothGrowthRate) || 5.0;
        const withdrawalAmount = parseFloat(this.rothWithdrawalAmount) || 0;
        const annualConversion = this.totalConversionAmount / this.yearsToConvert;
        
        for (let i = 0; i < years.length; i++) {
          const year = years[i];
          
          // Add conversion amounts during conversion years (at start of year)
          if (year >= this.conversionStartYear && year < (this.conversionStartYear + this.yearsToConvert)) {
            const annualConversion = this.totalConversionAmount / this.yearsToConvert;
            rothBalance += annualConversion;
            console.log(`💰 Year ${year}: Adding conversion ${annualConversion}, balance now: ${rothBalance}`);
          }
          
          // Apply growth to the entire balance (including new conversions)
          const growthMultiplier = (1 + (rothGrowthRate / 100));
          const balanceBeforeGrowth = rothBalance;
          rothBalance = rothBalance * growthMultiplier;
          if (year >= 2030 && year <= 2037) { // Only log conversion and post-conversion years to avoid spam
            console.log(`🔍 Year ${year}: Roth balance ${balanceBeforeGrowth} * ${growthMultiplier} = ${rothBalance}`);
          }
          
          // Apply withdrawals if past withdrawal start year (at end of year)
          if (year >= this.rothWithdrawalStartYear && withdrawalAmount > 0) {
            rothBalance -= withdrawalAmount;
            rothBalance = Math.max(0, rothBalance); // Ensure balance doesn't go below zero
          }
          
          rothData.push(rothBalance);
        }
        
        // Add Roth dataset if we have conversion data
        if (this.totalConversionAmount > 0) {
          datasets.push({
            label: 'Roth IRA',
            borderColor: '#6f42c1', // Purple for Roth
            backgroundColor: 'rgba(111,66,193,0.1)',
            data: rothData,
            fill: false,
            borderWidth: 2,
            tension: 0.1
          });
        }
        
        // Make sure we have at least one dataset
        if (datasets.length === 0) {
          datasets.push({
            label: 'Default Asset',
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.1)',
            data: Array(years.length).fill(0),
            fill: false
          });
        }
        
        // Return the asset line data
        return {
          labels: years.map(year => year.toString()),
          datasets: datasets
        };
      } catch (error) {
        console.error('Error generating asset line data:', error);
        // Return fallback data
        return {
          labels: Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() + i).toString()),
          datasets: [
            {
              label: 'Default Asset',
              borderColor: '#007bff',
              backgroundColor: 'rgba(0,123,255,0.1)',
              data: Array(30).fill(0),
              fill: false
            }
          ]
        };
      }
    },
    generateAssetLineDataFromYearByYear(yearByYearData) {
      try {
        if (!yearByYearData || yearByYearData.length === 0) {
          console.error('No year-by-year data available');
          return this.generateAssetLineData(); // Fallback
        }
        
        // Extract years from the data
        const years = yearByYearData.map(row => row.year);
        
        // Dynamically detect all asset types from the data
        const assetTypes = new Set();
        yearByYearData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (key.endsWith('_balance')) {
              const assetType = key.replace('_balance', '');
              assetTypes.add(assetType);
            }
          });
        });
        
        console.log('📊 Detected asset types:', Array.from(assetTypes));
        
        // Create datasets for each asset type
        const datasets = [];
        const colorMap = {
          'Qualified': '#28a745',
          'qualified': '#28a745', 
          'roth_ira': '#6f42c1',
          'social_security': '#20c997',
          'brokerage': '#fd7e14',
          'savings': '#ffc107',
          'pension': '#dc3545'
        };
        
        // Process each asset type
        Array.from(assetTypes).forEach((assetType, index) => {
          const balanceKey = `${assetType}_balance`;
          const balances = [];
          
          // Extract balances for this asset type across all years
          yearByYearData.forEach(row => {
            const balance = parseFloat(row[balanceKey] || 0);
            balances.push(balance);
          });
          
          // Only add dataset if there are non-zero balances
          if (balances.some(v => v > 0)) {
            // Try to find the actual asset name from eligibleAssets
            const eligibleAsset = (this.eligibleAssets || []).find(asset => 
              asset.income_type === assetType || 
              asset.income_type === assetType.replace('_', ' ').toLowerCase() ||
              asset.income_type.toLowerCase() === assetType.toLowerCase()
            );
            
            const assetLabel = eligibleAsset ? 
              (eligibleAsset.income_name || eligibleAsset.investment_name || this.formatAssetTypeName(assetType)) : 
              this.formatAssetTypeName(assetType);
            
            const color = colorMap[assetType] || this.getRandomColor();
            
            datasets.push({
              label: assetLabel,
              borderColor: color,
              backgroundColor: this.hexToRgba(color, 0.1),
              data: balances,
              fill: false,
              borderWidth: 2
            });
          }
        });
        
        console.log('📊 Asset line data generated from year-by-year:', {
          years: years.length,
          assetTypes: Array.from(assetTypes),
          datasets: datasets.map(d => ({ label: d.label, dataPoints: d.data.length }))
        });
        
        // If no valid datasets, fallback to local generation
        if (datasets.length === 0) {
          console.warn('No valid datasets from API data, falling back to local generation');
          return this.generateAssetLineData();
        }
        
        return {
          labels: years.map(y => y.toString()),
          datasets: datasets
        };
      } catch (error) {
        console.error('Error generating asset line data from year-by-year:', error);
        return this.generateAssetLineData(); // Fallback
      }
    },
    generateAssetLineDataFromAPI(assetBalances) {
      try {
        if (!assetBalances || !assetBalances.years || !assetBalances.assets) {
          console.error('Invalid asset balance data from API');
          return this.generateAssetLineData(); // Fallback to local generation
        }
        
        const years = assetBalances.years;
        const assets = assetBalances.assets;
        const datasets = [];
        
        // Create a color map for consistent colors across asset types
        const colorMap = {
          'ira': '#007bff',
          'traditional_ira': '#007bff',
          '401k': '#28a745',
          'traditional_401k': '#28a745',
          'roth_ira': '#6f42c1',
          'roth_401k': '#17a2b8',
          'brokerage': '#fd7e14',
          'savings': '#ffc107',
          'pension': '#dc3545',
          'social_security': '#20c997'
        };
        
        // Process each asset type
        for (const [assetType, balances] of Object.entries(assets)) {
          // Skip any asset types that don't have both baseline and conversion data
          if (!balances.baseline || !balances.conversion) continue;
          
          // Add baseline dataset
          datasets.push({
            label: `${this.formatAssetTypeName(assetType)} (Baseline)`,
            borderColor: colorMap[assetType.toLowerCase()] || this.getRandomColor(),
            backgroundColor: 'rgba(0,0,0,0.05)',
            data: balances.baseline,
            fill: false,
            borderDash: [5, 5] // Dashed line for baseline
          });
          
          // Add conversion dataset
          datasets.push({
            label: `${this.formatAssetTypeName(assetType)} (After Conversion)`,
            borderColor: colorMap[assetType.toLowerCase()] || this.getRandomColor(),
            backgroundColor: 'rgba(0,0,0,0.1)',
            data: balances.conversion,
            fill: false
          });
        }
        
        // Make sure we have at least one dataset
        if (datasets.length === 0) {
          datasets.push({
            label: 'Default Asset',
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.1)',
            data: Array(years.length).fill(0),
            fill: false
          });
        }
        
        return {
          labels: years.map(year => year.toString()),
          datasets: datasets
        };
      } catch (error) {
        console.error('Error generating asset line data from API:', error);
        return this.generateAssetLineData(); // Fallback to local generation
      }
    },
    
    formatAssetTypeName(assetType) {
      // Convert snake_case to Title Case with proper acronyms
      if (!assetType) return 'Unknown';
      
      // Handle common acronyms
      const acronyms = {
        'ira': 'IRA',
        '401k': '401(k)'
      };
      
      return assetType
        .split('_')
        .map(word => {
          // Check if word is an acronym
          if (acronyms[word.toLowerCase()]) {
            return acronyms[word.toLowerCase()];
          }
          // Otherwise capitalize first letter
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    },
    generateExpenseSummaryData() {
      console.log('🟡 generateExpenseSummaryData called');
      console.log('🟡 hasScenarioBeenRun:', this.hasScenarioBeenRun);
      try {
        // Check if we have real data or need to show "no data" state
        if (!this.hasScenarioBeenRun) {
          console.log('🟡 No calculation data yet - returning empty chart');
          this.totalSavings = 0;
          this.savingsPercentage = '0.0';

          return {
            labels: ['RMDs', 'State & Federal Taxes', 'IRMAA Surcharges', 'Total Expenses'],
            datasets: [
              {
                label: 'No Data - Run Calculation',
                backgroundColor: '#e0e0e0',
                data: [0, 0, 0, 0]
              }
            ]
          };
        }
        
        console.log('🟡 Using REAL data (hasScenarioBeenRun is true)');
        
        // Get values from baseline and optimal schedule
        const baseline = this.baselineMetrics || {};
        const optimal = this.optimalSchedule?.score_breakdown || {};
        const comparison = this.comparisonMetrics || {};
        
        // DEBUG: Log what we're actually reading from the API
        console.log('🔴 BAR CHART DATA SOURCES:');
        console.log('🔴 this.baselineMetrics:', this.baselineMetrics);
        console.log('🔴 this.optimalSchedule:', this.optimalSchedule);
        console.log('🔴 baseline object:', baseline);
        console.log('🔴 optimal object:', optimal);
        
        // Extract RMD data (use total RMDs from the enhanced API response)
        const baselineRMDs = baseline.total_rmds || 0;
        const optimalRMDs = optimal.total_rmds || 0;
        const rmdReduction = comparison.rmd_reduction || (baselineRMDs - optimalRMDs);
        
        // DEBUG: Log the RMD values we're using
        console.log('🔴 baselineRMDs value:', baselineRMDs);
        console.log('🔴 optimalRMDs value:', optimalRMDs);
        console.log('🔴 These are the values going into the bar chart!');
        
        // Extract tax data
        const baselineTaxes = baseline.lifetime_tax || 0;
        const optimalTaxes = optimal.lifetime_tax || 0;
        const taxSavings = comparison.tax_savings || (baselineTaxes - optimalTaxes);
        
        // Extract ONLY IRMAA data (not base Medicare premiums)
        // Base Medicare premiums are the same regardless of income, only IRMAA changes
        const baselineIRMAA = baseline.total_irmaa || 0;
        const optimalIRMAA = optimal.total_irmaa || 0;
        const irmaaSavings = comparison.irmaa_savings || (baselineIRMAA - optimalIRMAA);
        
        console.log('🔴 Baseline IRMAA:', baselineIRMAA);
        console.log('🔴 Optimal IRMAA:', optimalIRMAA);
        
        // NOTE: Inheritance tax is now shown in a separate chart section
        // We no longer include it in the main expense comparison

        // Calculate totals WITHOUT RMDs and WITHOUT inheritance tax (using only IRMAA, not base Medicare)
        // Total Expenses = State & Federal Taxes + IRMAA Surcharges (RMDs shown separately)
        const baselineTotal = baselineTaxes + baselineIRMAA;
        const optimalTotal = optimalTaxes + optimalIRMAA;
        
        // Calculate savings
        const savings = comparison.total_savings || (baselineTotal - optimalTotal);
        const savingsPercentageRaw = comparison.total_savings_pct ||
          ((baselineTotal > 0) ? ((savings / baselineTotal) * 100) : 0);
        const savingsPercentage = parseFloat(savingsPercentageRaw).toFixed(1);

        // Extract conversion tax cost metrics
        console.log('🔵 CONVERSION COST METRICS:', this.conversionCostMetrics);
        if (this.conversionCostMetrics) {
          this.conversionTaxCost = this.conversionCostMetrics.total_conversion_tax || 0;
          this.conversionTaxRate = parseFloat(this.conversionCostMetrics.effective_conversion_tax_rate || 0).toFixed(1);
          console.log('🟢 Setting conversionTaxCost:', this.conversionTaxCost);
          console.log('🟢 Setting conversionTaxRate:', this.conversionTaxRate);
        } else {
          this.conversionTaxCost = null;
          this.conversionTaxRate = 0;
          console.log('🔴 NO conversion_cost_metrics found');
        }

        // Warn if conversion makes things worse
        if (optimalTotal > baselineTotal) {
          console.warn('⚠️ Conversion increases costs - may not be optimal');
          toast.warning('This conversion may increase your lifetime costs. Consider adjusting your strategy.', {
            position: 'top-right',
            autoClose: 8000,
          });
        }

        // Update savings display
        this.totalSavings = savings;
        this.savingsPercentage = savingsPercentage;
        
        // DEBUG: Log the final data going into the chart
        console.log('🔴 FINAL BAR CHART DATA:');
        console.log('🔴 Before Conversion RMDs:', baselineRMDs);
        console.log('🔴 After Conversion RMDs:', optimalRMDs);
        console.log('🔴 Before Conversion Taxes:', baselineTaxes);
        console.log('🔴 Before Conversion IRMAA:', baselineIRMAA);
        console.log('🔴 Before Conversion Total (Taxes + IRMAA):', baselineTotal);
        console.log('🔴 After Conversion Taxes:', optimalTaxes);
        console.log('🔴 After Conversion IRMAA:', optimalIRMAA);
        console.log('🔴 After Conversion Total (Taxes + IRMAA):', optimalTotal);

        // Return the expense summary data (RMDs shown separately, inheritance tax removed)
        const chartData = {
          labels: ['RMDs', 'State & Federal Taxes', 'IRMAA Surcharges', 'Total Expenses'],
          datasets: [
            {
              label: 'Before Conversion',
              backgroundColor: '#007bff',
              data: [baselineRMDs, baselineTaxes, baselineIRMAA, baselineTotal]
            },
            {
              label: 'After Conversion',
              backgroundColor: '#28a745',
              data: [optimalRMDs, optimalTaxes, optimalIRMAA, optimalTotal]
            }
          ]
        };
        
        console.log('🔴 Complete chart data object:', chartData);
        return chartData;
      } catch (error) {
        console.error('Error generating expense summary data:', error);
        // Financial compliance: Never show fallback/placeholder data
        // Let the error propagate so users know data is not available
        throw error;
      }
    },
    generateInheritanceTaxData() {
      console.log('🟣 generateInheritanceTaxData called');
      try {
        if (!this.hasScenarioBeenRun) {
          console.log('🟣 No calculation data yet - returning empty chart');
          return {
            labels: ['Taxable Estate', 'Non-Taxable Estate', 'Estate Tax Owed'],
            datasets: [
              {
                label: 'No Data - Run Calculation',
                backgroundColor: '#e0e0e0',
                data: [0, 0, 0]
              }
            ]
          };
        }

        console.log('🟣 Using REAL data (hasScenarioBeenRun is true)');

        // Get the final year from each table to calculate estate values
        const baselineFinalYear = this.baselineYearByYear && this.baselineYearByYear.length > 0
          ? this.baselineYearByYear[this.baselineYearByYear.length - 1]
          : null;

        const optimalFinalYear = this.afterConversionYearByYear && this.afterConversionYearByYear.length > 0
          ? this.afterConversionYearByYear[this.afterConversionYearByYear.length - 1]
          : null;

        console.log('🟣 Baseline final year:', baselineFinalYear);
        console.log('🟣 Optimal final year:', optimalFinalYear);

        // Calculate estate values from the final year data
        const baselineTaxableEstate = baselineFinalYear ? this.calculateTaxableEstate(baselineFinalYear) : 0;
        const baselineNonTaxableEstate = baselineFinalYear ? this.calculateNonTaxableEstate(baselineFinalYear) : 0;

        const optimalTaxableEstate = optimalFinalYear ? this.calculateTaxableEstate(optimalFinalYear) : 0;
        const optimalNonTaxableEstate = optimalFinalYear ? this.calculateNonTaxableEstate(optimalFinalYear) : 0;

        // Get estate tax from metrics (backend calculation)
        const baseline = this.baselineMetrics || {};
        const optimal = this.optimalSchedule?.score_breakdown || {};
        const baselineEstateTax = baseline.inheritance_tax || 0;
        const optimalEstateTax = optimal.inheritance_tax || 0;

        console.log('🟣 Baseline Taxable Estate (from table):', baselineTaxableEstate);
        console.log('🟣 Optimal Taxable Estate (from table):', optimalTaxableEstate);
        console.log('🟣 Baseline Estate Tax (from metrics):', baselineEstateTax);
        console.log('🟣 Optimal Estate Tax (from metrics):', optimalEstateTax);

        const chartData = {
          labels: ['Taxable Estate', 'Non-Taxable Estate', 'Estate Tax Owed'],
          datasets: [
            {
              label: 'Before Conversion',
              backgroundColor: '#dc3545',
              data: [baselineTaxableEstate, baselineNonTaxableEstate, baselineEstateTax]
            },
            {
              label: 'After Conversion',
              backgroundColor: '#28a745',
              data: [optimalTaxableEstate, optimalNonTaxableEstate, optimalEstateTax]
            }
          ]
        };

        console.log('🟣 Complete inheritance tax chart data:', chartData);
        return chartData;
      } catch (error) {
        console.error('Error generating inheritance tax data:', error);
        return {
          labels: ['Taxable Estate', 'Non-Taxable Estate', 'Estate Tax Owed'],
          datasets: [
            {
              label: 'Before Conversion',
              backgroundColor: '#dc3545',
              data: [0, 0, 0]
            },
            {
              label: 'After Conversion',
              backgroundColor: '#28a745',
              data: [0, 0, 0]
            }
          ]
        };
      }
    },
    // Helper methods for audit table estate tax calculations
    calculateTaxableEstate(row) {
      // Calculate total taxable estate for a given year row
      // Taxable assets: Qualified, Non-Qualified, Inherited Traditional
      let total = 0;

      // Qualified balance
      total += parseFloat(row.qualified_balance || row.Qualified_balance || 0);

      // Non-Qualified balance
      total += parseFloat(row.non_qualified_balance || row['Non-Qualified_balance'] || 0);

      // Traditional IRA (if separate from Qualified)
      total += parseFloat(row.traditional_ira_balance || 0);

      // Inherited Traditional Spouse
      total += parseFloat(row.inherited_traditional_spouse_balance || row['Inherited Traditional Spouse_balance'] || 0);

      // Inherited Traditional Non-Spouse
      total += parseFloat(row.inherited_traditional_non_spouse_balance || row['Inherited Traditional Non-Spouse_balance'] || 0);

      return total;
    },
    calculateNonTaxableEstate(row) {
      // Calculate total non-taxable estate for a given year row
      // Non-taxable assets: Roth, Inherited Roth
      let total = 0;

      // Roth balance
      total += parseFloat(row.roth_balance || row.Roth_balance || 0);

      // Roth IRA balance
      total += parseFloat(row.roth_ira_balance || 0);

      // Inherited Roth Spouse
      total += parseFloat(row.inherited_roth_spouse_balance || row['Inherited Roth Spouse_balance'] || 0);

      // Inherited Roth Non-Spouse
      total += parseFloat(row.inherited_roth_non_spouse_balance || row['Inherited Roth Non-Spouse_balance'] || 0);

      return total;
    },
    calculateEstateTaxForRow(taxableAmount) {
      // This is a simplified calculation - in reality this should use the estate tax brackets
      // For now, we'll return 0 for years before death, and let the final row show the actual
      // estate tax from the API response
      // TODO: Implement proper estate tax calculation using brackets if needed for intermediate years
      return 0;
    }
  },
  mounted() {
    console.log('Asset Details medicare:', this.assetDetails);
    if (Array.isArray(this.assetDetails) && this.assetDetails.length > 0) {
      this.assetDetails.forEach(asset => {
        console.log('Asset:', asset);
        console.log('Asset Type:', asset.income_type);
      });
    } else {
      console.log('Asset Details is empty or not an array.');
    }
  },
  watch: {
    // Remove the watch handlers that could affect other components
  },
};
</script>

<style src="./RothConversionTab.css"></style>
