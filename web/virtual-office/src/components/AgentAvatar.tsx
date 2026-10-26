import type { DemoAgent } from '../demo/model';

export function AgentAvatar({ agent, large = false }: { agent: DemoAgent; large?: boolean }) {
  return <span className={`avatar${large ? ' avatar-large' : ''}`} data-tone={agent.tone} aria-hidden="true">{agent.initials}</span>;
}
