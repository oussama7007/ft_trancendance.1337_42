export const passwordRules = [
    {
        label: "At least 8 characters",
        test: (password: string) => password.length >= 8,
    },
    {
        label: "One lowercase letter",
        test: (password: string) => /[a-z]/.test(password),
    },
    {
        label: "One uppercase letter",
        test: (password: string) => /[A-Z]/.test(password),
    },
    {
        label: "One number",
        test: (password: string) => /[0-9]/.test(password),
    },
    {
        label: "One special character",
        test: (password: string) =>
            /[^\p{L}\p{N}\s]/u.test(password),
    },
    {
        label: "Maximum 64 characters",
        test: (password: string) => password.length <= 64,
    },
];

export function isPasswordValid(password: string): boolean {
    return passwordRules.every((rule) => rule.test(password));
}