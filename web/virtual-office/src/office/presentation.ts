// Display-only overrides; no scheduling, positions, clocks or execution authority.
export type OfficeTone = 'neutral' | 'ready' | 'active' | 'blocked' | 'completed' | 'assumed';
export interface OfficePresentation {
  readonly agents: readonly { readonly id: string; readonly label: string; readonly tone: OfficeTone }[];
}
