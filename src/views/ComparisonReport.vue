<template>
  <div class="content container-fluid" style="margin-top: 80px;">
    <!-- Page Header -->
    <div class="page-header" style="margin-bottom: 1rem;">
      <div class="row align-items-end">
        <div class="col-sm">
          <h1 class="page-header-title">Scenario Comparison Report</h1>
          <nav aria-label="breadcrumb" style="margin-bottom: 0;">
            <ol class="breadcrumb breadcrumb-no-gutter" style="margin-bottom: 0;">
              <li class="breadcrumb-item"><a class="breadcrumb-link" href="#">Clients</a></li>
              <li class="breadcrumb-item"><a class="breadcrumb-link" href="#">{{ clientName }}</a></li>
              <li class="breadcrumb-item active" aria-current="page">Comparison Report</li>
            </ol>
          </nav>
        </div>
      </div>
    </div>
    <!-- End Page Header -->

    <!-- Comparison Table -->
    <div class="card">
      <div class="card-body">
        <div class="row">
          <!-- Column 1 -->
          <div class="col-md-4">
            <div class="mb-4">
              <select class="form-select" v-model="selectedScenario1" @change="loadScenarioData(1)">
                <option value="">Select Scenario</option>
                <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
                  {{ scenario.name }}
                </option>
              </select>
            </div>
            
            <div class="scenario-column" :class="{'opacity-50': !scenarioData1}">
              <h4 class="text-primary text-center mb-4">{{ scenarioData1 ? scenarioData1.name : 'Select a Scenario' }}</h4>
              
              <!-- IRMAA Percentage of Medicare -->
              <div class="mb-4" style="min-height: 58px;">
                <div v-if="scenarioData1">
                  <div class="text-center mb-2"><strong>IRMAA Percentage of Medicare</strong></div>
                  <div :style="{
                    width: '100%',
                    height: '30px',
                    backgroundColor: getIrmaaColor(scenarioData1.irmaa_percentage),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: 'white',
                    borderRadius: '5px'
                  }">
                    {{ scenarioData1.irmaa_percentage }}%
                  </div>
                </div>
              </div>
              
              <!-- Financial Data -->
              <div class="comparison-row">
                <div class="comparison-label">Medicare</div>
                <div class="comparison-value">{{ scenarioData1 ? '$' + formatNumber(scenarioData1.medicare_cost) : '-' }}</div>
              </div>
              
              <div class="comparison-row">
                <div class="comparison-label">Fed Taxes</div>
                <div class="comparison-value">{{ scenarioData1 ? '$' + formatNumber(scenarioData1.federal_taxes) : '-' }}</div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Out of Pocket</div>
                <div class="comparison-value text-danger"><strong>{{ scenarioData1 ? '$' + formatNumber(scenarioData1.out_of_pocket) : '-' }}</strong></div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Solution Cost</div>
                <div class="comparison-value">{{ scenarioData1 ? '$' + formatNumber(scenarioData1.solution_cost) : '-' }}</div>
              </div>

              <hr>

              <div class="comparison-row">
                <div class="comparison-label"><strong>Total Costs</strong></div>
                <div class="comparison-value"><strong>{{ scenarioData1 ? '$' + formatNumber(scenarioData1.total_costs) : '-' }}</strong></div>
              </div>
            </div>
          </div>
          
          <!-- Column 2 -->
          <div class="col-md-4">
            <div class="mb-4">
              <select class="form-select" v-model="selectedScenario2" @change="loadScenarioData(2)">
                <option value="">Select Scenario</option>
                <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
                  {{ scenario.name }}
                </option>
              </select>
            </div>
            
            <div class="scenario-column" :class="{'opacity-50': !scenarioData2}">
              <h4 class="text-primary text-center mb-4">{{ scenarioData2 ? scenarioData2.name : 'Select a Scenario' }}</h4>
              
              <!-- IRMAA Percentage of Medicare -->
              <div class="mb-4" style="min-height: 58px;">
                <div v-if="scenarioData2">
                  <div class="text-center mb-2"><strong>IRMAA Percentage of Medicare</strong></div>
                  <div :style="{
                    width: '100%',
                    height: '30px',
                    backgroundColor: getIrmaaColor(scenarioData2.irmaa_percentage),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: 'white',
                    borderRadius: '5px'
                  }">
                    {{ scenarioData2.irmaa_percentage }}%
                  </div>
                </div>
              </div>
              
              <!-- Financial Data -->
              <div class="comparison-row">
                <div class="comparison-label">Medicare</div>
                <div class="comparison-value">{{ scenarioData2 ? '$' + formatNumber(scenarioData2.medicare_cost) : '-' }}</div>
              </div>
              
              <div class="comparison-row">
                <div class="comparison-label">Fed Taxes</div>
                <div class="comparison-value">{{ scenarioData2 ? '$' + formatNumber(scenarioData2.federal_taxes) : '-' }}</div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Out of Pocket</div>
                <div class="comparison-value text-danger"><strong>{{ scenarioData2 ? '$' + formatNumber(scenarioData2.out_of_pocket) : '-' }}</strong></div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Solution Cost</div>
                <div class="comparison-value">{{ scenarioData2 ? '$' + formatNumber(scenarioData2.solution_cost) : '-' }}</div>
              </div>

              <hr>

              <div class="comparison-row">
                <div class="comparison-label"><strong>Total Costs</strong></div>
                <div class="comparison-value"><strong>{{ scenarioData2 ? '$' + formatNumber(scenarioData2.total_costs) : '-' }}</strong></div>
              </div>
            </div>
          </div>
          
          <!-- Column 3 - Differences -->
          <div class="col-md-4">
            <div class="mb-4">
              <div class="form-select-placeholder text-center p-2 bg-light border rounded">
                <strong>Cost Differences</strong>
              </div>
            </div>
            
            <div class="scenario-column differences-column" :class="{'opacity-50': !scenarioData1 || !scenarioData2}">
              <h4 class="text-center mb-4">{{ (scenarioData1 && scenarioData2) ? 'Cost Comparison' : 'Select Both Scenarios' }}</h4>
              
              <!-- IRMAA Percentage Difference -->
              <div class="mb-4" style="min-height: 58px;">
                <div v-if="scenarioData1 && scenarioData2">
                  <div class="text-center mb-2"><strong>IRMAA Percentage Difference</strong></div>
                  <div :style="{
                    width: '100%',
                    height: '30px',
                    backgroundColor: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: 'white',
                    borderRadius: '5px'
                  }">
                    {{ formatIrmaaDifference(scenarioData1.irmaa_percentage, scenarioData2.irmaa_percentage) }}
                  </div>
                </div>
              </div>
              
              <!-- Financial Data Differences -->
              <div class="comparison-row">
                <div class="comparison-label">Medicare</div>
                <div class="comparison-value" :class="getDifferenceClass(medicareDifference)">
                  {{ (scenarioData1 && scenarioData2) ? formatDifference(medicareDifference) : '-' }}
                </div>
              </div>
              
              <div class="comparison-row">
                <div class="comparison-label">Fed Taxes</div>
                <div class="comparison-value" :class="getDifferenceClass(federalTaxesDifference)">
                  {{ (scenarioData1 && scenarioData2) ? formatDifference(federalTaxesDifference) : '-' }}
                </div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Out of Pocket</div>
                <div class="comparison-value" :class="getDifferenceClass(outOfPocketDifference)">
                  <strong>{{ (scenarioData1 && scenarioData2) ? formatDifference(outOfPocketDifference) : '-' }}</strong>
                </div>
              </div>

              <div class="comparison-row">
                <div class="comparison-label">Solution Cost</div>
                <div class="comparison-value" :class="getDifferenceClass(solutionCostDifference)">
                  {{ (scenarioData1 && scenarioData2) ? formatDifference(solutionCostDifference) : '-' }}
                </div>
              </div>

              <hr>

              <div class="comparison-row">
                <div class="comparison-label"><strong>Total Costs</strong></div>
                <div class="comparison-value" :class="getDifferenceClass(totalCostsDifference)">
                  <strong>{{ (scenarioData1 && scenarioData2) ? formatDifference(totalCostsDifference) : '-' }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- End Comparison Table -->
  </div>
</template>

<script>
import { API_CONFIG } from '@/config'

export default {
  name: 'ComparisonReport',
  data() {
    return {
      clientId: null,
      clientName: '',
      scenarios: [],
      selectedScenario1: '',
      selectedScenario2: '',
      scenarioData1: null,
      scenarioData2: null
    };
  },
  computed: {
    medicareDifference() {
      if (!this.scenarioData1 || !this.scenarioData2) return 0;
      return parseFloat(this.scenarioData2.medicare_cost || 0) - parseFloat(this.scenarioData1.medicare_cost || 0);
    },
    federalTaxesDifference() {
      if (!this.scenarioData1 || !this.scenarioData2) return 0;
      return parseFloat(this.scenarioData2.federal_taxes || 0) - parseFloat(this.scenarioData1.federal_taxes || 0);
    },
    solutionCostDifference() {
      if (!this.scenarioData1 || !this.scenarioData2) return 0;
      return parseFloat(this.scenarioData2.solution_cost || 0) - parseFloat(this.scenarioData1.solution_cost || 0);
    },
    totalCostsDifference() {
      if (!this.scenarioData1 || !this.scenarioData2) return 0;
      return parseFloat(this.scenarioData2.total_costs || 0) - parseFloat(this.scenarioData1.total_costs || 0);
    },
    outOfPocketDifference() {
      if (!this.scenarioData1 || !this.scenarioData2) return 0;
      return parseFloat(this.scenarioData2.out_of_pocket || 0) - parseFloat(this.scenarioData1.out_of_pocket || 0);
    }
  },
  mounted() {
    this.clientId = this.$route.params.id;
    this.loadClientData();
    this.loadComparisonPreferences();
  },
  methods: {
    async loadClientData() {
      try {
        const response = await fetch(`${API_CONFIG.API_URL}/clients/${this.clientId}/`, {
          credentials: 'include'  // Send httpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();
          this.clientName = `${data.first_name} ${data.last_name}`;
          this.scenarios = data.scenarios || [];
          console.log('Client data loaded:', data);
          console.log('Available scenarios:', this.scenarios);
        } else {
          const errorData = await response.json();
          console.error('Error loading client data:', errorData);
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    },

    async loadComparisonPreferences() {
      if (!this.clientId) return;

      try {
        const response = await fetch(`${API_CONFIG.API_URL}/clients/${this.clientId}/comparison-preferences/`, {
          credentials: 'include'  // Send httpOnly cookies
        });
        
        if (response.ok) {
          const preferences = await response.json();
          if (preferences.scenario1) {
            this.selectedScenario1 = preferences.scenario1;
            this.loadScenarioData(1);
          }
          if (preferences.scenario2) {
            this.selectedScenario2 = preferences.scenario2;
            this.loadScenarioData(2);
          }
        }
      } catch (error) {
        console.error('Error loading comparison preferences:', error);
      }
    },

    async saveComparisonPreferences() {
      if (!this.clientId) return;

      try {
        await fetch(`${API_CONFIG.API_URL}/clients/${this.clientId}/comparison-preferences/`, {
          method: 'POST',
          credentials: 'include',  // Send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scenario1: this.selectedScenario1,
            scenario2: this.selectedScenario2
          })
        });
      } catch (error) {
        console.error('Error saving comparison preferences:', error);
      }
    },

    async loadScenarioData(column) {
      const scenarioId = column === 1 ? this.selectedScenario1 : this.selectedScenario2;
      
      console.log(`🔍 loadScenarioData called: column=${column}, scenarioId=${scenarioId}`);
      
      if (!scenarioId) {
        console.log(`❌ No scenario ID for column ${column}, returning`);
        return;
      }

      const url = `${API_CONFIG.API_URL}/scenarios/${scenarioId}/comparison-data/`;
      console.log(`📞 Making API call to: ${url}`);

      try {
        const response = await fetch(url, {
          credentials: 'include'  // Send httpOnly cookies
        });

        console.log(`📈 Response status for scenario ${scenarioId}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`Scenario data for column ${column}:`, data);
          
          if (column === 1) {
            this.scenarioData1 = data;
          } else if (column === 2) {
            this.scenarioData2 = data;
          }
          
          // Save preferences after successfully loading data
          this.saveComparisonPreferences();
        } else {
          const errorData = await response.json();
          console.error(`Error response for scenario ${scenarioId}:`, errorData);
        }
      } catch (error) {
        console.error('Error loading scenario data:', error);
      }
    },

    formatNumber(value) {
      if (!value) return '0.00';
      return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatDifference(value) {
      if (!value || value === 0) return '$0.00';
      
      const formatted = Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return value > 0 ? `+$${formatted}` : `-$${formatted}`;
    },

    getIrmaaColor(percentage) {
      // Match color logic from ScenarioDetail.vue
      if (percentage > 50) {
        return '#ff0000'; // Red
      } else if (percentage > 25) {
        return '#ffa500'; // Orange
      } else if (percentage > 15) {
        return '#ffff00'; // Yellow
      } else {
        return '#00ff00'; // Green
      }
    },

    formatIrmaaDifference(pct1, pct2) {
      const diff = pct2 - pct1;
      if (diff === 0) return '0%';
      return diff > 0 ? `+${diff}%` : `${diff}%`;
    },

    getDifferenceClass(value) {
      if (!value || value === 0) return 'text-muted';
      return value > 0 ? 'text-danger' : 'text-success';
    }
  }
};
</script>

<style scoped>
.scenario-column {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  min-height: 48px;
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-label {
  font-size: 14px;
  color: #374151;
}

.comparison-value {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  text-align: right;
}

.alert-danger {
  background-color: #ef4444;
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
}

.form-select-placeholder {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.differences-column {
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
}

.alert-success {
  background-color: #22c55e;
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
}

.alert-warning {
  background-color: #f59e0b;
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
}

.alert-info {
  background-color: #3b82f6;
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
}

.text-success {
  color: #22c55e !important;
  font-weight: 600;
}

.text-danger {
  color: #ef4444 !important;
  font-weight: 600;
}

.text-muted {
  color: #6b7280 !important;
}

.opacity-50 {
  opacity: 0.5;
}

hr {
  margin-top: 16px;
  margin-bottom: 16px;
}
</style>