import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, Lock, Eye, CheckCircle, Mail, Phone, MapPin, Scale, Gavel } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Gavel className="h-4 w-4" />
              Legal Terms
            </div>
            <h1 className="text-6xl font-bold text-foreground leading-tight">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              These terms govern your use of the Compito platform. Please read them carefully as they form a legally binding agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <CardContent className="p-0 space-y-8">
                
                {/* Introduction */}
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    These Compito Global Terms of Service (the "Terms of Service" or the "Terms") constitute a legally binding agreement between the User (defined below) of the Platform (defined below) ("you" or "your") and Compito, Inc. (together with its Affiliates (defined below), "Compito", "we", "us" or "our") governing your use of Compito's websites (including www.compito.com, www.compito.co.uk, www.compito.ca, www.compito.fr, www.compito.de, www.compito.es, www.compito.pt, and www.compito.it) (together, the "Sites"), mobile applications (together, the "Apps"), and related services, information and communications (collectively referred to herein as the "Platform" or the "Compito Platform").
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The use of all personal data you submit to the Platform or which we collect about you is governed by our Global Privacy Policy ("Privacy Policy").
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms, together with the Privacy Policy and the Compito Happiness Pledge (the "Happiness Pledge") for the country in which the Task is performed (which are each incorporated by reference, and referred to collectively, herein as the "Agreement"), governs your access to and use of the Platform. The Agreement also includes all other supplemental policies and terms referenced and/or linked to within these Terms or which are otherwise made available to you, all of which also apply to your use of the Platform and are incorporated into the Agreement by reference.
                  </p>
                </div>

                {/* Important Notice */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-red-800 mb-3">Important Notice</h4>
                  <p className="text-red-700 leading-relaxed">
                    FOR U.S. AND CANADIAN USERS, SECTION 24 CONTAINS AN ARBITRATION AGREEMENT. THIS ARBITRATION AGREEMENT, WITH LIMITED EXCEPTION, REQUIRES YOU TO SUBMIT DISPUTES AND CLAIMS YOU HAVE AGAINST COMPITO TO BINDING AND FINAL ARBITRATION ON AN INDIVIDUAL BASIS. PLEASE READ IT CAREFULLY AS IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING, IF APPLICABLE, YOUR RIGHT TO OPT OUT OF ARBITRATION.
                  </p>
                </div>

                {/* Acknowledgment */}
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    BY ACKNOWLEDGING THE TERMS OF SERVICE AND/OR ACCESSING AND USING THE PLATFORM, YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT YOU HAVE READ AND UNDERSTAND AND AGREE TO BE BOUND BY (WITHOUT LIMITATION OR QUALIFICATION), THE AGREEMENT (INCLUDING, ALL TERMS INCORPORATED HEREIN BY REFERENCE).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    IF YOU DO NOT AGREE TO BE BOUND BY THE AGREEMENT AND ABIDE BY ITS TERMS, YOU MAY NOT ACCESS OR USE THE PLATFORM.
                  </p>
                </div>

                {/* 1. The Platform */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">1. The Platform</h2>
                  
                  <h3 className="text-2xl font-bold text-foreground">A. Online Marketplace</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform is an online web- and app-based two-sided marketplace which enables connections between Clients and Workers. "Client(s)" are individuals and/or businesses seeking to obtain short-term services ("Task(s)"), and "Worker(s)" are businesses seeking to perform Tasks for Clients. Clients and Workers are referred to herein together as "User(s)".
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Workers are independent business owners, providing services under their own name or business name (and not under Compito's name), using their own tools and supplies. Workers choose the applicable rates for Tasks, without deduction by Compito. Workers may (a) maintain a clientele without any restrictions from Compito; (b) offer and provide their services elsewhere, including through competing platforms; and (c) accept or reject Clients and Service Agreements (defined below). Workers are independent contractors of Clients, and Clients are therefore clients of Workers, not Compito.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">B. Compito's Role</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform is not an employment agency service or business, and Compito is not an employer of any User. Users are not employees, partners, representatives, agents, joint venturers, independent contractors or franchisees of Compito.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Users hereby acknowledge and agree that (a) Compito does not (i) perform Tasks nor employ individuals to perform Tasks, (ii) supervise, scope, direct, control or monitor Workers' work (including that Compito does not set Workers' work locations, work hours, or terms of work), nor provide tools or supplies to, or pay any expenses of, Workers, or (iii) have any control over the quality, timing, legality, failure to provide, or any other aspect whatsoever of Tasks or Users (or the acts or omissions thereof), nor of the integrity, responsibility, competence, qualifications, communications, or the ratings or reviews provided by Users with respect to each other; and (b) the formation of a Service Agreement will not, under any circumstances, create any responsibility or liability for Compito, nor any employment or other relationship between Compito and the Users or between the Client and the Worker.
                  </p>
                </div>

                {/* 2. Use of the Platform */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">2. Use of the Platform</h2>
                  
                  <h3 className="text-2xl font-bold text-foreground">A. Registration</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You must register and create an account to access and use the Platform, providing only correct and accurate information (such as, without limitation, your name, business name, mailing address, email address, and/or telephone number). You agree to immediately notify Compito of any changes to your account information.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">B. Account Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You are fully and solely responsible for (a) maintaining the confidentiality of any log-in, password, and account number provided by or given to you to access the Platform; and (b) all activities that occur under your password or account, even if not authorized by you.
                  </p>
                </div>

                {/* 3. Fees, Billing, and Payment */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">3. Fees, Billing, Invoicing, and Payment; Cancellation</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The terms relevant to fees (including Worker Payments and Compito's fees), invoicing, payment (including for Tasks, and any other amounts owed by Users hereunder) and cancellation, are set out in the Fees, Payments and Cancellation Supplemental Terms, which applies to your access to and use of the Platform. Unless otherwise expressly stated in this Agreement, all fees (including, without limitation, the Task Payment and all Compito fees) are non-refundable.
                  </p>
                </div>

                {/* 4. Contests and Promotional Codes */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">4. Contests and Promotional Codes</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Compito may, from time to time, provide certain optional promotional codes, opportunities and contests to Users. All such optional promotional opportunities will be run at the sole discretion of Compito, will be subject to the terms and conditions governing same, and can be implemented, modified, or removed at any time by Compito without advance notification.
                  </p>
                </div>

                {/* 5. Public Areas */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">5. Public Areas</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform may contain profiles, email systems, blogs, message boards, reviews, ratings, task postings, chat areas, news groups, forums, communities and/or other message or communication facilities ("Public Areas") that allow Users to communicate with other Users. You may only use such community areas to send and receive messages and materials that are relevant and proper to the applicable forum.
                  </p>
                </div>

                {/* 6. Deactivation and Suspension */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">6. Deactivation and Suspension</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In the event of an actual or suspected breach by you of any part of the Agreement (including, without limitation, abuse, fraud or interference with the proper working of the Platform), Compito may (a) suspend your right to use the Platform pending its investigation; and/or (b) deactivate your account or limit your use of the Platform upon its confirmation of a breach.
                  </p>
                </div>

                {/* 7. Termination */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">7. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You may terminate the Agreement between you and Compito at any time by ceasing all use of the Platform and deactivating your account. Compito may terminate the Agreement between you and Compito at any time, and cease providing access to the Platform (pursuant to Section 6 above), if you breach any part of the Agreement or violate applicable laws.
                  </p>
                </div>

                {/* 8. User Generated Content; Feedback */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">8. User Generated Content; Feedback</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    "User Generated Content" is defined as any information, content and materials (including any videotape, film, recording, photograph, voice) you provide to Compito, its agents, Affiliates, and corporate partners, or other Users in connection with your registration for and use of the Platform.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    User Generated Content is not the opinion of, and has not been verified or approved by, Compito. You acknowledge and agree that Compito: (a) is not involved in the creation or development of User Generated Content and does not control any User Generated Content; (b) is not responsible or liable for any User Generated Content; (c) may, but is no obligation to, monitor or review User Generated Content; and (d) reserves the right to limit or remove User Generated Content if it is not compliant with the terms of the Agreement.
                  </p>
                </div>

                {/* 9. Intellectual Property Rights */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">9. Intellectual Property Rights</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform, and all components thereof and content made available and/or displayed thereon (including the Marks (defined below), and all text, graphics, editorial content, data, formatting, graphs, designs, HTML, look and feel, photographs, music, sounds, images, software, videos, typefaces, information, tools, designs, interfaces and other content), is owned by Compito, excluding User Generated Content and any third-party websites made available on or via the Platform.
                  </p>
                </div>

                {/* 10. Links to Third-Party Websites */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">10. Links to Third-Party Websites</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform may contain links to third-party websites, which are maintained by parties over which Compito exercises no control. Such links are provided for reference and convenience only; and do not constitute Compito's endorsement, warranty or guarantee of, or association with, those websites, their content or their operators.
                  </p>
                </div>

                {/* 11. Copyright Complaints */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">11. Copyright Complaints and Copyright Agent</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe, in good faith, that any materials provided on or in connection with the Platform infringe upon your copyright or other intellectual property right, please send the following information to Compito's Copyright Agent:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>A description of the copyrighted work that you claim has been infringed, including the URL where the material you claim is infringed is visible.</li>
                    <li>A description of the location where the original or an authorized copy of the copyrighted work exists.</li>
                    <li>Your name, address, telephone number, and e-mail address.</li>
                    <li>A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
                    <li>A statement by you, made under penalty of perjury, that the information in your notice is accurate, and that you are the copyright owner or authorized to act on the copyright owner's behalf.</li>
                    <li>Your electronic or physical signature as the owner of the copyright or the person authorized to act on behalf of the owner of the copyright interest.</li>
                  </ul>
                </div>

                {/* 12. Disclaimer of Warranties */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">12. Disclaimer of Warranties</h2>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-red-800 mb-3">Use Of The Platform Is Entirely At Your Own Risk</h4>
                    <p className="text-red-700 leading-relaxed">
                      THE PLATFORM AND THE TECHNOLOGY UNDERLYING IT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, (INCLUDING, BUT NOT LIMITED TO, WARRANTIES OR CONDITIONS OF MERCHANTABILITY, QUALITY OR FITNESS FOR A PARTICULAR PURPOSE, GOOD AND WORKMANLIKE SERVICES, COMPLIANCE WITH ANY LAW, STATUTE, ORDINANCE, REGULATION, OR CODE, AND/OR NON-INFRINGEMENT), AND THE SAME ARE EXPRESSLY EXCLUDED.
                    </p>
                  </div>
                </div>

                {/* 13. Limitation of Liability */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">13. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You acknowledge and agree that Compito is only willing to provide the Platform if you agree to certain limitations of our liability to you and third parties, as set out in this Section and elsewhere in the Agreement.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <p className="text-red-700 leading-relaxed">
                      THEREFORE, YOU ACKNOWLEDGE AND AGREE THAT, TO THE EXTENT PERMITTED BY APPLICABLE LAW, UNDER NO CIRCUMSTANCES WILL THE COMPITO PARTIES OR THEIR CORPORATE PARTNERS BE RESPONSIBLE OR LIABLE FOR ANY AND ALL LIABILITIES ARISING OUT OF OR IN ANY WAY RELATED TO OR CONNECTED WITH THE PLATFORM OR YOUR OR ANY OTHER PARTY'S USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF THE SAME.
                    </p>
                  </div>
                </div>

                {/* 14. Indemnification */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">14. Indemnification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Users' indemnification obligations are set out below in this Section. Compito reserves the right, in its own sole discretion, to assume the exclusive defense and control of any matter otherwise subject to your indemnification.
                  </p>
                </div>

                {/* 15. Dispute Resolution */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">15. Dispute Resolution</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To expedite resolution and reduce the cost of any dispute, controversy or claim related to, arising from or regarding your use of the Platform, your relationship with Compito, Tasks, or the Agreement (including previous versions), ("Dispute"), you can try to find an amicable solution with Compito before initiating any out of court settlement (such as mediation or arbitration) or court proceeding (except as may be set forth in Section 24).
                  </p>
                </div>

                {/* 16. App Store-Sourced Apps */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">16. App Store-Sourced Apps</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you access or download any App from the Apple App Store, you agree to Apple's Licensed Application End User License Agreement and will comply therewith in your access to and use of the App(s). If you access or download any App from the Google Play Store, you agree to Google Play Terms of Service and will comply therewith in your access to and use of the App(s).
                  </p>
                </div>

                {/* 17. Changes to the Agreement */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">17. Changes to the Agreement, the Platform and the App</h2>
                  <h3 className="text-2xl font-bold text-foreground">A. Changes to the Agreement</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Compito reserves the right, for justifiable and proportionate reasons, at any time, to review, change, modify, update, add to, supplement, suspend, discontinue, or delete any term(s) or provision(s) of the Agreement (including the Terms of Service, Privacy Policy, Acceptable Use Policy and/or Happiness Pledge).
                  </p>
                </div>

                {/* 18. No Rights of Third Parties */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">18. No Rights of Third Parties</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Except as expressly set out herein and/or is otherwise required by applicable laws, the Agreement is for the sole benefit of Compito and the User, and their permitted successors and assigns, and there are no other third-party beneficiaries under the Agreement.
                  </p>
                </div>

                {/* 19. Notices */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">19. Notices and Consent to Receive Notices Electronically</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Unless otherwise specified in the Agreement, all agreements, notices, disclosures and other communications (collectively, "Notices") under the Agreement will be in writing and will be deemed to have been duly given when received, if personally delivered or sent by certified or registered mail, return receipt requested; when receipt is electronically confirmed, if transmitted by facsimile or email; or the day it is shown as delivered by the overnight delivery service's tracking information, if sent for next day delivery by a recognized overnight delivery service.
                  </p>
                </div>

                {/* 20. Consent to Electronic Signatures */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">20. Consent to Electronic Signatures</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By using the Platform, you agree (a) to transact electronically through the Platform; (b) your electronic signature is the legal equivalent of your manual signature and has the same legal effect, validity and enforceability as a paper-based signature; (c) your use of a keypad, mouse or other device to select an item, button, icon or similar act/action, constitutes your signature as if actually signed by you in writing; and (d) no certification authority or other third party verification is necessary to validate your electronic signature, and the lack of such certification or third party verification will not in any way affect the enforceability of your electronic signature.
                  </p>
                </div>

                {/* 21. Governing Law */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">21. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Except for Sections 15 (Dispute Resolution) and/or 24 (Jurisdiction-specific Provisions) hereof, the Agreement and your use of the Platform will be governed by, and will be construed under, the laws as set out in this Section (without regard to choice of law principles):
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>For Users within the United States: The laws of the State of California.</li>
                    <li>For Users outside of the United States: English law, and any dispute regarding the Agreement or the use of the Platform will only be dealt with by the English courts.</li>
                  </ul>
                </div>

                {/* 22. Notices */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">22. Notices</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Compito Platform, websites and Apps are owned and operated by Compito, Inc., a company registered in Delaware (United States). If you have any questions about the Agreement or the Platform, please contact us by using the means listed here.
                  </p>
                </div>

                {/* 23. General Provisions */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">23. General Provisions</h2>
                  <h3 className="text-2xl font-bold text-foreground">a. Relationship of the Parties</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    No agency, partnership, joint venture, employer-employee or franchiser-franchisee relationship exists, is intended or created between you and Compito by the Agreement or your use of the Platform. Users do not have authority to act as agent for, nor to bind or make any representations on behalf of, Compito.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">b. Entire Agreement</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Agreement (including any terms linked to in, and incorporated by reference into, these Terms) constitutes the complete and exclusive agreement between you and Compito with respect to your use of the Platform, and supersedes any and all prior or contemporaneous agreements, proposals or communications, except as otherwise specified in the Arbitration Agreement in Section 24(A).
                  </p>
                </div>

                {/* 24. Jurisdiction-specific Provisions */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">24. Jurisdiction-specific Provisions, including Dispute Resolution</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The terms in this Section apply to Users in the noted jurisdictions. To the extent that there are any discrepancies or inconsistencies between these Global Terms of Service and the following jurisdiction-specific provisions, the jurisdiction-specific provisions shall prevail, govern and control with respect to Users in those jurisdictions.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">A. Residents of the United States of America</h3>
                  <h4 className="text-xl font-semibold text-foreground">I. Dispute Resolution - Arbitration Agreement</h4>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <h5 className="text-lg font-bold text-red-800 mb-3">PLEASE READ THIS SECTION CAREFULLY</h5>
                    <p className="text-red-700 leading-relaxed">
                      IT AFFECTS YOUR LEGAL RIGHTS AND GOVERNS HOW YOU AND COMPITO CAN BRING CLAIMS COVERED BY THIS ARBITRATION AGREEMENT. THIS SECTION WILL, WITH LIMITED EXCEPTION, REQUIRE YOU AND COMPITO TO SUBMIT CLAIMS TO BINDING AND FINAL ARBITRATION ON AN INDIVIDUAL BASIS.
                    </p>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground">B. Residents of a Country other than the United States of America</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By providing your mobile phone number and using the Platform, you hereby affirmatively consent to use of your mobile phone number for calls and recurring text messages, (including with an autodialer and/or prerecorded voice) by Compito and Affiliates, or from independent contractors (including Workers) in order to (a) perform and improve upon the Platform, (b) facilitate the carrying out of Tasks through the Platform, and (c) provide you with information and reminders regarding your registration, orientation, upcoming Tasks, product alterations, changes and updates, service outages or alterations.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">C. Residents of Canada</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Dispute Resolution – Arbitration & Class Action Waiver. PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS AND GOVERNS HOW YOU AND COMPITO CAN BRING CLAIMS AGAINST EACH OTHER. THIS SECTION WILL, WITH LIMITED EXCEPTIONS, REQUIRE YOU AND COMPITO TO SUBMIT CLAIMS AGAINST EACH OTHER TO BINDING AND FINAL ARBITRATION ON AN INDIVIDUAL BASIS.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">D. Residents of Germany</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Users in Germany are free to file a claim related to the Agreement in a German court at any time and do not have to notify Compito of any disputes prior to filing such claims.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-foreground">E. Residents of Monaco</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Users who are residents of Monaco are considered as "consumers" – meaning any individual who, when entering into a distance contract, does not act in the course of his commercial, industrial, self-employed or home-made activity – shall benefit a right of withdrawal of 7 days from the day of confirmation of acceptance of the service ("Withdrawal Period"). Such right shall be exercised in writing and shall be notified by email.
                  </p>
                </div>

                {/* 25. Acknowledgement and Consent */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">25. Acknowledgement and Consent</h2>
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-green-800 mb-3">Final Agreement</h4>
                    <p className="text-green-700 leading-relaxed">
                      I HEREBY ACKNOWLEDGE THAT I HAVE READ AND UNDERSTAND THE FOREGOING TERMS OF SERVICE, AS WELL AS THE PRIVACY POLICY, THE AUP, THE HAPPINESS PLEDGE, ALL OTHER TERMS INCORPORATED HEREIN AND THEREIN BY REFERENCE, AND AGREE THAT MY USE OF THE PLATFORM IS AN ACKNOWLEDGMENT OF MY AGREEMENT TO BE BOUND BY THE TERMS AND CONDITIONS OF THE AGREEMENT.
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Contact Us</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about these Terms of Service or about the Platform, please contact us through our support channels.
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
                  <p>These terms are effective as of the date of publication</p>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;



