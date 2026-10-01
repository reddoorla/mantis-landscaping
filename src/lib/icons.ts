import {
  Bug,
  CalendarCheck,
  Carrot,
  ClipboardList,
  Droplets,
  Flower2,
  MessagesSquare,
  PencilRuler,
  Scissors,
  Shovel,
  Sprout,
  Sun,
  Users,
} from "@lucide/svelte";

export const ICONS = {
  design: PencilRuler,
  water: Droplets,
  edible: Carrot,
  native: Flower2,
  installation: Shovel,
  maintenance: Scissors,
  visit: CalendarCheck,
  plan: ClipboardList,
  plant: Sprout,
  sun: Sun,
  community: Users,
  pest: Bug,
  consulting: MessagesSquare,
} as const;

export type IconKey = keyof typeof ICONS;

export const ICON_KEYS = Object.keys(ICONS) as IconKey[];

export function iconFor(key: string | null | undefined) {
  return key && Object.hasOwn(ICONS, key) ? ICONS[key as IconKey] : null;
}
