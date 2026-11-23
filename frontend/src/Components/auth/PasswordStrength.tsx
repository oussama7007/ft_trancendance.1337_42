import { passwordRules } from "@/utils/password";

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrength({
    password,
}: PasswordStrengthProps) {
    const passedRules = passwordRules.filter(
        (rule) => rule.test(password)
    ).length;

    let strength = "Weak";

    if (passedRules >= 4) {
        strength = "Medium";
    }

    if (passedRules === passwordRules.length) {
        strength = "Strong";
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between text-sm">
                <span className="text-irent-muted">
                    Password strength
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
                {passwordRules.map((rule) => {
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
                            <span className="mr-2">
                                {passed ? "✓" : "○"}
                            </span>

                            {rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}