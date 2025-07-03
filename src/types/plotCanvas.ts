export interface Attribute {
    id: string;
    name: string;
    value: string;
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
    attributes?: Attribute[]; // Added attributes property
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

  attributes?: Attribute[]; // Added root-level attributes property
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
    attributes?: Attribute[]; // Added attributes property
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
  onDelete?: (nodeId: string) => void; // Added onDelete definition
  onCharacterOrWorldClick?: (entityId: string) => void; // Added onCharacterOrWorldClick definition
  onFetchCharacterDetails?: (arcId: string) => Promise<any>; // Added onFetchCharacterDetails definition
  onAddLinkedNode?: (parentNodeId: string, currentNodeType: string) => void; // Added onAddLinkedNode definition
}



// Removed logCharacters invocation and debugging logic
export const initializePlotCanvas = (data: PlotCanvasData) => {
  console.log('Initializing PlotCanvas with data:', data);
  console.log('Characters in nodes:', data.nodes.map(node => node.characters));
};

export const setupNode = (node: PlotNodeData) => {
  console.log('Setting up node:', node);
  console.log('Characters in node:', node.characters);
};
