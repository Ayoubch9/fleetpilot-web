# Google Play Pre-Submission Checklist — MileVoxa

Use the final Android build, not assumptions from the website.

- Privacy Policy URL: https://www.milevoxa.com/privacy
- Account deletion URL: https://www.milevoxa.com/data-deletion
- Verify the Play developer/business name exactly matches the operator name shown in the Privacy Policy.
- Confirm in-app account deletion remains available at Profile & Company → Danger Zone → Delete Account.
- Complete Data Safety for all data transmitted off-device, including behavior of third-party SDKs.
- Review Android permissions and remove permissions that are not needed.
- For occasional receipt/photo selection, prefer Android Photo Picker rather than broad media-library permission unless broad access is truly core functionality.
- Review Google ML Kit's current data-safety disclosure for the exact ML Kit packages used by the app.
- Review Google Sign-In / Supabase authentication data.
- Complete App Access with stable reviewer credentials and enough sample data to review protected product areas.
- Complete Target Audience accurately; MileVoxa is a business/productivity product and should not be represented as child-directed unless that actually changes.
- Complete Financial features declaration based on the final product behavior.
- Complete Content Rating and Ads declarations accurately.
- Confirm all personal/sensitive data is transmitted over HTTPS/TLS.
- Confirm deletion removes associated user data except clearly disclosed, legitimate retention.
- Verify the Data Safety form stays consistent with the Privacy Policy.
