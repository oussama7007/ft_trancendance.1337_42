import { passwordRules } from "@/utils/password";

interface PasswordStrengthLabels {
    title: string;
    weak: string;
    medium: string;
    strong: string;
    rules: readonly string[];
}

interface PasswordStrengthProps {
    password: string;
    labels?: PasswordStrengthLabels;
}

export function PasswordStrength({
    password,
    labels,
}: PasswordStrengthProps) {
    const passedRules = passwordRules.filter(
        (rule) => rule.test(password)
    ).length;

    let strength = labels?.weak ?? 'Weak';

    if (passedRules >= 4) {
        strength = labels?.medium ?? 'Medium';
    }

    if (passedRules === passwordRules.length) {
         strength = labels?.strong ?? 'Strong';
    }

    return (
        <div className="space-y-3 text-start">
            <div className="flex justify-between text-sm">
                <span className="text-irent-muted">
                    {labels?.title ?? 'Password strength'}
                </span>

                <span className="font-semibold">
                    {strength}
                </span>
            </div>

            <div className="flex gap-1">
                {passwordRules.map((rule, index) => (
                    <div
                        key={rule.label}
                        className={`h-1.5 flex-1 rounded-full ${
                            index < passedRules
                                ? "bg-irent-accent"
                                : "bg-irent-border"
                        }`}
                    />
                ))}
            </div>

            <ul className="space-y-1">
                {passwordRules.map((rule, index) => {
                    const passed = rule.test(password);

                    return (
                        <li
                            key={rule.label}
                            className={`text-xs ${
                                passed
                                    ? "text-green-700"
                                    : "text-irent-muted"
                            }`}
                        >
                            <span className="me-2">
                                {passed ? "✓" : "○"}
                            </span>

                            {labels?.rules[index] ?? rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
