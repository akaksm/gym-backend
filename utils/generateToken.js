import jwt from "jsonwebtoken"

const generateToken = data => {
    return jwt.sign({ id: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: "2d" })
}

export { generateToken }