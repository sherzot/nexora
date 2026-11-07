/** Frontend-owned presentation models. These are not Runtime DTOs or authority. */
export type DemoId = `demo-${string}`;
export type AgentStatus = 'Focused' | 'Available' | 'Reviewing' | 'Away';
export type TaskStatus = 'Planned' | 'In progress' | 'In review' | 'Done';
export interface DemoProvenance {
  readonly provenance: 'synthetic-demo';
  readonly fixtureRevision: 'c10-fixtures-01';
}
export interface DemoAgent extends DemoProvenance {
  readonly id: DemoId;
  readonly order: number;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly specialty: string;
  readonly roomId: DemoId;
  readonly status: AgentStatus;
  readonly tone: 'blue' | 'sage' | 'amber' | 'lavender';
  readonly desk: { readonly x: number; readonly y: number };
}
export interface DemoRoom extends DemoProvenance {
  readonly id: DemoId;
  readonly order: number;
  readonly name: string;
  readonly purpose: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly depth: number;
}
export interface DemoTask extends DemoProvenance {
  readonly id: DemoId;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly agentIds: readonly DemoId[];
  readonly workflowId: DemoId;
  readonly status: TaskStatus;
  readonly category: string;
}
export interface DemoWorkflowPresentation extends DemoProvenance {
  readonly id: DemoId;
  readonly order: number;
  readonly title: string;
  readonly stages: readonly string[];
  readonly taskIds: readonly DemoId[];
}
export interface DemoActivity extends DemoProvenance {
  readonly id: DemoId;
  readonly sequence: number;
  readonly timestamp: string;
  readonly agentId: DemoId;
  readonly taskId: DemoId;
  readonly title: string;
  readonly detail: string;
}
export interface DemoReviewDisplay extends DemoProvenance {
  readonly id: DemoId;
  readonly order: number;
  readonly taskId: DemoId;
  readonly displayOnly: true;
  readonly label: 'Example: review pending' | 'Example: review complete';
}
