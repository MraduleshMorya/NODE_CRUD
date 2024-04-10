// this file is responsible for handling all the customer(role provider) related operations 

const {
	createProvider,
	getProviderUsingEmail,
	listUnOptedServices,
	listOptedServices,
	pauseAllServiceLeads,
	pauseServiceLeadsFunction,
	resumeAllServiceLeads,
	resumeServiceLeadsFunction,
	storeResetPasswordLink,
	optService,
	validateUserAndToken,
	saveNewPassword,
	getProviders,
	listServices, 
	listLeads,
	updateDailyMaxLimit,
	searchUserExists,
	updateProviderServiceArea,
	getUserDetails,
	updateUserCardDetails,
	markUserActiveAndFailedLeadsToRetryMode} = require("../repository/repository");

const {
	CreateHashPassword,
	createLoginToken,
	createResetPasswordToken,
	decodeResetPasswordToken } = require("../utilities/crypto&jwt");

const {
	ErrorSomethingWentWrong,
	ErrorUnverifiedUser,
	ErrorServiceIdRequired,
	ErrorEmailIdRequired,
	ErrorInvalidInput, 
	ErrorEmailExists} = require("../utilities/messages");

const {
	providerSignUpValidationSchema,
	loginInputValidationSchema,
	addServiceValidationSchema2,
	resetPasswordInputValidationSchema, 
	updateMaxDailyLimitValidationSchema,
	updateServiceableAreaValidationSchema} = require("../utilities/validations/validationSchemas");


const { sendResetPasswordEmailLink, newUserRegisteredInfoMail, newServiceAddedInfoMail } = require("../utilities/emails/emails");
const { debugLogger } = require("../utilities/logger-functions/fileBasedLoggers");
const { errorHandler } = require("../utilities/errorCodeAndHandlers");
const { formateResponse } = require("../utilities/responseFormate");
const { createCustomer, createPaymentMethod, getCardDetails } = require("../utilities/stripe");

const { processTransactions } = require("../utilities/transactions");
const AllMessages = require('../utilities/messages');


//this function will register an new user into the providers 
exports.signUp = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	const httpStatusCode = 201;
	try {
		let input = JSON.parse(JSON.stringify(req.body));

		for (inputKey of Object.keys(input)) {
			if (typeof input[inputKey] == "string") {
				input[inputKey] = input[inputKey].trim();
			}
		}

		// validating the user input
		let validationResult = await providerSignUpValidationSchema.validate(input);

		if (validationResult.error) {
			throw validationResult.error;
		}

		// searching for the user's existence in the database using email
		if(await searchUserExists(input.emailAddress)){
			throw ErrorEmailExists;
		}

		// creating the customer into stripe 
		let stripeData = await createCustomer({
			name: input.companyName,
			email: input.emailAddress,
			phone: input.phoneNo,
		}) 

		let password = req.body.password;
		input.stripeCustomerId = stripeData.id ;

		input.hashedPassword = await CreateHashPassword(password);

		// creating the user into database 
		let registerSuccess = await createProvider(input);

		const token = await createLoginToken(registerSuccess[0].provider_id);

		if (!registerSuccess) {
			throw ErrorSomethingWentWrong;
		}

		newUserRegisteredInfoMail(input.companyName);

		debugLogger.debug(`Controller : signUp `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, registerSuccess, 1, 'Thank you for submitting the form. Your request has been sent to the Admin for approval process', httpStatusCode, 1, token);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : signUp `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.signIn = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	try {
		let input = req.body;
		
		// validating user input 
		let validationResult = loginInputValidationSchema.validate(input);

		if (validationResult.error) {
			throw validationResult.error;
		}

		// searching user into database using email 
		let data = await getProviderUsingEmail(input.email);
		delete data.id ;

		if(data[0].status == 'Suspended'){
			throw AllMessages.ErrorAccountSuspended;
		}

		const message = data[0].is_active ? '' : 'Your account has not been verified yet';

		hashedPassword = await CreateHashPassword(input.password);

		if (data[0].hashed_password != hashedPassword) {
			throw { name: "Error", message: 'Invalid Password' };
		}
		delete data[0].hashed_password;
		data[0].card = null ;

		if(data[0].stripe_card_id){
			let card_details = await getCardDetails(data[0].stripe_card_id);
			delete data[0].stripe_card_id ;
			data[0].card = card_details ;
		}

		// creating login token 
		const token = await createLoginToken(data[0].provider_id);

		debugLogger.debug(`Controller : signIn `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, 1, message, 200, 1, token);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : signIn `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}

