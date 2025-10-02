import { describe, it, expect } from 'vitest';

describe('Roth Conversion - Core Logic Tests', () => {
  describe('distributeConversionAmounts', () => {
    const distributeConversionAmounts = (total, years) => {
      const baseAmount = Math.floor(total / years);
      const remainder = total - (baseAmount * years);
      const amounts = Array(years).fill(baseAmount);
      amounts[years - 1] += remainder;
      return amounts;
    };

    it('should distribute evenly divisible amounts correctly', () => {
      const result = distributeConversionAmounts(150000, 5);
      expect(result).toEqual([30000, 30000, 30000, 30000, 30000]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(150000);
    });

    it('should handle remainder in final year for uneven division', () => {
      const result = distributeConversionAmounts(100000, 3);
      expect(result).toEqual([33333, 33333, 33334]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100000);
    });

    it('should handle single year conversion', () => {
      const result = distributeConversionAmounts(50000, 1);
      expect(result).toEqual([50000]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(50000);
    });

    it('should handle large amounts with precision', () => {
      const result = distributeConversionAmounts(1000000, 7);
      expect(result.reduce((a, b) => a + b, 0)).toBe(1000000);
    });
  });

  describe('isRothWithdrawalYearValid logic', () => {
    const isRothWithdrawalYearValid = (conversionStartYear, yearsToConvert, withdrawalYear) => {
      const conversionEndYear = conversionStartYear + yearsToConvert - 1;
      return withdrawalYear > conversionEndYear;
    };

    it('should validate withdrawal year is after conversion END year', () => {
      expect(isRothWithdrawalYearValid(2025, 5, 2031)).toBe(true);
    });

    it('should reject withdrawal year during conversion period', () => {
      expect(isRothWithdrawalYearValid(2025, 5, 2027)).toBe(false);
    });

    it('should reject withdrawal year same as conversion end year', () => {
      expect(isRothWithdrawalYearValid(2025, 5, 2029)).toBe(false);
    });

    it('should handle single year conversion correctly', () => {
      expect(isRothWithdrawalYearValid(2025, 1, 2026)).toBe(true);
    });
  });

  describe('validateCurrencyInput logic', () => {
    const validateCurrencyInput = (value) => {
      if (value < 0) return false;
      if (isNaN(value)) return false;
      if (typeof value === 'string' && /e/i.test(value)) return false;
      return true;
    };

    it('should reject negative amounts', () => {
      expect(validateCurrencyInput(-1000)).toBe(false);
    });

    it('should accept valid positive amounts', () => {
      expect(validateCurrencyInput(50000)).toBe(true);
    });

    it('should reject scientific notation', () => {
      expect(validateCurrencyInput('1e6')).toBe(false);
    });

    it('should handle zero correctly', () => {
      expect(validateCurrencyInput(0)).toBe(true);
    });
  });

  describe('isPreRetirementIncomeRequired logic', () => {
    const isPreRetirementIncomeRequired = (conversionStartYear, retirementYear) => {
      return conversionStartYear < retirementYear;
    };

    const isPreRetirementIncomeValid = (conversionStartYear, retirementYear, preRetirementIncome) => {
      if (isPreRetirementIncomeRequired(conversionStartYear, retirementYear)) {
        const income = parseFloat(preRetirementIncome);
        return !isNaN(income) && income >= 0;
      }
      return true;
    };

    it('should require pre-retirement income when converting before retirement', () => {
      expect(isPreRetirementIncomeRequired(2025, 2030)).toBe(true);
    });

    it('should not require pre-retirement income when converting after retirement', () => {
      expect(isPreRetirementIncomeRequired(2030, 2025)).toBe(false);
    });

    it('should validate pre-retirement income is provided when required', () => {
      expect(isPreRetirementIncomeValid(2025, 2030, '100000')).toBe(true);
      expect(isPreRetirementIncomeValid(2025, 2030, '')).toBe(false);
      expect(isPreRetirementIncomeValid(2030, 2025, '')).toBe(true);
    });
  });
});