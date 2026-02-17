import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

export default function TermsPage() {
  return (
    <AppLayout hideNav hideHeader>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 14, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-foreground/90">
          <section>
            <h2 className="text-base font-semibold">1. Service Overview</h2>
            <p>
              BiteSafe provides nutrition estimates and blood sugar risk guidance from meal photos.
              The service is informational only and does not replace medical advice, diagnosis, or treatment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">2. Eligibility and Account Use</h2>
            <p>
              You must provide accurate account information and keep your login credentials secure.
              You are responsible for activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">3. Health and Medical Disclaimer</h2>
            <p>
              BiteSafe is not a medical device and is not intended for emergency decisions,
              insulin dosing, or direct clinical treatment. Always consult a licensed clinician for care decisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">4. Data Retention and Deletion</h2>
            <p>
              Meal logs are retained for 30 days and then automatically removed. You may reset your account
              from the profile section to clear local login state on your device.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">5. Third-Party Services</h2>
            <p>
              BiteSafe uses Supabase for authentication and storage, and Google Gemini for AI food analysis.
              Third-party downtime or service changes may affect app behavior.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">6. Limitation of Liability</h2>
            <p>
              To the maximum extent allowed by law, BiteSafe is provided "as is" without warranties,
              and we are not liable for indirect, incidental, or consequential damages from use of the service.
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 text-sm">
          <Link className="text-primary hover:underline" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-primary hover:underline" to="/auth">
            Back to Auth
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
