import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if email configuration is available
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email configuration not found, skipping email send");
      return NextResponse.json({ success: true, message: "Account created successfully" });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Captyn Global</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Captyn Global! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Thank you for creating an account with Captyn Global. We're excited to have you join our community!</p>
            
            <p>Your account has been successfully created with the email: <strong>${email}</strong></p>
            
            <p>You can now:</p>
            <ul>
              <li>Browse millions of products with transparent pricing</li>
              <li>Get personalized recommendations based on your searches</li>
              <li>Add items to your wishlist and cart</li>
              <li>Track your orders and shipping</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
            </div>
            
            <p>If you have any questions or need assistance, feel free to contact our support team:</p>
            <ul>
              <li>Email: captynglobal@gmail.com</li>
              <li>WhatsApp: +254112047147</li>
            </ul>
            
            <p>Happy shopping!</p>
            <p>The Captyn Global Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Captyn Global. All rights reserved.</p>
            <p>This email was sent to ${email}. If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"Captyn Global" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Captyn Global - Account Created Successfully! 🎉",
      html: htmlContent,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Confirmation email sent successfully" 
    });

  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully" 
    }); // Don't fail account creation if email fails
  }
}
