# Chart Comparison: Working Bar Chart vs Broken Circle Chart

## Page: https://staging.retirementadvisorpro.com/clients/2/scenarios/detail/1

### Test Results:
- **Laptop**: Both bar chart AND circle chart work ✅
- **iPad**: Bar chart works ✅, Circle chart does NOT work ❌

---

## WORKING BAR CHART (Graph Component)

### Location in ScenarioDetail.vue
Lines 313-318:
```vue
<Graph
  :data="overviewChartData"
  :options="overviewChartOptions"
  :height="300"
  type="line"
/>
```

### Component Type
- **Vue Component**: `/src/components/Graph.vue`
- **Reactive**: Yes - uses Vue's reactivity system
- **Props-driven**: Yes - receives data via props

### Library Details
- **Package**: Chart.js
- **Import method**: ES6 module import
- **Location**: `import Chart from 'chart.js/auto';` (line 8 of Graph.vue)
- **Loaded via**: npm package bundled by Vite
- **Version control**: Package.json dependency

### Data Source
- **Computed property**: `overviewChartData` (line 1671)
- **Returns**: `{ labels: [], datasets: [] }`
- **Safe fallback**: Returns empty object if no data (line 1672-1674)
- **Data dependency**: `this.filteredScenarioResults`

### Initialization Lifecycle
1. Parent component mounts
2. `overviewChartData` computed property calculates
3. `<Graph>` component receives data via prop
4. Graph component's `mounted()` hook fires (line 42)
5. `renderChart()` called (line 45)
6. Chart.js instance created with data

### Data Flow
```
filteredScenarioResults (computed)
  → overviewChartData (computed)
  → :data prop
  → Graph component
  → renderChart()
  → new Chart()
```

### Timing
- **When initialized**: After Vue component mount
- **Data available**: Guaranteed via computed property
- **Reactive updates**: Automatic via Vue watchers (lines 47-76)

### Error Handling
- Canvas availability checks (lines 99, 135, 174)
- Context validation (lines 181-191)
- Try-catch wrapper (lines 93, 222-225)
- Data validation (lines 123-132)
- Graceful degradation on empty data

### iPad Compatibility Features
- Deep clones data to avoid reference issues (line 71, 105)
- Adds 50ms delay for canvas readiness (line 64)
- ResizeObserver for dimension changes (lines 227-267)
- Disables animations (line 144)
- Multiple canvas availability checks

---

## BROKEN CIRCLE CHART (Circles.js)

### Location in ScenarioDetail.vue
Lines 334-336:
```vue
<div v-else class="circles-chart d-flex justify-content-center" style="padding-top:20px; min-height: 180px;">
  <div class="js-circle" id="circle-overview"></div>
</div>
```

### Component Type
- **Plain HTML div**: Not a Vue component
- **Reactive**: No - manual DOM manipulation
- **Props-driven**: No - directly accesses parent component data

### Library Details
- **Package**: Circles.js
- **Import method**: Script tag in index.html
- **Location**: `<script src="/assets/vendor/circles.js/circles.min.js"></script>` (line 96)
- **Loaded via**: Static file served by nginx
- **Version control**: Vendor file in public/assets

### Data Source
- **Direct property access**:
  - `this.overviewTotalTax` (line 886)
  - `this.overviewTotalMedicare` (line 886)
  - `this.overviewTotalGrossIncome` (line 887)
- **No safe fallback**: Calculates percentage inline
- **Data dependency**: Computed properties based on `this.filteredScenarioResults`

### Initialization Lifecycle
1. Parent component mounts
2. `mounted()` hook calls `loadScenarioData()` (line 1819)
3. `loadScenarioData()` calls `initPlugins()` (line 1000)
4. `initPlugins()` calls `initializeCircles()` (line 776)
5. `initializeCircles()` uses `$nextTick` (line 876)
6. Retry loop with 100ms delays checking for `window.Circles` (lines 879-945)
7. Once found, calls `window.Circles.create()` (line 890)

### Data Flow
```
filteredScenarioResults (computed)
  → overviewTotalTax (computed)
  → overviewTotalMedicare (computed)
  → overviewTotalGrossIncome (computed)
  → Direct access in initializeCircles()
  → window.Circles.create()
```

### Timing
- **When initialized**: After `$nextTick` + retry delays
- **Data available**: Unknown - no validation
- **Reactive updates**: None - only initializes once

### Error Handling
- Retry loop for library loading (20 retries, 100ms each)
- Console error after 20 failed retries (line 947)
- **No data validation**
- **No canvas/DOM checks**
- **No fallback for missing data**

### iPad Compatibility Features
- **None identified**

---

## KEY DIFFERENCES

| Feature | Bar Chart (Works) | Circle Chart (Broken) |
|---------|------------------|---------------------|
| **Vue Integration** | Full Vue component | Plain DOM manipulation |
| **Library Loading** | npm + Vite bundle | Script tag + global var |
| **Data Binding** | Vue props (reactive) | Direct property access |
| **Initialization** | Component lifecycle | Manual with retries |
| **Error Handling** | Extensive | Minimal |
| **Data Validation** | Yes (lines 123-132) | No |
| **DOM Checks** | Multiple canvas checks | None |
| **Reactive Updates** | Automatic watchers | None |
| **Animation** | Disabled for mobile | Enabled (400ms duration) |
| **Timing Control** | 50ms delay + ResizeObserver | $nextTick + retry loop |

---

## HYPOTHESIS: Why Circle Fails on iPad

### Theory 1: Race Condition
- Circle initializes before data is available
- No data validation means it creates circle with 0%
- Computed properties return 0 when `filteredScenarioResults` is empty
- Bar chart waits for data via reactive props

### Theory 2: Global Variable Issues
- `window.Circles` may not be available on iPad when called
- Script loading from `/assets/vendor/` may be blocked or delayed
- No verification that library actually loaded correctly

### Theory 3: Animation/Rendering Issues
- iOS 15 WebKit has known bugs with animations
- Circle uses 400ms animation duration (line 898)
- Bar chart disables animations entirely (line 144)

### Theory 4: DOM Timing
- `$nextTick` may not be sufficient on iPad Safari
- DOM element may not be ready when `Circles.create()` is called
- No validation that target element exists before initialization

---

## RECOMMENDED FIX

Convert circle to use the same pattern as the working bar chart:
1. Create a Circles Vue component (similar to Graph.vue)
2. Use npm package for Circles.js instead of script tag
3. Add proper data validation
4. Add DOM element checks
5. Disable or reduce animations
6. Use reactive props instead of direct property access
