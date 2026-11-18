import { captureMissionVariant, compareReplayedVariants, replayVariant } from './diagnostics';
import { createReadinessReport } from './readiness';
import type { ConfigurationIssue, MissionInput, ReadinessReport } from './readiness';
import type { MissionPreviewState } from './preview';

export const scenarioSlots = ['A', 'B', 'C'] as const;
export type ScenarioSlot = typeof scenarioSlots[number];
export type ScenarioRef = Readonly<{ slot: ScenarioSlot; revision: number }>;
export type CapturedScenario = Readonly<{ ref: ScenarioRef; input: MissionInput }>;
export type ScenarioCollection = Readonly<{
  slots: Readonly<Partial<Record<ScenarioSlot, CapturedScenario>>>;
  lastRevision: number;
}>;

export const emptyScenarioCollection: ScenarioCollection = Object.freeze({
  slots: Object.freeze({}),
  lastRevision: 0,
});

type ValidReadiness = Extract<ReadinessReport, { status: 'valid-for-hypothetical-preview' }>;
export type ScenarioEvaluation =
  | { kind: 'invalid'; ref: ScenarioRef; readiness: ReadinessReport }
  | { kind: 'valid'; ref: ScenarioRef; readiness: ValidReadiness; terminal: MissionPreviewState };

export const planningCriteria = ['fewer-initial-blockers', 'fewer-prerequisite-edges'] as const;
export type PlanningCriterion = typeof planningCriteria[number];

export const scenarioLimitations = Object.freeze([
  'Recommendations describe structural preferences under the selected criteria.',
  'Hypothetical transitions measure logical steps. The model provides no duration, cost, staffing capacity, productivity, reliability or security estimates.',
  'A local planning preference grants no operational permission and records no Human Approval.',
]);

export type DecisionEvidence = Readonly<{
  compared: readonly [ScenarioRef, ScenarioRef];
  criteria: readonly PlanningCriterion[];
  observations: readonly { criterion: PlanningCriterion; left: number; right: number }[];
  outcome?: ReturnType<typeof compareReplayedVariants>;
  limitations: readonly string[];
  provenance: 'hypothetical';
}>;

export type Recommendation =
  | { kind: 'favored'; scenario: ScenarioRef; evidence: DecisionEvidence }
  | { kind: 'tie' | 'trade-off'; evidence: DecisionEvidence }
  | {
      kind: 'withheld';
      reason: 'invalid' | 'different-membership' | 'different-assumptions' | 'all-assumed-mismatch' | 'insufficient-evidence';
      evidence: DecisionEvidence;
    };

export type DecisionRecord = Readonly<{
  preferred: CapturedScenario;
  compared: readonly ScenarioRef[];
  criteria: readonly PlanningCriterion[];
  evidence: readonly Recommendation[];
  rationale: string;
  limitations: readonly string[];
  provenance: 'hypothetical';
}>;

export type DecisionInvalidation = 'criteria-changed' | 'scenario-added' | 'scenario-replaced' | 'scenario-removed' | 'mission-reset';

type CaptureResult =
  | { ok: true; collection: ScenarioCollection }
  | { ok: false; reason: 'invalid-input' | 'invalid-revision' | 'invalid-slot'; issues: readonly ConfigurationIssue[] };

export function captureScenario(collection: ScenarioCollection, slot: ScenarioSlot, revision: number, input: MissionInput): CaptureResult {
  if (!scenarioSlots.includes(slot)) return { ok: false, reason: 'invalid-slot', issues: [] };
  if (!Number.isSafeInteger(revision) || revision <= collection.lastRevision) {
    return { ok: false, reason: 'invalid-revision', issues: [] };
  }
  const readiness = createReadinessReport(input);
  if (readiness.status !== 'valid-for-hypothetical-preview') {
    return { ok: false, reason: 'invalid-input', issues: readiness.issues };
  }
  const captured = captureMissionVariant(input.plan, input.assumptions, input.assignments);
  captured.plan.edges.forEach(Object.freeze);
  Object.freeze(captured.plan.edges);
  Object.freeze(captured.plan.taskIds);
  Object.freeze(captured.plan);
  Object.freeze(captured.assumptions);
  Object.freeze(captured.assignments);
  const scenario = Object.freeze({ ref: Object.freeze({ slot, revision }), input: Object.freeze(captured) });
  return {
    ok: true,
    collection: Object.freeze({
      slots: Object.freeze({ ...collection.slots, [slot]: scenario }),
      lastRevision: revision,
    }),
  };
}

export function removeScenario(collection: ScenarioCollection, slot: ScenarioSlot): ScenarioCollection {
  if (!scenarioSlots.includes(slot) || !collection.slots[slot]) return collection;
  const slots = { ...collection.slots };
  delete slots[slot];
  return Object.freeze({ ...collection, slots: Object.freeze(slots) });
}

export function evaluateScenario(scenario: CapturedScenario): ScenarioEvaluation {
  const readiness = createReadinessReport(scenario.input);
  if (readiness.status !== 'valid-for-hypothetical-preview') return { kind: 'invalid', ref: scenario.ref, readiness };
  return { kind: 'valid', ref: scenario.ref, readiness, terminal: replayVariant(scenario.input) };
}

function normalizeCriteria(criteria: readonly PlanningCriterion[]) {
  return planningCriteria.filter((criterion) => criteria.includes(criterion));
}

