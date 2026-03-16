const transporter = require('../config/emailConfig');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async(email , otp)=>{
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'CineMax - Your OTP Code',
        html:  `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #F5A623;">CineMax 🎬</h2>
                <p>Your OTP code is:</p>
                <h1 style="color: #F5A623; letter-spacing: 8px;">${otp}</h1>
                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};


module.exports = {generateOTP , sendOTPEmail};