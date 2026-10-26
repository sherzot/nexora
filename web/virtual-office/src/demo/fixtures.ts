import type { DemoActivity, DemoAgent, DemoReviewDisplay, DemoRoom, DemoTask, DemoWorkflowPresentation } from './model';

export const fixtureRevision = 'c10-fixtures-01' as const;
export const provenance = 'synthetic-demo' as const;
const meta = { fixtureRevision, provenance } as const;
export const rooms: readonly DemoRoom[] = [
  { ...meta, id: 'demo-room-studio', order: 1, name: 'Product studio', purpose: 'Ideas into clear interfaces', x: 0.3, y: 0.3, width: 4.3, depth: 3.1 },
  { ...meta, id: 'demo-room-engineering', order: 2, name: 'Engineering', purpose: 'Small, thoughtful building blocks', x: 5, y: 0.3, width: 4.7, depth: 3.1 },
  { ...meta, id: 'demo-room-quality', order: 3, name: 'Quality lab', purpose: 'Make the details dependable', x: 0.3, y: 3.9, width: 4.3, depth: 2.8 },
  { ...meta, id: 'demo-room-library', order: 4, name: 'Research corner', purpose: 'A quiet place for context', x: 5, y: 3.9, width: 4.7, depth: 2.8 },
];
export const agents: readonly DemoAgent[] = [
  { ...meta, id: 'demo-agent-ada', order: 1, name: 'Ada', initials: 'AD', role: 'Product designer', specialty: 'Interface systems & accessibility', roomId: 'demo-room-studio', status: 'Focused', tone: 'blue', desk: { x: 1.1, y: 1.1 } },
  { ...meta, id: 'demo-agent-noah', order: 2, name: 'Noah', initials: 'NO', role: 'Product architect', specialty: 'Boundaries & clear decisions', roomId: 'demo-room-studio', status: 'Reviewing', tone: 'lavender', desk: { x: 3.1, y: 1.1 } },
  { ...meta, id: 'demo-agent-mira', order: 3, name: 'Mira', initials: 'MI', role: 'Backend engineer', specialty: 'Go & domain contracts', roomId: 'demo-room-engineering', status: 'Focused', tone: 'sage', desk: { x: 5.8, y: 1.1 } },
  { ...meta, id: 'demo-agent-leo', order: 4, name: 'Leo', initials: 'LE', role: 'Frontend engineer', specialty: 'Local, readable experiences', roomId: 'demo-room-engineering', status: 'Available', tone: 'blue', desk: { x: 8, y: 1.1 } },
  { ...meta, id: 'demo-agent-iris', order: 5, name: 'Iris', initials: 'IR', role: 'Quality engineer', specialty: 'Deterministic boundary checks', roomId: 'demo-room-quality', status: 'Reviewing', tone: 'amber', desk: { x: 1.1, y: 4.6 } },
  { ...meta, id: 'demo-agent-owen', order: 6, name: 'Owen', initials: 'OW', role: 'Platform engineer', specialty: 'Development environments', roomId: 'demo-room-quality', status: 'Available', tone: 'sage', desk: { x: 3.1, y: 4.6 } },
  { ...meta, id: 'demo-agent-sora', order: 7, name: 'Sora', initials: 'SO', role: 'Research specialist', specialty: 'Evidence & source context', roomId: 'demo-room-library', status: 'Focused', tone: 'lavender', desk: { x: 5.8, y: 4.6 } },
  { ...meta, id: 'demo-agent-theo', order: 8, name: 'Theo', initials: 'TH', role: 'Technical writer', specialty: 'Precise, useful documentation', roomId: 'demo-room-library', status: 'Away', tone: 'amber', desk: { x: 8, y: 4.6 } },
];
export const workflows: readonly DemoWorkflowPresentation[] = [
  { ...meta, id: 'demo-workflow-office', order: 1, title: 'Virtual Office concept', stages: ['Outline', 'Design', 'Review', 'Present'], taskIds: ['demo-task-layout', 'demo-task-map', 'demo-task-keyboard', 'demo-task-notes'] },
  { ...meta, id: 'demo-workflow-foundation', order: 2, title: 'Development foundations', stages: ['Explore', 'Describe', 'Check'], taskIds: ['demo-task-contract', 'demo-task-environment', 'demo-task-evidence', 'demo-task-language'] },
];
export const tasks: readonly DemoTask[] = [
  { ...meta, id: 'demo-task-layout', order: 1, title: 'Shape the workspace layout', description: 'A synthetic layout exercise with a quiet visual hierarchy.', agentIds: ['demo-agent-ada', 'demo-agent-leo'], workflowId: 'demo-workflow-office', status: 'In progress', category: 'Design' },
  { ...meta, id: 'demo-task-map', order: 2, title: 'Map rooms to team context', description: 'Describe the display-only relationship between rooms and people.', agentIds: ['demo-agent-noah'], workflowId: 'demo-workflow-office', status: 'In review', category: 'Architecture' },
  { ...meta, id: 'demo-task-keyboard', order: 3, title: 'Trace keyboard navigation', description: 'A fictional checklist for moving through the office without a pointer.', agentIds: ['demo-agent-iris', 'demo-agent-leo'], workflowId: 'demo-workflow-office', status: 'Planned', category: 'Quality' },
  { ...meta, id: 'demo-task-notes', order: 4, title: 'Write the demo field notes', description: 'Explain what the visual demonstration does and does not establish.', agentIds: ['demo-agent-theo'], workflowId: 'demo-workflow-office', status: 'Planned', category: 'Documentation' },
  { ...meta, id: 'demo-task-contract', order: 5, title: 'Illustrate a contract boundary', description: 'A presentation exercise, not a source-owner contract or API.', agentIds: ['demo-agent-mira', 'demo-agent-noah'], workflowId: 'demo-workflow-foundation', status: 'In progress', category: 'Engineering' },
  { ...meta, id: 'demo-task-environment', order: 6, title: 'Outline a local workspace', description: 'Describe a fictional development setup without operating services.', agentIds: ['demo-agent-owen'], workflowId: 'demo-workflow-foundation', status: 'Done', category: 'Platform' },
  { ...meta, id: 'demo-task-evidence', order: 7, title: 'Organize example references', description: 'Group synthetic evidence labels. No sources are queried.', agentIds: ['demo-agent-sora'], workflowId: 'demo-workflow-foundation', status: 'In review', category: 'Research' },
  { ...meta, id: 'demo-task-language', order: 8, title: 'Refine status vocabulary', description: 'Keep presentation labels distinct from actual Runtime states.', agentIds: ['demo-agent-theo', 'demo-agent-ada'], workflowId: 'demo-workflow-foundation', status: 'Done', category: 'Content' },
];
export const activities: readonly DemoActivity[] = [
  { ...meta, id: 'demo-event-01', sequence: 1, timestamp: '2026-10-25T09:00:00Z', agentId: 'demo-agent-ada', taskId: 'demo-task-layout', title: 'Workspace study added', detail: 'Example note: explore a more open central workspace.' },
  { ...meta, id: 'demo-event-02', sequence: 2, timestamp: '2026-10-25T09:15:00Z', agentId: 'demo-agent-owen', taskId: 'demo-task-environment', title: 'Environment outline marked done', detail: 'Synthetic presentation change; no environment was created.' },
  { ...meta, id: 'demo-event-03', sequence: 3, timestamp: '2026-10-25T09:30:00Z', agentId: 'demo-agent-noah', taskId: 'demo-task-map', title: 'Room map ready for example review', detail: 'This event does not request or record an authoritative approval.' },
  { ...meta, id: 'demo-event-04', sequence: 4, timestamp: '2026-10-25T09:45:00Z', agentId: 'demo-agent-mira', taskId: 'demo-task-contract', title: 'Boundary sketch updated', detail: 'Illustrative task content only; no implementation changed.' },
  { ...meta, id: 'demo-event-05', sequence: 5, timestamp: '2026-10-25T10:00:00Z', agentId: 'demo-agent-sora', taskId: 'demo-task-evidence', title: 'Reference labels grouped', detail: 'Fixed demo data, with no retrieval or external source access.' },
  { ...meta, id: 'demo-event-06', sequence: 6, timestamp: '2026-10-25T10:15:00Z', agentId: 'demo-agent-theo', taskId: 'demo-task-language', title: 'Status vocabulary example completed', detail: 'Display labels are separate from Run lifecycle and effects.' },
];
export const reviews: readonly DemoReviewDisplay[] = [
  { ...meta, id: 'demo-review-map', order: 1, taskId: 'demo-task-map', displayOnly: true, label: 'Example: review pending' },
  { ...meta, id: 'demo-review-language', order: 2, taskId: 'demo-task-language', displayOnly: true, label: 'Example: review complete' },
];