function sameRef(a: ScenarioRef, b: ScenarioRef): boolean {
  return a.slot === b.slot && a.revision === b.revision;
}

export function compareScenarios(left: ScenarioEvaluation, right: ScenarioEvaluation, selected: readonly PlanningCriterion[]): Recommendation {
  const criteria = normalizeCriteria(selected);
  const base: DecisionEvidence = {
    compared: [left.ref, right.ref],
    criteria,
    observations: [],
    limitations: scenarioLimitations,
    provenance: 'hypothetical',
  };
  if (left.kind === 'invalid' || right.kind === 'invalid') return { kind: 'withheld', reason: 'invalid', evidence: base };
  const outcome = compareReplayedVariants(left.terminal, right.terminal);
  const counts = (criterion: PlanningCriterion, state: ValidReadiness) =>
    criterion === 'fewer-initial-blockers' ? state.initial.blocked.length : state.edges.length;
  const evidence: DecisionEvidence = {
    ...base,
    outcome,
    observations: criteria.map((criterion) => ({
      criterion, left: counts(criterion, left.readiness), right: counts(criterion, right.readiness),
    })),
  };
  if (outcome.membershipChanged) return { kind: 'withheld', reason: 'different-membership', evidence };
  if ((left.terminal.events.length === 0) !== (right.terminal.events.length === 0)) {
    return { kind: 'withheld', reason: 'all-assumed-mismatch', evidence };
  }
  if (outcome.assumptionsChanged) return { kind: 'withheld', reason: 'different-assumptions', evidence };
  if (!criteria.length || left.ref.slot === right.ref.slot) return { kind: 'withheld', reason: 'insufficient-evidence', evidence };
  const favorsLeft = evidence.observations.some(({ left, right }) => left < right);
  const favorsRight = evidence.observations.some(({ left, right }) => right < left);
  if (favorsLeft && favorsRight) return { kind: 'trade-off', evidence };
  if (!favorsLeft && !favorsRight) return { kind: 'tie', evidence };
  return { kind: 'favored', scenario: favorsLeft ? left.ref : right.ref, evidence };
}

function occupied(collection: ScenarioCollection): CapturedScenario[] {
  return scenarioSlots.flatMap((slot) => {
    const scenario = collection.slots[slot];
    return scenario ? [scenario] : [];
  });
}

function sameCriteria(a: readonly PlanningCriterion[], b: readonly PlanningCriterion[]): boolean {
  const left = normalizeCriteria(a);
  const right = normalizeCriteria(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function coversPair(evidence: DecisionEvidence, a: ScenarioRef, b: ScenarioRef): boolean {
  const [left, right] = evidence.compared;
  return (sameRef(left, a) && sameRef(right, b)) || (sameRef(left, b) && sameRef(right, a));
}

export function recommendCollection(pairs: readonly Recommendation[], collection: ScenarioCollection, criteria: readonly PlanningCriterion[]): ScenarioRef | null {
  const scenarios = occupied(collection);
  if (scenarios.length < 2 || !normalizeCriteria(criteria).length) return null;
  return scenarios.find(({ ref }) => scenarios.every(({ ref: other }) => sameRef(ref, other)
    || pairs.some((pair) => pair.kind === 'favored' && sameRef(pair.scenario, ref)
      && sameCriteria(pair.evidence.criteria, criteria) && coversPair(pair.evidence, ref, other))))?.ref ?? null;
}

type PreferenceResult =
  | { ok: true; record: DecisionRecord }
  | { ok: false; reason: 'stale-evidence' | 'insufficient-evidence' };

export function recordPreference(
  collection: ScenarioCollection,
  selected: ScenarioRef,
  selectedCriteria: readonly PlanningCriterion[],
  evidence: readonly Recommendation[],
  rationale = '',
): PreferenceResult {
  const preferred = collection.slots[selected.slot];
  if (!preferred || !sameRef(preferred.ref, selected)) return { ok: false, reason: 'stale-evidence' };
  const criteria = normalizeCriteria(selectedCriteria);
  const scenarios = occupied(collection);
  if (scenarios.length < 2 || !criteria.length) return { ok: false, reason: 'insufficient-evidence' };
  const compared = scenarios.map(({ ref }) => ref);
  const expected = compared.length * (compared.length - 1) / 2;
  const referencesMatch = evidence.length === expected && compared.every((a, index) =>
    compared.slice(index + 1).every((b) => evidence.some((pair) =>
      sameCriteria(pair.evidence.criteria, criteria) && coversPair(pair.evidence, a, b))));
  if (!referencesMatch) return { ok: false, reason: 'stale-evidence' };

  return {
    ok: true,
    record: {
      preferred,
      compared,
      criteria,
      evidence: [...evidence],
      rationale: rationale.trim(),
      limitations: scenarioLimitations,
      provenance: 'hypothetical',
    },
  };
}

export function decisionInvalidation(
  record: DecisionRecord,
  collection: ScenarioCollection,
  criteria: readonly PlanningCriterion[],
): DecisionInvalidation | null {
  if (!sameCriteria(record.criteria, criteria)) return 'criteria-changed';
  for (const ref of record.compared) {
    const current = collection.slots[ref.slot];
    if (!current) return 'scenario-removed';
    if (!sameRef(ref, current.ref)) return 'scenario-replaced';
  }
  if (occupied(collection).length > record.compared.length) return 'scenario-added';
  return null;
}
