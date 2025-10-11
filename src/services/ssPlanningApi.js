/**
 * Social Security Planning API Service
 *
 * Handles all API calls to the new ss_planning Django app endpoints.
 */

import axios from 'axios';
import { API_CONFIG } from '@/config';

// Use full API URL from config, not relative path
const SS_PLANNING_BASE_URL = `${API_CONFIG.API_URL}/ss-planning`;

export const ssPlanningApi = {
  /**
   * Get client info including FRA, life expectancy, and current age
   * GET /api/ss-planning/scenarios/:id/client-info/
   */
  async getClientInfo(scenarioId) {
    try {
      const response = await axios.get(`${SS_PLANNING_BASE_URL}/scenarios/${scenarioId}/client-info/`);

      // Check if response is HTML (authentication error)
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        console.error('❌ API returned HTML - likely authentication error');
        throw new Error('Authentication failed - received HTML instead of JSON');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching client info:', error);
      console.error('Response:', error.response);
      throw error;
    }
  },

  /**
   * Generate preview of Social Security claiming strategy
   * GET /api/ss-planning/scenarios/:id/preview/
   *
   * @param {number} scenarioId - Scenario ID
   * @param {object} params - Query parameters
   * @param {number} params.primary_claiming_age - Primary's claiming age (62-70)
   * @param {number} [params.spouse_claiming_age] - Spouse's claiming age (62-70)
   * @param {number} [params.life_expectancy_primary] - Override primary's life expectancy
   * @param {number} [params.life_expectancy_spouse] - Override spouse's life expectancy
   */
  async getPreview(scenarioId, params) {
    try {
      const response = await axios.get(
        `${SS_PLANNING_BASE_URL}/scenarios/${scenarioId}/preview/`,
        { params }
      );

      // Check if response is HTML (authentication error)
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        console.error('❌ API returned HTML - likely authentication error');
        throw new Error('Authentication failed - received HTML instead of JSON');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching SS preview:', error);
      console.error('Response:', error.response);
      throw error;
    }
  },

  /**
   * Save a Social Security claiming strategy
   * POST /api/ss-planning/scenarios/:id/strategies/save/
   *
   * @param {number} scenarioId - Scenario ID
   * @param {object} strategyData - Strategy data
   * @param {string} strategyData.name - Strategy name
   * @param {number} strategyData.primary_claiming_age - Primary's claiming age
   * @param {number} [strategyData.spouse_claiming_age] - Spouse's claiming age
   * @param {string} [strategyData.optimization_goal] - Optimization goal
   * @param {string} [strategyData.health_status_primary] - Primary's health status
   * @param {string} [strategyData.health_status_spouse] - Spouse's health status
   * @param {number} [strategyData.life_expectancy_primary] - Primary's life expectancy
   * @param {number} [strategyData.life_expectancy_spouse] - Spouse's life expectancy
   * @param {string} [strategyData.notes] - Strategy notes
   * @param {boolean} [strategyData.is_active] - Whether strategy is active
   */
  async saveStrategy(scenarioId, strategyData) {
    try {
      const response = await axios.post(
        `${SS_PLANNING_BASE_URL}/scenarios/${scenarioId}/strategies/save/`,
        strategyData
      );
      return response.data;
    } catch (error) {
      console.error('Error saving SS strategy:', error);
      throw error;
    }
  },

  /**
   * List all saved strategies for a scenario
   * GET /api/ss-planning/scenarios/:id/strategies/
   */
  async listStrategies(scenarioId) {
    try {
      const response = await axios.get(`${SS_PLANNING_BASE_URL}/scenarios/${scenarioId}/strategies/`);
      return response.data;
    } catch (error) {
      console.error('Error listing SS strategies:', error);
      throw error;
    }
  },

  /**
   * Compare multiple saved strategies
   * POST /api/ss-planning/scenarios/:id/strategies/compare/
   *
   * @param {number} scenarioId - Scenario ID
   * @param {number[]} strategyIds - Array of strategy IDs to compare
   */
  async compareStrategies(scenarioId, strategyIds) {
    try {
      const response = await axios.post(
        `${SS_PLANNING_BASE_URL}/scenarios/${scenarioId}/strategies/compare/`,
        { strategy_ids: strategyIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error comparing SS strategies:', error);
      throw error;
    }
  }
};

export default ssPlanningApi;
