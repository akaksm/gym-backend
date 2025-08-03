// Email format validation
export function isValidEmail(email) {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email)
}

// Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
export function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}':"\\|,.<>/?]).{8,}$/.test(password)
}

// Name: not empty, not just numbers, at least 2 chars
export function isValidName(name) {
    return typeof name === 'string' && name.trim().length >= 2 && !/^\d+$/.test(name)
}

// Phone: exactly 10 digits
export function isValidPhone(phone) {
    return /^\d{10}$/.test(phone)
} 