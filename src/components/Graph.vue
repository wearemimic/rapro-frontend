<template>
  <div :style="`height: ${height}px;`">
    <canvas ref="canvas" :height="height" :style="`height: ${height}px;`"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  props: {
    data: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    },
    height: {
      type: Number,
      default: 200
    },
    type: {
      type: String,
      default: 'line'
    },
    // Add a unique ID prop to distinguish between different graph instances
    graphId: {
      type: String,
      default: () => `graph-${Math.random().toString(36).slice(2, 11)}`
    }
  },
  data() {
    return {
      chartInstance: null,
      resizeObserver: null,
      // Track registered plugins to avoid duplicate registration
      registeredPlugins: new Set()
    };
  },
  mounted() {
    this.renderChart();
  },
  watch: {
    data: {
      handler(newData, oldData) {
        // Skip if component is unmounting or canvas not available
        if (!this.$refs.canvas) {
          return;
        }

        // Add small delay to ensure tab is visible and canvas is ready
        setTimeout(() => {
          // Double-check canvas is still available after delay
          if (!this.$refs.canvas) {
            return;
          }
          // Create a deep copy of the data to avoid reference issues
          const dataCopy = JSON.parse(JSON.stringify(newData));
          this.renderChart(dataCopy);
        }, 50);
      },
      deep: true
    },
    options: {
      handler(newOptions) {
        // Skip if component is unmounting or canvas not available
        if (!this.$refs.canvas) {
          return;
        }
        // Create a deep copy of the options to avoid reference issues
        const optionsCopy = JSON.parse(JSON.stringify(newOptions));
        this.renderChart(undefined, optionsCopy);
      },
      deep: true
    }
  },
  methods: {
    renderChart(dataCopy, optionsCopy) {
      try {
        // CRITICAL: Check if canvas is available before doing anything
        if (!this.$refs.canvas) {
          return;
        }

        // Use provided data copies or make copies of the props
        const safeData = dataCopy || (this.data ? JSON.parse(JSON.stringify(this.data)) : null);
        const safeOptions = optionsCopy || (this.options ? JSON.parse(JSON.stringify(this.options)) : {});

        // Always destroy previous chart instance first to prevent conflicts
        if (this.chartInstance) {
          try {
            this.chartInstance.destroy();
          } catch (destroyError) {
            console.warn('⚠️ Error destroying chart:', destroyError);
          }
          this.chartInstance = null;
        }
        
        // Validate data before creating new chart
        if (!safeData || !safeData.labels || !safeData.datasets || !safeData.datasets.length) {
          return;
        }
        
        // Double-check canvas is still available
        if (!this.$refs.canvas) {
          console.warn('⚠️ Canvas lost during chart setup');
          return;
        }
        
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          ...safeOptions,
          animation: false // Disable animations to prevent canvas context errors
        };
        
        // Support mixed chart types: if any dataset has a 'type', use 'bar' as root type
        let chartType = this.type || 'line';
        if (safeData.datasets.some(ds => ds.type)) {
          chartType = 'bar';
        }
        
        // Register custom plugins if they exist, using the graphId to make them unique
        if (options.plugins && options.plugins.totalColumnHighlight) {
          const pluginId = `totalColumnHighlight-${this.graphId}`;
          
          // Only register if not already registered
          if (!this.registeredPlugins.has(pluginId)) {
            Chart.register({
              id: pluginId,
              beforeDraw: options.plugins.totalColumnHighlight.beforeDraw
            });
            this.registeredPlugins.add(pluginId);
          }
          
          // Update plugin reference in options to use our unique ID
          options.plugins.totalColumnHighlight = {
            ...options.plugins.totalColumnHighlight,
            id: pluginId
          };
        }
        
        // Final canvas check before creating chart
        const canvasEl = this.$refs.canvas;
        if (!canvasEl) {
          console.error('❌ Canvas element disappeared before chart creation');
          return;
        }
        
        // Get 2D context and verify it's available
        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
          return;
        }

        // Check if context is still valid (not lost)
        if (ctx.isContextLost && ctx.isContextLost()) {
          return;
        }

        this.chartInstance = new Chart(ctx, {
          type: chartType,
          data: safeData,
          options
        });

        // If canvas has 0 dimensions, set up a resize observer to fix it when visible
        if (canvasEl.offsetWidth === 0 || canvasEl.offsetHeight === 0) {
          this.setupResizeObserver();
        }
      } catch (error) {
        console.error('❌ Error rendering chart:', error);
        console.error('❌ Error stack:', error.stack);
      }
    },
    setupResizeObserver() {
      const canvasEl = this.$refs.canvas;
      if (!canvasEl) {
        return;
      }

      // Clean up existing observer if any
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      // Create a ResizeObserver to detect when canvas becomes visible
      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;

          // If canvas now has dimensions and we have a chart instance, resize it
          if (width > 0 && height > 0 && this.chartInstance) {
            try {
              this.chartInstance.resize();

              // Disconnect observer after successful resize since we only need it once
              this.resizeObserver.disconnect();
              this.resizeObserver = null;
            } catch (error) {
              console.error('Error resizing chart:', error);
            }
          }
        }
      });

      // Start observing the canvas element
      this.resizeObserver.observe(canvasEl);
    }
  },
  beforeUnmount() {
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up chart instance
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (error) {
        console.warn('Error destroying chart on unmount:', error);
      }
      this.chartInstance = null;
    }
  }
};
</script>