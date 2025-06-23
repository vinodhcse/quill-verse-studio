
export interface WorldLocation {
  id: string;
  name: string;
  description: string;
  image?: string;
  customAttributes: Record<string, any>;
  rulesAndBeliefs: string[];
  history: Array<{
    event: string;
    eventNote?: string;
    date: string;
  }>;
  arc: Array<{
    actId: string;
    timelineEventId: string;
    descriptionChange: string;
  }>;
}

export interface WorldObject {
  id: string;
  name: string;
  description: string;
  image?: string;
  customAttributes: Record<string, any>;
  rulesAndBeliefs: string[];
  history: Array<{
    event: string;
    eventNote?: string;
    date: string;
  }>;
  arc: Array<{
    actId: string;
    timelineEventId: string;
    descriptionChange: string;
  }>;
}

export interface World {
  locations: WorldLocation[];
  objects: WorldObject[];
}

export interface WorldData {
  world: World;
}
