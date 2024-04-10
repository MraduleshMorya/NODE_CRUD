
// this function handles all the errors that occurs and manually throws in a single centralized place
// this function logs errors into file based logging as well 

const { errorLogger } = require("./logger-functions/fileBasedLoggers");

// there are httpStatus key ki every json response that represent a what kind of error is occurred
exports.errorHandler = async (req, res, error) => {
    console.log("path :- ", req.path);
    console.log(error);
    console.log("error.name :- ", error.name);

    errorLogger.error("Error log", { meta: { req, error: { name: error.name, message: error.message }, requestFailedReason: error.message } })

    let httpStatus = 400;
    let statusCode = 0;
    let message = error.message;
    // all available httpStatus codes present in the project 
    // we use these httpStatus code to identify what kind of error occurred in the process
    // predefined httpStatus code were not able to support our cases like(400,401,403)
    // 0 for error
    // 1 for success 

    switch (error.name) {

        case "Error":
            httpStatus = 400;
            message = error.message;
            break;

        case "forbidden":
            httpStatus = 403;
            message = error.message;
            break;

        case "something":
            httpStatus = 400;
            message = error.message;
            break;

        case "JsonWebTokenError":
            httpStatus = 401;
            message = error.message;
            break;

        case "TypeError":
            httpStatus = 400;
            message = error.message;
            break;

        case "ValidationError":
            httpStatus = 400;
            message = error.message;
            break;

        case 'TokenExpiredError':
            httpStatus = 401;
            message = 'Token expired';
            break;

        case 'TokenRequired':
            break;

        case 'UnverifiedUser':
            statusCode = 2;
            message = error.message;
            break;

        case 'ErrorAccountSuspended':
            statusCode = 3;
            message = error.message;
            break;

        default:
            httpStatus = 400;
            message = `Something Went Wrong :( ${error.message}`;
            break;
    }

    return res.status(httpStatus).json({
        statusCode: statusCode,
        message: message.replaceAll('"', ""),
        data: {
            totalRecords: 0,
            responseData: [],
        },
    });
};
