<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password - Compito</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f9fafb; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); overflow:hidden;">
            <tr>
              <td style="background:#751BE9; padding:20px; text-align:center;">
                <!-- <img src="cid:compito_logo" alt="Compito Logo" width="140" style="display:block; margin:0 auto; object-fit:contain;" /> -->
                <div style="font-size:24px; font-weight:700; color:#ffffff; font-family:Arial, Helvetica, sans-serif;">Compito</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px; text-align:left;">
                <h2 style="margin-top:0; font-size:22px; color:#111827;">Reset Your Password</h2>
                <p style="font-size:16px; line-height:1.5; color:#374151;">
                  You requested to reset your password for your <strong>Compito</strong> account.
                  Click the button below to choose a new password. This link expires in 60 minutes.
                </p>
                <p style="margin:30px 0; text-align:center;">
                  <a href="{{ $resetUrl }}"
                     style="background-color:#751BE9; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:16px; font-weight:500; display:inline-block;">
                    Reset Password
                  </a>
                </p>
                <p style="font-size:14px; color:#6b7280; line-height:1.5;">
                  If the button above doesn't work, copy and paste this link into your browser:<br />
                  <a href="{{ $resetUrl }}" style="color:#751BE9;">{{ $resetUrl }}</a>
                </p>
                <p style="font-size:12px; color:#9ca3af;">If you didn't request a password reset, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f3f4f6; padding:20px; text-align:center; font-size:13px; color:#9ca3af;">
                © 2025 Compito. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>


