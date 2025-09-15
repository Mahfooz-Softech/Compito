<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Compito!</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f9fafb; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:#751BE9; padding:20px; text-align:center;">
                <img src="{{ asset('lovable-uploads/8c93c5bf-e594-435e-a1e1-0f8be25f943a.png') }}" alt="Compito Logo" width="140" style="display:block; margin:0 auto;object:contain;"/>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px; text-align:left;">
                <h2 style="margin-top:0; font-size:22px; color:#111827;">Welcome to Compito! 🎉</h2>
                <p style="font-size:16px; line-height:1.5; color:#374151;">
                  Hi {{ $userName }}, <br /><br />
                  Welcome to <strong>Compito</strong>! We're excited to have you join our community of skilled workers and customers.
                </p>

                <p style="font-size:16px; line-height:1.5; color:#374151;">
                  As a {{ $userType }}, you can now:
                </p>

                <ul style="font-size:16px; line-height:1.5; color:#374151;">
                    @if($userType === 'customer')
                        <li>Browse and book services from skilled workers</li>
                        <li>Post service requests and receive offers</li>
                        <li>Rate and review completed services</li>
                        <li>Manage your bookings and payments</li>
                    @elseif($userType === 'worker')
                        <li>Create your professional profile</li>
                        <li>Browse and respond to service requests</li>
                        <li>Set your availability and rates</li>
                        <li>Earn money by providing quality services</li>
                    @elseif($userType === 'admin')
                        <li>Manage the platform and users</li>
                        <li>Monitor service requests and bookings</li>
                        <li>Handle payments and commissions</li>
                        <li>Support the community</li>
                    @endif
                </ul>

                <p style="margin:30px 0; text-align:center;">
                  <a href="{{ $dashboardUrl }}" 
                     style="background-color:#751BE9; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:16px; font-weight:500; display:inline-block;">
                    Go to Dashboard
                  </a>
                </p>

                <p style="font-size:14px; color:#6b7280; line-height:1.5;">
                  If you have any questions, feel free to contact our support team.
                </p>
              </td>
            </tr>

            <!-- Footer -->
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






