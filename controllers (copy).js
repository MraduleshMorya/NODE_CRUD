 
exports.signUp = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	const httpStatusCode = 201;
	let message ;
	try {

		debugLogger.debug(`Controller : signUp `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, registerSuccess, 1, 'Thank you for submitting the form. Your request has been sent to the Admin for approval process', httpStatusCode, 1, token);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : signUp `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}

