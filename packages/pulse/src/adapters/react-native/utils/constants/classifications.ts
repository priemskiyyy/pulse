import type { AppStateClassification } from "src/adapters/react-native/types/internal/AppStateClassification";
import type { AppStateStatus } from "src/adapters/react-native/types/AppStateStatus";

/** iOS statuses: `inactive` is still foreground, and an app extension has no app lifecycle to observe. */
export const IOS_CLASSIFICATIONS: Record<
  AppStateStatus,
  AppStateClassification
> = Object.freeze({
  active: "ACTIVE",
  inactive: "INACTIVE",
  background: "BACKGROUND",
  unknown: "UNKNOWN",
  extension: "UNKNOWN",
});

/** Android statuses: Android documents neither `inactive` nor `extension`, so they carry no evidence. */
export const ANDROID_CLASSIFICATIONS: Record<
  AppStateStatus,
  AppStateClassification
> = Object.freeze({
  active: "ACTIVE",
  inactive: "UNKNOWN",
  background: "BACKGROUND",
  unknown: "UNKNOWN",
  extension: "UNKNOWN",
});
