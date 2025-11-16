/**
 * Food Wright Unit Conversion Library
 *
 * This library handles parsing, converting, and formatting ingredient quantities
 * between imperial and metric, including mass-to-volume conversions based on
 * ingredient density.
 */

// --- 1. Unit Definitions ---
// Base units: 'ml' for volume, 'g' for mass.
const units = {
  // Volume (Imperial)
  tsp: { type: 'volume', toBase: 4.92892, system: 'imperial' },
  tbsp: { type: 'volume', toBase: 14.7868, system: 'imperial' },
  'fl oz': { type: 'volume', toBase: 29.5735, system: 'imperial' },
  cup: { type: 'volume', toBase: 236.588, system: 'imperial' },
  pint: { type: 'volume', toBase: 473.176, system: 'imperial' },
  quart: { type: 'volume', toBase: 946.353, system: 'imperial' },
  gallon: { type: 'volume', toBase: 3785.41, system: 'imperial' },

  // Volume (Metric)
  ml: { type: 'volume', toBase: 1, system: 'metric' },
  l: { type: 'volume', toBase: 1000, system: 'metric' },

  // Mass (Imperial)
  oz: { type: 'mass', toBase: 28.3495, system: 'imperial' },
  lb: { type: 'mass', toBase: 453.592, system: 'imperial' },

  // Mass (Metric)
  g: { type: 'mass', toBase: 1, system: 'metric' },
  kg: { type: 'mass', toBase: 1000, system: 'metric' },

  // Each (Non-convertible)
  each: { type: 'each', toBase: 1, system: 'imperial' },
  '': { type: 'each', toBase: 1, system: 'imperial' }, // Handle blank unit
};

// --- NEW: Flat Unit Arrays ---

/**
 * A flat list of all units for the converter tool.
 */
export const allUnitsFlat = [
  // Imperial Volume
  'cup', 'tbsp', 'tsp', 'fl oz', 'pint', 'quart', 'gallon',
  // Metric Volume
  'ml', 'l',
  // Imperial Mass
  'lb', 'oz',
  // Metric Mass
  'g', 'kg',
  // Other
  'each',
];

/**
 * A flat list favoring Imperial units, for submission forms.
 */
export const imperialUnits = [
  'each',
  // Imperial Volume
  'cup', 'tbsp', 'tsp', 'fl oz', 'pint', 'quart', 'gallon',
  // Imperial Mass
  'lb', 'oz',
  // Metric (for convenience)
  // 'g', 'kg', 'ml', 'l',
];

/**
 * A flat list favoring Metric units, for submission forms.
 */
export const metricUnits = [
  'each',
  // Metric Mass
  'g', 'kg',
  // Metric Volume
  'ml', 'l',
  // Imperial (for convenience)
  // 'cup', 'tbsp', 'tsp', 'fl oz', 'lb', 'oz',
];
// ---

// --- 2. Density Database (g/ml) ---
// This is the "secret sauce" for volume <-> mass conversion.
// We use 'g/ml' as the standard. (1 cup = 236.588 ml)
// (e.g., 1 cup flour = 120g. 120 / 236.588 = 0.507 g/ml)
const densityDB = {
  'default': 1, // Default to water
  'water': 1,
  'milk': 1.03,
  'oil': 0.92,
  'butter': 0.91,
  'flour': 0.51, // All-purpose
  'all-purpose flour': 0.51,
  'bread flour': 0.49,
  'cake flour': 0.42,
  'sugar': 0.85, // Granulated
  'granulated sugar': 0.85,
  'brown sugar': 0.76, // Packed
  'powdered sugar': 0.53,
  'salt': 1.2, // Table salt
  'baking soda': 0.68,
  'baking powder': 0.68,
  'cocoa powder': 0.42,
  'cornstarch': 0.53,
  'honey': 1.42,
  'molasses': 1.42,
  'maple syrup': 1.32,
  'rolled oats': 0.35,
};

/**
 * Finds the closest matching density key for an ingredient.
 * e.g., "1 cup of all-purpose flour" -> 'all-purpose flour'
 */
function findIngredientKey(name) {
  if (!name) return 'default';
  const lowerName = name.toLowerCase();

  // Try for an exact match first
  if (densityDB[lowerName]) {
    return lowerName;
  }

  // Try for a partial match
  for (const key in densityDB) {
    if (lowerName.includes(key)) {
      return key;
    }
  }

  // Fallback
  return 'default';
}

/**
 * Gets the density (g/ml) for a given ingredient name.
 */
function getDensity(name) {
  const key = findIngredientKey(name);
  return densityDB[key];
}

// --- 3. Parsing & Formatting Helpers ---

/**
 * Parses a string quantity (e.g., "1 1/2") into a number (1.5).
 * @param {string} quantityStr
 * @returns {number}
 */
export function parseQuantity(quantityStr) {
  if (!quantityStr) return 0;

  const str = String(quantityStr).trim();
  let total = 0;

  // Handle ranges "1-2" by parsing the first number
  const rangeParts = str.split('-');
  const parts = rangeParts[0].split(' ');

  for (const part of parts) {
    if (part.includes('/')) {
      const [num, den] = part.split('/').map(parseFloat);
      if (den) {
        total += num / den;
      }
    } else {
      const num = parseFloat(part);
      if (!isNaN(num)) {
        total += num;
      }
    }
  }
  return total;
}

/**
 * Formats a number into a pretty fraction string.
 * e.g., 1.5 -> "1 1/2", 0.33 -> "1/3"
 * @param {number} num
 * @returns {string}
 */
