"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// A password field with a show/hide toggle.
//
// One component rather than the toggle repeated per form, so every password
// box on the panel behaves the same. It takes the same props a plain input
// does, minus `type`, which it owns.

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export default function PasswordInput({
  className = "",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        // room for the button so a long value never runs under it
        className={`${className} pr-11`}
      />

      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        // the field itself is already labelled, this button only needs to say
        // what it does
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        // a toggle is not a tab stop worth having between two fields, the
        // keyboard path through a login form should be email then password
        // then submit
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
