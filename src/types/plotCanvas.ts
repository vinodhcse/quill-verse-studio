
export interface CanvasNode {
  id: string;
  type: 'Outline' | 'Act' | 'Chapter' | 'SceneBeats' | 'Character' | 'WorldLocation' | 'WorldObject';
  name: string;
  detail: string;
  goal?: string;
  status: 'Completed' | 'Not Completed';
  timelineEventIds: string[];
  parentId?: string | null;
  childIds: string[];
  linkedNodeIds: string[];
  position: { x: number; y: number };
  
  // Character-specific fields
  aliases?: string[];
  age?: number;
  birthday?: string;
  gender?: string;
  image?: string;
  locationId?: string;
  traits?: string[];
  backstory?: string;
  beliefs?: string[];
  motivations?: string[];
  relationships?: Array<{
    with: string;
    type: string;
  }>;
  internalConflicts?: string[];
  externalConflicts?: string[];
  goals?: Array<{
    goal: string;
    actions: string[];
    impact: string;
  }>;
  arc?: Array<{
    actId: string;
    timelineEventId: string;
    descriptionChange: string;
  }>;
  
  // World-specific fields
  worldId?: string;
  description?: string;
  customAttributes?: Record<string, any>;
  rulesAndBeliefs?: string[];
  history?: Array<{
    event: string;
    date: string;
  }>;
}

export interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  type: 'story' | 'character' | 'flashback' | 'world';
  linkedNodeIds: string[];
  description: string;
}

export interface PlotCanvasData {
  nodes: CanvasNode[];
  timelineEvents: TimelineEvent[];
  nodePositions?: Record<string, { x: number; y: number }>;
  lastUpdated: string;
}

export interface PlotNodeData extends Record<string, unknown> {
  id: string;
  type: string;
  name: string;
  detail?: string;
  goal?: string;
  status: string;
  parentId?: string | null;
  childIds: string[];
  linkedNodeIds: string[];
  characters?: Array<{
    id: string;
    name: string;
    image?: string;
    type: string;
  }>;
  worlds?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onNavigateToEntity?: (entityId: string) => void;
}
