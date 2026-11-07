import type { AgentStatus, TaskStatus } from '../demo/model';

export function StatusLabel({ status }: { status: AgentStatus | TaskStatus }) {
  return <span className="status-label" data-status={status}><span aria-hidden="true" className="status-dot" />{status}<span className="sr-only"> — synthetic presentation status</span></span>;
}
