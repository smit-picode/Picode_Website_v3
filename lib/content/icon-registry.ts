import {
  Activity,
  BadgeCheck,
  BarChart3,
  Blocks,
  Bot,
  Brain,
  Building2,
  Cable,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileScan,
  GitBranch,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Layers,
  Lock,
  MonitorSmartphone,
  Network,
  PanelsTopLeft,
  Radar,
  RefreshCcw,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Truck,
  UserCircle2,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons that content edited in the admin panel can use, stored by name in the database.
 * Add an entry here to make another icon available in the editors.
 */
export const ICONS: Record<string, LucideIcon> = {
  Activity,
  BadgeCheck,
  BarChart3,
  Blocks,
  Bot,
  Brain,
  Building2,
  Cable,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileScan,
  GitBranch,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Layers,
  Lock,
  MonitorSmartphone,
  Network,
  PanelsTopLeft,
  Radar,
  RefreshCcw,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Truck,
  UserCircle2,
  Users,
  Workflow,
  Zap,
};

export const ICON_NAMES = Object.keys(ICONS).sort();

export function iconByName(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || Sparkles;
}

/** Reverse lookup for converting the built-in content (icon components) to names. */
export function iconName(icon: LucideIcon): string {
  return Object.entries(ICONS).find(([, c]) => c === icon)?.[0] ?? "Sparkles";
}
