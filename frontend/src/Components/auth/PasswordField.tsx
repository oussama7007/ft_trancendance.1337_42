import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;

    autoComplete?: string;
    minLength?: number;
    showPasswordText?: string;
    hidePasswordText?: string;
    textDirection?: 'rtl' | 'ltr';
}

export function PasswordField({
    id,
    label,
    value,
    onChange,
    autoComplete = "new-password",
    minLength,
    showPasswordText = "Show password",
    hidePasswordText = "Hide password",
    textDirection = 'ltr',
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-start">
                {label}
            </Label>

            <div className="relative" dir={textDirection}>
                <Input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    dir={textDirection}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    minLength={minLength}
                    maxLength={64}
                    autoComplete={autoComplete}
                    required
                    className={textDirection === 'rtl'
                        ? 'pe-12 text-right'
                        : 'pe-12 text-left'}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? hidePasswordText : showPasswordText}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
            </div>
        </div>
    );
}