// controller to add service to the provider 
exports.addService = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Service successfully added and awaiting admin approval';
	let data = [];
	let providerId = req.auth.userId;
	try {

		// user input validation 
		let validationResponse = await addServiceValidationSchema2.validate(req.body);

		if (validationResponse.error) {
			throw validationResponse.error;
		}

		if (req.body.isLocationSpecific && (req.body.zipCodes.length === 0 && req.body.states.length === 0)) {
			throw ErrorInvalidInput;
		}

		if (req.body.isLocationSpecific == false && (req.body.zipCodes.length !== 0 || req.body.states.length !== 0)) {
			throw ErrorInvalidInput;
		}

		let insertionResponse = await optService(req.body, providerId);

		data = await listOptedServices(providerId);

		newServiceAddedInfoMail(req.userInfo.company_name)

		debugLogger.debug(`Controller : addService `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, data.length, message, 200,);

	} catch (error) {
		//error code for duplicate results 
		if (error?.code == 23505) {
			error.name = 'Error'
			error.message = "You've already added this service"
		}
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : addService `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}

exports.updateServiceArea = async (req, res)=> {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Serviceable area updated successfully';
	let data = [];
	let providerId = req.auth.userId;
	try {

		let validationResponse = await updateServiceableAreaValidationSchema.validate(req.body);

		if (validationResponse.error) {
			throw validationResponse.error;
		}

		if (req.body.isLocationSpecific && (req.body.zipCodes.length === 0 && req.body.states.length === 0)) {
			throw ErrorInvalidInput;
		}

		if (req.body.isLocationSpecific == false && (req.body.zipCodes.length != 0 || req.body.states.length != 0)) {
			throw ErrorInvalidInput;
		}

		let updateResponse = await updateProviderServiceArea(req.body, providerId);

		data = await listOptedServices(providerId,req.body.serviceId);

		debugLogger.debug(`Controller : updateServiceArea `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, data.length, message, 200,);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : updateServiceArea `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.listServicesUnOpted = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	try {
		let data = await listUnOptedServices(req.auth.userId);

		debugLogger.debug(`Controller : ListServicesUnOpted `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, data.length);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : listServicesUnOpted `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}

}


exports.getOptedServicesList = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	try {

		let data = await listOptedServices(req.auth.userId);

		debugLogger.debug(`Controller : getOptedServicesList `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, data.length);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : getOptedServicesList `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}

}


