/**
 * Validation Module
 * Main validation entry point
 */

import { SingleValidation } from './single.js';
import { BatchValidation } from './batch.js';
import { ValueUtils } from '../utils/values.js';
import { CONSTANTS } from '../config/constants.js';

export const Validation = {
  /**
   * Main validation gate before submission
   */
  ensureValidBeforeSubmit() {
    const mode = ValueUtils.getMode();

    if (mode !== CONSTANTS.MODES.BATCH) {
      return SingleValidation.validateRequired();
    }

    const result = BatchValidation.parseAndValidate();
    return {
      valid: result.valid,
      error: result.error,
    };
  },

  // Re-export sub-modules for direct access
  Single: SingleValidation,
  Batch: BatchValidation,
};
