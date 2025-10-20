<template>
  <div class="comprehensive-conversion-table">
    <!-- Empty State -->
    <div v-if="!tableData || tableData.length === 0" class="text-center py-5">
      <i class="bi bi-table fs-1 text-muted"></i>
      <p class="mt-2 text-muted">No data available</p>
    </div>

    <!-- Table Content -->
    <div v-else class="table-wrapper">
      <!-- Top scrollbar -->
      <div class="top-scrollbar-container" ref="topScrollbar" @scroll="syncScrollToBottom">
        <div class="top-scrollbar-content"></div>
      </div>

      <!-- Main table with bottom scrollbar -->
      <div class="table-scroll-container" ref="bottomScrollbar" @scroll="syncScrollToTop">
        <table class="table table-hover table-sm">
          <thead>
            <tr class="header-row-first">
            <!-- Demographics Columns (Sticky) -->
            <th :colspan="hasSpouse ? 3 : 2" class="text-center bg-info text-white demo-header-sticky" style="position: sticky; left: 0; z-index: 11;">Demographics</th>

            <!-- Income Sources Columns (including Pre-Retirement Income + dynamic sources) -->
            <th :colspan="1 + incomeSourceColumns.length" class="text-center bg-success text-white" style="background-color: #28a745 !important;">
              Income Sources
            </th>

            <!-- Conversion Columns (New Section) -->
            <th colspan="2" class="text-center bg-purple text-white" style="background-color: #6f42c1 !important;">Roth Conversion</th>

            <!-- Asset Balances Columns -->
            <th v-if="assetBalanceColumns.length > 0" :colspan="assetBalanceColumns.length" class="text-center bg-secondary text-white" style="background-color: #6c757d !important;">
              Asset Balances
            </th>

            <!-- RMD Columns -->
            <th colspan="2" class="text-center bg-dark text-white" style="background-color: #343a40 !important;">RMDs</th>

            <!-- Tax Columns (Extended with Conversion columns) -->
            <th colspan="8" class="text-center bg-warning" style="background-color: #ffc107 !important;">Taxes</th>

            <!-- Medicare Columns -->
            <th colspan="5" class="text-center bg-danger text-white" style="background-color: #dc3545 !important;">Medicare/IRMAA</th>

            <!-- Income Phases Columns -->
            <th colspan="3" class="text-center bg-primary text-white" style="background-color: #007bff !important;">Income Phases</th>

            <!-- Net Income Column -->
            <th colspan="1" class="text-center bg-success text-white" style="position: sticky; right: 0; z-index: 11;">Net Income</th>
            </tr>
            <tr class="header-row-second">
            <!-- Demographics -->
            <th style="position: sticky; left: 0; z-index: 10; background-color: #f8f9fa;">Year</th>
            <th :class="{ 'demo-last-col': !hasSpouse }" style="position: sticky; left: 60px; z-index: 10; background-color: #f8f9fa;">{{ primaryName }} Age</th>
            <th v-if="hasSpouse" class="demo-last-col" style="position: sticky; left: 160px; z-index: 10; background-color: #f8f9fa;">{{ spouseName }} Age</th>

            <!-- Income Sources -->
            <th>Pre-Retirement Income</th>
            <th v-for="source in incomeSourceColumns" :key="`income-${source.id}`">
              {{ source.name }}
            </th>

            <!-- Roth Conversion -->
            <th class="text-purple">Conversion Amount</th>
            <!-- Roth Balance column hidden - shown in Asset Balances as "Converted Roth IRA" instead -->
            <th class="text-purple">Tax Free Income</th>

            <!-- Asset Balances -->
            <th v-for="asset in assetBalanceColumns" :key="`balance-${asset.id}`">
              {{ asset.name }}
            </th>

            <!-- RMDs -->
            <th>RMD Required</th>
            <th class="border-end">RMD Total</th>

            <!-- Taxes (Extended) -->
            <th>AGI</th>
            <th>MAGI</th>
            <th>Taxable Income</th>
            <th class="text-purple">Conversion Tax</th>
            <th>Federal Tax</th>
            <th>State Tax</th>
            <th>Marginal Rate</th>
            <th class="border-end">Effective Rate</th>

            <!-- Medicare -->
            <th>Part B</th>
            <th>Part D</th>
            <th>IRMAA</th>
            <th>Bracket</th>
            <th class="border-end">Total Medicare</th>

            <!-- Income Phases -->
            <th>Gross Income</th>
            <th>After Tax</th>
            <th class="border-end">After Medicare</th>

            <!-- Net Income -->
            <th class="sticky-column fw-bold" style="position: sticky; right: 0; z-index: 10; background-color: #f8f9fa;">
              Remaining
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="year in tableData" :key="year.year" :class="{ 'conversion-year-highlight': year.roth_conversion > 0 }">
            <!-- Demographics -->
            <td style="position: sticky; left: 0; background-color: white; z-index: 5;">{{ year.year }}</td>
            <td :class="{ 'demo-last-col': !hasSpouse }" style="position: sticky; left: 60px; background-color: white; z-index: 5;">{{ year.primary_age || '-' }}</td>
            <td v-if="hasSpouse" class="demo-last-col" style="position: sticky; left: 160px; background-color: white; z-index: 5;">{{ year.spouse_age || '-' }}</td>

            <!-- Income Sources -->
            <td>
              <span v-if="year.pre_retirement_income > 0">
                {{ formatCurrency(year.pre_retirement_income) }}
              </span>
              <span v-else>-</span>
            </td>
            <td v-for="source in incomeSourceColumns" :key="`income-${source.id}-${year.year}`">
              {{ formatCurrency(year.income_by_source?.[source.id] || 0) }}
            </td>

            <!-- Roth Conversion -->
            <td class="text-purple">
              <span v-if="year.roth_conversion > 0" class="fw-bold text-purple">
                {{ formatCurrency(year.roth_conversion) }}
              </span>
              <span v-else>-</span>
            </td>
            <!-- Roth Balance column hidden -->
            <td class="text-purple">
              <span v-if="year.tax_free_income > 0" class="fw-bold text-success">
                {{ formatCurrency(year.tax_free_income) }}
              </span>
              <span v-else>-</span>
            </td>

            <!-- Asset Balances -->
            <td v-for="asset in assetBalanceColumns" :key="`balance-${asset.id}-${year.year}`">
              {{ formatCurrency(year.asset_balances?.[asset.id] || year[`${asset.id}_balance`] || 0) }}
            </td>

            <!-- RMDs -->
            <td>
              <span v-if="Object.keys(year.rmd_required || {}).length > 0" class="text-danger">
                {{ formatCurrency(Object.values(year.rmd_required).reduce((a, b) => a + b, 0)) }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="border-end">{{ formatCurrency(year.rmd_total || year.rmd_amount || 0) }}</td>

            <!-- Taxes (Extended) -->
            <td>{{ formatCurrency(year.agi || 0) }}</td>
            <td>{{ formatCurrency(year.magi || 0) }}</td>
            <td>{{ formatCurrency(year.taxable_income || 0) }}</td>
            <td class="text-purple">
              <span v-if="year.conversion_tax > 0" class="fw-bold text-purple">
                {{ formatCurrency(year.conversion_tax) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ formatCurrency(year.federal_tax || 0) }}</td>
            <td>{{ formatCurrency(year.state_tax || 0) }}</td>
            <td>{{ year.marginal_rate || 0 }}%</td>
            <td class="border-end">{{ (year.effective_rate || 0).toFixed(2) }}%</td>

            <!-- Medicare -->
            <td>{{ formatCurrency(year.part_b || 0) }}</td>
            <td>{{ formatCurrency(year.part_d || 0) }}</td>
            <td>
              <span v-if="year.irmaa_surcharge > 0" class="text-warning">
                {{ formatCurrency(year.irmaa_surcharge) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span v-if="year.irmaa_bracket_number > 0" class="badge bg-warning text-dark">
                {{ year.irmaa_bracket_number }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="border-end">{{ formatCurrency(year.total_medicare || 0) }}</td>

            <!-- Income Phases -->
            <td>{{ formatCurrency(year.gross_income_total || year.gross_income || 0) }}</td>
            <td>{{ formatCurrency(year.after_tax_income || 0) }}</td>
            <td class="border-end">{{ formatCurrency(year.after_medicare_income || 0) }}</td>

            <!-- Net Income -->
            <td class="sticky-column fw-bold" style="position: sticky; right: 0; background-color: #f8f9fa; z-index: 5;">
              {{ formatCurrency(year.remaining_income || year.net_income || 0) }}
            </td>
          </tr>

          <!-- Totals Row -->
          <tr v-if="tableTotals" class="totals-row">
            <!-- Demographics -->
            <td style="position: sticky; left: 0; background-color: #e9ecef; z-index: 5;" class="fw-bold">TOTALS</td>
            <td :class="{ 'demo-last-col': !hasSpouse }" style="position: sticky; left: 60px; background-color: #e9ecef; z-index: 5;">-</td>
            <td v-if="hasSpouse" class="demo-last-col" style="position: sticky; left: 160px; background-color: #e9ecef; z-index: 5;">-</td>

            <!-- Income Sources - Sum -->
            <td class="fw-bold">{{ formatCurrency(tableTotals.preRetirementIncome) }}</td>
            <td v-for="source in incomeSourceColumns" :key="`total-income-${source.id}`" class="fw-bold">
              {{ formatCurrency(tableTotals.incomeSources[source.id] || 0) }}
            </td>

            <!-- Roth Conversion - Sum -->
            <td class="fw-bold text-purple">{{ formatCurrency(tableTotals.rothConversion) }}</td>
            <!-- Roth Balance column hidden -->
            <td class="fw-bold text-success">{{ formatCurrency(tableTotals.taxFreeIncome) }}</td>

            <!-- Asset Balances - Final Year -->
            <td v-for="asset in assetBalanceColumns" :key="`total-balance-${asset.id}`" class="fw-bold text-muted">
              {{ formatCurrency(tableTotals.assetBalances[asset.id] || 0) }}
            </td>

            <!-- RMDs - Sum -->
            <td class="fw-bold">{{ formatCurrency(tableTotals.rmdRequired) }}</td>
            <td class="border-end fw-bold">{{ formatCurrency(tableTotals.rmdTotal) }}</td>

            <!-- Taxes - Sum (with conversion-specific columns) -->
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td class="fw-bold text-purple">{{ formatCurrency(tableTotals.conversionTax) }}</td>
            <td class="fw-bold">{{ formatCurrency(tableTotals.federalTax) }}</td>
            <td class="fw-bold">{{ formatCurrency(tableTotals.stateTax) }}</td>
            <td>-</td>
            <td class="border-end">-</td>

            <!-- Medicare - Sum -->
            <td class="fw-bold">{{ formatCurrency(tableTotals.partB) }}</td>
            <td class="fw-bold">{{ formatCurrency(tableTotals.partD) }}</td>
            <td class="fw-bold">{{ formatCurrency(tableTotals.irmaa) }}</td>
            <td>-</td>
            <td class="border-end fw-bold">{{ formatCurrency(tableTotals.totalMedicare) }}</td>

            <!-- Income Phases - Sum -->
            <td class="fw-bold">{{ formatCurrency(tableTotals.grossIncome) }}</td>
            <td class="fw-bold">{{ formatCurrency(tableTotals.afterTax) }}</td>
            <td class="border-end fw-bold">{{ formatCurrency(tableTotals.afterMedicare) }}</td>

            <!-- Net Income - Sum -->
            <td class="sticky-column fw-bold" style="position: sticky; right: 0; background-color: #e9ecef; z-index: 5;">
              {{ formatCurrency(tableTotals.remaining) }}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, nextTick, watch } from 'vue';

export default {
  name: 'ComprehensiveConversionTable',

  props: {
    comprehensiveData: {
      type: Object,
      required: true
    },
    client: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props) {
    // Refs for scroll synchronization
    const topScrollbar = ref(null);
    const bottomScrollbar = ref(null);
    let isScrolling = false;

    // Sync scroll from top to bottom
    const syncScrollToBottom = () => {
      if (!isScrolling && topScrollbar.value && bottomScrollbar.value) {
        isScrolling = true;
        bottomScrollbar.value.scrollLeft = topScrollbar.value.scrollLeft;
        isScrolling = false;
      }
    };

    // Sync scroll from bottom to top
    const syncScrollToTop = () => {
      if (!isScrolling && topScrollbar.value && bottomScrollbar.value) {
        isScrolling = true;
        topScrollbar.value.scrollLeft = bottomScrollbar.value.scrollLeft;
        isScrolling = false;
      }
    };

    const updateScrollbarWidth = () => {
      nextTick(() => {
        if (topScrollbar.value && bottomScrollbar.value) {
          const scrollWidth = bottomScrollbar.value.scrollWidth;
          const topContent = topScrollbar.value.querySelector('.top-scrollbar-content');
          if (topContent) {
            topContent.style.width = `${scrollWidth}px`;
          }
        }
      });
    };

    // Set up scroll width after component mounts
    onMounted(() => {
      updateScrollbarWidth();
    });

    // Computed properties
    const tableData = computed(() => {
      return props.comprehensiveData?.years || [];
    });

    const primaryName = computed(() => {
      return props.client?.first_name || 'Primary';
    });

    const spouseName = computed(() => {
      return props.client?.spouse?.first_name || 'Spouse';
    });

    const hasSpouse = computed(() => {
      const taxStatus = props.client?.tax_status?.toLowerCase();
      return taxStatus && taxStatus !== 'single';
    });

    // Dynamic column generation based on actual data
    const incomeSourceColumns = computed(() => {
      if (!tableData.value.length) return [];

      const firstYear = tableData.value[0];
      const sources = [];

      if (firstYear.income_by_source) {
        // Get all unique income source IDs from all years
        const allSourceIds = new Set();
        tableData.value.forEach(year => {
          if (year.income_by_source) {
            Object.keys(year.income_by_source).forEach(id => allSourceIds.add(id));
          }
        });

        // Get names from comprehensive data if available
        const incomeNames = props.comprehensiveData?.income_source_names || {};

        // Create column definitions
        allSourceIds.forEach(id => {
          // Try to get the name from the metadata
          let name = incomeNames[id];
          if (!name) {
            // Fallback to default names if not in metadata
            name = `Income ${id}`;
          } else {
            // Capitalize properly
            name = name.split(' ').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }

          sources.push({
            id: id,
            name: name
          });
        });
      }

      return sources;
    });

    const assetBalanceColumns = computed(() => {
      if (!tableData.value.length) return [];

      const firstYear = tableData.value[0];
      const assets = [];

      console.log('🔍 DEBUG: ComprehensiveConversionTable - assetBalanceColumns computation');
      console.log('🔍 First year data:', firstYear);
      console.log('🔍 asset_balances:', firstYear.asset_balances);
      console.log('🔍 comprehensiveData.asset_names:', props.comprehensiveData?.asset_names);

      if (firstYear.asset_balances) {
        // Get all unique asset IDs - but only for actual assets with balances
        const allAssetIds = new Set();
        tableData.value.forEach(year => {
          if (year.asset_balances) {
            Object.keys(year.asset_balances).forEach(id => {
              // Only add if it has a non-zero balance (filters out income-only sources)
              if (year.asset_balances[id] > 0) {
                allAssetIds.add(id);
              }
            });
          }
        });

        console.log('🔍 All asset IDs with balances > 0:', Array.from(allAssetIds));

        // Get names from comprehensive data if available
        const assetNames = props.comprehensiveData?.asset_names || {};

        // Create column definitions - only for real assets
        allAssetIds.forEach(id => {
          // Get the name from the metadata (backend already filters income-only types)
          let name = assetNames[id];
          console.log(`🔍 Asset ID ${id}: name="${name}"`);
          if (name) {
            // Capitalize properly
            name = name.split(' ').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');

            assets.push({
              id: id,
              name: name
            });
          }
        });
      }

      // Check for asset balance fields directly on year objects (fallback)
      if (assets.length === 0 && tableData.value.length > 0) {
        console.log('🔍 Using fallback - checking for _balance fields');

        // Define income-only types that should NOT appear in Asset Balances
        const incomeOnlyTypes = new Set([
          'social_security',
          'pension',
          'wages',
          'rental_income',
          'other'
        ]);

        const balanceFields = Object.keys(firstYear).filter(key => {
          if (!key.endsWith('_balance')) return false;

          const assetType = key.replace('_balance', '');

          // Exclude income-only types from asset balances
          if (incomeOnlyTypes.has(assetType)) {
            console.log(`🔍 Excluding income-only type: ${assetType}`);
            return false;
          }

          return true;
        });

        console.log('🔍 Found balance fields:', balanceFields);
        balanceFields.forEach(field => {
          const assetType = field.replace('_balance', '');
          const displayName = assetType.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');

          assets.push({
            id: assetType,
            name: displayName
          });
        });
      }

      console.log('🔍 Final assets array:', assets);
      return assets;
    });

    const tableTotals = computed(() => {
      if (!tableData.value || tableData.value.length === 0) return null;

      const totals = {
        preRetirementIncome: 0,
        incomeSources: {},
        rothConversion: 0,
        rothBalance: 0,
        taxFreeIncome: 0,
        assetBalances: {},
        rmdRequired: 0,
        rmdTotal: 0,
        agi: 0,
        magi: 0,
        taxableIncome: 0,
        regularTax: 0,
        conversionTax: 0,
        federalTax: 0,
        stateTax: 0,
        partB: 0,
        partD: 0,
        irmaa: 0,
        totalMedicare: 0,
        grossIncome: 0,
        afterTax: 0,
        afterMedicare: 0,
        remaining: 0
      };

      // Get the last year for asset balances
      const lastYear = tableData.value[tableData.value.length - 1];

      // Sum all years
      tableData.value.forEach(year => {
        // Pre-retirement income
        totals.preRetirementIncome += year.pre_retirement_income || 0;

        // Income sources
        if (year.income_by_source) {
          Object.keys(year.income_by_source).forEach(id => {
            totals.incomeSources[id] = (totals.incomeSources[id] || 0) + (year.income_by_source[id] || 0);
          });
        }

        // Roth conversion
        totals.rothConversion += year.roth_conversion || 0;
        totals.taxFreeIncome += year.tax_free_income || 0;

        // RMDs
        if (year.rmd_required) {
          totals.rmdRequired += Object.values(year.rmd_required).reduce((a, b) => a + b, 0);
        }
        totals.rmdTotal += year.rmd_total || year.rmd_amount || 0;

        // Taxes
        totals.agi += year.agi || 0;
        totals.magi += year.magi || 0;
        totals.taxableIncome += year.taxable_income || 0;
        totals.regularTax += year.regular_income_tax || 0;
        totals.conversionTax += year.conversion_tax || 0;
        totals.federalTax += year.federal_tax || 0;
        totals.stateTax += year.state_tax || 0;

        // Medicare
        totals.partB += year.part_b || 0;
        totals.partD += year.part_d || 0;
        totals.irmaa += year.irmaa_surcharge || 0;
        totals.totalMedicare += year.total_medicare || 0;

        // Income phases
        totals.grossIncome += year.gross_income_total || year.gross_income || 0;
        totals.afterTax += year.after_tax_income || 0;
        totals.afterMedicare += year.after_medicare_income || 0;
        totals.remaining += year.remaining_income || year.net_income || 0;
      });

      // Asset balances - use final year values
      if (lastYear.asset_balances) {
        totals.assetBalances = { ...lastYear.asset_balances };
      }

      // Roth balance - use final year value
      totals.rothBalance = lastYear.roth_ira_balance || 0;

      // Also check for _balance fields on the last year (fallback)
      assetBalanceColumns.value.forEach(asset => {
        if (!totals.assetBalances[asset.id]) {
          const balanceFieldValue = lastYear[`${asset.id}_balance`];
          if (balanceFieldValue !== undefined) {
            totals.assetBalances[asset.id] = balanceFieldValue;
          }
        }
      });

      return totals;
    });

    // Watch for comprehensive data changes to update scrollbar
    watch(() => props.comprehensiveData, () => {
      updateScrollbarWidth();
    });

    // Watch for table data changes to update scrollbar
    watch(tableData, () => {
      updateScrollbarWidth();
    });

    // Methods
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '-';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    return {
      tableData,
      primaryName,
      spouseName,
      hasSpouse,
      incomeSourceColumns,
      assetBalanceColumns,
      tableTotals,
      formatCurrency,
      topScrollbar,
      bottomScrollbar,
      syncScrollToBottom,
      syncScrollToTop
    };
  }
};
</script>

<style scoped>
.comprehensive-conversion-table {
  position: relative;
}

/* Table wrapper */
.table-wrapper {
  width: 100%;
}

/* Top scrollbar */
.top-scrollbar-container {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  height: 15px;
  margin-bottom: 5px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.top-scrollbar-content {
  height: 1px;
  /* Width will be set dynamically via JavaScript */
}

/* Main table scroll container */
.table-scroll-container {
  overflow-x: auto;
  max-width: 100%;
}

/* Table sizing */
.table {
  min-width: 1600px;
}

/* Header styling - no sticky for now */
.table thead {
  background: white;
}

/* Header rows */
.header-row-first th {
  /* First row styling */
}

.header-row-second th {
  background-color: #f8f9fa;
}

/* Ensure all header cells have solid backgrounds */
.table thead tr.header-row-first th {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.table thead tr.header-row-second th {
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 0.875rem;
  background-color: #f8f9fa;
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  vertical-align: middle;
}

.table td {
  font-size: 0.875rem;
  white-space: nowrap;
  vertical-align: middle;
}

.sticky-column {
  position: sticky;
  background-color: #f8f9fa;
  font-weight: 500;
}

/* Zebra striping */
.table tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Hover effect */
.table tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

/* Highlight rows with conversions */
.conversion-year-highlight {
  background-color: rgba(111, 66, 193, 0.05) !important;
}

.conversion-year-highlight:hover {
  background-color: rgba(111, 66, 193, 0.15) !important;
}

/* Purple text for conversion-specific columns */
.text-purple {
  color: #6f42c1 !important;
}

.bg-purple {
  background-color: #6f42c1 !important;
}

/* Border styles for section separation */
.border-end {
  border-right: 2px solid #dee2e6 !important;
}

/* Sticky styling enhancements */
.sticky-column {
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

/* Add shadow to the last demographic column for visual separation */
.demo-last-col {
  box-shadow: 3px 0 5px rgba(0,0,0,0.1);
}

/* Sticky demographics header */
.demo-header-sticky {
  box-shadow: 3px 0 5px rgba(0,0,0,0.1);
}

/* Badge styles */
.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Totals row styling */
.totals-row {
  background-color: #e9ecef !important;
  border-top: 3px solid #495057 !important;
  font-weight: 600;
}

.totals-row td {
  background-color: #e9ecef !important;
  font-size: 0.9rem;
}

.totals-row:hover {
  background-color: #e9ecef !important;
}
</style>
