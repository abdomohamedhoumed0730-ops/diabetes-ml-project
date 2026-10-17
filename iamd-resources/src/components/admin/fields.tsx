"use client";

import type { ReactNode } from "react";
import { FieldError } from "@/components/form-message";
import type { ActionState } from "@/lib/validation";

type Common = { name: string; label: string; state: ActionState | null; hint?: ReactNode; required?: boolean };

export function TextField({
  name,
  label,
  state,
  hint,
  required,
  defaultValue,
  type = "text",
  maxLength,
  placeholder,
}: Common & { defaultValue?: string | number | null; type?: string; maxLength?: number; placeholder?: string }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className="input"
        aria-invalid={Boolean(state?.errors?.[name])}
        aria-describedby={`${name}-error`}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      <FieldError state={state} name={name} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  state,
  hint,
  required,
  defaultValue,
  rows = 4,
  maxLength,
  placeholder,
}: Common & { defaultValue?: string | null; rows?: number; maxLength?: number; placeholder?: string }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className="input"
        aria-invalid={Boolean(state?.errors?.[name])}
        aria-describedby={`${name}-error`}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      <FieldError state={state} name={name} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  state,
  hint,
  required,
  defaultValue,
  options,
  placeholder,
  onChange,
  value,
}: Common & {
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
}) {
  const id = `field-${name}`;
  const controlled = value !== undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <select
        id={id}
        name={name}
        {...(controlled ? { value } : { defaultValue: defaultValue ?? "" })}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        className="input"
        aria-invalid={Boolean(state?.errors?.[name])}
        aria-describedby={`${name}-error`}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      <FieldError state={state} name={name} />
    </div>
  );
}

export function CheckboxField({ name, label, state, hint, defaultChecked }: Common & { defaultChecked?: boolean }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-2 text-sm text-slate-700">
        <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700" />
        <span>
          {label}
          {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
        </span>
      </label>
      <FieldError state={state} name={name} />
    </div>
  );
}
