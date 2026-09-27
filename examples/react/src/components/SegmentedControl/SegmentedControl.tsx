import type { Option } from "example-shared/types/Option";
import { PILL_CLASS_NAME } from "example-shared/ui/styles/pillStyles";
import { segmentStyles } from "example-shared/ui/styles/segmentStyles";

type SegmentedControlProps<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
};

export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onSelect,
}: SegmentedControlProps<T>) => (
  <div role="group" aria-label={label} className={PILL_CLASS_NAME}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onSelect(option.value)}
        className={segmentStyles({ selected: value === option.value })}
      >
        {option.label}
      </button>
    ))}
  </div>
);
