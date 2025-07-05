
export interface Character {
  id: string;
  name: string;
  aliases: string[];
  age: number;
  birthday: string;
  gender: string;
  description: string;
  image?: string;
  locationId?: string;
  traits: string[];
  backstory: string;
  beliefs: string[];
  motivations: string[];
  relationships: Array<{
    with: string;
    type: string;
  }>;
  internalConflicts: string[];
  externalConflicts: string[];
  goals: Array<{
    goal: string;
    actions: string[];
    impact: string;
  }>;
  arc: Array<{
    actId: string;
    chapterId: string;
    timelineEventId: string;
    traits: {
      from: string[];
      to: string[];
    };
    goals: {
      added: string[];
    };
    summary: string;
    note: string;
  }>;
}

export interface CharacterGlossaryData {
  characters: Character[];
}
