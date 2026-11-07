import { activities, agents, rooms, tasks, workflows } from './fixtures';

export const findAgent = (id: string) => agents.find((agent) => agent.id === id);
export const findRoom = (id: string) => rooms.find((room) => room.id === id);
export const findTask = (id: string) => tasks.find((task) => task.id === id);
export const findWorkflow = (id: string) => workflows.find((workflow) => workflow.id === id);
export const tasksForAgent = (id: string) => tasks.filter((task) => task.agentIds.some((agentId) => agentId === id));
export const activityForAgent = (id: string) => activities.filter((event) => event.agentId === id);
export const agentHref = (id: string) => `#/agents/${encodeURIComponent(id)}`;
export const activityTime = (timestamp: string) => `${timestamp.slice(11, 16)} UTC`;
