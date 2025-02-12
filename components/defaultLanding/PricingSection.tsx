import { CheckIcon } from '@heroicons/react/20/solid';
import { useTranslation } from 'next-i18next';
import { Button, Card } from 'react-daisyui';

import plans from './data/pricing.json';

const PricingSection = () => {
  const { t } = useTranslation('common');
  return (
    <section className="py-6">
      <div className="flex flex-col justify-center space-y-6">
        <h2 className="text-center text-4xl font-bold normal-case">
          {t('pricing')}
        </h2>
        <p className="text-center text-xl">
          Start with a free trial of 20 uploads. No credit card required.
        </p>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            {plans.map((plan, index) => {
              return (
                <Card
                  key={`plan-${index}`}
                  className="rounded-md dark:border-gray-200 border border-gray-300"
                >
                  <Card.Body>
                    <Card.Title tag="h2" className="text-center">
                      {plan.currency}{plan.amount} / {plan.duration}
                    </Card.Title>
                    <p className="text-center">{plan.description}</p>
                    <div className="mt-5">
                      <ul className="flex flex-col space-y-2">
                        {plan.benefits.map(
                          (benefit: string, itemIndex: number) => {
                            return (
                              <li
                                key={`plan-${index}-benefit-${itemIndex}`}
                                className="flex items-center"
                              >
                                <CheckIcon className="h-5 w-5" />
                                <span className="ml-1">{benefit}</span>
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>
                  </Card.Body>
                  <Card.Actions className="justify-center m-2">
                    <Button
                      color="primary"
                      className="md:w-full w-3/4 rounded-md"
                      size="md"
                    >
                      Start Free Trial
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
