const { transporter } = require("./configs");

async function sendMailToNewUser(email, password) {

    let mailOptions = {};
    mailOptions.to = email;
    mailOptions.from = 'Love After<no-reply@gmail.com>';
    mailOptions.subject = "Registration Success";
    // mailOptions.html = ;
    mailOptions.text = ` 
    Congratulations! Your registration on Love After has been successfully processed. We are excited to have you on board.

    Here are your login details:
    Username: ${email}
    Password: ${password}
        
    Please note that your account is currently pending approval from our administrators. 
    
    In the meantime, explore Love After and get ready for a great experience. `;

    console.log("mailOptions :- ", mailOptions);

    let res = await transporter.sendMail(mailOptions);
    return 1;
}

async function sendResetPasswordEmailLink(email, link, providerName) {

    let mailOptions = {};
    mailOptions.to = email;
    mailOptions.from = 'Team Love After<no-reply@gmail.com>';
    mailOptions.subject = "Reset Your Password";
    mailOptions.text = `

Dear ${providerName},
You've requested a password reset. <a href='${link}'>Click here.</a>
If you didn't request this, ignore this email.

Thanks,
Team LoveAfter
    `;

    console.log("mailOptions :- ", mailOptions);

    let res = await transporter.sendMail(mailOptions);
    return 1;
}

async function newUserRegisteredInfoMail (companyName){

    let mailOptions = {};
    mailOptions.to = process.env.adminEmail;
    mailOptions.from = 'Team Love After<no-reply@gmail.com>';
    mailOptions.subject = "Approval Needed: New Company Registration";
    mailOptions.text = ` 
Hi Team,
We've received a registration from a new company ${companyName}, seeking to join our platform. Their account requires approval.

Please review and approve the new company account when convenient.

Best,
Team Love After
`;

    let res = await transporter.sendMail(mailOptions);
    
    console.log('User register info mail response :- ', res);

}

async function newServiceAddedInfoMail (companyName,){

    let mailOptions = {};
    mailOptions.to = process.env.adminEmail;
    mailOptions.from = 'Team Love After<no-reply@gmail.com>';
    mailOptions.subject = `New Service Request from ${companyName} - Review and Approval Required`;
    mailOptions.text = `
Hi,
This email is to request your review and approval of a service request submitted by ${companyName}.

Thanks,
Team LoveAfter`;

    let res = await transporter.sendMail(mailOptions);
    
    console.log('service added info mail response :- ', res);

}

module.exports = {
    sendMailToNewUser,
    sendResetPasswordEmailLink,
    newUserRegisteredInfoMail,
    newServiceAddedInfoMail
}