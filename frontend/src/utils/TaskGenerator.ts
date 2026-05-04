export type ShapeType = 'triangle' | 'square' | 'circle' | 'pentagon' | 'hexagon';

export interface ShapeItem {
  id: string;
  shape: ShapeType;
  color: string;
  size: number;
}

export interface DropZone {
  id: string;
  label: string;
  acceptedShapes: ShapeType[];
  position: { x: number; y: number; z: number };
}

export interface DragDropTask {
  taskId: string;
  taskType: 'drag_drop_shapes';
  instruction: string;
  shapes: ShapeItem[];
  zones: DropZone[];
  difficultyLevel: number;
  timeLimitSeconds: number;
}

export function generateShapeTask(difficultyLevel: number, taskIndex: number): DragDropTask {
  const shapeCount = Math.min(3 + Math.floor(difficultyLevel / 2), 7);
  const categoryCount = Math.min(2 + Math.floor(difficultyLevel / 3), 3);
  const colors = ['#00D9FF', '#FFD700', '#FF6B9D', '#9D4EDD', '#00F5D4', '#FF9F1C'];

  const allCategories = [
    { id: 'triangles', label: 'Triangles', shapes: ['triangle'] as ShapeType[] },
    { id: 'squares',   label: 'Squares',   shapes: ['square']   as ShapeType[] },
    { id: 'circles',   label: 'Circles',   shapes: ['circle']   as ShapeType[] },
  ];
  const categories = allCategories.slice(0, categoryCount);

  const zones: DropZone[] = categories.map((cat, i) => {
    const x = (i - (categoryCount - 1) / 2) * 0.55;
    return {
      id: cat.id,
      label: cat.label,
      acceptedShapes: cat.shapes,
      position: { x, y: 1.7, z: -2.0 },
    };
  });

  const shapes: ShapeItem[] = [];
  let idCounter = 0;
  const taskId = `task_${taskIndex}_${Date.now()}`;

  for (const cat of categories) {
    const count = Math.ceil(shapeCount / categoryCount);
    for (let i = 0; i < count; i++) {
      shapes.push({
        id: `${taskId}_${idCounter++}`,
        shape: cat.shapes[0],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1,
      });
    }
  }

  // shuffle
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }

  return {
    taskId,
    taskType: 'drag_drop_shapes',
    instruction:
      categoryCount <= 2
        ? 'Sort shapes into the correct boxes'
        : 'Categorize all shapes by their type',
    shapes: shapes.slice(0, shapeCount),
    zones,
    difficultyLevel,
    timeLimitSeconds: difficultyLevel <= 3 ? 120 : 90,
  };
}

export function validateDragDrop(
  task: DragDropTask,
  placements: Map<string, string>,
): { correct: number; total: number; percentage: number } {
  const shapeMap = new Map(task.shapes.map((s) => [s.id, s]));
  const zoneMap = new Map(task.zones.map((z) => [z.id, z]));
  let correct = 0;
  for (const [shapeId, zoneId] of placements) {
    const shape = shapeMap.get(shapeId);
    const zone = zoneMap.get(zoneId);
    if (shape && zone && zone.acceptedShapes.includes(shape.shape)) correct++;
  }
  return { correct, total: task.shapes.length, percentage: Math.round((correct / task.shapes.length) * 100) };
}
