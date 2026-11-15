export interface MissionEdge {
  readonly prerequisiteId: string;
  readonly dependentId: string;
}

export interface MissionPlan {
  readonly taskIds: readonly string[];
  readonly edges: readonly MissionEdge[];
}

type Readiness = 'Assumed complete' | 'Ready in this plan' | 'Blocked in this plan';

interface TaskEvaluation {
  readonly id: string;
  readonly status: Readiness;
  readonly unmet: readonly string[];
}

interface PlanEvaluation {
  readonly error?: string;
  readonly tasks: readonly TaskEvaluation[];
}

export function validatePlan(plan: MissionPlan, catalog: readonly string[]): string | undefined {
  const known = new Set(catalog);
  const selected = new Set(plan.taskIds);
  if (plan.taskIds.some((id) => !known.has(id))) return 'Unknown task in this plan.';
  if (selected.size !== plan.taskIds.length) return 'Each task can appear only once.';

  const dependents = new Map(plan.taskIds.map((id) => [id, new Set<string>()]));
  const prerequisiteCounts = new Map(plan.taskIds.map((id) => [id, 0]));
  for (const { prerequisiteId, dependentId } of plan.edges) {
    if (!known.has(prerequisiteId) || !known.has(dependentId)) return 'Unknown dependency endpoint.';
    if (!selected.has(prerequisiteId) || !selected.has(dependentId)) return 'Select both tasks before adding a dependency.';
    if (prerequisiteId === dependentId) return 'A task cannot require itself.';
    const linked = dependents.get(prerequisiteId)!;
    if (linked.has(dependentId)) return 'This dependency already exists.';
    linked.add(dependentId);
    prerequisiteCounts.set(dependentId, prerequisiteCounts.get(dependentId)! + 1);
  }

  const ready = plan.taskIds.filter((id) => prerequisiteCounts.get(id) === 0);
  for (let cursor = 0; cursor < ready.length; cursor++) {
    for (const id of dependents.get(ready[cursor])!) {
      const remaining = prerequisiteCounts.get(id)! - 1;
      prerequisiteCounts.set(id, remaining);
      if (remaining === 0) ready.push(id);
    }
  }
  if (ready.length !== selected.size) return 'These prerequisites create a dependency cycle.';
}

export function evaluatePlan(plan: MissionPlan, assumptions: readonly string[], catalog: readonly string[]): PlanEvaluation {
  const invalid = validatePlan(plan, catalog);
  if (invalid) return { error: invalid, tasks: [] };
  const selected = new Set(plan.taskIds);
  const complete = new Set(assumptions);
  if (assumptions.some((id) => !selected.has(id))) {
    return { error: 'Completion assumptions must refer to selected tasks.', tasks: [] };
  }

  const tasks: TaskEvaluation[] = [];
  for (const id of catalog) {
    if (!selected.has(id)) continue;
    const prerequisites = new Set(plan.edges.filter((edge) => edge.dependentId === id).map((edge) => edge.prerequisiteId));
    const unmet = catalog.filter((prerequisiteId) => prerequisites.has(prerequisiteId) && !complete.has(prerequisiteId));
    if (complete.has(id) && unmet.length) {
      return { error: `Cannot assume ${id} complete while its prerequisites are unmet: ${unmet.join(', ')}.`, tasks: [] };
    }
    tasks.push({
      id,
      status: complete.has(id) ? 'Assumed complete' : unmet.length ? 'Blocked in this plan' : 'Ready in this plan',
      unmet,
    });
  }
  return { tasks };
}

export function comparePlans(reference: MissionPlan, draft: MissionPlan, assumptions: readonly string[], catalog: readonly string[]) {
  const referenceResult = evaluatePlan(reference, assumptions.filter((id) => reference.taskIds.includes(id)), catalog);
  const draftResult = evaluatePlan(draft, assumptions.filter((id) => draft.taskIds.includes(id)), catalog);
  const equal = !referenceResult.error && !draftResult.error
    && reference.taskIds.length === draft.taskIds.length
    && reference.taskIds.every((id) => draft.taskIds.includes(id))
    && reference.edges.length === draft.edges.length
    && reference.edges.every(({ prerequisiteId, dependentId }) =>
      draft.edges.some((edge) => edge.prerequisiteId === prerequisiteId && edge.dependentId === dependentId));
  return { reference: referenceResult, draft: draftResult, equal };
}
