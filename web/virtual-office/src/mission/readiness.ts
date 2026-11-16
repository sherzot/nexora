import { compareMissionVariants, diagnoseMission } from './diagnostics';
import type { MissionEdge } from './plan';
import { validateMissionPreviewInput } from './preview';
import type { ConfigurationIssue, MissionPreviewState, PreviewEvent } from './preview';

export type { ConfigurationIssue } from './preview';
export type MissionInput = MissionPreviewState['input'];

export type InitialReadiness = {
  ready: readonly string[];
  blocked: readonly { taskId: string; unmet: readonly string[] }[];
  assumedComplete: readonly string[];
};

export type ReadinessReport = {
  taskCount: number;
  selectedTaskIds: readonly string[];
  edges: readonly MissionEdge[];
  assignments: ReturnType<typeof validateMissionPreviewInput>['assignments'];
  issues: readonly ConfigurationIssue[];
} & (
  | { status: 'incomplete' | 'invalid'; initial: InitialReadiness | null }
  | { status: 'valid-for-hypothetical-preview'; initial: InitialReadiness }
);

export type AssumptionFinding =
  | { kind: 'assumed-complete'; taskId: string; source: 'captured-input' }
  | { kind: 'assumption-changed'; taskId: string; source: 'variant-inputs'; baseline: boolean; alternative: boolean };

type AssumptionChange = Extract<AssumptionFinding, { kind: 'assumption-changed' }>;
type ResolvedBlocker = { taskId: string; event: PreviewEvent };
type ValidReadiness = Extract<ReadinessReport, { status: 'valid-for-hypothetical-preview' }>;

export type WhatIfComparison = {
  baseline: ValidReadiness;
  alternative: ValidReadiness;
  outcome: ReturnType<typeof compareMissionVariants>;
  assumptionFindings: readonly AssumptionChange[];
  resolvedBlockers: { baseline: readonly ResolvedBlocker[]; alternative: readonly ResolvedBlocker[] };
  provenance: 'hypothetical';
};

export type DecisionSummary = {
  draft: ReadinessReport;
  comparison: WhatIfComparison | null;
  limitations: readonly string[];
};

const limitations = [
  'The preview uses synthetic fixture data and serial deterministic transitions.',
  'Agent eligibility describes fixture relationships. Actual availability and capacity are outside the model.',
  'Logical steps count hypothetical transitions. The model provides no elapsed time or real execution evidence.',
] as const;

function initialReadiness(tasks: ReturnType<typeof validateMissionPreviewInput>['evaluation']['tasks']): InitialReadiness {
  return {
    ready: tasks.filter((task) => task.status === 'Ready in this plan').map(({ id }) => id),
    blocked: tasks.filter((task) => task.status === 'Blocked in this plan').map(({ id, unmet }) => ({ taskId: id, unmet })),
    assumedComplete: tasks.filter((task) => task.status === 'Assumed complete').map(({ id }) => id),
  };
}

export function createReadinessReport(input: MissionInput): ReadinessReport {
  const { plan, assumptions, assignments } = input;
  const validation = validateMissionPreviewInput(plan, assumptions, assignments);
  const { issues, evaluation } = validation;
  const summary = {
    taskCount: plan.taskIds.length,
    selectedTaskIds: [...plan.taskIds],
    edges: plan.edges.map((edge) => ({ ...edge })),
    assignments: validation.assignments,
    issues,
  };
  if (issues.length === 0) {
    return { ...summary, initial: initialReadiness(evaluation.tasks), status: 'valid-for-hypothetical-preview' };
  }
  const invalid = issues.some(({ code }) => code !== 'empty-plan' && code !== 'missing-assignment');
  return {
    ...summary,
    initial: evaluation.error ? null : initialReadiness(evaluation.tasks),
    status: invalid ? 'invalid' : 'incomplete',
  };
}

function collectResolvedBlockers(state: MissionPreviewState): ResolvedBlocker[] {
  return diagnoseMission(state).tasks.flatMap(({ id, unblockedBy }) => unblockedBy ? [{ taskId: id, event: unblockedBy }] : []);
}

function assumptionChanges(baseline: ValidReadiness, alternative: ValidReadiness): AssumptionChange[] {
  const before = new Set(baseline.initial.assumedComplete);
  const after = new Set(alternative.initial.assumedComplete);
  return [...new Set([...before, ...after])].flatMap((taskId) => {
    const baseline = before.has(taskId);
    const alternative = after.has(taskId);
    if (baseline === alternative) return [];
    return [{ kind: 'assumption-changed', taskId, source: 'variant-inputs', baseline, alternative }];
  });
}

export function createDecisionSummary(input: MissionInput, variantA?: MissionInput, variantB?: MissionInput): DecisionSummary {
  const draft = createReadinessReport(input);
  if (!variantA || !variantB) return { draft, comparison: null, limitations };

  const baseline = createReadinessReport(variantA);
  const alternative = createReadinessReport(variantB);
  if (baseline.status !== 'valid-for-hypothetical-preview' || alternative.status !== 'valid-for-hypothetical-preview') {
    return { draft, comparison: null, limitations };
  }
  const outcome = compareMissionVariants(variantA, variantB);
  return {
    draft,
    comparison: {
      baseline,
      alternative,
      outcome,
      assumptionFindings: assumptionChanges(baseline, alternative),
      resolvedBlockers: {
        baseline: collectResolvedBlockers(outcome.left),
        alternative: collectResolvedBlockers(outcome.right),
      },
      provenance: 'hypothetical',
    },
    limitations,
  };
}
