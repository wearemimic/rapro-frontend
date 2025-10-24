<template>
  <div>
    <p class="text-muted mb-3">Configure conversion schedule for each asset individually:</p>
    <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle">
          <thead class="thead-light">
            <tr>
              <th>Asset</th>
              <th>Owner</th>
              <th>Current Value</th>
              <th>Amount to Convert</th>
              <th>Start Year</th>
              <th>Years</th>
              <th>Annual Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in (eligibleAssets && eligibleAssets.length ? eligibleAssets : [])" :key="asset.id || asset.income_type">
              <td>{{ asset.income_name || asset.investment_name || asset.income_type || 'Unknown' }}</td>
              <td>
                <span :class="getOwnerBadgeClass(asset.owned_by)">
                  {{ formatOwner(asset.owned_by) }}
                </span>
              </td>
              <td>{{ formatCurrency(asset.current_asset_balance) }}</td>
              <td style="min-width: 150px;">
                <input
                  type="text"
                  :value="maxToConvertRaw[asset.id || asset.income_type] || ''"
                  @focus="onMaxToConvertFocus(asset)"
                  @input="onMaxToConvertInput($event, asset)"
                  @blur="onMaxToConvertBlur(asset)"
                  class="form-control form-control-sm"
                />
              </td>
              <td style="min-width: 180px;">
                <select
                  :value="getAssetStartYear(asset)"
                  @input="handleStartYearChange(asset, $event.target.value)"
                  class="form-select form-select-sm"
                  :disabled="!getAssetConversionAmount(asset)"
                >
                  <option value="" disabled>Select Year</option>
                  <option v-for="year in availableYears" :key="year" :value="year">
                    {{ year }}{{ year === getRetirementYearForOwner(asset.owned_by) ? ' (Retirement)' : '' }}
                  </option>
                </select>
              </td>
              <td style="min-width: 100px;">
                <input
                  type="number"
                  :value="getAssetConversionYears(asset)"
                  @input="updateAssetConversionYears(asset, $event.target.value)"
                  class="form-control form-control-sm"
                  min="1"
                  max="20"
                  :disabled="!getAssetConversionAmount(asset)"
                />
              </td>
              <td>
                <strong>{{ formatCurrency(calculateAnnualAmount(asset)) }}</strong>
              </td>
            </tr>
            <!-- Total Row -->
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td colspan="3">Total to Convert</td>
              <td>{{ formatCurrency(totalToConvert) }}</td>
              <td colspan="2">{{ conversionYearRange }}</td>
              <td>{{ formatCurrency(maxAnnualAmount) }}</td>
            </tr>
          </tbody>
        </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssetSelectionPanel',
  props: {
    eligibleAssets: {
      type: Array,
      required: true
    },
    maxToConvert: {
      type: Object,
      required: true
    },
    maxToConvertRaw: {
      type: Object,
      required: true
    },
    assetConversionParams: {
      type: Object,
      required: true
    },
    availableYears: {
      type: Array,
      required: true
    },
    primaryRetirementYear: {
      type: Number,
      required: true
    },
    spouseRetirementYear: {
      type: Number,
      default: null
    },
    client: {
      type: Object,
      required: true
    }
  },
  emits: ['update:maxToConvert', 'update:maxToConvertRaw', 'update:assetConversionParams'],
  computed: {
    totalToConvert() {
      return (this.eligibleAssets || []).reduce((sum, asset) => {
        const val = this.maxToConvert[asset.id || asset.income_type];
        return sum + (parseFloat(val) || 0);
      }, 0);
    },
    conversionYearRange() {
      const years = Object.values(this.assetConversionParams)
        .filter(p => p.startYear && p.years)
        .flatMap(p => {
          const start = parseInt(p.startYear);
          const end = start + parseInt(p.years) - 1;
          return [start, end];
        });

      if (years.length === 0) return '-';

      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
    },
    maxAnnualAmount() {
      // Calculate the maximum annual conversion amount across all years
      const yearTotals = {};

      Object.entries(this.assetConversionParams).forEach(([assetKey, params]) => {
        if (!params.startYear || !params.years) return;

        const amount = this.maxToConvert[assetKey] || 0;
        const annual = amount / parseInt(params.years);
        const startYear = parseInt(params.startYear);
        const endYear = startYear + parseInt(params.years);

        for (let year = startYear; year < endYear; year++) {
          yearTotals[year] = (yearTotals[year] || 0) + annual;
        }
      });

      const max = Math.max(0, ...Object.values(yearTotals));
      return max;
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    },
    formatOwner(owner) {
      if (!owner) return 'Unknown';
      return owner.charAt(0).toUpperCase() + owner.slice(1);
    },
    getOwnerBadgeClass(owner) {
      if (owner === 'primary') return 'badge bg-primary';
      if (owner === 'spouse') return 'badge bg-info';
      return 'badge bg-secondary';
    },
    getRetirementYearForOwner(owner) {
      if (owner === 'spouse' && this.spouseRetirementYear) {
        return this.spouseRetirementYear;
      }
      return this.primaryRetirementYear;
    },
    getAssetKey(asset) {
      return asset.id || asset.income_type;
    },
    getAssetConversionAmount(asset) {
      const key = this.getAssetKey(asset);
      return this.maxToConvert[key] || 0;
    },
    getAssetStartYear(asset) {
      const key = this.getAssetKey(asset);
      return this.assetConversionParams[key]?.startYear || '';
    },
    getAssetConversionYears(asset) {
      const key = this.getAssetKey(asset);
      return this.assetConversionParams[key]?.years || 1;
    },
    handleStartYearChange(asset, year) {
      console.log('handleStartYearChange called:', { asset: this.getAssetKey(asset), year });
      this.updateAssetStartYear(asset, year);
    },
    updateAssetStartYear(asset, year) {
      const key = this.getAssetKey(asset);
      const yearNum = parseInt(year);
      console.log('updateAssetStartYear:', { key, year, yearNum, currentParams: this.assetConversionParams });

      const updated = {
        ...this.assetConversionParams,
        [key]: {
          ...(this.assetConversionParams[key] || {}),
          startYear: yearNum
        }
      };
      console.log('Emitting updated params:', updated);
      this.$emit('update:assetConversionParams', updated);
    },
    updateAssetConversionYears(asset, years) {
      const key = this.getAssetKey(asset);
      const yearsNum = Math.max(1, Math.min(20, parseInt(years) || 1));
      const updated = {
        ...this.assetConversionParams,
        [key]: {
          ...(this.assetConversionParams[key] || {}),
          years: yearsNum
        }
      };
      this.$emit('update:assetConversionParams', updated);
    },
    calculateAnnualAmount(asset) {
      const amount = this.getAssetConversionAmount(asset);
      const years = this.getAssetConversionYears(asset);
      if (!amount || !years) return 0;
      return amount / years;
    },
    onMaxToConvertFocus(asset) {
      const key = this.getAssetKey(asset);
      const val = this.maxToConvert[key];
      let newRaw = (!val || val === 0) ? '' : val.toString();
      this.$emit('update:maxToConvertRaw', { ...this.maxToConvertRaw, [key]: newRaw });
    },
    onMaxToConvertInput(event, asset) {
      const key = this.getAssetKey(asset);
      let raw = event.target.value.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      if (parts.length > 2) raw = parts[0] + '.' + parts[1];
      if (parts[1]) raw = parts[0] + '.' + parts[1].slice(0, 2);
      if (raw === '.') {
        this.$emit('update:maxToConvertRaw', { ...this.maxToConvertRaw, [key]: '0.' });
        this.$emit('update:maxToConvert', { ...this.maxToConvert, [key]: 0 });
        // Clear conversion params when amount is cleared
        const updated = { ...this.assetConversionParams };
        delete updated[key];
        this.$emit('update:assetConversionParams', updated);
        return;
      }
      if (raw === '') {
        this.$emit('update:maxToConvertRaw', { ...this.maxToConvertRaw, [key]: '' });
        this.$emit('update:maxToConvert', { ...this.maxToConvert, [key]: 0 });
        // Clear conversion params when amount is cleared
        const updated = { ...this.assetConversionParams };
        delete updated[key];
        this.$emit('update:assetConversionParams', updated);
        return;
      }
      let numeric = parseFloat(raw);
      if (isNaN(numeric)) numeric = 0;
      const max = parseFloat(asset.current_asset_balance) || 0;
      if (numeric > max) {
        numeric = max;
      }
      const [intPart, decPart] = numeric.toString().split('.');
      let formatted = parseInt(intPart, 10).toLocaleString();
      if (decPart !== undefined) {
        formatted += '.' + decPart;
      }
      this.$emit('update:maxToConvertRaw', { ...this.maxToConvertRaw, [key]: formatted });
      this.$emit('update:maxToConvert', { ...this.maxToConvert, [key]: numeric });

      // Initialize conversion params with defaults when amount is set
      if (numeric > 0 && !this.assetConversionParams[key]) {
        const retirementYear = this.getRetirementYearForOwner(asset.owned_by);
        const updated = {
          ...this.assetConversionParams,
          [key]: {
            startYear: retirementYear,
            years: 5
          }
        };
        this.$emit('update:assetConversionParams', updated);
      }
    },
    onMaxToConvertBlur(asset) {
      const key = this.getAssetKey(asset);
      const val = this.maxToConvert[key];
      this.$emit('update:maxToConvertRaw', { ...this.maxToConvertRaw, [key]: this.formatCurrency(val) });
    }
  }
};
</script> 