exports.getServiceDetails = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	try {
		const { serviceUUID } = req.params;
		let data = await listOptedServices(req.auth.userId, serviceUUID);

		debugLogger.debug(`Controller : getServiceDetails `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data = data, data.length);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : getServiceDetails `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


// this controller function will mark the database to stop generating leads for the  provider 
// so that the business/lead providing logic could stop for that particular user 
exports.pauseAllLeads = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'All leads have been paused successfully';
	const data = [];
	try {
		let response = await pauseAllServiceLeads(req.auth.userId);
		debugLogger.debug(`Controller : pauseAllLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : pauseAllLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


// this controller function will mark the database to resume generating leads for the  provider 
// so that the business/lead providing logic could restart for that particular user 
exports.resumeAllLeads = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'All leads have been restarted successfully';
	const data = [];
	try {
		let response = await resumeAllServiceLeads(req.auth.userId);
		debugLogger.debug(`Controller : resumeAllLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : resumeAllLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


// this particular controller function will stop one services leads generation 
exports.pauseServiceLeads = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Leads for the respective service have been paused successfully';
	const data = [];
	try {
		if (!req.body.providerServiceId) {
			throw ErrorServiceIdRequired;
		}
		let response = await pauseServiceLeadsFunction(req.auth.userId, req.body.providerServiceId);
		debugLogger.debug(`Controller : pauseServiceLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : pauseServiceLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


// this particular controller function will restart one services leads/business generation 
exports.resumeServiceLeads = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Leads for the respective service have been restarted successfully';
	const data = [];
	try {
		if (!req.body.providerServiceId) {
			throw ErrorServiceIdRequired;
		}
		let response = await resumeServiceLeadsFunction(req.auth.userId, req.body.providerServiceId);
		debugLogger.debug(`Controller : resumeServiceLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : resumeServiceLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.sendResetPasswordLink = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = '';
	const data = [];
	try {
		if (!req.body.email) {
			throw ErrorEmailIdRequired;
		}

		let userData = await getProviderUsingEmail(req.body.email);

		userData = userData[0]

		let token = await createResetPasswordToken(userData.provider_id);

		let link = process.env.resetPasswordLinkPrefix + token;

		let emailSent = await sendResetPasswordEmailLink(userData.email, link, userData.company_name);

		let storeLinkResponse = await storeResetPasswordLink(userData.id, token);

		message = 'Password reset instructions have been sent to your email address. Please check your email';

		debugLogger.debug(`Controller : sendResetPasswordLink `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : sendResetPasswordLink `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.resetPassword = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Password reset successfully , please go to the sign in page';
	const data = [];
	try {

		let validationResult = await resetPasswordInputValidationSchema.validate(req.body);

		if (validationResult.error) {
			throw validationResult.error;
		}

		let userData = await decodeResetPasswordToken(req.body.token);

		let validateUserAndTokenResponseId = await validateUserAndToken(userData.data, req.body.token);

		let hashedPassword = await CreateHashPassword(req.body.password);

		let changePasswordResponse = await saveNewPassword(userData.data, hashedPassword, validateUserAndTokenResponseId,)

		debugLogger.debug(`Controller : resetPassword `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : resetPassword `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.listProviders = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = '';
	let data = new Array();
	try {
		if (req.query.providerId) {
			data = await getProviders(req.query.providerId);
		} else {
			data = await getProviders();
		}
		debugLogger.debug(`Controller : listProviders `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : listProviders `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}

// this controller will list the services publicly 
exports.listServices = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = '';
	let data = new Array();
	try {
		data = await listServices();
		debugLogger.debug(`Controller : listServices public `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : listServices public `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}

exports.listLeadsController = async (req, res) => {
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = '';
	let data = [];
	try {

		if (req.query.leadId) {
			data = await listLeads(req.auth.userId, req.query.leadId);
		} else {
			data = await listLeads(req.auth.userId);
		}
		debugLogger.debug(`Controller : listLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, data, data.length, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : listLeads `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.updateMaxDailyLeadAmountController = async (req,res)=>{

	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Max daily limit updated successfully';
	try {

		let validationResponse = await updateMaxDailyLimitValidationSchema.validate(req.body);
		if(validationResponse.error){
			throw validationResponse.error;
		}

		let response = await updateDailyMaxLimit(req.auth.userId, req.body.max_daily_limit);
		debugLogger.debug(`Controller : updateMaxDailyLeadAmountController `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, response, response.length, message,);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : updateMaxDailyLeadAmountController `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.addCreditCard = async (req,res)=>{

	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Card added successfully';
	try {

		if( !req.body.cardToken ){
			throw ErrorInvalidInput;
		}

		let userData = await getUserDetails(req.auth.userId);
		console.log(userData);

		let paymentMethodData = await createPaymentMethod(userData.stripe_customer_id, req.body.cardToken);

		paymentMethodId = paymentMethodData.id ;

		let updateCardInfoResponse = await updateUserCardDetails(req.auth.userId, paymentMethodId);
		await markUserActiveAndFailedLeadsToRetryMode(req.auth.userId);

		let response = [{
			card: paymentMethodData.card
		}]

		debugLogger.debug(`Controller : addCreditCard `, { meta: { req, requestStatus, requestFailedReason } });
		return formateResponse(req, res, response, response.length, message);

	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : addCreditCard `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
}


exports.startTransactionDeductionProcess = async (req,res)=>{
	let requestStatus = `Success`;
	let requestFailedReason = '';
	let message = 'Transactions are being processed ,please wait patiently';
	try{
		processTransactions();
		return formateResponse(req, res, [], 0, message);
	} catch (error) {
		requestFailedReason = error.message;
		debugLogger.debug(`Controller : startTransactionDeductionProcess `, { meta: { req, requestStatus, requestFailedReason } });
		return errorHandler(req, res, error);
	}
	
}