
export interface PlotNodeData extends Record<string, unknown> {
  id: string;
  type: string;
  name: string;
  detail?: string;
  status: string;
  characters?: string[];
  worlds?: string[];
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
}

export interface PlotCanvasData {
  nodes: any[];
  edges: any[];
}
