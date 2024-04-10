const formateResponse = async (req, res, data = [], totalRecords = 1, message = '', httpStatus = 200, statusCode = 1, token = undefined) => {
    let response = {
        "statusCode": statusCode,
        "message": message,
        "data": {
            "totalRecords": totalRecords,
            "responseData": data,
        }
    };

    if (token) {
        response.data.token = token
    }

    return res.status(httpStatus).json(response)
};

module.exports = {
    formateResponse
}