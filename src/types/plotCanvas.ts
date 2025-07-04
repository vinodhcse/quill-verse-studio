export interface Attribute {
    id: string;
    name: string;
    value: string;
}

export interface CharacterAttributes {
  age?: number;
  birthday?: string;
  gender?: string;
  description?: string;
  image?: string;
  aliases?: string[];
  traits?: string[];
  backstory?: string;
  beliefs?: string[];
  motivations?: string[];
  internalConflicts?: string[];
  externalConflicts?: string[];
  relationships?: Array<{
    with: string;
    type: string;
  }>;
  goals?: Array<{
    goal: string;
    actions: string[];
    impact: string;
  }>;
}

export interface CanvasNode {
  id: string;
  type: 'Outline' | 'Act' | 'Chapter' | 'SceneBeats' | 'Character' | 'WorldLocation' | 'WorldObject' | 'Arc' | 'Chart';
  name: string;
  detail: string;
  goal?: string;
  status: 'Completed' | 'Not Completed';
  timelineEventIds: string[];
  parentId?: string | null;
  childIds: string[];
  linkedNodeIds: string[];
  position: { x: number; y: number };
  
  characters?: Array<{
    id: string;
    name: string;
    image?: string;
    type: string;
    attributes?: Attribute[];
  }>;
  worlds?: Array<{
    id: string;
    name: string;
    type: string;
    locations?: Array<{
      id: string;
      name: string;
      selected?: boolean;
    }>;
    objects?: Array<{
      id: string;
      name: string;
      description?: string;
      selected?: boolean;
    }>;
  }>;

  // Character-specific fields (legacy support)
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

  // New structured attributes for character arcs
  attributes?: CharacterAttributes | Attribute[];
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
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    style?: Record<string, any>;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
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
    attributes?: Attribute[];
  }>;
  worlds?: Array<{
    id: string;
    name: string;
    type: string;
    locations?: Array<{
      id: string;
      name: string;
      selected?: boolean;
    }>;
    objects?: Array<{
      id: string;
      name: string;
      description?: string;
      selected?: boolean;
    }>;
  }>;
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onNavigateToEntity?: (entityId: string) => void;
  onDelete?: (nodeId: string) => void;
  onCharacterOrWorldClick?: (entityId: string) => void;
  onFetchCharacterDetails?: (arcId: string) => Promise<any>;
  onAddLinkedNode?: (parentNodeId: string, currentNodeType: string) => void;
  isFirstNode?: boolean; // Indicates if this is the first node in the canvas;
}

export const initializePlotCanvas = (data: PlotCanvasData) => {
  console.log('Initializing PlotCanvas with data:', data);
  console.log('Characters in nodes:', data.nodes.map(node => node.characters));
};

export const setupNode = (node: PlotNodeData) => {
  console.log('Setting up node:', node);
  console.log('Characters in node:', node.characters);
};
