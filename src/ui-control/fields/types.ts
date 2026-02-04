import type { ReactNode, Ref } from "react";

export interface FieldController<T> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<unknown>;
}

export interface FieldState {
  invalid: boolean;
  error?: string;
}

export interface FieldRenderProps<T> {
  field: FieldController<T>;
  fieldState: FieldState;
}

export interface FieldWrapperPropsBase {
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  id?: string;
}

export interface FieldWrapperProps<T> extends FieldWrapperPropsBase {
  value: T;
  onChange: (value: T) => void;
  render: (props: FieldRenderProps<T>) => ReactNode;
}

export interface Option<T = string> {
  value: T;
  label: string;
}
