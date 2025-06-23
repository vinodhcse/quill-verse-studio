
export interface PlotNodeData {
  id: string;
  type: string;
  name: string;
  detail?: string;
  status: string;
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
}

export interface PlotCanvasData {
  nodes: any[];
  edges: any[];
}
