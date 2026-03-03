"use client";

import type { ComponentType } from "react";
import {
  Image,
  Camera,
  Box,
  Lock,
  Unlock,
  Clock,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  CheckCircle,
  X,
  HelpCircle,
} from "lucide-react";

type IconName =
  | "PhotoIcon"
  | "CameraIcon"
  | "CubeTransparentIcon"
  | "LockClosedIcon"
  | "LockOpenIcon"
  | "ClockIcon"
  | "PlusCircleIcon"
  | "ExclamationTriangleIcon"
  | "ArrowPathIcon"
  | "HomeIcon"
  | "CheckCircleIcon"
  | "XMarkIcon";

interface AppIconProps {
  name: IconName | string;
  size?: number;
  className?: string;
  variant?: "solid" | "outline";
}

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  PhotoIcon: Image,
  CameraIcon: Camera,
  CubeTransparentIcon: Box,
  LockClosedIcon: Lock,
  LockOpenIcon: Unlock,
  ClockIcon: Clock,
  PlusCircleIcon: PlusCircle,
  ExclamationTriangleIcon: AlertTriangle,
  ArrowPathIcon: RefreshCw,
  HomeIcon: Home,
  CheckCircleIcon: CheckCircle,
  XMarkIcon: X,
};

export default function Icon({ name, size = 20, className, variant }: AppIconProps) {
  const IconComponent = iconMap[name] || HelpCircle;
  // lucide-react icons are outline; variant is accepted for compatibility.
  const extraClass = variant === "solid" ? "fill-current" : "";

  return <IconComponent size={size} className={[className, extraClass].filter(Boolean).join(" ")} />;
}
