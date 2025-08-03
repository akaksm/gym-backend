class ApiResponse {
    constructor(message, data, status = 'success', statusCode = 200) {
        this.message = message
        this.status = status
        this.statusCode = statusCode
        this.data = data
        this.timestamp = new Date().toISOString()
    }
}

export {ApiResponse}