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
            /[^\p{L}\p{N}\s]/u.test(password), //  hadi ^ kat3ni (not) b7al !, \p{L} hadi kat3ni جميع الحروف (Letters): تشمل أي حرف من أي لغة في العالم (الإنجليزية a-z، العربية أ-ي، الفرنسية é، وغيرها). , \p{N} جميع الأرقام (Numbers):(١, ٢, ٣, ٤, ٥, ٦, ٧, ٨, ) تشمل الأرقام المعتادة 0-9 وأي أرقام بأي لغة أخرى. 
    },
    {
        label: "Maximum 64 characters",
        test: (password: string) => password.length <= 64, // NIST Guidelines
    },
];

export function isPasswordValid(password: string): boolean {
    return passwordRules.every((rule) => rule.test(password));
}