import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

export default function PrivacyPage() {
  return (
    <AppLayout hideNav hideHeader>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 14, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-foreground/90">
          <section>
            <h2 className="text-base font-semibold">1. Data We Collect</h2>
            <p>
              We collect account data (email), profile data (health preferences and metrics),
              meal photos, meal analysis outputs, and glucose entries you provide.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">2. Why We Use Data</h2>
            <p>
              We use data to authenticate your account, generate meal analysis, personalize suggestions,
              and show your trends and history in the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">3. Third-Party Processors</h2>
            <p>
              Supabase processes authentication and database storage. Google Gemini processes food image
              analysis requests. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">4. Retention</h2>
            <p>
              Meal logs are automatically deleted after 30 days. Account data may remain until
              you request deletion or stop using the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">5. Security</h2>
            <p>
              We use access controls and row-level security to isolate user records.
              No system is perfectly secure, so avoid uploading unnecessary sensitive information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">6. HIPAA Notice</h2>
            <p>
              BiteSafe is not currently represented as a HIPAA-covered service unless explicitly stated in a separate signed agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">7. Your Rights</h2>
            <p>
              You can update profile fields, reset account access on your device, and contact support
              to request data handling changes where required by law.
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 text-sm">
          <Link className="text-primary hover:underline" to="/terms">
            Terms of Service
          </Link>
          <Link className="text-primary hover:underline" to="/auth">
            Back to Auth
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
