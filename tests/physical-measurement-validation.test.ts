import assert from "node:assert/strict";
import test from "node:test";

import {
  validatePhysicalMeasurementInput,
} from "../lib/physical-measurement-validation";

test("physical measurement validation accepts realistic values", () => {
  const result =
    validatePhysicalMeasurementInput({
      heightCm: 170,
      weightKg: 80,
      bodyFatPercent: 18,
      muscleMassKg: 42,
    });

  assert.equal(
    result.ok,
    true
  );
});

test("physical measurement validation rejects muscle mass above body weight", () => {
  const result =
    validatePhysicalMeasurementInput({
      heightCm: 170,
      weightKg: 80,
      bodyFatPercent: 18,
      muscleMassKg: 98,
    });

  assert.equal(
    result.ok,
    false
  );

  if (!result.ok) {
    assert.match(
      result.error,
      /nuk mund të jetë më e madhe se pesha trupore/
    );
  }
});

test("physical measurement validation rejects unrealistic body fat", () => {
  const result =
    validatePhysicalMeasurementInput({
      heightCm: 170,
      weightKg: 80,
      bodyFatPercent: 88,
      muscleMassKg: 42,
    });

  assert.equal(
    result.ok,
    false
  );
});

test("physical measurement validation requires at least one metric", () => {
  const result =
    validatePhysicalMeasurementInput({
      heightCm: "",
      weightKg: "",
      bodyFatPercent: "",
      muscleMassKg: "",
    });

  assert.equal(
    result.ok,
    false
  );
});

test("physical measurement validation rejects values outside production sanity limits", () => {
  const invalidCases = [
    {
      heightCm: 79,
      weightKg: 80,
      bodyFatPercent: 18,
      muscleMassKg: 42,
    },
    {
      heightCm: 170,
      weightKg: 301,
      bodyFatPercent: 18,
      muscleMassKg: 42,
    },
    {
      heightCm: 170,
      weightKg: 80,
      bodyFatPercent: 71,
      muscleMassKg: 42,
    },
    {
      heightCm: 170,
      weightKg: 80,
      bodyFatPercent: 18,
      muscleMassKg: 201,
    },
  ];

  for (
    const input of invalidCases
  ) {
    const result =
      validatePhysicalMeasurementInput(
        input
      );

    assert.equal(
      result.ok,
      false
    );
  }
});