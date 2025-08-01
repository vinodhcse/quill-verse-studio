
export interface TimelineEvent {
  id: string;
  name: string;
  date: string | number; // Use ISO date or story-specific integer timestamp
  type: 'story' | 'character' | 'flashback' | 'world';
  linkedNodeIds: string[]; // IDs of outline/scene nodes this event is related to
  description: string;
}

export interface CanvasNode {
  id: string;
  type: 'Outline' | 'Act' | 'Chapter' | 'SceneBeats' | 'Character';
  name: string;
  detail: string;
  goal: string;
  status: 'Completed' | 'Not Completed';
  timelineEventIds: string[];
  parentId?: string;
  childIds: string[];
  linkedNodeIds?: string[]; // For same-level connections
  position?: { x: number; y: number }; // Save node positions
}

export interface CanvasData {
  nodes: CanvasNode[];
  timelineEvents: TimelineEvent[];
  nodePositions?: Record<string, { x: number; y: number }>; // Separate position storage
  lastUpdated: string;
}
