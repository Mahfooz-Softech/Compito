import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, Lock, Eye, CheckCircle, Mail, Phone, MapPin } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="h-4 w-4" />
              Privacy & Security
            </div>
            <h1 className="text-6xl font-bold text-foreground leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your privacy and data security are our top priorities. Learn how we protect your information and maintain transparency in our data practices.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <CardContent className="p-0 space-y-8">
                
                {/* 1. Introduction */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    This Global Privacy Policy ("Privacy Policy") describes how Compito, Inc., Compito, Limited, Compito GmbH, Compito Poland Sp. z o. o., Compito Canada Operations, Inc. and its subsidiaries, including Dolly, Inc., (together as "Compito") collects, uses, retains, discloses, and deletes your Personal Information on the Compito and Dolly websites and apps (the "Platform"). It also explains the legal rights and options with respect to your information depending on where you reside.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By using the Platform, you confirm that you have read and understood this Privacy Policy, and each applicable Terms of Service (together referred to as the "Agreement").
                  </p>
                </div>

                {/* 2. General Terms */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">2. General Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">In this Privacy Policy:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Compito, Inc. and Dolly, Inc. are referred to as "Compito," "we," "our," or "us."</li>
                    <li>Users of the Platforms (Clients, Workers, Helpers, or Hands) as "You."</li>
                    <li>The "Platform" refers to Compito's websites: www.compito.com and local variants, including www.compito.co.uk, www.compito.ca, www.compito.fr, www.compito.de, www.compito.it, www.compito.pt, www.compito.es, and www.dolly.com, and www.book.dolly.com, as well as its mobile applications, "Compito," "Worker by Compito", and "Dolly."</li>
                    <li>"Terms of Service" refers to the applicable legal terms you agree to when you use one of our products or services.</li>
                    <li>"Personal Information" is information that can directly or indirectly identify, or can reasonably identify, an individual, to the extent regulated under applicable privacy laws.</li>
                  </ul>
                </div>

                {/* 3. Collection of Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">3. Collection of Personal Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect personal information directly from you when you provide it to us or from your use of the Platform. Some examples of Personal Information we collect includes the following:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Contact Information:</strong> such as your first and last name, email address, physical address, and phone number which is needed to set up an account.</li>
                    <li><strong>Billing Information:</strong> such as your credit or debit card number, expiration date, security code, and zip code.</li>
                    <li><strong>Identity Information:</strong> such as your date of birth, and depending on where you reside, your social security, tax ID number, VAT ID number, or social insurance number, and photo of your ID document such as your passport, local ID, or driver's license.</li>
                    <li><strong>Promotional Information:</strong> such as the information you provide when you participate in surveys, contests, or similar offerings.</li>
                    <li><strong>Job Applicant Information:</strong> such as employment and education history from resumes, writing and work samples, references as necessary to consider you for open positions.</li>
                    <li><strong>User Generated Content Information:</strong> such as information submitted via email or chat messages between you and us or between you and other users.</li>
                    <li><strong>Booking Information:</strong> such as information about the task or job you are seeking e.g., the time, date, and location.</li>
                    <li><strong>Driver's License and Vehicle Information:</strong> such as your vehicle type, year, make and model.</li>
                    <li><strong>Background Check Information:</strong> such as results of your background check which may include any criminal violations.</li>
                    <li><strong>Data from Cookies and Similar Technologies:</strong> as described in our Cookie Policy.</li>
                    <li><strong>Device Data:</strong> including data about the type of device or browser you use, your device's operating system, internet service provider, device's regional and language settings, and device identifiers such as IP address and AD ID.</li>
                    <li><strong>Location Data:</strong> including location data such as those derived from an IP address or data that indicates a city or postal code level or latitude/longitude data.</li>
                    <li><strong>Service Use Data:</strong> including your activities on the Platform's features and webpages, the time of day you browse, and emails and advertisements that you view and may interact with.</li>
                    <li><strong>Third Party Information:</strong> If you registered through one of our partners or IKEA, they may provide us with information such as your name, address, phone number, email, order number, or purchase history related to your requests.</li>
                  </ul>
                </div>

                {/* 4. Use of Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">4. Use of Personal Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use your Personal Information for business and commercial purposes, which includes the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>To operate and make available the Platform.</li>
                    <li>To connect you with other users to fulfill a Task or a Job.</li>
                    <li>To personalize your experience on the Platform.</li>
                    <li>For billing and fraud prevention to ensure a safe and secure environment to facilitate financial transactions.</li>
                    <li>To conduct identification and criminal background checks, as permitted by applicable laws.</li>
                    <li>To ensure the safety of our users both online and offline.</li>
                    <li>To maintain the integrity of the Platform.</li>
                    <li>For analysis to improve the Platform.</li>
                    <li>To contact you with transactional and promotional communications.</li>
                    <li>To provide you with customer support, and to assist in the resolution of your, or a third party's, complaints.</li>
                    <li>To advertise our Platform's or a partner's products or services that we think might interest you.</li>
                    <li>To enforce the relevant Terms of Service.</li>
                    <li>As otherwise set forth in other terms of the Agreement or as otherwise permitted under applicable laws.</li>
                  </ul>
                </div>

                {/* 5. Disclosure of Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">5. Disclosure of Personal Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We share your Personal Information with third parties for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Subsidiaries:</strong> To promote and improve each other's products and services.</li>
                    <li><strong>Service Providers:</strong> To operate the Platform and process Personal Information in accordance with Compito's instructions and on its behalf.</li>
                    <li><strong>Promotions or Offers:</strong> When you voluntarily enter a sweepstakes, prize draw, contest, promotion, or offering, we may share your Personal Information with the partner to provide you with the product or service requested.</li>
                    <li><strong>Advertising:</strong> We may share your Personal Information with third parties for advertising purposes.</li>
                    <li><strong>Other users:</strong> We may share your contact information with another user, or their legal or other authorized representative, to resolve an investigation or dispute.</li>
                    <li><strong>Legal Obligations:</strong> We may disclose your Personal Information to comply with applicable laws, or as requested by courts, law enforcement, governmental or public authorities, tax authorities, or authorized third parties.</li>
                    <li><strong>Merger or Acquisition:</strong> We may also share your Personal Information with interested parties in connection with, or during negotiations of, any proposed or actual merger, purchase, or sale of all or any portion of our assets to another business.</li>
                  </ul>
                </div>

                {/* 6. Retention of Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">6. Retention of Personal Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We retain your Personal Information for as long as necessary to provide you with our products or services and fulfill the purposes described in this Privacy Policy. When we no longer need to use your information and there is no need for us to keep it to comply with our legal obligations or to the extent permitted under applicable laws, we'll either delete it from our systems or deidentify it so that we can't use it to reidentify you.
                  </p>
                </div>

                {/* 7. Your Rights and Choices */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">7. Your Rights and Choices</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Depending on where you live, you may have certain privacy rights under regional or local law. If you live in the EEA, UK, or Switzerland, please see "Additional Disclosures for Data Subjects in the European Economic Area (EEA), Switzerland, and the UK" section below.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">Opt-Out of Promotional Communications</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may opt-out of receiving or promotional updates via email, SMS, or push notifications, on web and app, by visiting the "Notifications" page in your Account Settings and setting your preferences.
                  </p>

                  <h3 className="text-2xl font-bold text-foreground">Right to Access and Data Portability</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to access the Personal Information we have about you. In particular, you have the right to request the following from us:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>The categories of Personal Information we have collected about you.</li>
                    <li>The categories of sources from which the Personal Information was collected.</li>
                    <li>The categories of Personal Information about you we disclosed for a business purpose or sold.</li>
                    <li>The categories of third parties to whom the Personal Information was disclosed for a business purpose or sold.</li>
                    <li>The business or commercial purpose for collecting or selling the Personal Information.</li>
                    <li>The specific pieces of Personal Information we have collected about you.</li>
                  </ul>

                  <h3 className="text-2xl font-bold text-foreground">Right to Correct</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to update and correct inaccuracies in your account at any time by logging in and clicking on the "Account" tab. There, you can view, update, and correct your account information.
                  </p>

                  <h3 className="text-2xl font-bold text-foreground">Right to Delete</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to delete the Personal Information we have about you. Please note we may retain certain Personal Information to comply with our legal obligations or to the extent permitted under applicable laws.
                  </p>

                  <h3 className="text-2xl font-bold text-foreground">Right to Non-Discrimination</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to non-discriminatory treatment by us should you exercise any of these rights.
                  </p>
                </div>

                {/* 8. Contacting Us */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">8. Contacting Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about our this policy or our privacy practices us, you may contact us here or by sending us a letter to:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <p className="text-muted-foreground font-medium">
                      Attn: Legal<br />
                      Compito, Inc.<br />
                      PO Box 530225<br />
                      Atlanta, GA 30353-0225<br />
                      USA
                    </p>
                  </div>
                </div>

                {/* 9. Jurisdiction-Specific Provisions */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">9. Jurisdiction-Specific Provisions</h2>
                  
                  <h3 className="text-2xl font-bold text-foreground">Residents of the United States</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Right to Opt-Out of Sale:</strong> Compito does not generally sell information as the term "sell" is traditionally understood. However, to the extent "sale" under the CCPA is interpreted to include advertising technology activities such as those disclosed in Section 5, Compito's Use of Information, as a "sale," you have the right to opt-out of the sale of your Personal Information by us to third parties at any time.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">Residents of Canada</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Transfer Of Data:</strong> We and our affiliates primarily store your Personal Information on servers located and operated within the United States to provide and operate the Platform. By accepting the terms of this Privacy Policy, you acknowledge the transfer to and processing of your Personal Information on servers located in the U.S.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">Residents of the European Economic Area (EEA), Switzerland, and the United Kingdom</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Controller:</strong> Compito, Inc. is the data controller for your Personal Information.
                  </p>
                  
                  <h4 className="text-xl font-semibold text-foreground">Legal Bases for Using Your Personal Information</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    In accordance with the General Data Protection Regulation ("GDPR") and the United Kingdom General Data Protection Regulation ("UK GDPR"), we rely on the following legal basis for processing your Personal Information:
                  </p>
                  
                  <h4 className="text-xl font-semibold text-foreground">Performance of a Contract</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We process the following information where it is necessary for us to carry out a contract to which you are party to or take steps before you enter into a contract with us or another user of the Platform:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Contact Information</li>
                    <li>Billing Information</li>
                    <li>Booking Information</li>
                    <li>User-Generated Content Information</li>
                    <li>Driver's License and Vehicle Information</li>
                    <li>Third Party Information</li>
                  </ul>
                  
                  <h4 className="text-xl font-semibold text-foreground">Consent</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We process the following information where you have given your consent:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Contact Information</li>
                    <li>Promotional Information</li>
                    <li>Data from Cookies or Similar Technologies</li>
                  </ul>
                  
                  <h4 className="text-xl font-semibold text-foreground">Legitimate Interests</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We rely on our legitimate interests or those of a third party where they are not outweighed by your interests and fundamental rights, to process the following information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Contact Information</li>
                    <li>Identity Information</li>
                    <li>User-Generated Content Information</li>
                    <li>Booking Information</li>
                    <li>Job Applicant Information – to manage recruitment</li>
                    <li>Device Data</li>
                    <li>Location Data</li>
                    <li>Service Use Data</li>
                    <li>Data from Cookies and Similar Technologies</li>
                  </ul>
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-3">Important Notice</h4>
                  <p className="text-amber-700 leading-relaxed">
                    This Privacy Policy contains comprehensive information about how we collect, use, and protect your personal information. For specific details about your rights and how to exercise them, please refer to the relevant sections above based on your location.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Contact Us</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us through our support channels.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" className="w-full sm:w-auto" asChild>
                      <Link to="/">Back to Home</Link>
                    </Button>
                    <Button className="w-full sm:w-auto" asChild>
                      <Link to="/contact">Contact Support</Link>
                    </Button>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-center text-sm text-muted-foreground border-t pt-6">
                  <p>Last updated: {new Date().toLocaleDateString()}</p>
                  <p>This privacy policy is effective as of the date of publication</p>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
