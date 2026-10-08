export const PHYSICAL_MEASUREMENT_LIMITS = {
  heightCm: {
    min: 80,
    max: 250,
  },
  weightKg: {
    min: 20,
    max: 300,
  },
  bodyFatPercent: {
    min: 1,
    max: 70,
  },
  muscleMassKg: {
    min: 5,
    max: 200,
  },
} as const;

type PhysicalMeasurementValues = {
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
};

type PhysicalMeasurementValidationResult =
  | {
      ok: true;
      values: PhysicalMeasurementValues;
    }
  | {
      ok: false;
      error: string;
    };

function parseOptionalNumber(
  value: unknown
): number | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function isOutsideRange(
  value: number | null,
  min: number,
  max: number
) {
  return (
    value !== null &&
    (value < min || value > max)
  );
}

export function validatePhysicalMeasurementInput(
  input: {
    heightCm: unknown;
    weightKg: unknown;
    bodyFatPercent: unknown;
    muscleMassKg: unknown;
  }
): PhysicalMeasurementValidationResult {
  const heightCm =
    parseOptionalNumber(
      input.heightCm
    );

  const weightKg =
    parseOptionalNumber(
      input.weightKg
    );

  const bodyFatPercent =
    parseOptionalNumber(
      input.bodyFatPercent
    );

  const muscleMassKg =
    parseOptionalNumber(
      input.muscleMassKg
    );

  if (
    heightCm === undefined ||
    weightKg === undefined ||
    bodyFatPercent === undefined ||
    muscleMassKg === undefined
  ) {
    return {
      ok: false,
      error:
        "Një ose më shumë matje nuk janë të vlefshme.",
    };
  }

  if (
    isOutsideRange(
      heightCm,
      PHYSICAL_MEASUREMENT_LIMITS.heightCm.min,
      PHYSICAL_MEASUREMENT_LIMITS.heightCm.max
    )
  ) {
    return {
      ok: false,
      error:
        "Gjatësia duhet të jetë mes 80 dhe 250 cm.",
    };
  }

  if (
    isOutsideRange(
      weightKg,
      PHYSICAL_MEASUREMENT_LIMITS.weightKg.min,
      PHYSICAL_MEASUREMENT_LIMITS.weightKg.max
    )
  ) {
    return {
      ok: false,
      error:
        "Pesha duhet të jetë mes 20 dhe 300 kg.",
    };
  }

  if (
    isOutsideRange(
      bodyFatPercent,
      PHYSICAL_MEASUREMENT_LIMITS.bodyFatPercent.min,
      PHYSICAL_MEASUREMENT_LIMITS.bodyFatPercent.max
    )
  ) {
    return {
      ok: false,
      error:
        "Yndyra trupore duhet të jetë mes 1 dhe 70%.",
    };
  }

  if (
    isOutsideRange(
      muscleMassKg,
      PHYSICAL_MEASUREMENT_LIMITS.muscleMassKg.min,
      PHYSICAL_MEASUREMENT_LIMITS.muscleMassKg.max
    )
  ) {
    return {
      ok: false,
      error:
        "Masa muskulore duhet të jetë mes 5 dhe 200 kg.",
    };
  }

  if (
    weightKg !== null &&
    muscleMassKg !== null &&
    muscleMassKg > weightKg
  ) {
    return {
      ok: false,
      error:
        "Masa muskulore nuk mund të jetë më e madhe se pesha trupore.",
    };
  }

  if (
    heightCm === null &&
    weightKg === null &&
    bodyFatPercent === null &&
    muscleMassKg === null
  ) {
    return {
      ok: false,
      error:
        "Vendos të paktën një matje fizike.",
    };
  }

  return {
    ok: true,
    values: {
      heightCm,
      weightKg,
      bodyFatPercent,
      muscleMassKg,
    },
  };
}