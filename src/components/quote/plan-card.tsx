"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InsurancePlan } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { MOCK_INSURANCE_POLICY_LINK, DEFAULT_CURRENCY } from "@/lib/constants";
import { CheckCircle, FileText, DollarSign, BarChart3, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: InsurancePlan;
  onSelectPlan: () => void;
}

export function PlanCard({ plan, onSelectPlan }: PlanCardProps) {
  const t = useTranslations('quote');
  const suitabilityColor = plan.suitabilityScore > 75 ? "bg-green-500" : plan.suitabilityScore > 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card className="shadow-xl w-full overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="bg-secondary/30 p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">{plan.planName}</CardTitle>
            <CardDescription className="text-md text-muted-foreground">{plan.provider}</CardDescription>
          </div>
          <Badge variant="default" className="text-lg bg-accent text-accent-foreground">
            {plan.price} {DEFAULT_CURRENCY}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h4 className="font-semibold text-lg mb-2 flex items-center"><CheckCircle className="h-5 w-5 me-2 text-primary" />{t('coverageDetails')}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{plan.coverageDetails || t('noCoverageDetails')}</p>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2 flex items-center"><BarChart3 className="h-5 w-5 me-2 text-primary" />{t('suitabilityScore')}</h4>
          <div className="flex items-center gap-2">
            <Progress value={plan.suitabilityScore} className={cn("w-[calc(100%-4rem)] h-3", suitabilityColor)} />
            <span className="font-bold text-primary">{plan.suitabilityScore}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('suitabilityHint')}</p>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2 flex items-center"><Info className="h-5 w-5 me-2 text-primary" />{t('justification')}</h4>
          <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-md">{plan.rationale || t('noJustification')}</p>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-muted/30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" asChild>
          <a href={plan.policyDocumentLink || MOCK_INSURANCE_POLICY_LINK} target="_blank" rel="noopener noreferrer">
            <FileText className="me-2 h-4 w-4" />
            {t('viewPolicy')}
          </a>
        </Button>
        <Button onClick={onSelectPlan} className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-accent-foreground shadow-md">
          <DollarSign className="me-2 h-4 w-4" />
          {t('chooseAndPay')}
        </Button>
      </CardFooter>
    </Card>
  );
}
