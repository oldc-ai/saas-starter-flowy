import { useTranslation } from 'next-i18next';
import Link from 'next/link';

const HeroSection = () => {
  const { t } = useTranslation('common');
  return (
    <div className="hero py-52">
      <div className="hero-content text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold">Automate Your Food Cost Tracking</h1>
          <p className="py-6 text-2xl font-normal">
            Automatically standardize data from purchase receipts and invoices. Track item-level food costs weekly.
            Save time and reduce errors in managing your food business expenses.
          </p>
          <div className="flex items-center justify-center gap-2 ">
            <Link
              href="/auth/join"
              className="btn btn-primary px-8 no-underline"
            >
              Start Free Trial
            </Link>
            <Link
              href="https://hi-flowy.ai"
              className="btn btn-outline px-8"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
