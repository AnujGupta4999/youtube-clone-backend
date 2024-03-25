class ApiResponse{
    constructor(sstatusCode, data, message="Success"){
        this.data = data;
        this.sstatusCode = sstatusCode
        this.message = message
        this.success = sstatusCode < 400;
    }
}