export function formatQuantity(num) {
  if (num === 0) return '0';

  const tolerance = 1.0E-6;
  const whole = Math.floor(num);
  const frac = num - whole;

  let fracStr = '';

  // Common fractions
  if (frac < tolerance) {
    fracStr = '';
  } else if (Math.abs(frac - 0.125) < tolerance) {
    fracStr = ' 1/8';
  } else if (Math.abs(frac - 0.25) < tolerance) {
    fracStr = ' 1/4';
  } else if (Math.abs(frac - 0.333333) < tolerance) {
    fracStr = ' 1/3';
  } else if (Math.abs(frac - 0.5) < tolerance) {
    fracStr = ' 1/2';
  } else if (Math.abs(frac - 0.666666) < tolerance) {
    fracStr = ' 2/3';
  } else if (Math.abs(frac - 0.75) < tolerance) {
    fracStr = ' 3/4';
  } else if (Math.abs(frac - 0.875) < tolerance) {
    fracStr = ' 7/8';
  } else {
    // Fallback to 1 decimal place
    return num.toFixed(1);
  }

  if (whole === 0) {
    return fracStr.trim();
  }

  return whole + fracStr;
}

/**
 * Formats a value in 'ml' into the best metric or imperial volume unit.
 * @param {number} ml
 * @param {'metric' | 'imperial'} targetSystem
 */
function formatVolume(ml, targetSystem) {
  if (targetSystem === 'metric') {
    if (ml >= 1000) {
      return { quantity: formatQuantity(ml / 1000), unit: 'l' };
    }
    return { quantity: String(Math.round(ml)), unit: 'ml' };
  } else {
    // Imperial
    if (ml >= 236.588) {
      return { quantity: formatQuantity(ml / 236.588), unit: 'cup' };
    }
    if (ml >= 14.7868) {
      return { quantity: formatQuantity(ml / 14.7868), unit: 'tbsp' };
    }
    return { quantity: formatQuantity(ml / 4.92892), unit: 'tsp' };
  }
}

/**
 * Formats a value in 'g' into the best metric or imperial mass unit.
 * @param {number} g
 * @param {'metric' | 'imperial'} targetSystem
 */
function formatMass(g, targetSystem) {
  if (targetSystem === 'metric') {
    if (g >= 1000) {
      return { quantity: formatQuantity(g / 1000), unit: 'kg' };
    }
    return { quantity: String(Math.round(g)), unit: 'g' };
  } else {
    // Imperial
    if (g >= 453.592) {
      return { quantity: formatQuantity(g / 453.592), unit: 'lb' };
    }
    return { quantity: formatQuantity(g / 28.3495), unit: 'oz' };
  }
}

// --- 4. Main Conversion Functions ---

/**
 * [NEW] Core conversion logic.
 * Takes a value and converts it to the target system.
 * @param {number} fromValue - The numeric quantity (e.g., 1.5)
 * @param {string} fromUnit - The starting unit (e.g., "cup")
 * @param {'metric' | 'imperial'} targetSystem
 * @param {string} [ingredientName] - Optional, for mass/volume conversion
 * @returns {object} - { value, unit }
 */
export function convert(fromValue, fromUnit, targetSystem, ingredientName = 'default') {
  const fromDef = units[fromUnit.toLowerCase()];

  // If we don't know the unit, or it's 'each', we can't convert.
  if (!fromDef || fromDef.type === 'each') {
    return { value: fromValue, unit: fromUnit };
  }

  // If it's already in the target system, just return it.
  if (fromDef.system === targetSystem) {
    return { value: fromValue, unit: fromUnit };
  }

  // --- Start Conversion ---
  const fromType = fromDef.type;
  const baseValue = fromValue * fromDef.toBase; // Base value in ml or g
  const density = getDensity(ingredientName);

  if (targetSystem === 'metric') {
    if (fromType === 'volume') {
      // Imperial Volume -> Metric
      if (density !== 1) { // Check if we have a specific density
        // Can convert to mass!
        const valueInGrams = baseValue * density;
        return formatMass(valueInGrams, 'metric');
      } else {
        // No density, convert to metric volume
        return formatVolume(baseValue, 'metric');
      }
    } else {
      // Imperial Mass -> Metric Mass (e.g., "1 oz" -> "28 g")
      return formatMass(baseValue, 'metric');
    }
  } else {
    // Target is Imperial
    if (fromType === 'mass') {
      // Metric Mass -> Imperial
      if (density !== 1) { // Check if we have a specific density
        // Can convert to volume!
        const valueInMl = baseValue / density;
        return formatVolume(valueInMl, 'imperial');
      } else {
        // No density, convert to imperial mass
        return formatMass(baseValue, 'imperial');
      }
    } else {
      // Metric Volume -> Imperial Volume (e.g., "100 ml" -> "0.42 cups")
      return formatVolume(baseValue, 'imperial');
    }
  }
}


/**
 * Takes a structured ingredient and converts it to the target system
 * for display on the recipe page.
 * @param {object} ingredient - { quantity_str, unit, name }
 * @param {'metric' | 'imperial'} targetSystem
 * @returns {object} - { quantity, unit }
 */
export function getConvertedIngredientDisplay(ingredient, targetSystem) {
  const { quantity_str, unit, name } = ingredient;

  // If no quantity or unit, just return it as-is.
  if (!quantity_str || !unit) {
    return { quantity: quantity_str, unit: unit };
  }

  const fromDef = units[unit.toLowerCase()];

  // If we can't convert, just format the original
  if (!fromDef || fromDef.type === 'each') {
    return { quantity: quantity_str, unit: unit };
  }

  const fromValue = parseQuantity(quantity_str);

  // If the unit is already in the target system, just re-format it prettily.
  if (fromDef.system === targetSystem) {
    return { quantity: formatQuantity(fromValue), unit: unit };
  }

  // Otherwise, run the conversion
  return convert(fromValue, unit, targetSystem, name);
}
